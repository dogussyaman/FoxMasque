import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type Style = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const map: Record<Style, Haptics.ImpactFeedbackStyle | null> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  success: null,
  warning: null,
  error: null,
};

export function useHaptics() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(true);
  }, []);

  const trigger = useCallback(
    (style: Style = 'light') => {
      if (!enabled) return;
      if (Platform.OS === 'web') return;
      try {
        if (style === 'success' || style === 'warning' || style === 'error') {
          Haptics.notificationAsync(
            style === 'success'
              ? Haptics.NotificationFeedbackType.Success
              : style === 'warning'
                ? Haptics.NotificationFeedbackType.Warning
                : Haptics.NotificationFeedbackType.Error
          );
        } else {
          const s = map[style];
          if (s) Haptics.impactAsync(s);
        }
      } catch {
        // no-op
      }
    },
    [enabled]
  );

  return { trigger, setEnabled };
}
