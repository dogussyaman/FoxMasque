import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { soundAssets, type SoundEffect } from '@/assets/sound';

type SoundListener = (enabled: boolean) => void;

class SoundService {
  private enabled: boolean = true;
  private listeners: Set<SoundListener> = new Set();
  private isAudioModeConfigured: boolean = false;
  private preloadedSounds: Partial<Record<SoundEffect, Audio.Sound>> = {};

  constructor() {
    this.configureAudioMode();
  }

  private async configureAudioMode() {
    if (Platform.OS === 'web') return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      this.isAudioModeConfigured = true;
    } catch {
      // Audio mode configuration is optional; continue gracefully
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    this.listeners.forEach((listener) => {
      try {
        listener(val);
      } catch {
        // ignore listener errors
      }
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
   * Preload sound instances for zero-latency playback
   */
  public async preload() {
    if (!this.isAudioModeConfigured) {
      await this.configureAudioMode();
    }
    const effects: SoundEffect[] = ['click', 'true', 'zartalanma'];
    for (const effect of effects) {
      try {
        if (!this.preloadedSounds[effect]) {
          const source = soundAssets[effect];
          const { sound } = await Audio.Sound.createAsync(source, {
            shouldPlay: false,
            volume: effect === 'click' ? 0.75 : 1.0,
          });
          this.preloadedSounds[effect] = sound;
        }
      } catch {
        // graceful fallback
      }
    }
  }

  /**
   * Play a game sound effect
   */
  public async play(effect: SoundEffect, customVolume?: number): Promise<void> {
    if (!this.enabled) return;

    const source = soundAssets[effect];
    if (!source) return;

    const defaultVol = effect === 'click' ? 0.75 : 1.0;
    const volume = customVolume !== undefined ? customVolume : defaultVol;

    try {
      const existing = this.preloadedSounds[effect];
      if (existing) {
        const status = await existing.getStatusAsync();
        if (status.isLoaded) {
          await existing.setVolumeAsync(volume);
          await existing.replayAsync();
          return;
        }
      }

      // Create and play sound on-the-fly with expo-av
      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: true, volume },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
          }
        }
      );
    } catch {
      // Graceful fallback for Web HTML5 Audio
      if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.Audio !== 'undefined') {
        try {
          const audioSrc = typeof source === 'string' ? source : (source?.default || source?.uri || source);
          if (audioSrc && typeof audioSrc === 'string') {
            const webAudio = new window.Audio(audioSrc);
            webAudio.volume = Math.max(0, Math.min(1, volume));
            webAudio.play().catch(() => {});
          }
        } catch {
          // Autoplay policy or muted
        }
      }
    }
  }
}

export const soundService = new SoundService();
