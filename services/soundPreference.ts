type SoundPreferenceListener = (enabled: boolean) => void;
type ReportError = (operation: string, error: unknown) => void;

export interface SoundPreferenceStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

const PREFERENCE_LOAD_TIMEOUT_MS = 3000;

class PreferenceLoadTimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new PreferenceLoadTimeoutError(message)), PREFERENCE_LOAD_TIMEOUT_MS);
    }),
  ]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

export class SoundPreference {
  private enabled = true;
  private loaded = false;
  private revision = 0;
  private listeners = new Set<SoundPreferenceListener>();
  private readyListeners = new Set<() => void>();
  private writeQueue: Promise<void> = Promise.resolve();
  public readonly ready: Promise<void>;

  constructor(
    private readonly storage: SoundPreferenceStorage,
    private readonly key: string,
    private readonly reportError: ReportError,
  ) {
    this.ready = this.load();
  }

  private async load(): Promise<void> {
    const revisionAtStart = this.revision;
    let readPromise: Promise<string | null>;
    try {
      readPromise = this.storage.getItem(this.key);
    } catch (error) {
      this.reportError('load-preference', error);
      this.markLoaded();
      return;
    }

    try {
      const value = await withTimeout(
        readPromise,
        'Sound preference loading timed out.',
      );
      if (revisionAtStart === this.revision && value !== null) {
        this.update(value !== 'false');
      }
      this.markLoaded();
    } catch (error) {
      this.reportError('load-preference', error);
      if (error instanceof PreferenceLoadTimeoutError) {
        void readPromise.then((value) => {
          if (revisionAtStart === this.revision && value !== null) {
            this.update(value !== 'false');
          }
          this.markLoaded();
        }).catch((lateError: unknown) => {
          this.reportError('load-preference', lateError);
          this.markLoaded();
        });
      } else {
        this.markLoaded();
      }
    }
  }

  public isReady(): boolean {
    return this.loaded;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.revision += 1;
    this.update(enabled);
    this.writeQueue = this.writeQueue
      .then(() => this.storage.setItem(this.key, String(enabled)))
      .catch((error: unknown) => {
        this.reportError('save-preference', error);
      });
  }

  public subscribe(listener: SoundPreferenceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeReady(listener: () => void): () => void {
    this.readyListeners.add(listener);
    return () => this.readyListeners.delete(listener);
  }

  private markLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;
    for (const listener of this.readyListeners) {
      try {
        listener();
      } catch (error) {
        this.reportError('notify-ready-listener', error);
      }
    }
  }

  private update(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    for (const listener of this.listeners) {
      try {
        listener(enabled);
      } catch (error) {
        this.reportError('notify-listener', error);
      }
    }
  }
}
