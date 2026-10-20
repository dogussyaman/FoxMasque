import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Share } from 'react-native';
import { UserPlus, Share2, MessageCircle, Send, Sparkles } from 'lucide-react-native';
import { Screen, ScreenHeader, Card, Button, Avatar, EmptyState, Badge } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';

interface Friend {
  id: string;
  name: string;
  avatarKey: string;
  status: 'online' | 'offline' | 'in_game';
}

const SEED_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Elif', avatarKey: 'fox', status: 'online' },
  { id: 'f2', name: 'Mert', avatarKey: 'panda', status: 'in_game' },
  { id: 'f3', name: 'Zeynep', avatarKey: 'unicorn', status: 'offline' },
  { id: 'f4', name: 'Can', avatarKey: 'lion', status: 'online' },
  { id: 'f5', name: 'Asya', avatarKey: 'frog', status: 'offline' },
];

export default function ArkadaslarScreen() {
  const { roomCode } = useGameStore();
  const { trigger } = useHaptics();
  const [friends] = useState<Friend[]>(SEED_FRIENDS);

  const online = friends.filter((f) => f.status === 'online');
  const inGame = friends.filter((f) => f.status === 'in_game');
  const offline = friends.filter((f) => f.status === 'offline');

  const handleShare = async () => {
    trigger('light');
    try {
      await Share.share({
        message: roomCode
          ? `ZARTO parti oyununda odadayım! Kod: ${roomCode}. Hemen katıl!`
          : `ZARTO blöf oyununu oynamak için arkadaş ekle!`,
      });
    } catch {}
  };

  return (
    <Screen gradient diagonalSlice>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Arkadaşlar"
          subtitle="Davet et, birlikte blöf yapın!"
          right={<Badge tone="purple" sticker>{friends.length} ARKADAŞ</Badge>}
        />

        {/* Room Share Card */}
        <Card variant="surface" glow="orange" style={{ marginTop: spacing.xs }}>
          <View style={styles.inviteRow}>
            <View style={styles.inviteIconCircle}>
              <UserPlus color={colors.orange} size={22} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inviteTitle}>Oda Kodunu Paylaş</Text>
              <Text style={styles.inviteDesc}>
                {roomCode ? `Aktif oda kodun: ${roomCode}` : 'Bir oda kurarak arkadaşlarını çağır.'}
              </Text>
            </View>
            <Button
              label="Paylaş"
              size="md"
              variant="orange"
              onPress={handleShare}
              icon={<Share2 color="#FFF" size={15} />}
            />
          </View>
        </Card>

        {/* Online Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Çevrimiçi ({online.length})</Text>
          {online.length === 0 ? (
            <EmptyState title="Çevrimiçi arkadaş yok" message="Arkadaşların oyuna girdiğinde burada görünür." />
          ) : (
            <Card variant="surface" style={styles.listCard}>
              {online.map((f, idx) => (
                <FriendRow
                  key={f.id}
                  friend={f}
                  onInvite={handleShare}
                  isLast={idx === online.length - 1}
                />
              ))}
            </Card>
          )}
        </View>

        {/* In-Game Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oyundakiler ({inGame.length})</Text>
          {inGame.length === 0 ? (
            <EmptyState title="Şu an oyunda kimse yok" />
          ) : (
            <Card variant="surface" style={styles.listCard}>
              {inGame.map((f, idx) => (
                <FriendRow
                  key={f.id}
                  friend={f}
                  onInvite={handleShare}
                  isLast={idx === inGame.length - 1}
                />
              ))}
            </Card>
          )}
        </View>

        {/* Offline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Çevrimdışı ({offline.length})</Text>
          <Card variant="surface" style={styles.listCard}>
            {offline.map((f, idx) => (
              <FriendRow
                key={f.id}
                friend={f}
                muted
                onInvite={handleShare}
                isLast={idx === offline.length - 1}
              />
            ))}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function FriendRow({
  friend,
  onInvite,
  muted,
  isLast,
}: {
  friend: Friend;
  onInvite: () => void;
  muted?: boolean;
  isLast?: boolean;
}) {
  const statusLabel =
    friend.status === 'online' ? 'Çevrimiçi' : friend.status === 'in_game' ? 'Oyunda' : 'Çevrimdışı';
  const tone = friend.status === 'online' ? 'lime' : friend.status === 'in_game' ? 'orange' : 'neutral';

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Avatar avatarKey={friend.avatarKey} size={42} online={friend.status !== 'offline'} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.name, muted && { color: colors.textMuted }]}>{friend.name}</Text>
        <Badge tone={tone as any} sticker>{statusLabel}</Badge>
      </View>
      <Pressable onPress={onInvite} style={styles.iconBtn}>
        {friend.status === 'in_game' ? (
          <MessageCircle color={colors.orange} size={18} />
        ) : (
          <Send color={colors.purpleSoft} size={18} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 120,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inviteIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 113, 59, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  inviteDesc: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
    marginBottom: spacing.xs,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bgSurfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
