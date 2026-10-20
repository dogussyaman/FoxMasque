import { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Check, Clock, Sparkles } from 'lucide-react-native';
import { Screen, Card, Badge, Avatar, Button } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';

export default function WaitingScreen() {
  const { roomState, service, roomCode, currentPlayer } = useGameStore();
  const { trigger } = useHaptics();

  // Watch for phase change to 'reveal' or 'scoreboard'
  useEffect(() => {
    if (roomState?.phase === 'reveal') {
      trigger('success');
      router.replace('/result');
    } else if (roomState?.phase === 'scoreboard') {
      router.replace('/scoreboard');
    }
  }, [roomState?.phase, trigger]);

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const isHost = me?.isHost ?? false;

  const picks = roomState?.picks ?? {};
  const fakeAnswers = roomState?.fakeAnswers ?? {};
  const isGuessPhase = roomState?.phase === 'guess';

  const submittedCount = isGuessPhase
    ? Object.keys(picks).length
    : Object.keys(fakeAnswers).length || Object.keys(roomState?.answers ?? {}).length;
  const totalCount = playersList.length;

  const handleForceAdvance = async () => {
    if (!roomCode || !isHost) return;
    trigger('medium');
    await service.advancePhase(roomCode);
    router.replace('/result');
  };

  return (
    <Screen>
      <View style={styles.topWrap}>
        <View style={styles.successIcon}>
          <Check color="#FFF" size={32} />
        </View>
        <Text style={styles.title}>Cevabın Alındı!</Text>
        <Text style={styles.subtitle}>
          {isGuessPhase
            ? 'Rakiplerin tahminlerini tamamlaması bekleniyor…'
            : 'Diğer oyuncuların sahte cevaplarını göndermesi bekleniyor…'}
        </Text>
      </View>

      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Tamamlayanlar</Text>
          <Badge tone={submittedCount === totalCount ? 'success' : 'purple'}>
            {submittedCount} / {totalCount} Oyuncu
          </Badge>
        </View>
      </Card>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.listTitle}>Oyuncu Durumları</Text>
        <Card style={styles.playersCard}>
          {playersList.map((player) => {
            const hasDone = isGuessPhase ? picks[player.id] !== undefined : !!fakeAnswers[player.id];
            return (
              <View key={player.id} style={styles.playerRow}>
                <Avatar avatarKey={player.avatarKey} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerScore}>{player.score} Puan</Text>
                </View>
                {hasDone ? (
                  <View style={styles.answeredBadge}>
                    <Check color={colors.success} size={14} />
                    <Text style={styles.answeredText}>Tamamladı</Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Clock color={colors.textMuted} size={14} />
                    <Text style={styles.pendingText}>Düşünüyor…</Text>
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        {/* Tactical party tip */}
        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Sparkles color={colors.orange} size={18} />
            <Text style={styles.tipTitle}>ZARTO İpucu</Text>
          </View>
          <Text style={styles.tipBody}>
            Kendi sahte cevabını seçemezsin; ne kadar çok rakibi senin sahte cevabına düşürürsen o kadar çok (+50) puan kazanırsın!
          </Text>
        </Card>

        {/* Host action button */}
        {isHost ? (
          <View style={styles.actionWrap}>
            <Button
              label="Sonuçları Açıkla"
              onPress={handleForceAdvance}
              variant="secondary"
              fullWidth
            />
          </View>
        ) : (
          <View style={styles.waitingNotice}>
            <Text style={styles.waitingNoticeText}>
              Oda kurucusunun sonuçları açması bekleniyor…
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topWrap: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 24,
  },
  statusCard: {
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  scroll: {
    paddingBottom: 40,
  },
  listTitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
    marginTop: 4,
  },
  playersCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  playerName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  playerScore: {
    ...typography.caption,
    color: colors.textMuted,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  answeredText: {
    ...typography.caption,
    color: colors.success,
    fontFamily: 'Poppins-SemiBold',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgSurfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  pendingText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  tipCard: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
    marginBottom: spacing.lg,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tipTitle: {
    ...typography.caption,
    color: colors.orange,
    fontFamily: 'Poppins-Bold',
  },
  tipBody: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionWrap: {
    marginTop: spacing.sm,
  },
  waitingNotice: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  waitingNoticeText: {
    ...typography.small,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
