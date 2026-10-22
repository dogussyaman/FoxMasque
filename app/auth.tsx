import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Screen, Button, Card, Input } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import type { Player } from '@/types/game';

export default function AuthScreen() {
  const { service, setCurrentPlayer, isLive } = useGameStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finishAuth = (player: Player) => {
    setCurrentPlayer(player);
    router.replace('/(tabs)');
  };

  const handleEmailAuth = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'register') {
        if (password.length < 6) {
          setError('Şifre en az 6 karakter olmalıdır.');
          return;
        }
        const result = await service.signUpWithEmail(email, password, name);
        if (result.player) {
          finishAuth(result.player);
        } else {
          setMessage('Kayıt oluşturuldu. E-postanı doğruladıktan sonra giriş yapabilirsin.');
          setMode('login');
        }
      } else {
        finishAuth(await service.signInWithEmail(email, password));
      }
    } catch (authError) {
      setError((authError as Error).message || 'Kimlik doğrulama başarısız oldu.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleAuth = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      finishAuth(await service.signInWithGoogle());
    } catch (authError) {
      setError((authError as Error).message || 'Google girişi tamamlanamadı.');
      setBusy(false);
    }
  };

  const handlePasswordReset = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await service.sendPasswordResetEmail(email);
      setMessage('Şifre yenileme bağlantısı gönderildiyse e-postanı kontrol et.');
    } catch (authError) {
      setError((authError as Error).message || 'Şifre yenileme e-postası gönderilemedi.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!isLive) router.replace('/onboarding');
  }, [isLive]);
  if (!isLive) return null;

  return (
    <Screen gradient diagonalSlice>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoStage}>
                <View style={styles.logoGlow} />
                <Image
                  source={require('@/assets/illustrations/kızılkuyruk.png')}
                  resizeMode="contain"
                  accessibilityLabel="Kızılkuyruk"
                  style={styles.logoImage}
                />
              </View>
              <Text style={styles.title}>
                {mode === 'register' ? 'Aramıza katıl!' : 'Tekrar hoş geldin!'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'register'
                  ? 'Hesabını oluştur, arkadaşlarınla blöf heyecanına katıl.'
                  : 'Giriş yap ve oyuna kaldığın yerden devam et.'}
              </Text>
            </View>

            <Card variant="surface" style={styles.card}>
              <View style={styles.modeSwitch}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === 'login' }}
                  onPress={() => {
                    setMode('login');
                    setError(null);
                    setMessage(null);
                  }}
                  disabled={busy}
                  style={[styles.modeOption, mode === 'login' && styles.modeOptionActive]}
                >
                  <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>
                    Giriş yap
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: mode === 'register' }}
                  onPress={() => {
                    setMode('register');
                    setError(null);
                    setMessage(null);
                  }}
                  disabled={busy}
                  style={[styles.modeOption, mode === 'register' && styles.modeOptionActive]}
                >
                  <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>
                    Kayıt ol
                  </Text>
                </Pressable>
              </View>
              <Button
                label="Google ile devam et"
                onPress={() => void handleGoogleAuth()}
                variant="primary"
                fullWidth
                disabled={busy}
              />
              <View style={styles.separator}>
                <View style={styles.rule} />
                <Text style={styles.orText}>veya e-posta ile</Text>
                <View style={styles.rule} />
              </View>

              {mode === 'register' ? (
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="Oyuncu adı"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  maxLength={32}
                  autoCapitalize="words"
                  textContentType="name"
                  variant="dark"
                  focusedBorderColor={colors.purple}
                />
              ) : null}
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="E-posta"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                variant="dark"
                focusedBorderColor={colors.purple}
              />
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Şifre (en az 6 karakter)"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                secureTextEntry
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                textContentType={mode === 'register' ? 'newPassword' : 'password'}
                variant="dark"
                focusedBorderColor={colors.purple}
              />

              {mode === 'login' ? (
                <Pressable
                  onPress={() => void handlePasswordReset()}
                  disabled={busy || !email.trim()}
                  style={styles.forgotPassword}
                >
                  <Text style={styles.switchText}>Şifremi unuttum</Text>
                </Pressable>
              ) : null}
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}

              <Button
                label={mode === 'register' ? 'Hesap oluştur' : 'Giriş yap'}
                onPress={() => void handleEmailAuth()}
                variant="orange"
                fullWidth
                disabled={busy || !email.trim() || !password}
                icon={busy ? <ActivityIndicator color="#FFF" /> : <Mail color="#FFF" size={18} />}
              />
            </Card>

            <Pressable
              onPress={() => router.replace('/onboarding')}
              disabled={busy}
              style={styles.guest}
            >
              <Text style={styles.guestText}>Hesap oluşturmadan misafir olarak oyna</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  content: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  logoStage: {
    width: '100%',
    height: 154,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'visible',
  },
  logoGlow: {
    position: 'absolute',
    width: '76%',
    height: 78,
    borderRadius: 999,
    backgroundColor: colors.orangeGlow,
    opacity: 0.65,
  },
  logoImage: {
    width: '100%',
    maxWidth: 440,
    height: 154,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  modeSwitch: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radii.md,
    backgroundColor: colors.bgDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    borderRadius: radii.sm,
  },
  modeOptionActive: {
    backgroundColor: colors.bgSurfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  modeText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },
  modeTextActive: {
    color: colors.textPrimary,
  },
  separator: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  orText: { ...typography.caption, color: colors.textMuted },
  input: {
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
  error: { ...typography.caption, color: colors.dangerSoft },
  message: { ...typography.caption, color: colors.lime },
  forgotPassword: { alignSelf: 'flex-end', paddingVertical: spacing.xs },
  switchText: { ...typography.caption, color: colors.purpleSoft },
  guest: { alignItems: 'center', padding: spacing.lg },
  guestText: { ...typography.caption, color: colors.textSecondary, textDecorationLine: 'underline' },
});
