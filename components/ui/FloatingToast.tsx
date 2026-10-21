import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { colors, radii, shadows, spacing, typography } from '@/theme';

export function FloatingToast({ title, message }: { title: string; message: string }) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      entering={FadeInDown.duration(240)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="none"
      style={[styles.container, { top: insets.top + spacing.sm }]}
    >
      <View style={styles.iconWrap}>
        <Sparkles color={colors.orange} size={18} strokeWidth={2.3} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
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
