import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography, radii } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { ThemeColors } from '@/theme/ThemeProvider';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const getTones = (colors: ThemeColors) => ({
  info: { bg: colors.blueGlow, fg: colors.blueSoft, border: colors.blue },
  success: { bg: colors.successGlow, fg: colors.successSoft, border: colors.success },
  warning: { bg: colors.warningGlow, fg: colors.warning, border: colors.warning },
  danger: { bg: colors.dangerGlow, fg: colors.dangerSoft, border: colors.danger },
} as const);

export function FeedbackBanner({ tone = 'info', title, message }: { tone?: Tone; title: string; message?: string }) {
  const { colors, mode } = useTheme();
  const tones = getTones(colors);
  const lightBackgrounds: Record<Tone, string> = {
    info: 'rgba(59, 130, 246, 0.10)',
    success: 'rgba(16, 185, 129, 0.10)',
    warning: 'rgba(255, 209, 102, 0.18)',
    danger: 'rgba(239, 68, 68, 0.10)',
  };
  const t = { ...tones[tone], bg: mode === 'light' ? lightBackgrounds[tone] : tones[tone].bg };
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[styles.title, { color: t.fg }]}>{title}</Text>
      {message ? <Text style={[styles.msg, { color: t.fg }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  title: { ...typography.bodyMedium },
  msg: { ...typography.small, marginTop: 4 },
});
