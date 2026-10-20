import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  LogIn,
  Sparkles,
  Zap,
  Gamepad2,
  ChevronRight,
  Shield,
  Smile,
  Flame,
} from 'lucide-react-native';
import { Screen, Button, Card, Badge, Avatar } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { CATEGORIES } from '@/features/game/categories';
import { mascotImages } from '@/assets/illustrations';

export default function HomeScreen() {
  const { init, isLive, service, connection, currentPlayer } = useGameStore();
  const { trigger } = useHaptics();
  const [leaderPreview, setLeaderPreview] = useState<
    { id: string; name: string; avatarKey: string; score: number }[]
  >([]);

  useEffect(() => {
    init();
    service.getLeaderboard().then((lb) => {
      setLeaderPreview(
        lb
          .slice(0, 4)
          .map((p) => ({
            id: p.id,
            name: p.name,
            avatarKey: p.avatarKey,
            score: p.score,
          }))
      );
    });
  }, [init, service]);

  const goCreate = () => {
    trigger('light');
    router.push('/create-room');
  };
  const goJoin = () => {
    trigger('light');
    router.push('/join-room');
  };

  return (
    <Screen gradient diagonalSlice>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Bar with ZARTO Brand & Player Avatar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoPill}>
              <Text style={styles.logoText}>ZARTO</Text>
            </View>
            <Badge
              tone={isLive ? 'lime' : 'yellow'}
              sticker
              style={{ marginLeft: 6 }}
            >
              {isLive ? 'CANLI' : 'DEMO'}
            </Badge>
          </View>

          <Pressable
            style={styles.profileBtn}
            onPress={() => router.push('/(tabs)/profil')}
          >
            <Avatar
              avatarKey={currentPlayer?.avatarKey || 'fox'}
              size={38}
              ring
            />
          </Pressable>
        </View>

        {/* Hero Area: Asymmetric Card with 3D Fox Mascot */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[colors.zartoSurface, '#35185D', '#20103B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Diagonal Accent Stripe */}
            <View style={styles.heroDiagonalStripe} />

            <View style={styles.heroContentRow}>
              {/* Left Column: Text & Micro Copy */}
              <View style={styles.heroLeftCol}>
                <View style={styles.kickerPill}>
                  <Flame color={colors.orange} size={14} />
                  <Text style={styles.kickerText}>PARTİ BLÖF OYUNU</Text>
                </View>
                <Text style={styles.heroTitle}>
                  Blöfünü Yap,{'\n'}
                  <Text style={{ color: colors.orange }}>Zartala!</Text>
                </Text>
                <Text style={styles.heroSubtitle}>
                  Sahte cevaplar yaz, rakiplerini kandır ve gerçek cevabı bul!
                </Text>
              </View>

              {/* Right Column: 3D Mascot Illustration */}
              <View style={styles.mascotWrap}>
                <Image
                  source={mascotImages.hero}
                  style={styles.mascotImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* CTAs */}
            <View style={styles.ctaRow}>
              <Button
                label="Oda Oluştur"
                onPress={goCreate}
                variant="orange"
                icon={<Plus color="#FFF" size={20} strokeWidth={2.5} />}
                style={styles.primaryCta}
              />
              <Button
                label="Odaya Katıl"
                onPress={goJoin}
                variant="secondary"
                icon={<LogIn color={colors.textPrimary} size={18} />}
                style={styles.secondaryCta}
              />
            </View>
          </LinearGradient>
        </View>

        {/* Quick Bluff Rules / Features Banner */}
        <View style={styles.miniRulesRow}>
          <View style={[styles.miniRuleChip, { borderColor: colors.lime }]}>
            <Text style={[styles.miniRuleEmoji, { color: colors.lime }]}>+100</Text>
            <Text style={styles.miniRuleText}>Doğru Bil</Text>
          </View>
          <View style={[styles.miniRuleChip, { borderColor: colors.orange }]}>
            <Text style={[styles.miniRuleEmoji, { color: colors.orange }]}>+50</Text>
            <Text style={styles.miniRuleText}>Zartala</Text>
          </View>
          <View style={[styles.miniRuleChip, { borderColor: colors.danger }]}>
            <Text style={[styles.miniRuleEmoji, { color: colors.dangerSoft }]}>-40</Text>
            <Text style={styles.miniRuleText}>Zartalanma</Text>
          </View>
        </View>

        {/* Categories Showcase */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Kategoriler</Text>
            <Pressable onPress={() => router.push('/category-select')}>
              <Text style={styles.sectionLink}>Tümünü Gör</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => router.push('/category-select')}
                style={styles.catCardPressable}
              >
                <LinearGradient
                  colors={[c.gradient[0], c.gradient[1]]}
                  style={styles.catCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.catEmojiCircle}>
                    <Text style={styles.catEmoji}>{c.emoji}</Text>
                  </View>
                  <Text style={styles.catName} numberOfLines={2}>
                    {c.name}
                  </Text>
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* How to Play - ZARTO Comic Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nasıl Oynanır?</Text>
          <Card variant="surface">
            <View style={styles.howToRow}>
              <View style={[styles.howToBadge, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Gamepad2 color={colors.purpleSoft} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.howToTitle}>1. Odaya Gir & Soru Gelir</Text>
                <Text style={styles.howToDesc}>
                  2-10 arkadaşınla odaya katıl. Kategori sorusu aynı anda herkese açılır.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.howToRow}>
              <View style={[styles.howToBadge, { backgroundColor: 'rgba(255, 113, 59, 0.2)' }]}>
                <Zap color={colors.orange} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.howToTitle}>2. Sahte Cevap Yaz & Şıkları Karıştır</Text>
                <Text style={styles.howToDesc}>
                  Herkes inandırıcı bir yalan uydurur. Gerçek cevap ve sahteler harmanlanır!
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.howToRow}>
              <View style={[styles.howToBadge, { backgroundColor: 'rgba(198, 243, 107, 0.2)' }]}>
                <Sparkles color={colors.lime} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.howToTitle}>3. Zartala & Zartalanma!</Text>
                <Text style={styles.howToDesc}>
                  Doğru cevaba +100 puan; sahtene kanan her rakip için +50 puan kap!
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Leaderboard Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Liderlik Tablosu</Text>
            <Pressable
              onPress={() => router.push('/(tabs)/liderlik')}
              style={styles.linkRow}
            >
              <Text style={styles.sectionLink}>Tümü</Text>
              <ChevronRight color={colors.orange} size={16} />
            </Pressable>
          </View>

          <Card variant="default">
            {leaderPreview.length === 0 ? (
              <Text style={styles.emptyText}>Henüz kayıtlı skor bulunmuyor.</Text>
            ) : (
              leaderPreview.map((p, i) => (
                <View
                  key={p.id}
                  style={[
                    styles.leaderRow,
                    i !== leaderPreview.length - 1 && styles.leaderRowBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.rankCircle,
                      i === 0 && styles.rankCircleFirst,
                      i === 1 && styles.rankCircleSecond,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankText,
                        i === 0 && { color: colors.yellow },
                      ]}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <Avatar avatarKey={p.avatarKey} size={36} />
                  <Text style={styles.leaderName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Badge tone={i === 0 ? 'yellow' : 'purple'}>
                    {p.score} P
                  </Badge>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPill: {
    backgroundColor: colors.purple,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: '#A78BFA',
    transform: [{ rotate: '-2deg' }],
  },
  logoText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFF',
    letterSpacing: 2,
  },
  profileBtn: {
    padding: 2,
  },
  heroContainer: {
    marginTop: spacing.md,
  },
  heroCard: {
    borderRadius: radii['2xl'],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 113, 59, 0.35)',
    padding: spacing.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroDiagonalStripe: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 220,
    backgroundColor: 'rgba(255, 113, 59, 0.12)',
    transform: [{ rotate: '-24deg' }],
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeftCol: {
    flex: 1.2,
    paddingRight: 6,
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 113, 59, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  kickerText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: colors.orange,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 6,
  },
  mascotWrap: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 130,
    height: 130,
    borderRadius: radii.lg,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.lg,
  },
  primaryCta: {
    flex: 1.2,
  },
  secondaryCta: {
    flex: 1,
  },
  miniRulesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.md,
  },
  miniRuleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 6,
  },
  miniRuleEmoji: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
  },
  miniRuleText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing['2xl'],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  sectionLink: {
    ...typography.bodyMedium,
    color: colors.orange,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  categoriesScroll: {
    paddingRight: 10,
  },
  catCardPressable: {
    marginRight: 12,
  },
  catCard: {
    width: 124,
    height: 98,
    borderRadius: radii.xl,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...shadows.card,
  },
  catEmojiCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 18,
  },
  catName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    lineHeight: 16,
    color: '#FFF',
  },
  howToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  howToBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howToTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  howToDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  leaderRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bgSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankCircleFirst: {
    backgroundColor: 'rgba(255, 209, 102, 0.25)',
    borderWidth: 1,
    borderColor: colors.yellow,
  },
  rankCircleSecond: {
    backgroundColor: 'rgba(214, 206, 229, 0.2)',
  },
  rankText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: colors.textMuted,
  },
  leaderName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
