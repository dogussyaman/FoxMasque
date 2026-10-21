import { useCallback, useEffect, useState } from 'react';
import { soundService } from '@/services/soundService';
import type { SoundEffect } from '@/assets/sound';

export function useSound() {
  const [enabled, setEnabledState] = useState(() => soundService.isEnabled());
  const [ready, setReady] = useState(() => soundService.isPreferenceReady());

  useEffect(() => {
    const unsubscribe = soundService.subscribe((val) => {
      setEnabledState(val);
    });
    const unsubscribeReady = soundService.subscribePreferenceReady(() => {
      setReady(true);
    });
    void soundService.waitForPreference().then(() => {
      setReady(soundService.isPreferenceReady());
    });
    return () => {
      unsubscribe();
      unsubscribeReady();
    };
  }, []);

  const playSound = useCallback((effect: SoundEffect, volume?: number) => {
    soundService.play(effect, volume);
  }, []);

  const setEnabled = useCallback((val: boolean) => {
    soundService.setEnabled(val);
  }, []);

  return { playSound, enabled, ready, setEnabled };
}

export type { SoundEffect };
