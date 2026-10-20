import { useCallback, useEffect, useState } from 'react';
import { soundService } from '@/services/soundService';
import type { SoundEffect } from '@/assets/sound';

export function useSound() {
  const [enabled, setEnabledState] = useState(() => soundService.isEnabled());

  useEffect(() => {
    return soundService.subscribe((val) => {
      setEnabledState(val);
    });
  }, []);

  const playSound = useCallback((effect: SoundEffect, volume?: number) => {
    soundService.play(effect, volume);
  }, []);

  const setEnabled = useCallback((val: boolean) => {
    soundService.setEnabled(val);
  }, []);

  return { playSound, enabled, setEnabled };
}

export type { SoundEffect };
