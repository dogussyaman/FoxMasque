import { Platform, Image, AppState, type AppStateStatus } from 'react-native';
import { soundAssets, type SoundEffect } from '@/assets/sound';

type SoundListener = (enabled: boolean) => void;

interface SoundPlayerInstance {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => Promise<void>;
  volume: number;
  remove: () => void;
}

// Dynamically check and access expo-audio to prevent native module missing errors
// from crashing the entire app on un-rebuilt development builds or older Expo Go versions
let expoAudioModule: typeof import('expo-audio') | null = null;
let isExpoAudioAvailable = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('expo-audio');
  if (mod && (mod.createAudioPlayer || mod.AudioModule)) {
    expoAudioModule = mod;
    isExpoAudioAvailable = true;
  }
} catch (e) {
  // Native module ExpoAudio is not yet compiled into the running native binary
  isExpoAudioAvailable = false;
  if (__DEV__) {
    console.warn(
      '[TUZAK SoundService] expo-audio native module is not available in current client build. ' +
      'On Web, HTML5 audio fallback is active. On iOS/Android, rebuild with `npx expo run:ios` or `npx expo run:android`.'
    );
  }
}

class SoundService {
  private enabled: boolean = true;
  private listeners: Set<SoundListener> = new Set();
  private isAudioModeConfigured: boolean = false;
  private appStateSubscription: any = null;

  // Multi-player pool per sound effect for rapid/overlapping playback without clipping
  // e.g. 'click' has 2 players alternating so rapid button taps sound clean and unbroken
  private playerPools: Map<SoundEffect, SoundPlayerInstance[]> = new Map();
  private poolIndex: Map<SoundEffect, number> = new Map();

  constructor() {
    this.initAudioMode();
    this.setupAppStateListener();
  }

  private async initAudioMode() {
    if (Platform.OS === 'web') return;
    if (!isExpoAudioAvailable || !expoAudioModule) return;

    try {
      if (expoAudioModule.setAudioModeAsync) {
        await expoAudioModule.setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'mixWithOthers',
          shouldPlayInBackground: false,
        });
        this.isAudioModeConfigured = true;
      }
    } catch {
      // Graceful initialization failure
    }
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        this.handleAppBackground();
      } else if (nextState === 'active') {
        this.handleAppActive();
      }
    });
  }

  private async handleAppBackground() {
    if (!isExpoAudioAvailable || !expoAudioModule) return;
    try {
      if (expoAudioModule.setIsAudioActiveAsync) {
        await expoAudioModule.setIsAudioActiveAsync(false);
      }
    } catch {}
  }

  private async handleAppActive() {
    if (!isExpoAudioAvailable || !expoAudioModule) return;
    try {
      if (expoAudioModule.setIsAudioActiveAsync) {
        await expoAudioModule.setIsAudioActiveAsync(true);
      }
    } catch {}
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stopAll();
    }
    this.listeners.forEach((listener) => {
      try {
        listener(val);
      } catch {}
    });
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public subscribe(listener: SoundListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Helper to create a single player instance for an asset
   */
  private createPlayerInstance(effect: SoundEffect): SoundPlayerInstance | null {
    const source = soundAssets[effect];
    if (!source) return null;

    const defaultVol = effect === 'click' ? 0.75 : effect === 'clock' ? 0.55 : 1.0;

    // 1. If expo-audio is available (Web or Native with compiled ExpoAudio)
    if (isExpoAudioAvailable && expoAudioModule?.createAudioPlayer) {
      try {
        const player = expoAudioModule.createAudioPlayer(source, {
          keepAudioSessionActive: true,
        });
        if (player) {
          player.volume = defaultVol;
          return {
            play: () => {
              try {
                player.play();
              } catch {}
            },
            pause: () => {
              try {
                player.pause();
              } catch {}
            },
            seekTo: async (sec: number) => {
              try {
                if (player.seekTo) {
                  await player.seekTo(sec);
                }
              } catch {}
            },
            volume: defaultVol,
            remove: () => {
              try {
                player.remove();
              } catch {}
            },
          };
        }
      } catch {}
    }

    // 2. Web fallback using browser Audio element
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
      try {
        const resolved =
          Image.resolveAssetSource(source)?.uri ||
          (typeof source === 'string' ? source : (source as any)?.default);
        if (resolved) {
          const webAudio = new window.Audio(resolved);
          webAudio.volume = defaultVol;
          webAudio.preload = 'auto';
          return {
            play: () => {
              try {
                webAudio.currentTime = 0;
                webAudio.play().catch(() => {});
              } catch {}
            },
            pause: () => {
              try {
                webAudio.pause();
              } catch {}
            },
            seekTo: async (sec: number) => {
              try {
                webAudio.currentTime = sec;
              } catch {}
            },
            volume: defaultVol,
            remove: () => {
              try {
                webAudio.pause();
                webAudio.src = '';
              } catch {}
            },
          };
        }
      } catch {}
    }

    return null;
  }

  /**
   * Preload sound instances into pools for near-instant, zero-latency playback
   */
  public async preload() {
    if (!this.isAudioModeConfigured) {
      await this.initAudioMode();
    }

    const effects: SoundEffect[] = ['click', 'true', 'zartalanma', 'clock'];
    for (const effect of effects) {
      if (!this.playerPools.has(effect)) {
        // Pool size: 'click' has 2 players so consecutive fast taps don't clip each other
        const poolSize = effect === 'click' ? 2 : 1;
        const pool: SoundPlayerInstance[] = [];

        for (let i = 0; i < poolSize; i++) {
          const inst = this.createPlayerInstance(effect);
          if (inst) pool.push(inst);
        }

        if (pool.length > 0) {
          this.playerPools.set(effect, pool);
          this.poolIndex.set(effect, 0);
        }
      }
    }
  }

  /**
   * Play a game sound effect
   */
  public async play(effect: SoundEffect, customVolume?: number): Promise<void> {
    if (!this.enabled) return;

    let pool = this.playerPools.get(effect);
    if (!pool || pool.length === 0) {
      // Lazy load on first play if not preloaded
      const inst = this.createPlayerInstance(effect);
      if (inst) {
        pool = [inst];
        this.playerPools.set(effect, pool);
        this.poolIndex.set(effect, 0);
      }
    }

    if (!pool || pool.length === 0) return;

    // Round-robin selection from pool
    const currentIdx = this.poolIndex.get(effect) || 0;
    const player = pool[currentIdx];
    const nextIdx = (currentIdx + 1) % pool.length;
    this.poolIndex.set(effect, nextIdx);

    try {
      const vol = customVolume !== undefined ? customVolume : player.volume;
      player.volume = Math.max(0, Math.min(1, vol));
      await player.seekTo(0);
      player.play();
    } catch {
      // Autoplay or muted catch
    }
  }

  /**
   * Stop a specific sound effect (or all if not provided) and rewind
   */
  public stop(effect?: SoundEffect) {
    if (!effect) {
      this.stopAll();
      return;
    }
    const pool = this.playerPools.get(effect);
    if (!pool) return;
    pool.forEach((player) => {
      try {
        player.pause();
        void player.seekTo(0);
      } catch {}
    });
  }

  /**
   * Stop all currently playing sounds across all pools
   */
  public stopAll() {
    this.playerPools.forEach((pool) => {
      pool.forEach((player) => {
        try {
          player.pause();
          void player.seekTo(0);
        } catch {}
      });
    });
  }

  /**
   * Release all players and clear memory
   */
  public destroy() {
    this.playerPools.forEach((pool) => {
      pool.forEach((player) => {
        try {
          player.remove();
        } catch {}
      });
    });
    this.playerPools.clear();
    this.poolIndex.clear();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

export const soundService = new SoundService();
