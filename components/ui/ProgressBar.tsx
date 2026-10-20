import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '@/theme';

interface ProgressProps {
  value?: number; // 0..1
  progress?: number; // alias for value
  tone?: 'purple' | 'blue' | 'success' | 'warning' | 'danger';
  color?: string;
  height?: number;
}

const TONES = {
  purple: colors.purple,
  blue: colors.blue,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
} as const;

export function ProgressBar({ value, progress, tone = 'purple', color, height = 8 }: ProgressProps) {
  const raw = value !== undefined ? value : progress !== undefined ? progress : 0;
  const v = Math.max(0, Math.min(1, raw));
  const bg = color || TONES[tone];
  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          { width: `${v * 100}%`, backgroundColor: bg, height },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.pill,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: radii.pill,
  },
});

void spacing;
