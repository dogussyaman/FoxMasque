import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Share } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { UserPlus, Share2, Send } from 'lucide-react-native';
import { Screen, ScreenHeader, Card, Button, Avatar, EmptyState, Badge } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import type { FriendRequest, SocialPlayer } from '@/services/types';

export default function ArkadaslarScreen() {
  const { roomCode, service } = useGameStore();
  const { trigger } = useHaptics();
  const [friends, setFriends] = useState<SocialPlayer[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingRequest, setLoadingRequest] = useState<string | null>(null);

  const refreshSocialData = useCallback(async () => {
    try {
      const [friendList, friendRequests] = await Promise.all([
        service.listFriends(),
        service.listFriendRequests(),
      ]);
      setFriends(friendList);
      setRequests(friendRequests);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [service]);

  useFocusEffect(useCallback(() => {
    void refreshSocialData();
  }, [refreshSocialData]));

  const handleShare = async () => {
    trigger('light');
    try {
      await Share.share({
        message: roomCode
          ? `FOXMASQUE parti oyununda odadayım! Kod: ${roomCode}. Hemen katıl!`
          : `FOXMASQUE blöf oyununu oynamak için arkadaş ekle!`,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const respondToRequest = async (request: FriendRequest, accept: boolean) => {
    setLoadingRequest(request.requestId);
    setError(null);
    try {
      await service.respondFriendRequest(request.requestId, accept);
      await refreshSocialData();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingRequest(null);
    }
  };

  return (
    <Screen gradient diagonalSlice padded={false} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Arkadaşlar"
          subtitle="Davet et, birlikte blöf yapın!"
          right={<Badge tone="purple" sticker>{friends.length} ARKADAŞ</Badge>}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

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

        {requests.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Arkadaşlık İstekleri ({requests.length})</Text>
            <Card variant="surface" style={styles.listCard}>
            {requests.map((request, idx) => (
              <View key={request.requestId} style={[styles.row, idx < requests.length - 1 && styles.rowBorder]}>
                <Avatar avatarKey={request.avatarUrl ?? request.avatarKey} size={42} />
                <View style={styles.requestIdentity}>
                  <Text style={styles.name}>{request.name}</Text>
                  <Text style={styles.requestDate}>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable
                  disabled={loadingRequest === request.requestId}
                  onPress={() => void respondToRequest(request, true)}
                  style={styles.acceptButton}
                >
                  <Text style={styles.acceptText}>Kabul</Text>
                </Pressable>
                <Pressable
                  disabled={loadingRequest === request.requestId}
                  onPress={() => void respondToRequest(request, false)}
                  style={styles.declineButton}
                >
                  <Text style={styles.declineText}>Reddet</Text>
                </Pressable>
              </View>
            ))}
            </Card>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arkadaşların ({friends.length})</Text>
          {friends.length === 0 ? (
            <EmptyState title="Henüz arkadaşın yok" message="Oyuncu profillerinden arkadaşlık isteği gönder." />
          ) : (
            <Card variant="surface" style={styles.listCard}>
              {friends.map((friend, idx) => (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  onInvite={handleShare}
                  isLast={idx === friends.length - 1}
                />
              ))}
            </Card>
          )}
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
  friend: SocialPlayer;
  onInvite: () => void;
  muted?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Avatar avatarKey={friend.avatarUrl ?? friend.avatarKey} size={42} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[styles.name, muted && { color: colors.textMuted }]}>{friend.name}</Text>
        <Badge tone="neutral" sticker>Arkadaş</Badge>
      </View>
      <Pressable onPress={onInvite} style={styles.iconBtn}>
        <Send color={colors.purpleSoft} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 100,
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
  requestIdentity: {
    flex: 1,
    marginLeft: 10,
  },
  requestDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  acceptButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.lime,
    marginRight: 6,
  },
  acceptText: {
    ...typography.caption,
    color: colors.zartoNight,
    fontFamily: 'Poppins-Bold',
  },
  declineButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.bgSurfaceAlt,
  },
  declineText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginVertical: spacing.sm,
  },
});
