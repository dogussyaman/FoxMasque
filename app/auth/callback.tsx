import { useTheme, useThemeStyles } from '@/theme/ThemeProvider';
import type { ThemeColors } from '@/theme/ThemeProvider';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Screen, Input } from '@/components/ui';
import { colors, radii, spacing, typography } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import type { Player } from '@/types/game';

export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const params = useLocalSearchParams<{ code?: string; type?: string; error?: string; error_description?: string }>();
  const { service, setCurrentPlayer } = useGameStore();
  const [error, setError] = useState<string | null>(null);
  const [recoveryPlayer, setRecoveryPlayer] = useState<Player | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const isRecovery = params.type === 'recovery';
  const code = typeof params.code === 'string' ? params.code : null;
  const oauthError = typeof params.error_description === 'string'
    ? params.error_description
    : typeof params.error === 'string' ? params.error : null;
  const callbackError = oauthError
    ? oauthError.toLowerCase().includes('access_denied') || oauthError.toLowerCase().includes('cancel')
      ? 'Google girişi iptal edildi.'
      : 'Google girişi tamamlanamadı. Lütfen yeniden dene.'
    : !code ? 'Giriş bağlantısında oturum kodu bulunamadı. Lütfen yeniden dene.' : null;

  useEffect(() => {
    let active = true;
    if (callbackError || !code) return () => { active = false; };

    service.completeOAuthCallback(code)
      .then((player) => {
        if (!active) return;
        if (isRecovery) {
          setRecoveryPlayer(player);
          return;
        }
        setCurrentPlayer(player);
        router.replace('/(tabs)');
      })
      .catch((authError) => {
        if (active) setError((authError as Error).message);
      });
    return () => { active = false; };
  }, [callbackError, code, service, setCurrentPlayer, isRecovery]);

  const handlePasswordUpdate = async () => {
    setBusy(true);
    setError(null);
    try {
      await service.updatePassword(password);
      if (recoveryPlayer) setCurrentPlayer(recoveryPlayer);
      router.replace('/(tabs)');
    } catch (authError) {
      setError((authError as Error).message || 'Şifre güncellenemedi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen gradient>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error || callbackError ? (
            <>
              <Text style={styles.error}>{error ?? callbackError}</Text>
              <Text style={styles.link} onPress={() => router.replace('/auth')}>Giriş ekranına dön</Text>
            </>
          ) : recoveryPlayer ? (
            <>
              <Text style={styles.text}>Yeni şifreni belirle</Text>
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Yeni şifre (en az 6 karakter)"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                style={styles.input}
                variant="dark"
                focusedBorderColor={colors.orange}
              />
              <Button
                label="Şifreyi güncelle"
                onPress={() => void handlePasswordUpdate()}
                variant="orange"
                fullWidth
                disabled={busy || password.length < 6}
              />
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.orange} size="large" />
              <Text style={styles.text}>Google oturumu doğrulanıyor...</Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  text: { ...typography.body, color: colors.textPrimary },
  error: { ...typography.body, color: colors.dangerSoft, textAlign: 'center' },
  link: { ...typography.body, color: colors.purpleSoft, padding: spacing.sm },
  input: {
    alignSelf: 'stretch',
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgDark,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
    ...typography.body,
  },
});
