import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { Button } from './Button';
import { mascotImages } from '@/assets/illustrations';

export function LoadingState({ label = 'Hazırlanıyor…' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mascotCircle}>
        <Image source={mascotImages.searching} style={styles.mascotSmall} resizeMode="contain" />
      </View>
      <ActivityIndicator size="large" color={colors.orange} style={{ marginTop: spacing.lg }} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mascotCircle}>
        <Image source={mascotImages.lobby} style={styles.mascot} resizeMode="contain" />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.text}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="orange" size="md" style={styles.actionBtn} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title = 'Bir sorun oluştu!',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.mascotCircle, { borderColor: colors.danger }]}>
        <Image source={mascotImages.shocked} style={styles.mascot} resizeMode="contain" />
      </View>
      <Text style={[styles.title, { color: colors.dangerSoft }]}>{title}</Text>
      {message ? <Text style={styles.text}>{message}</Text> : null}
      {onRetry ? (
        <Button label="Tekrar Dene" onPress={onRetry} variant="primary" size="md" style={styles.actionBtn} />
      ) : null}
    </View>
  );
}

export function OfflineState({
  label = 'Bağlantı koptu!',
  onRetry,
}: {
  label?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mascotCircle}>
        <Image source={mascotImages.searching} style={styles.mascot} resizeMode="contain" />
      </View>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.text}>İnternet bağlantını kontrol et veya tekrar dene.</Text>
      {onRetry ? (
        <Button label="Yeniden Bağlan" onPress={onRetry} variant="orange" size="md" style={styles.actionBtn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginVertical: spacing.md,
    ...shadows.card,
  },
  mascotCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.bgSurfaceAlt,
    borderWidth: 2,
    borderColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mascot: {
    width: 100,
    height: 100,
  },
  mascotSmall: {
    width: 90,
    height: 90,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontFamily: 'Poppins-Bold',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.orange,
    marginTop: spacing.md,
    fontFamily: 'Poppins-Bold',
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionBtn: {
    marginTop: spacing.lg,
    minWidth: 160,
  },
});
