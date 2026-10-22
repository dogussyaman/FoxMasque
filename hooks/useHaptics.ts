import { useCallback, useEffect, useState } from 'react';
import { hapticsService } from '@/services/hapticsService';

export function useHaptics() {
  const [enabled, setEnabledState] = useState(() => hapticsService.isEnabled());
  const [ready, setReady] = useState(() => hapticsService.isReady());

  useEffect(() => {
    const unsubscribe = hapticsService.subscribe(setEnabledState);
    const unsubscribeReady = hapticsService.subscribeReady(() => setReady(true));
    return () => {
      unsubscribe();
      unsubscribeReady();
    };
  }, []);

  const trigger = useCallback((style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    hapticsService.trigger(style);
  }, []);
  const setEnabled = useCallback((value: boolean) => {
    hapticsService.setEnabled(value);
  }, []);

  return { trigger, enabled, ready, setEnabled };
}
