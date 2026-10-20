import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight, Shield, Zap, Target } from 'lucide-react-native';
import { Screen, Button, Avatar, Card } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { AVATAR_KEYS, type AvatarKey } from '@/features/game/players';

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
    <Screen>
      <View style={styles.container}>
        {/* Step Indicator */}
        <View style={styles.stepIndicatorRow}>
          <View style={[styles.stepBar, step >= 1 && styles.stepBarActive]} />
          <View style={[styles.stepBar, step >= 2 && styles.stepBarActive]} />
        </View>

        {step === 1 ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerWrap}>
              <LinearGradient
                colors={[colors.purpleSoft, colors.purpleDeep]}
                style={styles.logoBadge}
              >
                <Sparkles color="#FFF" size={36} />
              </LinearGradient>
              <Text style={styles.title}>ZARTO'ya Hoş Geldin!</Text>
              <Text style={styles.subtitle}>
                Arkadaşlarınla oynayabileceğin en eğlenceli, bol çekişmeli Türkçe parti ve bilgi oyunu.
              </Text>
            </View>

            {/* Feature Cards */}
            <View style={styles.featuresWrap}>
              <Card style={styles.featureCard}>
                <View style={styles.iconCircle}>
                  <Target color={colors.purpleSoft} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Soruyu Bil</Text>
                  <Text style={styles.featureDesc}>
                    6 eğlenceli kategorideki soruları doğru yanıtla, +100 puan kazan.
                  </Text>
                </View>
              </Card>

              <Card style={styles.featureCard}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                  <Zap color={colors.orange} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Rakibini Zartala</Text>
                  <Text style={styles.featureDesc}>
                    Yanılacağını düşündüğün rakibini hedefle. O bilemezse +50 bonus senin!
                  </Text>
                </View>
              </Card>

              <Card style={styles.featureCard}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                  <Shield color={colors.blueSoft} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Kalkan ve Karşı Hamle</Text>
                  <Text style={styles.featureDesc}>
                    Özel yeteneklerini stratejik kullan, rakiplerin zartalını bertaraf et.
                  </Text>
                </View>
              </Card>
            </View>

            <View style={styles.actionWrap}>
              <Button
                label="Devam Et"
                onPress={handleNext}
                variant="primary"
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
              <Avatar avatarKey={selectedAvatar} size={90} />
            </View>

            {/* Avatar Grid */}
            <Text style={styles.sectionLabel}>Avatar Seç</Text>
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
            <Text style={styles.sectionLabel}>Kullanıcı Adın</Text>
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
                variant="primary"
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
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bgSurfaceAlt,
  },
  stepBarActive: {
    backgroundColor: colors.purpleSoft,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  featuresWrap: {
    gap: 12,
    marginBottom: spacing['2xl'],
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  featureDesc: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionWrap: {
    marginTop: spacing.lg,
  },
  previewAvatarWrap: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarBox: {
    padding: 6,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarBoxActive: {
    borderColor: colors.purpleSoft,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginBottom: spacing.xl,
  },
});
