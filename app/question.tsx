import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Clock, Send, Sparkles, AlertCircle, CheckCircle2, Flame, Lock } from 'lucide-react-native';
import { Screen, Button, Card, Badge, ProgressBar } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { QUESTIONS, type Question } from '@/features/game/questions';
import { getCategory } from '@/features/game/categories';
import type { RoundChoice } from '@/types/game';
import { mascotImages } from '@/assets/illustrations';

export default function QuestionScreen() {
  const { roomCode, roomState, currentPlayer, service } = useGameStore();
  const { trigger } = useHaptics();

  const totalTime = roomState?.config.roundSeconds ?? 20;
  const [secondsLeft, setSecondsLeft] = useState(totalTime);
  const [fakeAnswerText, setFakeAnswerText] = useState('');
  const [fakeSubmitted, setFakeSubmitted] = useState(false);
  const [choices, setChoices] = useState<RoundChoice[]>([]);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active question
  const currentQId = roomState?.currentQuestionId || QUESTIONS[0].id;
  const question: Question = QUESTIONS.find((q) => q.id === currentQId) || QUESTIONS[0];
  const category = getCategory(question.categoryId);

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const isBlocked = !!me?.isBlockedCurrentRound;

  // Determine sub-phase: 'fake_answer' or 'guess'
  const isGuessPhase = roomState?.phase === 'guess' || choices.length > 0;

  // Listen for phase transitions to result / scoreboard
  useEffect(() => {
    if (roomState?.phase === 'reveal') {
      router.replace('/result');
    } else if (roomState?.phase === 'scoreboard') {
      router.replace('/scoreboard');
    } else if (roomState?.phase === 'guess' && roomCode) {
      service.getRoundChoices(roomCode).then((list) => {
        if (list.length > 0) setChoices(list);
      }).catch(() => {});
    }
  }, [roomState?.phase, roomCode, service]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleTimeExpire();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === 4) trigger('warning');
        if (prev <= 3 && prev > 0) trigger('light');
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleTimeExpire = () => {
    if (submitting) return;
    if (!isGuessPhase) {
      // Auto-submit fake answer
      submitFake(fakeAnswerText.trim() || 'Bilmiyorum');
    } else {
      // Auto-submit first non-own choice
      const validChoice = choices.find((c) => !c.isOwnFake);
      if (validChoice) {
        submitPick(validChoice.choiceIndex);
      }
    }
  };

  const handleFakeSubmit = () => {
    const clean = fakeAnswerText.trim();
    if (!clean) {
      setError('Lütfen inandırıcı bir sahte cevap yaz.');
      return;
    }
    trigger('medium');
    submitFake(clean);
  };

  const submitFake = async (text: string) => {
    if (!roomCode || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await service.submitFakeAnswer(roomCode, text);
      setFakeSubmitted(true);
      const list = await service.getRoundChoices(roomCode);
      if (list.length > 0) {
        setChoices(list);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickSubmit = () => {
    if (selectedChoiceIndex === null) return;
    trigger('medium');
    submitPick(selectedChoiceIndex);
  };

  const submitPick = async (choiceIndex: number) => {
    if (!roomCode || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await service.submitPick(roomCode, choiceIndex);
      router.replace('/waiting');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const progressFraction = Math.max(0, secondsLeft / totalTime);

  if (isBlocked) {
    return (
      <Screen gradient diagonalSlice>
        <View style={styles.blockedWrap}>
          <Image source={mascotImages.shocked} style={styles.blockedMascot} resizeMode="contain" />
          <Text style={styles.blockedTitle}>Bu Tur Bloklandın!</Text>
          <Text style={styles.blockedSubtitle}>
            Rakiplerinden biri sana Blok yeteneği uyguladı. Bu tur cevap veremezsin; dinlen ve sonraki turda intikamını al!
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen gradient diagonalSlice>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Game HUD Bar */}
        <View style={styles.hudBar}>
          <View style={styles.hudTopRow}>
            <View style={styles.roundBadge}>
              <Text style={styles.roundText}>
                Tur {roomState?.currentRound ?? 1} / {roomState?.config.totalRounds ?? 5}
              </Text>
            </View>

            <Badge tone="purple" sticker>
              {category.emoji} {category.name}
            </Badge>

            <View style={[styles.timerWrap, secondsLeft <= 4 && styles.timerWrapUrgent]}>
              <Clock color={secondsLeft <= 4 ? colors.danger : colors.yellow} size={15} />
              <Text
                style={[
                  styles.timerText,
                  secondsLeft <= 4 && { color: colors.dangerSoft },
                ]}
              >
                {secondsLeft}s
              </Text>
            </View>
          </View>

          <View style={styles.progressWrap}>
            <ProgressBar
              progress={progressFraction}
              color={secondsLeft <= 4 ? colors.danger : colors.orange}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Prompt Card */}
          <Card variant="surface" glow="purple" style={styles.promptCard}>
            <View style={styles.questionIconRow}>
              <Text style={styles.questionKicker}>FoxMasque SORUSU</Text>
            </View>
            <Text style={styles.promptText}>{question.prompt}</Text>
          </Card>

          {/* STAGE 1: ENTER FAKE ANSWER */}
          {!isGuessPhase ? (
            <View style={styles.stageWrap}>
              {/* Cunning Fox Mascot Banner */}
              <View style={styles.cunningBanner}>
                <Image
                  source={mascotImages.cunning}
                  style={styles.cunningMascot}
                  resizeMode="contain"
                />
                <View style={{ flex: 1, paddingLeft: 8 }}>
                  <View style={styles.stageKicker}>
                    <Flame color={colors.orange} size={13} />
                    <Text style={styles.stageKickerText}>1. ADIM: BLÖFÜNÜ YAZ</Text>
                  </View>
                  <Text style={styles.cunningTitle}>
                    İnandırıcı ol!{'\n'}Kimse gerçeği anlamasın.
                  </Text>
                  <Text style={styles.cunningDesc}>
                    Sahte cevabına düşen her rakip için +50 puan kaparsın!
                  </Text>
                </View>
              </View>

              {!fakeSubmitted ? (
                <View style={styles.inputContainer}>
                  <TextInput
                    value={fakeAnswerText}
                    onChangeText={(t) => {
                      setFakeAnswerText(t);
                      if (error) setError(null);
                    }}
                    placeholder="İnandırıcı uydurma cevabın..."
                    placeholderTextColor={colors.textMuted}
                    style={styles.fakeInput}
                    maxLength={48}
                    returnKeyType="done"
                    onSubmitEditing={handleFakeSubmit}
                  />

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <Button
                    label="Sahte Cevabını Kilitle!"
                    onPress={handleFakeSubmit}
                    variant="orange"
                    loading={submitting}
                    fullWidth
                    icon={<Send color="#FFF" size={18} />}
                    style={{ marginTop: spacing.md }}
                  />
                </View>
              ) : (
                <Card variant="accent" style={styles.submittedCard}>
                  <CheckCircle2 color={colors.lime} size={32} />
                  <Text style={styles.submittedTitle}>Cevabın Havuzda Kilitlendi!</Text>
                  <Text style={styles.submittedText}>
                    "{fakeAnswerText}" cevabın gerçek cevapla karıştırılıyor. Diğer oyuncular bekleniyor...
                  </Text>
                </Card>
              )}
            </View>
          ) : (
            /* STAGE 2: GUESS FROM BLENDED CHOICES */
            <View style={styles.stageWrap}>
              <View style={styles.guessBanner}>
                <CheckCircle2 color={colors.lime} size={20} />
                <View style={{ flex: 1, paddingLeft: 6 }}>
                  <Text style={styles.guessTitle}>2. Adım: Gerçek Cevabı Bul!</Text>
                  <Text style={styles.guessDesc}>
                    Doğru cevap +100 puan! Kendi sahte cevabını seçemezsin. Başka birinin sahtesine kanarsan -40 puan!
                  </Text>
                </View>
              </View>

              <View style={styles.choicesList}>
                {choices.map((choice, idx) => {
                  const letter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][idx] || `${idx + 1}`;
                  const isSelected = selectedChoiceIndex === choice.choiceIndex;
                  const isOwn = !!choice.isOwnFake;

                  return (
                    <Pressable
                      key={choice.choiceIndex}
                      onPress={() => {
                        if (!isOwn) {
                          trigger('light');
                          setSelectedChoiceIndex(choice.choiceIndex);
                        }
                      }}
                      disabled={isOwn || submitting}
                      style={[
                        styles.choiceCard,
                        isSelected && styles.choiceCardSelected,
                        isOwn && styles.choiceCardOwn,
                      ]}
                    >
                      <View
                        style={[
                          styles.letterCircle,
                          isSelected && styles.letterCircleSelected,
                          isOwn && styles.letterCircleOwn,
                        ]}
                      >
                        <Text
                          style={[
                            styles.letterText,
                            isSelected && styles.letterTextSelected,
                            isOwn && styles.letterTextOwn,
                          ]}
                        >
                          {letter}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.choiceText,
                          isSelected && styles.choiceTextSelected,
                          isOwn && styles.choiceTextOwn,
                        ]}
                      >
                        {choice.text}
                      </Text>

                      {isOwn ? (
                        <Badge tone="yellow" sticker>SENİN BLÖFÜN</Badge>
                      ) : isSelected ? (
                        <View style={styles.selectedTick}>
                          <Lock color="#171026" size={14} strokeWidth={2.5} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                label={
                  selectedChoiceIndex !== null
                    ? 'Seçimini Onayla & Gönder'
                    : 'Bir Seçenek Seç'
                }
                onPress={handlePickSubmit}
                variant="orange"
                disabled={selectedChoiceIndex === null || submitting}
                loading={submitting}
                fullWidth
                icon={<CheckCircle2 color="#FFF" size={20} />}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hudBar: {
    paddingVertical: 10,
  },
  hudTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roundBadge: {
    backgroundColor: colors.bgSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  roundText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  timerWrapUrgent: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  timerText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: colors.yellow,
  },
  progressWrap: {
    marginTop: 4,
  },
  scroll: {
    paddingBottom: 48,
  },
  promptCard: {
    marginVertical: spacing.md,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.purple,
    ...shadows.glow,
  },
  questionIconRow: {
    marginBottom: 6,
  },
  questionKicker: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.purpleSoft,
    letterSpacing: 1.5,
  },
  promptText: {
    ...typography.h3,
    color: '#FFF',
    lineHeight: 28,
    fontFamily: 'Poppins-Bold',
  },
  stageWrap: {
    marginTop: spacing.sm,
  },
  cunningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.orange,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cunningMascot: {
    width: 86,
    height: 86,
  },
  stageKicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  stageKickerText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: colors.orange,
    letterSpacing: 1,
  },
  cunningTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  cunningDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },
  inputContainer: {
    marginTop: spacing.xs,
  },
  fakeInput: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 17,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  submittedCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: 8,
    marginTop: spacing.md,
  },
  submittedTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.lime,
    textAlign: 'center',
  },
  submittedText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  guessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(198, 243, 107, 0.12)',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lime,
    marginBottom: spacing.md,
  },
  guessTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: colors.lime,
  },
  guessDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    marginTop: 2,
  },
  choicesList: {
    gap: 10,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 12,
    ...shadows.card,
  },
  choiceCardSelected: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(255, 113, 59, 0.15)',
    ...shadows.glowOrange,
  },
  choiceCardOwn: {
    opacity: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 209, 102, 0.25)',
  },
  letterCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCircleSelected: {
    backgroundColor: colors.orange,
  },
  letterCircleOwn: {
    backgroundColor: 'rgba(255, 209, 102, 0.2)',
  },
  letterText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: colors.textSecondary,
  },
  letterTextSelected: {
    color: '#FFF',
  },
  letterTextOwn: {
    color: colors.yellow,
  },
  choiceText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  choiceTextSelected: {
    color: colors.orange,
  },
  choiceTextOwn: {
    color: colors.textMuted,
  },
  selectedTick: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: 12,
  },
  blockedMascot: {
    width: 140,
    height: 140,
  },
  blockedTitle: {
    ...typography.h2,
    color: colors.dangerSoft,
    textAlign: 'center',
  },
  blockedSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    ...typography.small,
    color: colors.dangerSoft,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
});
