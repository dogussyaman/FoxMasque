import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gamepad2, Plus, LogIn, Users, Zap, Shield, Swords } from 'lucide-react-native';
import { Screen, ScreenHeader, Button, Card, Badge } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { CATEGORIES } from '@/features/game/categories';

export default function OynaScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader title="Oyna" subtitle="Arkadaşlarını topla, zartala!" right={<Badge tone="purple">2–10 oyuncu</Badge>} />
        <LinearGradient colors={[colors.purpleDeep, colors.purple, colors.blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}><Gamepad2 color={colors.textOnAccent} size={26} /></View>
          <Text style={styles.kicker}>PARTİ MODU</Text>
          <Text style={styles.heroTitle}>Hazır mısın zartalamaya?</Text>
          <Text style={styles.heroCopy}>Oda kur, arkadaşlarını çağır ve 6 kategoride en iyi cevabı bul.</Text>
          <View style={styles.tags}>
            <View style={styles.tag}><Zap color="#FFE08A" size={14}/><Text style={styles.tagText}>Hızlı turlar</Text></View>
            <View style={styles.tag}><Shield color="#C7F9D4" size={14}/><Text style={styles.tagText}>Özel yetenekler</Text></View>
          </View>
        </LinearGradient>

        <View style={styles.actions}>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(139,92,246,0.18)' }]}><Plus color={colors.purpleSoft} size={22}/></View>
            <Text style={styles.actionTitle}>Yeni oda kur</Text>
            <Text style={styles.actionCopy}>Kuralları seç, kodunu arkadaşlarınla paylaş.</Text>
            <Button label="Oda Oluştur" onPress={() => router.push('/create-room')} fullWidth icon={<Plus color={colors.textOnAccent} size={18}/>} />
          </Card>
          <Card style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(56,189,248,0.16)' }]}><LogIn color={colors.blueSoft} size={22}/></View>
            <Text style={styles.actionTitle}>Odaya katıl</Text>
            <Text style={styles.actionCopy}>Arkadaşının paylaştığı oda kodunu gir.</Text>
            <Button label="Kod ile Katıl" onPress={() => router.push('/join-room')} variant="secondary" fullWidth icon={<Users color={colors.textPrimary} size={18}/>} />
          </Card>
        </View>

        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Oyun kategorileri</Text><Text style={styles.sectionMeta}>6 kategori</Text></View>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((category, index) => (
            <View key={category.id} style={[styles.categoryTile, { backgroundColor: category.gradient?.[0] ?? colors.bgSurface }]}>
              <Text style={styles.categoryEmoji}>{['🧠','🦊','👗','🎬','🎵','🍕'][index % 6]}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </View>
          ))}
        </View>
        <Card style={styles.tipCard}>
          <Swords color={colors.orange} size={20}/>
          <View style={{ flex: 1 }}><Text style={styles.tipTitle}>Oyunun taktiği</Text><Text style={styles.tipCopy}>Doğru cevabı bul, rakibini zartala; kalkan ve blok yeteneklerini doğru zamanda kullan.</Text></View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112 },
  hero: { marginTop: spacing.sm, borderRadius: radii.xl, padding: 22, overflow: 'hidden' },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  kicker: { color: '#DCD0FF', fontFamily: 'Poppins-SemiBold', fontSize: 11, letterSpacing: 1.5 },
  heroTitle: { color: colors.textOnAccent, fontFamily: 'Poppins-Bold', fontSize: 23, lineHeight: 30, marginTop: 5 },
  heroCopy: { color: 'rgba(255,255,255,0.82)', fontFamily: 'Poppins-Regular', fontSize: 13, lineHeight: 20, marginTop: 8 },
  tags: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { color: colors.textOnAccent, fontFamily: 'Poppins-Medium', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionCard: { flex: 1, padding: 14 },
  actionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionTitle: { color: colors.textPrimary, fontFamily: 'Poppins-SemiBold', fontSize: 14 },
  actionCopy: { color: colors.textMuted, fontFamily: 'Poppins-Regular', fontSize: 11, lineHeight: 17, minHeight: 50, marginTop: 4, marginBottom: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: colors.textPrimary, fontFamily: 'Poppins-SemiBold', fontSize: 16 },
  sectionMeta: { color: colors.textMuted, fontFamily: 'Poppins-Medium', fontSize: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryTile: { width: '31%', minHeight: 94, borderRadius: radii.lg, padding: 10, justifyContent: 'space-between' },
  categoryEmoji: { fontSize: 22 },
  categoryName: { color: colors.textPrimary, fontFamily: 'Poppins-SemiBold', fontSize: 11, lineHeight: 15 },
  tipCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 16 },
  tipTitle: { color: colors.textPrimary, fontFamily: 'Poppins-SemiBold', fontSize: 13 },
  tipCopy: { color: colors.textMuted, fontFamily: 'Poppins-Regular', fontSize: 12, lineHeight: 18, marginTop: 3 },
});
