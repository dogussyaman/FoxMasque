import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Image, AppState, type AppStateStatus } from 'react-native';
import { soundAssets, type SoundEffect } from '@/assets/sound';
import { SoundPool, type SoundPoolPlayer } from './soundPool';
import { SoundPreference } from './soundPreference';

const SOUND_PREFERENCE_KEY = '@foxmasque/sound-effects-enabled';
const PLAYER_READY_TIMEOUT_MS = 5000;
const INITIALIZATION_TIMEOUT_MS = 3000;

type ExpoAudioModule = typeof import('expo-audio');

let expoAudioModule: ExpoAudioModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require('expo-audio') as ExpoAudioModule;
  expoAudioModule = module;
} catch (error) {
  if (__DEV__) {
    console.warn('[SoundService] expo-audio could not be loaded; native sound is unavailable.', error);
  }
}

function reportError(effect: string, operation: string, error?: unknown) {
  if (__DEV__) {
    console.warn(`[SoundService] ${operation} failed for "${effect}".`, error);
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function getAsset(effect: SoundEffect): number {
  return soundAssets[effect];
}

class SoundService {
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private audioModePromise: Promise<void> | null = null;
  private preference: SoundPreference;
  private pool: SoundPool;

  constructor() {
    this.pool = new SoundPool(
      (effect) => this.createPlayerInstance(effect as SoundEffect),
      reportError,
      { click: 2, true: 1, zartalanma: 1, clock: 1 },
    );
    this.preference = new SoundPreference(AsyncStorage, SOUND_PREFERENCE_KEY, (operation, error) => {
      reportError('settings', operation, error);
    });
    this.preference.subscribe((enabled) => this.pool.setEnabled(enabled));
    this.attachAppStateListener();
  }

  private ensureAudioMode(): Promise<void> {
    if (!this.audioModePromise) {
      this.audioModePromise = (async () => {
        if (Platform.OS === 'web' || !expoAudioModule) return;
        try {
          await withTimeout(
            expoAudioModule.setAudioModeAsync({
              playsInSilentMode: true,
              interruptionMode: 'mixWithOthers',
              shouldPlayInBackground: false,
            }),
            INITIALIZATION_TIMEOUT_MS,
            'Audio mode configuration timed out.',
          );
        } catch (error) {
          reportError('audio-mode', 'configure', error);
        }
      })();
    }
    return this.audioModePromise;
  }

  private attachAppStateListener(): void {
    if (this.appStateSubscription) return;
    this.appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        this.pool.stop();
        void this.setAudioActive(false);
      } else if (nextState === 'active') {
        void this.setAudioActive(true);
      }
    });
  }

  private async setAudioActive(active: boolean): Promise<void> {
    if (Platform.OS === 'web' || !expoAudioModule) return;
    try {
      await expoAudioModule.setIsAudioActiveAsync(active);
    } catch (error) {
      reportError('audio-session', active ? 'resume' : 'deactivate', error);
    }
  }

  private createPlayerInstance(effect: SoundEffect): SoundPoolPlayer | null {
    const source = getAsset(effect);
    const defaultVolume = effect === 'click' ? 0.75 : effect === 'clock' ? 0.55 : 1;

    if (Platform.OS !== 'web' && expoAudioModule?.createAudioPlayer) {
      const player = expoAudioModule.createAudioPlayer(source, {
        keepAudioSessionActive: false,
      });
      return {
        waitUntilReady: () => new Promise<boolean>((resolve) => {
          if (player.isLoaded) {
            resolve(true);
            return;
          }

          const startedAt = Date.now();
          const checkReady = () => {
            if (player.isLoaded) {
              resolve(true);
            } else if (Date.now() - startedAt >= PLAYER_READY_TIMEOUT_MS) {
              resolve(false);
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        }),
        play: () => player.play(),
        pause: () => player.pause(),
        seekTo: (seconds) => player.seekTo(seconds),
        setVolume: (volume) => {
          player.volume = volume;
        },
        remove: () => player.remove(),
      };
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      const resolved = Image.resolveAssetSource(source)?.uri;
      if (!resolved) return null;

      const audio = new window.Audio(resolved);
      audio.volume = defaultVolume;
      audio.preload = 'auto';
      return {
        waitUntilReady: () => {
          if (audio.readyState >= 3) return Promise.resolve(true);
          return new Promise<boolean>((resolve) => {
            let settled = false;
            const finish = (ready: boolean) => {
              if (settled) return;
              settled = true;
              clearTimeout(timeout);
              audio.removeEventListener('canplaythrough', onReady);
              audio.removeEventListener('error', onError);
              resolve(ready);
            };
            const onReady = () => finish(true);
            const onError = () => finish(false);
            const timeout = setTimeout(() => finish(audio.readyState >= 3), PLAYER_READY_TIMEOUT_MS);
            audio.addEventListener('canplaythrough', onReady, { once: true });
            audio.addEventListener('error', onError, { once: true });
          });
        },
        play: () => {
          audio.currentTime = 0;
          return audio.play();
        },
        pause: () => audio.pause(),
        seekTo: async (seconds) => {
          audio.currentTime = seconds;
        },
        setVolume: (volume) => {
          audio.volume = volume;
        },
        remove: () => {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        },
      };
    }

    return null;
  }

  public async preload(): Promise<void> {
    this.attachAppStateListener();
    await this.ensureAudioMode();
    this.pool.preload(Object.keys(soundAssets) as SoundEffect[]);
  }

  public async play(effect: SoundEffect, customVolume?: number): Promise<boolean> {
    await this.preference.ready;
    if (!this.preference.isReady()) return false;
    if (!this.preference.isEnabled()) return false;
    await this.ensureAudioMode();
    if (!this.preference.isEnabled()) return false;
    const defaultVolume = effect === 'click' ? 0.75 : effect === 'clock' ? 0.55 : 1;
    return this.pool.play(effect, customVolume ?? defaultVolume, defaultVolume);
  }

  public stop(effect?: SoundEffect): void {
    this.pool.stop(effect);
  }

  public stopAll(): void {
    this.pool.stop();
  }

  public setEnabled(enabled: boolean): void {
    this.preference.setEnabled(enabled);
  }

  public isEnabled(): boolean {
    return this.preference.isEnabled();
  }

  public isPreferenceReady(): boolean {
    return this.preference.isReady();
  }

  public waitForPreference(): Promise<void> {
    return this.preference.ready;
  }

  public subscribePreferenceReady(listener: () => void): () => void {
    return this.preference.subscribeReady(listener);
  }

  public subscribe(listener: (enabled: boolean) => void): () => void {
    return this.preference.subscribe(listener);
  }

  public destroy(): void {
    this.pool.destroy();
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
  }
}

export const soundService = new SoundService();
