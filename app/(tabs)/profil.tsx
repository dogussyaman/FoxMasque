import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Switch, Pressable, TextInput } from 'react-native';
import { Settings, Shield, Zap, Award, Sparkles, Volume2, Vibrate, Globe, Check, Edit2 } from 'lucide-react-native';
import { Screen, ScreenHeader, Card, Button, Avatar, Badge } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
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
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Profil"
          subtitle="İstatistiklerin ve oyun tercihlerin"
          right={
            <Badge tone={isLive ? 'success' : 'warning'}>
              {isLive ? 'CANLI MOD' : 'DEMO MODU'}
            </Badge>
          }
        />

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <Avatar avatarKey={selectedAvatar} size={72} />
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
                    <Check color={colors.textOnAccent} size={18} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.nameDisplayRow}>
                  <Text style={styles.playerName}>{currentPlayer?.name ?? 'Zarto Ustası'}</Text>
                  <Pressable onPress={() => setEditingName(true)} style={styles.editIconBtn}>
                    <Edit2 color={colors.purpleSoft} size={16} />
                  </Pressable>
                </View>
              )}
              <Text style={styles.playerRole}>🎯 Zarta Stratejisti • Seviye 8</Text>
            </View>
          </View>

          {/* Avatar Selector Horizontal Scroll */}
          <Text style={styles.subhead}>Avatar Değiştir</Text>
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
          <Text style={styles.sectionTitle}>İstatistikler</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Award color={colors.purpleSoft} size={22} />
              <Text style={styles.statValue}>{currentPlayer?.score ?? 340} p</Text>
              <Text style={styles.statLabel}>Toplam Puan</Text>
            </View>
            <View style={styles.statBox}>
              <Zap color={colors.orange} size={22} />
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>Zartaladın</Text>
            </View>
            <View style={styles.statBox}>
              <Shield color={colors.blueSoft} size={22} />
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>Zartalandın</Text>
            </View>
            <View style={styles.statBox}>
              <Sparkles color={colors.success} size={22} />
              <Text style={styles.statValue}>%82</Text>
              <Text style={styles.statLabel}>Doğruluk</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar & Tercihler</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Volume2 color={colors.purpleSoft} size={20} />
                <View>
                  <Text style={styles.settingText}>Ses Efektleri</Text>
                  <Text style={styles.settingSub}>Oyun içi sesler ve jingle'lar</Text>
                </View>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={(v) => {
                  trigger('light');
                  setSoundEnabled(v);
                }}
                trackColor={{ false: colors.bgSurfaceAlt, true: colors.purple }}
                thumbColor="#FFF"
              />
            </View>

            <Divider />

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Vibrate color={colors.orange} size={20} />
                <View>
                  <Text style={styles.settingText}>Haptik Titreşim</Text>
                  <Text style={styles.settingSub}>Dokunma ve geri sayım titreşimleri</Text>
                </View>
              </View>
              <Switch
                value={hapticEnabled}
                onValueChange={(v) => {
                  trigger('light');
                  setHapticEnabled(v);
                }}
                trackColor={{ false: colors.bgSurfaceAlt, true: colors.purple }}
                thumbColor="#FFF"
              />
            </View>

            <Divider />

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
              <Badge tone={connection === 'online' ? 'success' : 'warning'}>
                {connection.toUpperCase()}
              </Badge>
            </View>
          </Card>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Card>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutTitle}>ZARTO v1.0.0</Text>
              <Text style={styles.aboutText}>Modern Türkçe Parti Oyunu</Text>
              <Text style={styles.aboutSub}>2–10 Oyuncu • Reanimated & Expo Native</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />;
}

const styles = StyleSheet.create({
  profileCard: {
    marginTop: spacing.sm,
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
  },
  editIconBtn: {
    padding: 4,
  },
  playerRole: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: 2,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  saveBtn: {
    backgroundColor: colors.purple,
    borderRadius: radii.md,
    padding: 8,
  },
  subhead: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  avatarList: {
    gap: 10,
    paddingVertical: 4,
  },
  avatarChoice: {
    padding: 4,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarChoiceActive: {
    borderColor: colors.purpleSoft,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
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
  },
  settingSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  aboutRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  aboutTitle: {
    ...typography.h4,
    color: colors.purpleSoft,
  },
  aboutText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginTop: 4,
  },
  aboutSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
});
