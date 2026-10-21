import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle2, AlertTriangle, Zap, ShieldAlert, ArrowRight, HelpCircle } from 'lucide-react-native';
import {
  Screen,
  Button,
  Card,
  Badge,
  Avatar,
  MascotFloat,
  PopView,
  ShakeView,
  StaggerRow,
  StickyActionBar,
} from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { QUESTIONS, type Question } from '@/features/game/questions';
import { resolveZartoRound } from '@/features/game/engine';
import type { RoundResultRow } from '@/types/game';
import { mascotImages } from '@/assets/illustrations';
import { soundService } from '@/services/soundService';

export default function ResultScreen() {
  const { roomState, currentPlayer, roomCode, service } = useGameStore();
  const { trigger } = useHaptics();
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [loadedQuestion, setLoadedQuestion] = useState<Question | null>(null);
  const playedResultSound = useRef<string | null>(null);

  const currentQId = roomState?.currentQuestionId || QUESTIONS[0].id;
  const localQuestion = QUESTIONS.find((q) => q.id === currentQId);
  const question: Question = loadedQuestion?.id === currentQId
    ? loadedQuestion
    : localQuestion || QUESTIONS[0];
  const currentRoomPhase = roomState?.phase;

  useEffect(() => {
    if (!roomCode || !currentRoomPhase || currentRoomPhase === 'lobby') return;
    let cancelled = false;
    void service.getCurrentQuestion(roomCode).then((nextQuestion) => {
      if (!cancelled && nextQuestion?.id === currentQId) setLoadedQuestion(nextQuestion);
    }).catch((error: unknown) => {
      if (!cancelled) setAdvanceError(error instanceof Error ? error.message : 'Soru yüklenemedi.');
    });
    return () => {
      cancelled = true;
    };
  }, [currentQId, currentRoomPhase, roomCode, service]);

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const isHost = me?.isHost ?? false;

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
    if (!myResult) return;
    const resultSoundKey = `${roomCode ?? 'local'}:${roomState?.currentRound ?? 1}:${me?.id ?? 'unknown'}`;
    if (playedResultSound.current === resultSoundKey) return;
    playedResultSound.current = resultSoundKey;

    if (zartalandın) {
      soundService.play('zartalanma');
      trigger('heavy');
    } else if (isCorrect) {
      soundService.play('true');
      trigger(zartaladın ? 'success' : 'light');
    } else if (zartaladın) {
      soundService.play('true');
      trigger('success');
    } else {
      trigger('warning');
    }
  }, [myResult, isCorrect, zartaladın, zartalandın, trigger, roomCode, roomState?.currentRound, me?.id]);

  const handleNext = async () => {
    trigger('medium');
    setAdvanceError(null);
    if (isHost && roomCode) {
      setAdvancing(true);
      try {
        await service.advancePhase(roomCode);
      } catch (error) {
        setAdvanceError((error as Error).message || 'Aşama ilerletilemedi.');
        setAdvancing(false);
        return;
      }
      setAdvancing(false);
    }
    router.replace('/scoreboard');
  };

  const trueAnswerText = question.correctAnswer;

  // Mascot expression based on round outcome
  const mascotSource = zartaladın
    ? mascotImages.smug
    : zartalandın
    ? mascotImages.shocked
    : isCorrect
    ? mascotImages.hero
    : mascotImages.searching;

  const headerTitle = zartaladın && isCorrect
    ? 'ÇİFTE BAŞARI! HEM BİLDİN HEM TUZAĞA DÜŞÜRDÜN!'
    : zartaladın
    ? 'TUZAĞA DÜŞÜRDÜN! RAKİPLER TUZAĞINA DÜŞTÜ!'
    : zartalandın
    ? 'TUZAĞA DÜŞTÜN! SAHTEYE KANDIN!'
    : isCorrect
    ? 'DOĞRU BİLDİN!'
    : 'YANLIŞ TAHMİN!';

  return (
    <Screen gradient diagonalSlice>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Mascot Hero Banner */}
        <View style={styles.topHeader}>
          <View style={styles.mascotCircle}>
            <MascotFloat floatDistance={5} duration={2400}>
              <Image source={mascotSource} style={styles.mascotImage} resizeMode="contain" />
            </MascotFloat>
          </View>

          <View style={styles.roundBadge}>
            <Text style={styles.roundText}>
              Tur {roomState?.currentRound ?? 1} / {roomState?.config.totalRounds ?? 5} Sonucu
            </Text>
          </View>

          <Text style={styles.headerTitleText}>{headerTitle}</Text>

          <PopView delay={100} duration={350}>
            <View
              style={[
                styles.scorePill,
                pointsDelta > 0
                  ? styles.scorePillPos
                  : pointsDelta < 0
                  ? styles.scorePillNeg
                  : styles.scorePillZero,
              ]}
            >
              <Text
                style={[
                  styles.mainScoreText,
                  pointsDelta > 0
                    ? { color: colors.lime }
                    : pointsDelta < 0
                    ? { color: colors.dangerSoft }
                    : { color: colors.textSecondary },
                ]}
              >
                {pointsDelta > 0 ? `+${pointsDelta}` : pointsDelta} PUAN
              </Text>
            </View>
          </PopView>
        </View>

        {/* Outcome Cards */}
        <View style={styles.outcomesList}>
          {/* 1. DOĞRU BİLDİN */}
          {isCorrect ? (
            <PopView delay={200} duration={380}>
              <Card variant="surface" glow="lime" style={styles.outcomeSuccessCard}>
                <View style={styles.outcomeRow}>
                  <View style={[styles.outcomeIconWrap, { backgroundColor: colors.lime }]}>
                    <CheckCircle2 color="#171026" size={24} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.outcomeSuccessTitle}>DOĞRU BİLDİN!</Text>
                    <Text style={styles.outcomeDesc}>Gerçek cevabı buldun</Text>
                  </View>
                  <Badge tone="lime" sticker>+100</Badge>
                </View>
              </Card>
            </PopView>
          ) : !zartalandın ? (
            <PopView delay={200} duration={380}>
              <Card variant="surface" style={styles.outcomeWrongCard}>
                <View style={styles.outcomeRow}>
                  <View style={[styles.outcomeIconWrap, { backgroundColor: colors.bgSurfaceAlt }]}>
                    <AlertTriangle color={colors.textMuted} size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.outcomeWrongTitle}>YANLIŞ TAHMİN</Text>
                    <Text style={styles.outcomeDesc}>Doğru cevabı bulamadın</Text>
                  </View>
                  <Badge tone="neutral">0 P</Badge>
                </View>
              </Card>
            </PopView>
          ) : null}

          {/* 2. ZARTALADIN */}
          {zartaladın && (
            <PopView delay={320} duration={380}>
              <Card variant="surface" glow="orange" style={styles.outcomeZartalaCard}>
                <View style={styles.outcomeRow}>
                  <View style={[styles.outcomeIconWrap, { backgroundColor: colors.orange }]}>
                    <Zap color="#FFF" size={24} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.outcomeZartalaTitle}>TUZAĞA DÜŞÜRDÜN!</Text>
                    <Text style={styles.outcomeDesc}>
                      {victimsCount} rakip senin tuzağına düştü!
                    </Text>
                  </View>
                  <Badge tone="orange" sticker>+{victimsCount * 50}</Badge>
                </View>
              </Card>
            </PopView>
          )}

          {/* 3. ZARTALANDIN */}
          {zartalandın && (
            <ShakeView delay={250} intensity={7}>
              <Card variant="surface" style={styles.outcomeZartalandinCard}>
                <View style={styles.outcomeRow}>
                  <View style={[styles.outcomeIconWrap, { backgroundColor: colors.danger }]}>
                    <ShieldAlert color="#FFF" size={24} strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.outcomeZartalandinTitle}>TUZAĞA DÜŞTÜN!</Text>
                    <Text style={styles.outcomeDesc}>
                      Başka bir oyuncunun tuzağına düştün
                    </Text>
                  </View>
                  <Badge tone="danger" sticker>-40</Badge>
                </View>
              </Card>
            </ShakeView>
          )}
        </View>

        {/* Question Review Card */}
        <Card variant="surface" style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <HelpCircle color={colors.yellow} size={18} />
            <Text style={styles.reviewLabel}>Soru ve Gerçek Cevap</Text>
          </View>
          <Text style={styles.reviewPrompt}>{question.prompt}</Text>

          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>Doğru Cevap:</Text>
            <Text style={styles.answerText}>{trueAnswerText}</Text>
          </View>

          {question.explanation ? (
            <Text style={styles.explanationText}>💡 {question.explanation}</Text>
          ) : null}
        </Card>

        {/* Other Players Summary */}
        <Text style={styles.sectionTitle}>TÜM OYUNCULARIN TUR PUANLARI</Text>
        <View style={styles.playersListWrap}>
          {playersList
            .filter((p) => p.id !== me?.id)
            .map((player, idx) => {
              const res = roomState?.roundResults?.[player.id];
              return (
                <StaggerRow key={player.id} index={idx} delay={70}>
                  <Card variant="surface" style={styles.playerRow}>
                    <Avatar avatarKey={player.avatarUrl ?? player.avatarKey} size={38} />
                    <Text style={styles.playerName}>{player.name}</Text>
                    <View style={styles.badgesWrap}>
                      {res?.outcome.correct ? (
                        <Badge tone="lime">+100</Badge>
                      ) : res?.outcome.zartalandın ? (
                        <Badge tone="danger">-40</Badge>
                      ) : (
                        <Badge tone="neutral">0</Badge>
                      )}
                      {res?.victimsCount && res.victimsCount > 0 ? (
                        <Badge tone="orange">+{res.victimsCount * 50}</Badge>
                      ) : null}
                    </View>
                  </Card>
                </StaggerRow>
              );
            })}
        </View>

      </ScrollView>
      <StickyActionBar>
        {advanceError ? (
          <Text accessibilityRole="alert" style={styles.advanceError}>{advanceError}</Text>
        ) : null}
        <Button
          label={isHost ? 'Skor Tablosuna Geç' : 'Sonuç Tablosunu Gör'}
          onPress={handleNext}
          variant="orange"
          fullWidth
          loading={advancing}
          disabled={advancing}
          icon={<ArrowRight color="#FFF" size={20} />}
        />
      </StickyActionBar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  advanceError: {
    ...typography.caption,
    color: colors.dangerSoft,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  scroll: {
    paddingBottom: spacing.md,
    paddingTop: 4,
  },
  topHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  mascotCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.bgCard,
    borderWidth: 2,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.glowOrange,
  },
  mascotImage: {
    width: 110,
    height: 110,
  },
  roundBadge: {
    backgroundColor: colors.bgSurfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  roundText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: 'Poppins-Bold',
  },
  headerTitleText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scorePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 2,
    marginTop: 8,
  },
  scorePillPos: {
    backgroundColor: 'rgba(198, 243, 107, 0.15)',
    borderColor: colors.lime,
  },
  scorePillNeg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
  },
  scorePillZero: {
    backgroundColor: colors.bgCard,
    borderColor: colors.borderStrong,
  },
  mainScoreText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    letterSpacing: 1,
  },
  outcomesList: {
    gap: 10,
    marginVertical: spacing.md,
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
    borderWidth: 1.5,
    borderColor: colors.lime,
  },
  outcomeSuccessTitle: {
    ...typography.bodyMedium,
    color: colors.lime,
    fontFamily: 'Poppins-Bold',
  },
  outcomeWrongCard: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  outcomeWrongTitle: {
    ...typography.bodyMedium,
    color: colors.textMuted,
    fontFamily: 'Poppins-Bold',
  },
  outcomeZartalaCard: {
    borderWidth: 1.5,
    borderColor: colors.orange,
  },
  outcomeZartalaTitle: {
    ...typography.bodyMedium,
    color: colors.orange,
    fontFamily: 'Poppins-Bold',
  },
  outcomeZartalandinCard: {
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  outcomeZartalandinTitle: {
    ...typography.bodyMedium,
    color: colors.dangerSoft,
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
    gap: 6,
    marginBottom: 6,
  },
  reviewLabel: {
    ...typography.caption,
    color: colors.yellow,
    fontFamily: 'Poppins-Bold',
  },
  reviewPrompt: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 10,
    fontFamily: 'Poppins-Medium',
  },
  answerBox: {
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(198, 243, 107, 0.3)',
  },
  answerLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  answerText: {
    ...typography.bodyMedium,
    color: colors.lime,
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
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  playersListWrap: {
    gap: 8,
    marginBottom: spacing.lg,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: 10,
  },
  playerName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
    fontFamily: 'Poppins-Bold',
  },
  badgesWrap: {
    flexDirection: 'row',
    gap: 6,
  },
});
