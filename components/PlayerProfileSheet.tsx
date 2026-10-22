import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { UserPlus, UserRoundX, UserRoundCheck } from 'lucide-react-native';
import { Avatar, Button, ModalSheet, Badge } from '@/components/ui';
import { colors, radii, spacing, typography } from '@/theme';
import type { Player } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import type { FriendRequest, RelationshipStatus } from '@/services/types';

interface PlayerProfileSheetProps {
  player: Player | null;
  isSelf: boolean;
  visible: boolean;
  onClose: () => void;
}

export function PlayerProfileSheet({ player, isSelf, visible, onClose }: PlayerProfileSheetProps) {
  const { service } = useGameStore();
  const [status, setStatus] = useState<RelationshipStatus>('none');
  const [incomingRequest, setIncomingRequest] = useState<FriendRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !player || isSelf) return;
    let active = true;
    Promise.all([
      service.getRelationshipStatus(player.id),
      service.listFriendRequests(),
    ]).then(([relationship, requests]) => {
      if (!active) return;
      setError(null);
      setStatus(relationship);
      setIncomingRequest(requests.find((request) => request.id === player.id) ?? null);
    }).catch((e) => {
      if (active) setError((e as Error).message);
    });
    return () => {
      active = false;
    };
  }, [visible, player?.id, isSelf, service]);

  if (!player) return null;

  const relationshipLabel = {
    none: null,
    outgoing_pending: 'İstek Gönderildi',
    incoming_pending: 'Arkadaşlık İsteği',
    friends: 'Arkadaşsınız',
    blocked: 'Engellendi',
  }[status];

  const performAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const next = await action();
      if (typeof next === 'string') setStatus(next as RelationshipStatus);
      if (status === 'blocked' && player) {
        setStatus(await service.getRelationshipStatus(player.id));
      }
      if (status === 'friends') setStatus('none');
      if (status === 'incoming_pending') setIncomingRequest(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Oyuncu Profili">
      <View style={styles.profile}>
        <Avatar avatarKey={player.avatarUrl ?? player.avatarKey} userId={player.id} size={82} ring />
        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.score}>{player.score} toplam puan</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{player.gamesPlayed ?? player.consecutiveCorrect}</Text>
            <Text style={styles.statLabel}>{player.gamesPlayed === undefined ? 'Seri' : 'Oyun'}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{player.gamesWon ?? (player.isOnline ? 'Çevrimiçi' : 'Çevrimdışı')}</Text>
            <Text style={styles.statLabel}>{player.gamesWon === undefined ? 'Durum' : 'Galibiyet'}</Text>
          </View>
        </View>

        {!isSelf && status === 'none' ? (
          <Button
            label="Arkadaş Ekle"
            onPress={() => void performAction(() => service.sendFriendRequest(player.id))}
            variant="orange"
            fullWidth
            disabled={busy}
            icon={<UserPlus color="#FFF" size={18} />}
            style={styles.action}
          />
        ) : relationshipLabel ? (
          <Badge
            tone={status === 'blocked' ? 'neutral' : status.endsWith('pending') ? 'yellow' : 'lime'}
            sticker
            style={styles.relationship}
          >
            {relationshipLabel}
          </Badge>
        ) : (
          <Badge tone="purple" sticker style={styles.relationship}>Bu senin profilin</Badge>
        )}

        {!isSelf && status === 'incoming_pending' && incomingRequest ? (
          <Button
            label="İsteği Kabul Et"
            onPress={() => void performAction(() =>
              service.respondFriendRequest(incomingRequest.requestId, true)
            )}
            variant="lime"
            fullWidth
            disabled={busy}
            icon={<UserRoundCheck color="#171026" size={18} />}
            style={styles.action}
          />
        ) : null}

        {!isSelf ? (
          <Button
            label={status === 'blocked' ? 'Engeli Kaldır' : 'Engelle'}
            onPress={() => void performAction(() =>
              (async () => {
                if (status === 'blocked') {
                  await service.unblockUser(player.id);
                } else {
                  await service.blockUser(player.id);
                }
                return service.getRelationshipStatus(player.id);
              })()
            )}
            variant="secondary"
            fullWidth
            disabled={busy}
            icon={<UserRoundX color={colors.textSecondary} size={17} />}
            style={styles.blockAction}
          />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  profile: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  score: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bgSurfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  statValue: {
    ...typography.bodyMedium,
    color: colors.orange,
    textAlign: 'center',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  relationship: {
    marginTop: spacing.md,
    minHeight: 42,
  },
  action: {
    marginTop: spacing.md,
  },
  blockAction: {
    marginTop: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
