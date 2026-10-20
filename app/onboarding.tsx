import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { Sparkles, ArrowRight, Shield, Zap, Target, Flame } from 'lucide-react-native';
import { Screen, Button, Avatar, Card } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { AVATAR_KEYS, type AvatarKey } from '@/features/game/players';
import { mascotImages } from '@/assets/illustrations';

export default function OnboardingScreen() {
  const { setCurrentPlayer, service } = useGameStore();
  const { trigger } = useHaptics();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey>('fox');

  const handleNext = () => {
    trigger('light');
    setStep(2);
  };

  const handleFinish = async () => {
    trigger('medium');
    const finalName = name.trim() || 'Parti Ustası';
    const player = await service.signInAnonymously(finalName, selectedAvatar);
    setCurrentPlayer(player);
    router.replace('/(tabs)');
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
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerWrap}>
              <View style={styles.mascotCircle}>
                <Image source={mascotImages.hero} style={styles.mascotImage} resizeMode="contain" />
              </View>

              <View style={styles.kickerPill}>
                <Flame color={colors.orange} size={14} />
                <Text style={styles.kickerText}>FoxMasque'E HOŞ GELDİN!</Text>
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
                  <Text style={styles.featureTitle}>2. Sahteni Yuttur & Zartala (+50)</Text>
                  <Text style={styles.featureDesc}>
                    İnandırıcı bir blöf yaz. Sahtene kanan her rakip için kişi başı +50 kap!
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

            <View style={styles.actionWrap}>
              <Button
                label="Karakterini Seç"
                onPress={handleNext}
                variant="orange"
                fullWidth
                icon={<ArrowRight color="#FFF" size={20} />}
              />
            </View>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.sectionLabel}>AVATARINI SEÇ</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_KEYS.map((key) => {
                const active = selectedAvatar === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      trigger('light');
                      setSelectedAvatar(key);
                    }}
                    style={[styles.avatarBox, active && styles.avatarBoxActive]}
                  >
                    <Avatar avatarKey={key} size={48} />
                  </Pressable>
                );
              })}
            </View>

            {/* Name Input */}
            <Text style={styles.sectionLabel}>KULLANICI ADIN</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Örn: ZartalaKralı"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              maxLength={16}
            />

            <View style={styles.actionWrap}>
              <Button
                label="Partiye Başla!"
                onPress={handleFinish}
                variant="orange"
                fullWidth
                icon={<Sparkles color="#FFF" size={20} />}
              />
            </View>
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 48,
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
  actionWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
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
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarBox: {
    padding: 4,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarBoxActive: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(255, 113, 59, 0.2)',
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
});
