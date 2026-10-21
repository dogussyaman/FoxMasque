import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, ShieldCheck } from 'lucide-react-native';
import { Screen, Button, Card } from '@/components/ui';
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
          <View style={styles.header}>
            <View style={styles.logo}><ShieldCheck color={colors.orange} size={30} /></View>
            <Text style={styles.title}>FOXMASQUE</Text>
            <Text style={styles.subtitle}>Hesabınla giriş yap, oyuna kaldığın yerden devam et.</Text>
          </View>

          <Card variant="surface" style={styles.card}>
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
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Oyuncu adı"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                maxLength={32}
                autoCapitalize="words"
                textContentType="name"
              />
            ) : null}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-posta"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Şifre (en az 6 karakter)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              textContentType={mode === 'register' ? 'newPassword' : 'password'}
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

            <Pressable
              onPress={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setMessage(null);
              }}
              disabled={busy}
              style={styles.switchMode}
            >
              <Text style={styles.switchText}>
                {mode === 'register' ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}
              </Text>
            </Pressable>
          </Card>

          <Pressable onPress={() => router.replace('/onboarding')} disabled={busy} style={styles.guest}>
            <Text style={styles.guestText}>Hesap oluşturmadan misafir olarak oyna</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: colors.bgSurface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  card: { gap: spacing.md },
  separator: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  orText: { ...typography.caption, color: colors.textMuted },
  input: {
    minHeight: 52, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bgDark, color: colors.textPrimary, paddingHorizontal: spacing.md,
    ...typography.body,
  },
  error: { ...typography.caption, color: colors.dangerSoft },
  message: { ...typography.caption, color: colors.lime },
  switchMode: { alignItems: 'center', padding: spacing.xs },
  forgotPassword: { alignSelf: 'flex-end', paddingVertical: spacing.xs },
  switchText: { ...typography.caption, color: colors.purpleSoft },
  guest: { alignItems: 'center', padding: spacing.lg },
  guestText: { ...typography.caption, color: colors.textSecondary, textDecorationLine: 'underline' },
});
