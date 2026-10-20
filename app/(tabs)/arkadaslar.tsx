import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { UserPlus, Share2, MessageCircle, Send } from 'lucide-react-native';
import { Screen, ScreenHeader, Card, Button, Avatar, EmptyState, Badge } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Arkadaşlar" subtitle="Davet et, oynamaya çağır" />

        <Card style={{ marginTop: spacing.sm }}>
          <View style={styles.inviteRow}>
            <UserPlus color={colors.purpleSoft} size={22} />
            <View style={{ flex: 1 }}>
              <Text style={styles.inviteTitle}>Oda Kodunu Paylaş</Text>
              <Text style={styles.inviteDesc}>{roomCode ? `Aktif oda: ${roomCode}` : 'Henüz bir odada değilsin.'}</Text>
            </View>
            <Button label="Paylaş" size="md" variant="secondary" onPress={() => trigger('light')} icon={<Share2 color={colors.textPrimary} size={16} />} />
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Çevrimiçi ({online.length})</Text>
          {online.length === 0 ? (
            <EmptyState title="Çevrimiçi kimse yok" message="Arkadaşların giriş yaptığında burada görünür." />
          ) : (
            <Card>
              {online.map((f) => (
                <FriendRow key={f.id} friend={f} onInvite={() => trigger('light')} />
              ))}
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oyunda ({inGame.length})</Text>
          {inGame.length === 0 ? (
            <EmptyState title="Şu an oyunda kimse yok" />
          ) : (
            <Card>
              {inGame.map((f) => (
                <FriendRow key={f.id} friend={f} onInvite={() => trigger('light')} />
              ))}
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Çevrimdışı ({offline.length})</Text>
          <Card>
            {offline.map((f) => (
              <FriendRow key={f.id} friend={f} muted onInvite={() => trigger('light')} />
            ))}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function FriendRow({ friend, onInvite, muted }: { friend: Friend; onInvite: () => void; muted?: boolean }) {
  const statusLabel =
    friend.status === 'online' ? 'Çevrimiçi' : friend.status === 'in_game' ? 'Oyunda' : 'Çevrimdışı';
  const tone = friend.status === 'online' ? 'success' : friend.status === 'in_game' ? 'purple' : 'neutral';
  return (
    <View style={styles.row}>
      <Avatar avatarKey={friend.avatarKey} size={42} online={friend.status !== 'offline'} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, muted && { color: colors.textMuted }]}>{friend.name}</Text>
        <Badge tone={tone as 'success' | 'purple' | 'neutral'}>{statusLabel}</Badge>
      </View>
      <Pressable onPress={onInvite} style={styles.iconBtn}>
        {friend.status === 'in_game' ? <MessageCircle color={colors.purpleSoft} size={20} /> : <Send color={colors.purpleSoft} size={20} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  inviteTitle: { ...typography.bodyMedium, color: colors.textPrimary },
  inviteDesc: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  name: { ...typography.bodyMedium, color: colors.textPrimary, marginBottom: 4 },
  iconBtn: { width: 40, height: 40, borderRadius: radii.lg, backgroundColor: colors.bgSurfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
