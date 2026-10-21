import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, spacing, typography, shadows } from '@/theme';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outline' | 'surface' | 'accent' | 'comic';
  glow?: 'none' | 'purple' | 'orange' | 'lime' | 'blue';
}

export function Card({ children, style, variant = 'default', glow = 'none' }: CardProps) {
  const bg =
    variant === 'elevated'
      ? colors.bgElevated
      : variant === 'outline'
      ? 'transparent'
      : variant === 'surface'
      ? colors.bgCard
      : variant === 'accent'
      ? colors.bgSurfaceAlt
      : variant === 'comic'
      ? colors.bgCardAlt
      : colors.bgCard;

  const border =
    variant === 'outline'
      ? colors.borderStrong
      : variant === 'comic'
      ? colors.purple
      : variant === 'accent'
      ? colors.borderAccent
      : colors.border;

  const glowStyle =
    glow === 'purple'
      ? shadows.glow
      : glow === 'orange'
      ? shadows.glowOrange
      : glow === 'lime'
      ? shadows.glowLime
      : glow === 'blue'
      ? shadows.glowBlue
      : shadows.card;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === 'comic' ? 2 : 1,
        },
        glowStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: { ...typography.h4, color: colors.textPrimary, fontFamily: 'Poppins-Bold' },
  headerSubtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});
