import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outline';
  glow?: 'none' | 'purple' | 'blue';
}

export function Card({ children, style, variant = 'default', glow = 'none' }: CardProps) {
  const bg =
    variant === 'elevated' ? colors.bgElevated : variant === 'outline' ? 'transparent' : colors.bgCard;
  const border = variant === 'outline' ? colors.borderStrong : colors.border;
  const glowStyle =
    glow === 'purple'
      ? { shadowColor: colors.purple, shadowOpacity: 0.45, shadowRadius: 18, elevation: 6 }
      : glow === 'blue'
        ? { shadowColor: colors.blue, shadowOpacity: 0.4, shadowRadius: 18, elevation: 6 }
        : {};
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg, borderColor: border },
        glow !== 'none' && { shadowOffset: { width: 0, height: 0 } },
        glowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  header: { marginBottom: spacing.md },
  headerTitle: { ...typography.h4, color: colors.textPrimary },
  headerSubtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});
