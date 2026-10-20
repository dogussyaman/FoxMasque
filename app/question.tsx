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
} from 'react-native';
import { router } from 'expo-router';
import { Clock, Send, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { Screen, Button, Card, Badge, ProgressBar } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { QUESTIONS, type Question } from '@/features/game/questions';
import { getCategory } from '@/features/game/categories';
import type { RoundChoice } from '@/types/game';

export default function QuestionScreen() {
  const { roomCode, roomState, currentPlayer, service } = useGameStore();
  const { trigger } = useHaptics();

  const totalTime = roomState?.config.roundSeconds ?? 20;
  const [secondsLeft, setSecondsLeft] = useState(totalTime);
  const [fakeAnswerText, setFakeAnswerText] = useState('');
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
      <Screen>
        <View style={styles.blockedWrap}>
          <AlertCircle color={colors.danger} size={48} />
          <Text style={styles.blockedTitle}>Bu Tur Bloklandın!</Text>
          <Text style={styles.blockedSubtitle}>
            Bir önceki turda bir rakip sana blok uyguladı. Bu tur cevap veremezsin, sonraki turda tekrar oyundasın!
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.roundWrap}>
              <Text style={styles.roundText}>
                Tur {roomState?.currentRound ?? 1} / {roomState?.config.totalRounds ?? 5}
              </Text>
            </View>
            <Badge tone="purple">
              {category.emoji} {category.name}
            </Badge>
            <View style={styles.timerWrap}>
              <Clock color={secondsLeft <= 4 ? colors.danger : colors.textPrimary} size={16} />
              <Text
                style={[
                  styles.timerText,
                  secondsLeft <= 4 && { color: colors.danger, fontFamily: 'Poppins-Bold' },
                ]}
              >
                {secondsLeft}s
              </Text>
            </View>
          </View>

          <View style={styles.progressWrap}>
            <ProgressBar
              progress={progressFraction}
              color={secondsLeft <= 4 ? colors.danger : colors.purpleSoft}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Question Prompt Card */}
          <Card style={styles.promptCard}>
            <Text style={styles.promptText}>{question.prompt}</Text>
          </Card>

          {/* STAGE 1: ENTER FAKE ANSWER */}
          {!isGuessPhase ? (
            <View style={styles.stageWrap}>
              <View style={styles.stageHeader}>
                <Sparkles color={colors.purpleSoft} size={20} />
                <Text style={styles.stageTitle}>1. Adım: Sahte Cevabını Yaz!</Text>
              </View>
              <Text style={styles.stageSubtitle}>
                Doğru cevap olduğunu düşündürtecek inandırıcı bir sahte cevap yaz. Rakiplerin buna düşerse kişi başı +50 puan kazanırsın!
              </Text>

              <TextInput
                value={fakeAnswerText}
                onChangeText={(t) => {
                  setFakeAnswerText(t);
                  if (error) setError(null);
                }}
                placeholder="İnandırıcı sahte cevabın..."
                placeholderTextColor={colors.textMuted}
                style={styles.fakeInput}
                maxLength={48}
                returnKeyType="done"
                onSubmitEditing={handleFakeSubmit}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                label="Sahte Cevabı Kilitle"
                onPress={handleFakeSubmit}
                variant="primary"
                loading={submitting}
                fullWidth
                icon={<Send color="#FFF" size={18} />}
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : (
            /* STAGE 2: GUESS FROM BLENDED CHOICES */
            <View style={styles.stageWrap}>
              <View style={styles.stageHeader}>
                <CheckCircle2 color={colors.success} size={20} />
                <Text style={styles.stageTitle}>2. Adım: Gerçek Cevabı Bul!</Text>
              </View>
              <Text style={styles.stageSubtitle}>
                Aşağıdaki seçeneklerden hangisi doğru? Kendi sahte cevabını seçemezsin. Başka birinin sahte cevabına düşersen -40 puan!
              </Text>

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
                        <Badge tone="warning">SENİN CEVABIN</Badge>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                label={selectedChoiceIndex === null ? 'Lütfen Bir Şık Seç' : 'Tahmini Gönder'}
                onPress={handlePickSubmit}
                variant="primary"
                disabled={selectedChoiceIndex === null || submitting}
                loading={submitting}
                fullWidth
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
  header: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roundWrap: {
    backgroundColor: colors.bgSurfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  roundText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'Poppins-SemiBold',
  },
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgSurfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  timerText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Medium',
  },
  progressWrap: {
    marginTop: 2,
  },
  scroll: {
    paddingBottom: 40,
  },
  promptCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 110,
    justifyContent: 'center',
  },
  promptText: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
  },
  stageWrap: {
    marginTop: spacing.xs,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  stageTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  stageSubtitle: {
    ...typography.small,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  fakeInput: {
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginBottom: 4,
  },
  choicesList: {
    gap: 10,
    marginBottom: spacing.sm,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 12,
  },
  choiceCardSelected: {
    borderColor: colors.purpleSoft,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
  },
  choiceCardOwn: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'transparent',
  },
  letterCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCircleSelected: {
    backgroundColor: colors.purple,
  },
  letterCircleOwn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  letterText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  letterTextSelected: {
    color: colors.textOnAccent,
  },
  letterTextOwn: {
    color: colors.textMuted,
  },
  choiceText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  choiceTextSelected: {
    fontFamily: 'Poppins-Bold',
    color: colors.textOnAccent,
  },
  choiceTextOwn: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginTop: 6,
    textAlign: 'center',
  },
  blockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  blockedTitle: {
    ...typography.h2,
    color: colors.danger,
    marginTop: spacing.md,
  },
  blockedSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});
