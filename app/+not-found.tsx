import { Stack, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, Button } from '@/components/ui';
import { colors, typography, spacing } from '@/theme';
import { Home, AlertCircle } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Bulunamadı', headerShown: false }} />
      <View style={styles.container}>
        <AlertCircle color={colors.purpleSoft} size={54} />
        <Text style={styles.title}>Sayfa Bulunamadı</Text>
        <Text style={styles.subtitle}>
          Aradığın sayfa veya parti odası artık mevcut değil.
        </Text>
        <Button
          label="Ana Sayfaya Dön"
          onPress={() => router.replace('/(tabs)')}
          variant="primary"
          icon={<Home color="#FFF" size={20} />}
          style={{ marginTop: spacing.xl, minWidth: 200 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 320,
  },
});
