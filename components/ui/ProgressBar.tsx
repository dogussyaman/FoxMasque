import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { colors, radii, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

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
  const { colors: themeColors } = useTheme();
  const raw = value !== undefined ? value : progress !== undefined ? progress : 0;
  const v = Math.max(0, Math.min(1, raw));
  const bg = color || themeColors[tone];

  const animatedWidth = useSharedValue(v);

  useEffect(() => {
    animatedWidth.value = withTiming(v, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
  }, [v, animatedWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { height, backgroundColor: themeColors.bgSurfaceAlt }]}>
      <Animated.View
        style={[
          styles.fill,
          fillStyle,
          { backgroundColor: bg, height },
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
