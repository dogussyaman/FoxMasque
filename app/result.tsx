import { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle2, AlertTriangle, Zap, ShieldAlert, ArrowRight, HelpCircle } from 'lucide-react-native';
import { Screen, Button, Card, Badge, Avatar } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { QUESTIONS, type Question } from '@/features/game/questions';
import { resolveZartoRound } from '@/features/game/engine';
import type { RoundResultRow } from '@/types/game';

export default function ResultScreen() {
  const { roomState, currentPlayer, roomCode, service } = useGameStore();
  const { trigger } = useHaptics();

  const currentQId = roomState?.currentQuestionId || QUESTIONS[0].id;
  const question: Question = QUESTIONS.find((q) => q.id === currentQId) || QUESTIONS[0];

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;

  // Use authoritative roundResults from server/store or resolve locally
  let myResult: RoundResultRow | undefined = me ? roomState?.roundResults?.[me.id] : undefined;

  if (!myResult && roomState) {
    const res = resolveZartoRound({
      question,
      players: playersList,
      choices: roomState.choices || [],
      picks: roomState.picks || {},
      fakeAnswers: roomState.fakeAnswers || {},
      abilityActions: roomState.abilityActions || [],
    });
    myResult = me ? res.rows[me.id] : undefined;
  }

  const outcome = myResult?.outcome;
  const pointsDelta = myResult?.pointsDelta ?? 0;
  const victimsCount = myResult?.victimsCount ?? outcome?.victimsCount ?? 0;
  const isCorrect = !!outcome?.correct;
  const zartaladın = !!outcome?.zartaladın || victimsCount > 0;
  const zartalandın = !!outcome?.zartalandın;

  useEffect(() => {
    if (isCorrect && zartaladın) {
      trigger('success');
    } else if (zartalandın) {
      trigger('heavy');
    } else if (isCorrect) {
      trigger('light');
    } else {
      trigger('warning');
    }
  }, [isCorrect, zartaladın, zartalandın, trigger]);

  const handleNext = async () => {
    trigger('medium');
    if (roomCode) {
      await service.advancePhase(roomCode);
    }
    router.replace('/scoreboard');
  };

  const trueAnswerText = question.correctAnswer || question.options?.[question.correctIndex];

  return (
    <Screen>
      <View style={styles.topHeader}>
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>
            Tur {roomState?.currentRound ?? 1} Sonucu
          </Text>
        </View>
        <Text
          style={[
            styles.mainScore,
            pointsDelta > 0
              ? { color: colors.success }
              : pointsDelta < 0
              ? { color: colors.danger }
              : { color: colors.textPrimary },
          ]}
        >
          {pointsDelta > 0 ? `+${pointsDelta}` : pointsDelta} Puan
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Outcome Banners & Badges */}
        <View style={styles.outcomesList}>
          {/* 1. DOĞRU BİLDİN */}
          {isCorrect ? (
            <Card style={styles.outcomeSuccessCard}>
              <View style={styles.outcomeRow}>
                <View style={[styles.outcomeIconWrap, { backgroundColor: colors.success }]}>
                  <CheckCircle2 color="#FFF" size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.outcomeSuccessTitle}>DOĞRU BİLDİN!</Text>
                  <Text style={styles.outcomeDesc}>Gerçek cevabı buldun (+100 Puan)</Text>
                </View>
                <Badge tone="success">+100</Badge>
              </View>
            </Card>
          ) : !zartalandın ? (
            <Card style={styles.outcomeWrongCard}>
              <View style={styles.outcomeRow}>
                <View style={[styles.outcomeIconWrap, { backgroundColor: colors.textMuted }]}>
                  <AlertTriangle color="#FFF" size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.outcomeWrongTitle}>YANLIŞ TAHMİN</Text>
                  <Text style={styles.outcomeDesc}>Doğru cevabı bulamadın (0 Puan)</Text>
                </View>
                <Badge tone="neutral">0</Badge>
              </View>
            </Card>
          ) : null}

          {/* 2. ZARTALADIN (Rivals picked your fake answer) */}
          {zartaladın ? (
            <Card style={styles.outcomeZartalaCard}>
              <View style={styles.outcomeRow}>
                <View style={[styles.outcomeIconWrap, { backgroundColor: colors.purple }]}>
                  <Zap color="#FFF" size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.outcomeZartalaTitle}>ZARTALADIN!</Text>
                  <Text style={styles.outcomeDesc}>
                    {victimsCount} rakip senin sahte cevabına düştü! (+{victimsCount * 50} Puan)
                  </Text>
                </View>
                <Badge tone="purple">+{victimsCount * 50}</Badge>
              </View>
            </Card>
          ) : null}

          {/* 3. ZARTALANDIN (You picked another player's fake answer) */}
          {zartalandın ? (
            <Card style={styles.outcomeZartalandinCard}>
              <View style={styles.outcomeRow}>
                <View style={[styles.outcomeIconWrap, { backgroundColor: colors.danger }]}>
                  <ShieldAlert color="#FFF" size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.outcomeZartalandinTitle}>ZARTALANDIN!</Text>
                  <Text style={styles.outcomeDesc}>
                    Başka bir oyuncunun sahte cevabına aldandın (-40 Puan)
                  </Text>
                </View>
                <Badge tone="danger">-40</Badge>
              </View>
            </Card>
          ) : null}
        </View>

        {/* Question Review Card */}
        <Card style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <HelpCircle color={colors.purpleSoft} size={18} />
            <Text style={styles.reviewLabel}>Soru ve Doğru Cevap</Text>
          </View>
          <Text style={styles.reviewPrompt}>{question.prompt}</Text>

          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>Gerçek Cevap:</Text>
            <Text style={styles.answerText}>{trueAnswerText}</Text>
          </View>

          {question.explanation ? (
            <Text style={styles.explanationText}>💡 {question.explanation}</Text>
          ) : null}
        </Card>

        {/* Other Players Summary */}
        <Text style={styles.sectionTitle}>Diğer Oyuncuların Durumu</Text>
        <Card style={styles.playersCard}>
          {playersList
            .filter((p) => p.id !== me?.id)
            .map((player) => {
              const res = roomState?.roundResults?.[player.id];
              return (
                <View key={player.id} style={styles.playerRow}>
                  <Avatar avatarKey={player.avatarKey} size={36} />
                  <Text style={styles.playerName}>{player.name}</Text>
                  <View style={styles.badgesWrap}>
                    {res?.outcome.correct ? (
                      <Badge tone="success">DOĞRU (+100)</Badge>
                    ) : res?.outcome.zartalandın ? (
                      <Badge tone="danger">ZARTALANDI (-40)</Badge>
                    ) : (
                      <Badge tone="neutral">YANLIŞ</Badge>
                    )}
                    {res?.victimsCount && res.victimsCount > 0 ? (
                      <Badge tone="purple">+{res.victimsCount * 50}</Badge>
                    ) : null}
                  </View>
                </View>
              );
            })}
        </Card>

        {/* Continue Button */}
        <View style={styles.actionWrap}>
          <Button
            label="Skor Tablosuna Geç"
            onPress={handleNext}
            variant="primary"
            fullWidth
            icon={<ArrowRight color="#FFF" size={20} />}
          />
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
  roundBadge: {
    backgroundColor: colors.bgSurfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: 6,
  },
  roundText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Poppins-SemiBold',
  },
  mainScore: {
    ...typography.h1,
  },
  scroll: {
    paddingBottom: 40,
  },
  outcomesList: {
    gap: 10,
    marginBottom: spacing.md,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  outcomeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeSuccessCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.35)',
  },
  outcomeSuccessTitle: {
    ...typography.bodyMedium,
    color: colors.success,
    fontFamily: 'Poppins-Bold',
  },
  outcomeWrongCard: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: colors.border,
  },
  outcomeWrongTitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    fontFamily: 'Poppins-Bold',
  },
  outcomeZartalaCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: colors.purpleSoft,
  },
  outcomeZartalaTitle: {
    ...typography.bodyMedium,
    color: colors.purpleSoft,
    fontFamily: 'Poppins-Bold',
  },
  outcomeZartalandinCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
  },
  outcomeZartalandinTitle: {
    ...typography.bodyMedium,
    color: colors.danger,
    fontFamily: 'Poppins-Bold',
  },
  outcomeDesc: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reviewCard: {
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  reviewLabel: {
    ...typography.caption,
    color: colors.purpleSoft,
    fontFamily: 'Poppins-SemiBold',
  },
  reviewPrompt: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 10,
  },
  answerBox: {
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: 6,
  },
  answerLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  answerText: {
    ...typography.bodyMedium,
    color: colors.success,
    fontFamily: 'Poppins-Bold',
    marginTop: 2,
  },
  explanationText: {
    ...typography.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
    gap: 10,
  },
  playerName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  badgesWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  actionWrap: {
    marginTop: spacing.sm,
  },
});
