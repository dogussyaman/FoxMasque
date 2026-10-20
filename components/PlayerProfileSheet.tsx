import { Text, View, StyleSheet } from 'react-native';
import { UserPlus, UserRoundX, UserRoundCheck } from 'lucide-react-native';
import { Avatar, Button, ModalSheet, Badge } from '@/components/ui';
import { colors, radii, spacing, typography } from '@/theme';
import { usePrototype } from '@/features/prototype/PrototypeProvider';
import type { Player } from '@/types/game';

interface PlayerProfileSheetProps {
  player: Player | null;
  isSelf: boolean;
  visible: boolean;
  onClose: () => void;
}

export function PlayerProfileSheet({ player, isSelf, visible, onClose }: PlayerProfileSheetProps) {
  const { relationship, sendFriendRequest, acceptFriendRequest, toggleBlocked } = usePrototype();
  if (!player) return null;

  const status = relationship(player.id);
  const relationshipLabel = {
    none: null,
    requested: 'İstek Gönderildi',
    friend: 'Arkadaşsınız',
    blocked: 'Engellendi',
  }[status];

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Oyuncu Profili">
      <View style={styles.profile}>
        <Avatar avatarKey={player.avatarKey} size={82} ring />
        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.score}>{player.score} toplam puan</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{player.consecutiveCorrect}</Text>
            <Text style={styles.statLabel}>Seri</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{player.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</Text>
            <Text style={styles.statLabel}>Durum</Text>
          </View>
        </View>

        {!isSelf && status === 'none' ? (
          <Button
            label="Arkadaş Ekle"
            onPress={() => sendFriendRequest(player.id)}
            variant="orange"
            fullWidth
            icon={<UserPlus color="#FFF" size={18} />}
            style={styles.action}
          />
        ) : relationshipLabel ? (
          <Badge
            tone={status === 'blocked' ? 'neutral' : status === 'requested' ? 'yellow' : 'lime'}
            sticker
            style={styles.relationship}
          >
            {relationshipLabel}
          </Badge>
        ) : (
          <Badge tone="purple" sticker style={styles.relationship}>Bu senin profilin</Badge>
        )}

        {!isSelf && status === 'requested' ? (
          <Button
            label="İsteği Kabul Et (Demo)"
            onPress={() => acceptFriendRequest(player.id)}
            variant="lime"
            fullWidth
            icon={<UserRoundCheck color="#171026" size={18} />}
            style={styles.action}
          />
        ) : null}

        {!isSelf ? (
          <Button
            label={status === 'blocked' ? 'Engeli Kaldır' : 'Engelle'}
            onPress={() => toggleBlocked(player.id)}
            variant="secondary"
            fullWidth
            icon={<UserRoundX color={colors.textSecondary} size={17} />}
            style={styles.blockAction}
          />
        ) : null}
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
});
