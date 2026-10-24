import { useTheme, useThemeStyles } from '@/theme/ThemeProvider';
import type { ThemeColors } from '@/theme/ThemeProvider';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ScrollView, TextInput, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Sparkles, ArrowRight, Shield, Zap, Target, Flame, Check } from 'lucide-react-native';
import { Screen, Button, Avatar, Card, StickyActionBar, Input } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import {
  AVATAR_KEYS,
  DICEBEAR_AVATAR_KEYS,
  createRandomDiceBearAvatarKey,
} from '@/features/game/players';
import { SPECIAL_AVATAR_KEYS } from '@/features/game/specialAvatars';
import { mascotImages } from '@/assets/illustrations';

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { setCurrentPlayer, service } = useGameStore();
  const { trigger } = useHaptics();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [avatarOptions] = useState(() => [
    ...SPECIAL_AVATAR_KEYS,
    createRandomDiceBearAvatarKey(),
    ...AVATAR_KEYS,
    ...DICEBEAR_AVATAR_KEYS,
  ]);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [avatarCategory, setAvatarCategory] = useState<'special' | 'all' | 'people' | 'robots' | 'emoji' | 'animals' | 'fashion' | 'streetwear'>('special');
  const filteredAvatarOptions = avatarOptions.filter((key) => {
    if (avatarCategory === 'all') return true;
    if (avatarCategory === 'special') return key.startsWith('special:');
    if (avatarCategory === 'animals') return AVATAR_KEYS.includes(key as (typeof AVATAR_KEYS)[number]);
    if (!key.startsWith('db:')) return false;
    const style = key.split(':')[1];
    if (avatarCategory === 'people') return style === 'lorelei' || style === 'adventurer';
    if (avatarCategory === 'robots') return style === 'bottts';
    if (avatarCategory === 'emoji') return style === 'fun-emoji';
    if (avatarCategory === 'fashion') return style === 'fashion';
    if (avatarCategory === 'streetwear') return style === 'streetwear';
    return false;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    trigger('light');
    setStep(2);
  };

  const handleFinish = async () => {
    trigger('medium');
    setBusy(true);
    setError(null);
    try {
      const finalName = name.trim() || 'Parti Ustası';
      const player = await service.signInAnonymously(finalName, selectedAvatar);
      setCurrentPlayer(player);
      router.replace('/(tabs)');
    } catch (authError) {
      setError((authError as Error).message || 'Misafir oturumu başlatılamadı.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen gradient diagonalSlice>
      <View style={styles.container}>
        {/* Step Indicator */}
        <View style={styles.stepIndicatorRow}>
          <View style={[styles.stepBar, step >= 1 && styles.stepBarActive]} />
          <View style={[styles.stepBar, step >= 2 && styles.stepBarActive]} />
        </View>

        {step === 1 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerWrap}>
              <View style={styles.mascotCircle}>
                <Image source={mascotImages.hero} style={styles.mascotImage} resizeMode="contain" />
              </View>

              <View style={styles.kickerPill}>
                <Flame color={colors.orange} size={14} />
                <Text style={styles.kickerText}>KIZILKUYRUK&apos;A HOŞ GELDİN!</Text>
              </View>

              <Text style={styles.title}>Parti & Blöf Zamanı!</Text>
              <Text style={styles.subtitle}>
                Arkadaşlarınla oynayabileceğin, sahte cevaplar uydurup rakipleri tuzağa düşürdüğün Türkçe parti oyunu.
              </Text>
            </View>

            {/* Feature Cards */}
            <View style={styles.featuresWrap}>
              <Card variant="surface" style={styles.featureCard}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(198, 243, 107, 0.2)' }]}>
                  <Target color={colors.lime} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>1. Gerçek Cevabı Bul (+100)</Text>
                  <Text style={styles.featureDesc}>
                    Karışık cevap havuzundan doğrusunu tahmin et, hanene +100 puanı yazdır.
                  </Text>
                </View>
              </Card>

              <Card variant="surface" style={styles.featureCard}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 113, 59, 0.2)' }]}>
                  <Zap color={colors.orange} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>2. Sahteni Yuttur & Tuzağa Düşür (+50)</Text>
                  <Text style={styles.featureDesc}>
                    İnandırıcı bir blöf yaz. Sahtene kanan ve tuzağa düşürdüğün her rakip için +50 puan kap!
                  </Text>
                </View>
              </Card>

              <Card variant="surface" style={styles.featureCard}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <Shield color={colors.purpleSoft} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>3. Kalkan & Blok Yetenekleri</Text>
                  <Text style={styles.featureDesc}>
                    3 doğru bildiğinde Kalkan, 3 kişiyi kandırdığında rakibi pas geçiren Blok açılır!
                  </Text>
                </View>
              </Card>
            </View>

          </ScrollView>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerWrap}>
              <Text style={styles.title}>Karakterini Seç</Text>
              <Text style={styles.subtitle}>
                Arkadaşlarının seni nasıl tanıyacağını ve avatarını belirle.
              </Text>
            </View>

            {/* Preview Avatar */}
            <View style={styles.previewAvatarWrap}>
              <Avatar avatarKey={selectedAvatar} size={90} ring />
            </View>

            {/* Avatar Grid */}
            <Text style={styles.sectionLabel}>AVATARINI SEÇ · {filteredAvatarOptions.length} SEÇENEK</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarFilters}>
              {([
                { key: 'special', label: '⭐ Özel Avatarlar' },
                { key: 'all', label: 'Tümü' },
                { key: 'people', label: 'Portreler' },
                { key: 'robots', label: 'Robotlar' },
                { key: 'emoji', label: 'Emoji' },
                { key: 'animals', label: 'Hayvanlar' },
                { key: 'fashion', label: 'Moda' },
                { key: 'streetwear', label: 'Sokak Stili' },
              ] as const).map((filter) => {
                const active = avatarCategory === filter.key;
                return (
                  <Pressable
                    key={filter.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => setAvatarCategory(filter.key)}
                    style={[styles.avatarFilterChip, active && styles.avatarFilterChipActive]}
                  >
                    <Text style={[styles.avatarFilterText, active && styles.avatarFilterTextActive]}>{filter.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.avatarGrid}>
              {filteredAvatarOptions.map((key) => {
                const active = selectedAvatar === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={`${key.startsWith('db:') ? key.split(':')[1] : key} avatarını seç`}
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      trigger('light');
                      setSelectedAvatar(key);
                    }}
                    style={[styles.avatarBox, active && styles.avatarBoxActive]}
                  >
                    <Avatar avatarKey={key} size={46} />
                    {active ? (
                      <View style={styles.avatarSelectedMark}>
                        <Check color="#FFF" size={12} strokeWidth={3} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Name Input */}
            <Text style={styles.sectionLabel}>KULLANICI ADIN</Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Örn: TuzakUstası"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              maxLength={16}
              focusedBorderColor={colors.orange}
            />

          </ScrollView>
        )}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <StickyActionBar>
          {step === 1 ? (
            <Button
              label="Karakterini Seç"
              onPress={handleNext}
              variant="orange"
              fullWidth
              icon={<ArrowRight color="#FFF" size={20} />}
            />
          ) : (
            <Button
              label="Partiye Başla!"
              onPress={handleFinish}
              variant="orange"
              fullWidth
              disabled={busy}
              icon={busy ? <ActivityIndicator color="#FFF" /> : <Sparkles color="#FFF" size={20} />}
            />
          )}
        </StickyActionBar>
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    marginBottom: 16,
  },
  stepBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.bgCard,
  },
  stepBarActive: {
    backgroundColor: colors.orange,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  headerWrap: {
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  mascotCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.glowOrange,
  },
  mascotImage: {
    width: 120,
    height: 120,
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 113, 59, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginBottom: 8,
  },
  kickerText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.orange,
    letterSpacing: 1,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  featuresWrap: {
    gap: 12,
    marginBottom: spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: spacing.md,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  featureDesc: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  previewAvatarWrap: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  sectionLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  avatarFilters: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  avatarFilterChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgCard,
  },
  avatarFilterChipActive: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(255, 113, 59, 0.16)',
  },
  avatarFilterText: {
    color: colors.textSecondary,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
  },
  avatarFilterTextActive: {
    color: colors.orange,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarBox: {
    width: '18%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarBoxActive: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(255, 113, 59, 0.2)',
  },
  avatarSelectedMark: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  error: { ...typography.caption, color: colors.dangerSoft, textAlign: 'center', paddingHorizontal: spacing.md },
});
