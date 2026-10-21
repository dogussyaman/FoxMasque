export interface SoundPoolPlayer {
  waitUntilReady: () => Promise<boolean>;
  play: () => void | Promise<void>;
  pause: () => void;
  seekTo: (seconds: number) => Promise<void>;
  setVolume: (volume: number) => void;
  remove: () => void;
}

type SoundEffectName = string;
type CreatePlayer = (effect: SoundEffectName) => SoundPoolPlayer | null;
type ReportError = (effect: SoundEffectName, operation: string, error?: unknown) => void;

interface PlayerEntry {
  player: SoundPoolPlayer;
  busy: boolean;
  generation: number;
}

export function clampVolume(volume: number, fallback: number): number {
  return Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : fallback;
}

export class SoundPool {
  private pools = new Map<SoundEffectName, PlayerEntry[]>();
  private poolIndexes = new Map<SoundEffectName, number>();
  private failedEffects = new Set<SoundEffectName>();
  private enabled = true;

  constructor(
    private readonly createPlayer: CreatePlayer,
    private readonly reportError: ReportError,
    private readonly poolSizes: Record<string, number>,
  ) {}

  public preload(effects: readonly SoundEffectName[]): void {
    for (const effect of effects) {
      this.ensurePool(effect);
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  public async play(effect: SoundEffectName, volume: number, defaultVolume: number): Promise<boolean> {
    if (!this.enabled || this.failedEffects.has(effect)) return false;

    this.ensurePool(effect);
    const pool = this.pools.get(effect);
    if (!pool?.length) return false;

    const startIndex = this.poolIndexes.get(effect) ?? 0;
    let selectedIndex = -1;
    for (let offset = 0; offset < pool.length; offset += 1) {
      const candidateIndex = (startIndex + offset) % pool.length;
      if (!pool[candidateIndex].busy) {
        selectedIndex = candidateIndex;
        break;
      }
    }
    if (selectedIndex < 0) return false;

    this.poolIndexes.set(effect, (selectedIndex + 1) % pool.length);
    const entry = pool[selectedIndex];
    const generation = entry.generation;
    entry.busy = true;

    try {
      const ready = await entry.player.waitUntilReady();
      if (!this.enabled || entry.generation !== generation) return false;
      if (!ready) {
        this.failEffect(effect, 'load', new Error('Player did not become ready before timeout.'));
        return false;
      }

      entry.player.setVolume(clampVolume(volume, defaultVolume));
      await entry.player.seekTo(0);
      if (entry.generation !== generation) return false;
      await entry.player.play();
      return true;
    } catch (error) {
      this.failEffect(effect, 'play', error);
      return false;
    } finally {
      entry.busy = false;
    }
  }

  public stop(effect?: SoundEffectName): void {
    const effects = effect ? [effect] : [...this.pools.keys()];
    for (const currentEffect of effects) {
      for (const entry of this.pools.get(currentEffect) ?? []) {
        entry.generation += 1;
        try {
          entry.player.pause();
          void entry.player.seekTo(0).catch((error: unknown) => {
            this.reportError(currentEffect, 'stop', error);
          });
        } catch (error) {
          this.reportError(currentEffect, 'stop', error);
        }
      }
    }
  }

  public destroy(): void {
    for (const [effect, pool] of this.pools) {
      for (const entry of pool) {
        entry.generation += 1;
        try {
          entry.player.remove();
        } catch (error) {
          this.reportError(effect, 'remove', error);
        }
      }
    }
    this.pools.clear();
    this.poolIndexes.clear();
    this.failedEffects.clear();
  }

  private ensurePool(effect: SoundEffectName): void {
    if (this.pools.has(effect) || this.failedEffects.has(effect)) return;

    const pool: PlayerEntry[] = [];
    const poolSize = Math.max(1, Math.floor(this.poolSizes[effect] ?? 1));
    for (let index = 0; index < poolSize; index += 1) {
      try {
        const player = this.createPlayer(effect);
        if (player) pool.push({ player, busy: false, generation: 0 });
      } catch (error) {
        this.reportError(effect, 'create', error);
      }
    }
    if (pool.length) {
      this.pools.set(effect, pool);
      this.poolIndexes.set(effect, 0);
    } else {
      this.failedEffects.add(effect);
      this.reportError(effect, 'create', new Error('No usable player could be created.'));
    }
  }

  private failEffect(effect: SoundEffectName, operation: string, error: unknown): void {
    if (this.failedEffects.has(effect)) return;
    this.failedEffects.add(effect);
    this.reportError(effect, operation, error);

    for (const entry of this.pools.get(effect) ?? []) {
      try {
        entry.player.remove();
      } catch (removeError) {
        this.reportError(effect, 'remove-after-failure', removeError);
      }
    }
    this.pools.delete(effect);
    this.poolIndexes.delete(effect);
  }
}
