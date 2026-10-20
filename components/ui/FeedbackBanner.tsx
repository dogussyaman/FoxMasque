import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, radii } from '@/theme';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const TONES = {
  info: { bg: colors.blueGlow, fg: colors.blueSoft, border: colors.blue },
  success: { bg: colors.successGlow, fg: colors.successSoft, border: colors.success },
  warning: { bg: colors.warningGlow, fg: colors.warning, border: colors.warning },
  danger: { bg: colors.dangerGlow, fg: colors.dangerSoft, border: colors.danger },
} as const;

export function FeedbackBanner({ tone = 'info', title, message }: { tone?: Tone; title: string; message?: string }) {
  const t = TONES[tone];
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
