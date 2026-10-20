import { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Trophy, ArrowRight, Sparkles, Crown } from 'lucide-react-native';
import { Screen, Button, Card, Badge, Avatar } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';

export default function ScoreboardScreen() {
  const { roomState, currentPlayer, roomCode, service } = useGameStore();
  const { trigger } = useHaptics();

  // Watch for phase change
  useEffect(() => {
    if (roomState?.phase === 'ability_select') {
      router.replace('/ability-select');
    } else if (roomState?.phase === 'game_over') {
      router.replace('/game-over');
    }
  }, [roomState?.phase]);

  const currentRound = roomState?.currentRound ?? 1;
  const totalRounds = roomState?.config.totalRounds ?? 5;
  const isFinalRound = currentRound >= totalRounds;

  const playersList = roomState
    ? Object.values(roomState.players).sort((a, b) => b.score - a.score)
    : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const isHost = me?.isHost ?? false;

  const handleNextRound = async () => {
    trigger('medium');
    if (!roomCode) return;
    if (isFinalRound) {
      await service.advancePhase(roomCode);
      router.replace('/game-over');
    } else {
      await service.advancePhase(roomCode);
      router.replace('/ability-select');
    }
  };

  return (
    <Screen>
      <View style={styles.topHeader}>
        <View style={styles.iconCircle}>
          <Trophy color="#FBBF24" size={28} />
        </View>
        <Text style={styles.title}>Skor Tablosu</Text>
        <Text style={styles.subtitle}>
          Tur {currentRound} / {totalRounds} {isFinalRound ? '(Son Tur)' : 'Tamamlandı'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.scoreCard}>
          {playersList.map((player, index) => {
            const isMe = player.id === currentPlayer?.id;
            const isLeader = index === 0;

            return (
              <View
                key={player.id}
                style={[
                  styles.playerRow,
                  isMe && styles.meRow,
                  index === playersList.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.rankWrap}>
                  {isLeader ? (
                    <Crown color="#FBBF24" size={20} fill="#FBBF24" />
                  ) : (
                    <Text style={styles.rankNum}>{index + 1}</Text>
                  )}
                </View>

                <Avatar avatarKey={player.avatarKey} size={42} />

                <View style={{ flex: 1 }}>
                  <Text style={[styles.playerName, isMe && { color: colors.purpleSoft, fontFamily: 'Poppins-Bold' }]}>
                    {player.name} {isMe ? '(Sen)' : ''}
                  </Text>
                  <Text style={styles.playerMeta}>
                    {player.isHost ? 'Oda Kurucusu • ' : ''}Sıra #{index + 1}
                  </Text>
                </View>

                <Badge tone={isLeader ? 'warning' : isMe ? 'purple' : 'neutral'}>
                  {player.score} Puan
                </Badge>
              </View>
            );
          })}
        </Card>

        <View style={styles.actionWrap}>
          {isHost ? (
            <Button
              label={isFinalRound ? 'Final Podyumunu Gör' : `Sonraki Tura Geç (Tur ${currentRound + 1})`}
              onPress={handleNextRound}
              variant="primary"
              fullWidth
              icon={isFinalRound ? <Sparkles color="#FFF" size={20} /> : <ArrowRight color="#FFF" size={20} />}
            />
          ) : (
            <View style={styles.waitingNotice}>
              <Text style={styles.waitingText}>
                Oda kurucusunun {isFinalRound ? 'oyunu bitirmesi' : 'sonraki turu başlatması'} bekleniyor…
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  scroll: {
    paddingBottom: 40,
  },
  scoreCard: {
    padding: 0,
    overflow: 'hidden',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  meRow: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  rankWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    fontFamily: 'Poppins-Bold',
  },
  playerName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  playerMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actionWrap: {
    marginTop: spacing.sm,
  },
  waitingNotice: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  waitingText: {
    ...typography.small,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
