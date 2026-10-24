import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { colors, radii, shadows, spacing, typography } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export interface FloatingToastProps {
  title: string;
  message: string;
  tone?: 'warning' | 'danger' | 'info';
}

export function FloatingToast({ title, message, tone = 'warning' }: FloatingToastProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();

  const isDanger = tone === 'danger';
  const accentColor = isDanger ? colors.danger : themeColors.orange;
  const iconWrapBg = isDanger ? 'rgba(239, 68, 68, 0.16)' : colors.warningGlow;
  const borderColor = isDanger ? 'rgba(239, 68, 68, 0.52)' : 'rgba(255, 145, 77, 0.52)';

  return (
    <Animated.View
      entering={FadeInDown.duration(240)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="none"
      style={[
        styles.container,
        {
          top: insets.top + spacing.sm,
          backgroundColor: themeColors.bgSurface,
          borderColor,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconWrapBg }]}>
        {isDanger ? (
          <AlertCircle color={colors.danger} size={18} strokeWidth={2.3} />
        ) : (
          <Sparkles color={accentColor} size={18} strokeWidth={2.3} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
        <Text style={[styles.message, { color: themeColors.textPrimary }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 145, 77, 0.52)',
    backgroundColor: colors.bgSurface,
    ...shadows.card,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.warningGlow,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.small,
    color: colors.orange,
    fontFamily: 'Poppins-Bold',
  },
  message: {
    ...typography.small,
    color: colors.textPrimary,
  },
});

