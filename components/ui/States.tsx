import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

export function LoadingState({ label = 'Yükleniyor…' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.purpleSoft} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

export function ErrorState({ title = 'Bir sorun oluştu', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.text}>{message}</Text> : null}
      {onRetry ? (
        <Text style={styles.retry} onPress={onRetry}>
          Tekrar dene
        </Text>
      ) : null}
    </View>
  );
}

export function OfflineState({ label = 'Bağlantı yok' }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>📶 {label}</Text>
      <Text style={styles.text}>İnternet bağlantını kontrol et.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing['3xl'] },
  title: { ...typography.h4, color: colors.textPrimary, textAlign: 'center' },
  text: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  retry: { ...typography.bodyMedium, color: colors.purpleSoft, marginTop: spacing.lg },
});
