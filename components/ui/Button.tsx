import { Pressable, StyleSheet, Text, View, ActivityIndicator, type ViewStyle } from 'react-native';
import { colors, typography, radii, spacing, shadows } from '@/theme';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'orange' | 'secondary' | 'ghost' | 'danger' | 'success' | 'lime';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const VARIANTS: Record<
  Variant,
  { bg: string; fg: string; border: string; bottomBorder: string; shadow?: object }
> = {
  primary: {
    bg: colors.purple,
    fg: colors.textOnAccent,
    border: '#A78BFA',
    bottomBorder: '#5B21B6',
    shadow: shadows.glow,
  },
  orange: {
    bg: colors.orange,
    fg: colors.textOnAccent,
    border: '#FFA07A',
    bottomBorder: '#C2410C',
    shadow: shadows.glowOrange,
  },
  secondary: {
    bg: colors.bgSurface,
    fg: colors.textPrimary,
    border: colors.borderStrong,
    bottomBorder: '#1A0E30',
    shadow: shadows.card,
  },
  ghost: {
    bg: 'transparent',
    fg: colors.textPrimary,
    border: 'transparent',
    bottomBorder: 'transparent',
  },
  danger: {
    bg: colors.danger,
    fg: colors.textOnAccent,
    border: '#F87171',
    bottomBorder: '#991B1B',
  },
  success: {
    bg: colors.success,
    fg: colors.textOnAccent,
    border: '#6EE7B7',
    bottomBorder: '#065F46',
  },
  lime: {
    bg: colors.lime,
    fg: '#171026',
    border: '#E2F899',
    bottomBorder: '#84CC16',
    shadow: shadows.glowLime,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled,
  loading,
  icon,
  style,
  fullWidth,
}: ButtonProps) {
  const v = VARIANTS[variant];
  const height = size === 'lg' ? 56 : size === 'md' ? 48 : 38;
  const fontSize = size === 'lg' ? 17 : size === 'md' ? 15 : 13;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        v.shadow,
        {
          height,
          backgroundColor: v.bg,
          borderColor: v.border,
          borderBottomColor: v.bottomBorder,
          borderBottomWidth: disabled ? 1 : 4,
          transform: [{ translateY: pressed ? 2 : 0 }],
          opacity: disabled ? 0.45 : pressed ? 0.92 : 1,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.label, { color: v.fg, fontSize }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconWrap: { marginRight: spacing.sm },
  label: {
    ...typography.bodyMedium,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.3,
  },
});
