import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, LogIn, Sparkles, Zap, Gamepad2, ChevronRight } from 'lucide-react-native';
import { Screen, ScreenHeader, Button, Card, Badge, Avatar } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { CATEGORIES } from '@/features/game/categories';

export default function HomeScreen() {
  const { init, isLive, service, connection } = useGameStore();
  const { trigger } = useHaptics();
  const [leaderPreview, setLeaderPreview] = useState<{ id: string; name: string; avatarKey: string; score: number }[]>([]);

  useEffect(() => {
    init();
    service.getLeaderboard().then((lb) => {
      setLeaderPreview(lb.slice(0, 5).map((p) => ({ id: p.id, name: p.name, avatarKey: p.avatarKey, score: p.score })));
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
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <ScreenHeader
          title="ZARTO"
          subtitle={isLive ? 'Canlı çoklu oyuncu' : 'Demo modu — çevrimdışı örnek oyun'}
          right={<Badge tone={isLive ? 'success' : 'warning'}>{isLive ? 'CANLI' : 'DEMO'}</Badge>}
        />

        <LinearGradient colors={[colors.purpleDeep, colors.purple, colors.blue]} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroTop}>
            <Sparkles color={colors.textOnAccent} size={22} />
            <Text style={styles.heroKicker}>PARTİ ZAMANI</Text>
          </View>
          <Text style={styles.heroTitle}>Zartala, koruma yap, kazan!</Text>
          <Text style={styles.heroText}>
            2–10 oyuncu, 6 kategori, özel yetenekler. Doğru bil, rakibini zartala, zartalanmamak için kalkan aç.
          </Text>
          <View style={styles.heroBtns}>
            <Button label="Oda Oluştur" onPress={goCreate} variant="primary" icon={<Plus color={colors.textOnAccent} size={20} />} fullWidth />
            <View style={{ height: 12 }} />
            <Button label="Kod ile Katıl" onPress={goJoin} variant="secondary" icon={<LogIn color={colors.textPrimary} size={20} />} fullWidth />
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {CATEGORIES.map((c) => (
              <LinearGradient key={c.id} colors={[c.gradient[0], c.gradient[1]]} style={styles.catCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={styles.catName}>{c.name}</Text>
              </LinearGradient>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nasıl Oynanır?</Text>
          <Card>
            <StepRow icon={<Gamepad2 color={colors.purpleSoft} size={22} />} title="Oda kur ya da katıl" desc="5 haneli kod ile arkadaşlarını ekle." />
            <Divider />
            <StepRow icon={<Zap color={colors.orange} size={22} />} title="Zartala & koru" desc="Doğru bil, rakibe zartal at; kalkanla korun." />
            <Divider />
            <StepRow icon={<Sparkles color={colors.blueSoft} size={22} />} title="Skorboarda yüksel" desc="Her tur sonunda puanını gör, sıralamada kal." />
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Liderlik</Text>
            <Pressable onPress={() => router.push('/(tabs)/liderlik')}>
              <Text style={styles.link}>Tümü <ChevronRight color={colors.purpleSoft} size={14} /></Text>
            </Pressable>
          </View>
          <Card>
            {leaderPreview.length === 0 ? (
              <Text style={styles.mutedText}>Henüz skor yok.</Text>
            ) : (
              leaderPreview.map((p, i) => (
                <View key={p.id} style={styles.leaderRow}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <Avatar avatarKey={p.avatarKey} size={34} />
                  <Text style={styles.leaderName}>{p.name}</Text>
                  <Badge tone={i === 0 ? 'warning' : 'neutral'}>{p.score} p</Badge>
                </View>
              ))
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bağlantı</Text>
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.bodyText}>Durum</Text>
              <Badge tone={connection === 'online' ? 'success' : connection === 'connecting' ? 'warning' : 'danger'}>
                {connection.toUpperCase()}
              </Badge>
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function StepRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />;
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radii['2xl'],
    padding: spacing['2xl'],
    marginTop: spacing.sm,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  heroKicker: { ...typography.caption, color: colors.textOnAccent, letterSpacing: 1.5 },
  heroTitle: { ...typography.h2, color: colors.textOnAccent, marginBottom: 8 },
  heroText: { ...typography.body, color: colors.textOnAccent, opacity: 0.95, marginBottom: 18 },
  heroBtns: {},
  section: { marginTop: spacing['3xl'] },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  catCard: {
    width: 130,
    height: 90,
    borderRadius: radii.xl,
    padding: spacing.md,
    marginRight: spacing.md,
    justifyContent: 'space-between',
  },
  catEmoji: { fontSize: 22 },
  catName: { ...typography.small, color: colors.textOnAccent, fontFamily: 'Poppins-SemiBold' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { ...typography.bodyMedium, color: colors.purpleSoft },
  leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  rank: { ...typography.h4, color: colors.textMuted, width: 24 },
  leaderName: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
  mutedText: { ...typography.body, color: colors.textMuted },
  bodyText: { ...typography.body, color: colors.textPrimary },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bgSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  stepDesc: { ...typography.small, color: colors.textMuted, marginTop: 2 },
});
