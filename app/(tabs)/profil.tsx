import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch, Pressable, TextInput } from 'react-native';
import { Shield, Zap, Award, Sparkles, Volume2, Vibrate, Globe, Check, Edit2, Flame } from 'lucide-react-native';
import { Screen, ScreenHeader, Card, Button, Avatar, Badge } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { AVATAR_KEYS, type AvatarKey } from '@/features/game/players';

export default function ProfilScreen() {
  const { currentPlayer, setCurrentPlayer, isLive, connection } = useGameStore();
  const { trigger } = useHaptics();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(currentPlayer?.name ?? 'Oyuncu');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey>(
    (currentPlayer?.avatarKey as AvatarKey) ?? 'fox'
  );

  const handleSaveProfile = () => {
    trigger('light');
    if (currentPlayer) {
      setCurrentPlayer({
        ...currentPlayer,
        name: tempName.trim() || 'Oyuncu',
        avatarKey: selectedAvatar,
      });
    }
    setEditingName(false);
  };

  const handleAvatarSelect = (key: AvatarKey) => {
    trigger('light');
    setSelectedAvatar(key);
    if (currentPlayer) {
      setCurrentPlayer({
        ...currentPlayer,
        avatarKey: key,
      });
    }
  };

  return (
    <Screen gradient diagonalSlice>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Profil"
          subtitle="İstatistiklerin ve oyun tercihlerin"
          right={
            <Badge tone={isLive ? 'lime' : 'yellow'} sticker>
              {isLive ? 'CANLI MOD' : 'DEMO MODU'}
            </Badge>
          }
        />

        {/* Profile Card */}
        <Card variant="surface" glow="orange" style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <Avatar avatarKey={selectedAvatar} size={68} ring />
            <View style={{ flex: 1 }}>
              {editingName ? (
                <View style={styles.editRow}>
                  <TextInput
                    value={tempName}
                    onChangeText={setTempName}
                    style={styles.nameInput}
                    placeholder="İsmin"
                    placeholderTextColor={colors.textMuted}
                    maxLength={16}
                  />
                  <Pressable onPress={handleSaveProfile} style={styles.saveBtn}>
                    <Check color="#FFF" size={18} strokeWidth={2.5} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.nameDisplayRow}>
                  <Text style={styles.playerName}>{currentPlayer?.name ?? 'Zarto Ustası'}</Text>
                  <Pressable onPress={() => setEditingName(true)} style={styles.editIconBtn}>
                    <Edit2 color={colors.orange} size={16} />
                  </Pressable>
                </View>
              )}
              <View style={styles.rolePill}>
                <Flame color={colors.yellow} size={12} />
                <Text style={styles.playerRole}>ZARTO Ustası • Seviye 8</Text>
              </View>
            </View>
          </View>

          {/* Avatar Selector Horizontal Scroll */}
          <Text style={styles.subhead}>AVATARINI DEĞİŞTİR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarList}>
            {AVATAR_KEYS.map((key) => {
              const active = selectedAvatar === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleAvatarSelect(key)}
                  style={[styles.avatarChoice, active && styles.avatarChoiceActive]}
                >
                  <Avatar avatarKey={key} size={42} />
                </Pressable>
              );
            })}
          </ScrollView>
        </Card>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İSTATİSTİKLER</Text>
          <View style={styles.statsGrid}>
            <Card variant="surface" style={styles.statBox}>
              <Award color={colors.yellow} size={24} />
              <Text style={styles.statValue}>{currentPlayer?.score ?? 340} P</Text>
              <Text style={styles.statLabel}>Toplam Puan</Text>
            </Card>

            <Card variant="surface" style={styles.statBox}>
              <Zap color={colors.orange} size={24} />
              <Text style={[styles.statValue, { color: colors.orange }]}>18</Text>
              <Text style={styles.statLabel}>Zartaladın</Text>
            </Card>

            <Card variant="surface" style={styles.statBox}>
              <Shield color={colors.dangerSoft} size={24} />
              <Text style={[styles.statValue, { color: colors.dangerSoft }]}>4</Text>
              <Text style={styles.statLabel}>Zartalandın</Text>
            </Card>

            <Card variant="surface" style={styles.statBox}>
              <Sparkles color={colors.lime} size={24} />
              <Text style={[styles.statValue, { color: colors.lime }]}>%82</Text>
              <Text style={styles.statLabel}>Blöf Başarısı</Text>
            </Card>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AYARLAR & TERCİHLER</Text>
          <Card variant="surface">
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Volume2 color={colors.purpleSoft} size={20} />
                <View>
                  <Text style={styles.settingText}>Ses Efektleri</Text>
                  <Text style={styles.settingSub}>Oyun içi zil ve parti jingle'ları</Text>
                </View>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={(v) => {
                  trigger('light');
                  setSoundEnabled(v);
                }}
                trackColor={{ false: colors.bgSurfaceAlt, true: colors.orange }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Vibrate color={colors.orange} size={20} />
                <View>
                  <Text style={styles.settingText}>Haptik Titreşim</Text>
                  <Text style={styles.settingSub}>Dokunma ve geri sayım uyarıları</Text>
                </View>
              </View>
              <Switch
                value={hapticEnabled}
                onValueChange={(v) => {
                  trigger('light');
                  setHapticEnabled(v);
                }}
                trackColor={{ false: colors.bgSurfaceAlt, true: colors.orange }}
                thumbColor="#FFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Globe color={colors.blueSoft} size={20} />
                <View>
                  <Text style={styles.settingText}>Ağ Durumu</Text>
                  <Text style={styles.settingSub}>
                    {connection === 'online' ? 'Çevrimiçi (Düşük Gecikme)' : connection}
                  </Text>
                </View>
              </View>
              <Badge tone={connection === 'online' ? 'lime' : 'yellow'} sticker>
                {connection.toUpperCase()}
              </Badge>
            </View>
          </Card>
        </View>

        {/* App Info Card */}
        <View style={styles.section}>
          <Card variant="comic" style={{ alignItems: 'center' }}>
            <Text style={styles.aboutTitle}>ZARTO v2.0</Text>
            <Text style={styles.aboutText}>Modern Türkçe Parti & Blöf Oyunu</Text>
            <Text style={styles.aboutSub}>2–10 Oyuncu • Gerçek Zamanlı Realtime Motoru</Text>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 120,
  },
  profileCard: {
    marginTop: spacing.xs,
    padding: spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: spacing.md,
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    ...typography.h3,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.bgSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  playerRole: {
    ...typography.caption,
    color: colors.yellow,
    fontFamily: 'Poppins-Medium',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  saveBtn: {
    backgroundColor: colors.orange,
    borderRadius: radii.md,
    padding: 10,
  },
  subhead: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  avatarList: {
    gap: 10,
    paddingVertical: 6,
  },
  avatarChoice: {
    padding: 4,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarChoiceActive: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(255, 113, 59, 0.2)',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.lg,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  settingSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  aboutTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.orange,
  },
  aboutText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginTop: 2,
    fontFamily: 'Poppins-SemiBold',
  },
  aboutSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
