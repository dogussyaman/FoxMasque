import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';
import type { ReactNode } from 'react';

type Tone = 'purple' | 'blue' | 'coral' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  purple: { bg: colors.purpleGlow, fg: colors.purpleSoft },
  blue: { bg: colors.blueGlow, fg: colors.blueSoft },
  coral: { bg: colors.orangeGlow, fg: colors.coralSoft },
  success: { bg: colors.successGlow, fg: colors.successSoft },
  warning: { bg: colors.warningGlow, fg: colors.warning },
  danger: { bg: colors.dangerGlow, fg: colors.dangerSoft },
  neutral: { bg: colors.bgSurfaceAlt, fg: colors.textSecondary },
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  style?: ViewStyle;
}

export function Badge({ children, tone = 'neutral', style }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.text, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  text: { ...typography.caption, letterSpacing: 0.4 },
});
