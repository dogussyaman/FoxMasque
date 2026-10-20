import { useEffect, useRef, useState } from 'react';
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
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Clock, Send, Sparkles, AlertCircle, CheckCircle2, Flame, Lock, Pause, Play, LogOut, Info } from 'lucide-react-native';
import {
  Screen,
  Button,
  Card,
  Badge,
  ProgressBar,
  StaggerRow,
  PopView,
  PulseView,
  MascotFloat,
  StickyActionBar,
} from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { QUESTIONS, type Question } from '@/features/game/questions';
import { getCategory } from '@/features/game/categories';
import type { RoundChoice } from '@/types/game';
import { mascotImages } from '@/assets/illustrations';
import { soundService } from '@/services/soundService';
import { usePrototype } from '@/features/prototype/PrototypeProvider';

export default function QuestionScreen() {
  const { roomCode, roomState, currentPlayer, service } = useGameStore();
  const prototype = usePrototype();
  const { trigger } = useHaptics();

  const totalTime = roomState?.config.roundSeconds ?? 20;
  const [secondsLeft, setSecondsLeft] = useState(totalTime);
  const [fakeAnswerText, setFakeAnswerText] = useState('');
  const [fakeSubmitted, setFakeSubmitted] = useState(false);
  const [choices, setChoices] = useState<RoundChoice[]>([]);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const clockPlayedFake = useRef(false);
  const clockPlayedGuess = useRef(false);
  const prevIsGuessPhase = useRef(false);
  const isFirstMount = useRef(true);

  // Active question
  const currentQId = roomState?.currentQuestionId || QUESTIONS[0].id;
  const question: Question = QUESTIONS.find((q) => q.id === currentQId) || QUESTIONS[0];
  const category = getCategory(question.categoryId);

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const isBlocked = !!me?.isBlockedCurrentRound;

  // Determine sub-phase: 'fake_answer' or 'guess'
  const isGuessPhase = roomState?.phase === 'guess' || choices.length > 0;

  // Reset timer & clock state when new question begins
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevIsGuessPhase.current = isGuessPhase;
      return;
    }
    clockPlayedFake.current = false;
    clockPlayedGuess.current = false;
    setFakeSubmitted(false);
    setFakeAnswerText('');
    setChoices([]);
    setSelectedChoiceIndex(null);
    setSecondsLeft(totalTime);
    soundService.stop('clock');
  }, [currentQId, totalTime]);

  // Transition from fake_answer to guess phase: stop previous clock & reset timer
  useEffect(() => {
    if (!prevIsGuessPhase.current && isGuessPhase) {
      soundService.stop('clock');
      clockPlayedGuess.current = false;
      setSecondsLeft(totalTime);
    }
    prevIsGuessPhase.current = isGuessPhase;
  }, [isGuessPhase, totalTime]);

  // Stop clock sound when unmounting
  useEffect(() => {
    return () => {
      soundService.stop('clock');
    };
  }, []);

  // Clock sound playback: 9-second countdown audio starts once when secondsLeft < 10
  useEffect(() => {
    if (isPaused) {
      soundService.stop('clock');
      return;
    }
    if (secondsLeft < 10 && secondsLeft > 0) {
      if (!isGuessPhase) {
        if (!fakeSubmitted && !submitting && !clockPlayedFake.current) {
          clockPlayedFake.current = true;
          void soundService.play('clock');
        }
      } else {
        if (!submitting && !clockPlayedGuess.current) {
          clockPlayedGuess.current = true;
          void soundService.play('clock');
        }
      }
    }
  }, [secondsLeft, isGuessPhase, fakeSubmitted, submitting, isPaused]);

  // Listen for phase transitions to result / scoreboard
  useEffect(() => {
    if (roomState?.phase === 'reveal') {
      soundService.stop('clock');
      router.replace('/result');
    } else if (roomState?.phase === 'scoreboard') {
      soundService.stop('clock');
      router.replace('/scoreboard');
    } else if (roomState?.phase === 'guess' && roomCode) {
      service.getRoundChoices(roomCode).then((list) => {
        if (list.length > 0) setChoices(list);
      }).catch(() => {});
    }
  }, [roomState?.phase, roomCode, service]);

  // Countdown timer (pauses when isPaused is true)
  useEffect(() => {
    if (isPaused) {
      soundService.stop('clock');
      return;
    }
    if (secondsLeft <= 0) {
      soundService.stop('clock');
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
  }, [secondsLeft, isGuessPhase, isPaused]);

  const handleTogglePause = () => {
    soundService.play('click');
    trigger('medium');
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        soundService.stop('clock');
      } else {
        if (secondsLeft < 10 && secondsLeft > 0) {
          clockPlayedFake.current = false;
          clockPlayedGuess.current = false;
        }
      }
      return next;
    });
  };

  const handleLeaveGame = async () => {
    soundService.stop('clock');
    setIsPaused(false);
    if (roomCode) {
      try {
        await service.leaveRoom(roomCode);
      } catch {}
    }
    router.replace('/create-room');
  };

  const handleTimeExpire = () => {
    soundService.stop('clock');
    if (submitting) return;
    if (!isGuessPhase) {
      if (fakeSubmitted) return;
      // Auto-submit empty fake answer if user didn't write anything
      submitFake(fakeAnswerText.trim());
    } else {
      // Auto-submit first non-own choice
      const validChoice = choices.find((c) => !c.isOwnFake) || choices[0];
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
    soundService.stop('clock');
    trigger('medium');
    submitFake(clean);
  };

  const submitFake = async (text: string) => {
    if (!roomCode || submitting) return;
    soundService.stop('clock');
    setSubmitting(true);
    setError(null);
    try {
      await service.submitFakeAnswer(roomCode, text);
      setFakeSubmitted(true);
      const stageId = `${roomCode}:${roomState?.currentRound ?? 1}:fake_answer`;
      if (currentPlayer) prototype.beginWaiting(stageId, 'fake_answer', currentPlayer.id);
      router.replace('/waiting');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickSubmit = () => {
    if (selectedChoiceIndex === null) return;
    soundService.stop('clock');
    trigger('medium');
    submitPick(selectedChoiceIndex);
  };

  const submitPick = async (choiceIndex: number) => {
    if (!roomCode || submitting) return;
    soundService.stop('clock');
    setSubmitting(true);
    setError(null);
    try {
      await service.submitPick(roomCode, choiceIndex);
      const stageId = `${roomCode}:${roomState?.currentRound ?? 1}:guess`;
      if (currentPlayer) prototype.beginWaiting(stageId, 'guess', currentPlayer.id);
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

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {secondsLeft <= 4 ? (
                <PulseView minScale={0.92} maxScale={1.08} duration={600}>
                  <View style={[styles.timerWrap, styles.timerWrapUrgent]}>
                    <Clock color={colors.danger} size={15} />
                    <Text style={[styles.timerText, { color: colors.dangerSoft }]}>
                      {secondsLeft}s
                    </Text>
                  </View>
                </PulseView>
              ) : (
                <View style={styles.timerWrap}>
                  <Clock color={colors.yellow} size={15} />
                  <Text style={styles.timerText}>{secondsLeft}s</Text>
                </View>
              )}

              <Pressable
                onPress={handleTogglePause}
                style={({ pressed }) => [
                  styles.pauseBtn,
                  { transform: [{ scale: pressed ? 0.94 : 1 }] },
                ]}
                hitSlop={8}
              >
                <Pause color={colors.textPrimary} size={15} />
              </Pressable>
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
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question Prompt Card */}
          <Card variant="surface" glow="purple" style={styles.promptCard}>
            <View style={styles.questionIconRow}>
              <Text style={styles.questionKicker}>TUZAK SORUSU</Text>
            </View>
            <Text style={styles.promptText}>{question.prompt}</Text>
          </Card>

          {/* STAGE 1: ENTER FAKE ANSWER */}
          {!isGuessPhase ? (
            <View style={styles.stageWrap}>
              {/* Cunning Fox Mascot Banner */}
              <View style={styles.cunningBanner}>
                <MascotFloat floatDistance={5} duration={2200}>
                  <Image
                    source={mascotImages.cunning}
                    style={styles.cunningMascot}
                    resizeMode="contain"
                  />
                </MascotFloat>
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

                </View>
              ) : (
                <PopView delay={80} duration={350}>
                  <Card variant="accent" style={styles.submittedCard}>
                    <CheckCircle2 color={colors.lime} size={32} />
                    <Text style={styles.submittedTitle}>Cevabın Havuzda Kilitlendi!</Text>
                    <Text style={styles.submittedText}>
                      "{fakeAnswerText}" cevabın gerçek cevapla karıştırılıyor. Diğer oyuncular bekleniyor...
                    </Text>
                  </Card>
                </PopView>
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

              {!fakeAnswerText.trim() && (
                <View style={styles.noFakeNotice}>
                  <Info color={colors.orange} size={16} />
                  <Text style={styles.noFakeNoticeText}>
                    Cevap yazamadığın için bu tur blöf puanı alamazsın, ama doğru cevabı bularak +100 puan kazanabilirsin!
                  </Text>
                </View>
              )}

              <View style={styles.choicesList}>
                {choices.map((choice, idx) => {
                  const letter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][idx] || `${idx + 1}`;
                  const isSelected = selectedChoiceIndex === choice.choiceIndex;
                  const isOwn = !!choice.isOwnFake;

                  return (
                    <StaggerRow key={choice.choiceIndex} index={idx} delay={90}>
                      <Pressable
                        onPress={() => {
                          if (!isOwn) {
                            soundService.play('click');
                            trigger('light');
                            setSelectedChoiceIndex(choice.choiceIndex);
                          }
                        }}
                        disabled={isOwn || submitting}
                        style={({ pressed }) => [
                          styles.choiceCard,
                          isSelected && styles.choiceCardSelected,
                          isOwn && styles.choiceCardOwn,
                          {
                            transform: [
                              { scale: pressed ? 0.99 : 1 },
                            ],
                          },
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
                    </StaggerRow>
                  );
                })}
              </View>

            </View>
          )}
        </ScrollView>
        {isGuessPhase ? (
          <StickyActionBar>
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
            />
          </StickyActionBar>
        ) : !fakeSubmitted ? (
          <StickyActionBar>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button
              label="Sahte Cevabını Kilitle!"
              onPress={handleFakeSubmit}
              variant="orange"
              loading={submitting}
              fullWidth
              icon={<Send color="#FFF" size={18} />}
            />
          </StickyActionBar>
        ) : null}
      </KeyboardAvoidingView>

      {/* Pause Modal */}
      <Modal
        visible={isPaused}
        transparent
        animationType="fade"
        onRequestClose={handleTogglePause}
      >
        <View style={styles.pauseBackdrop}>
          <Card variant="surface" glow="orange" style={styles.pauseModalCard}>
            <View style={styles.pauseHeaderRow}>
              <View style={styles.pauseIconCircle}>
                <Pause color={colors.orange} size={28} />
              </View>
              <Text style={styles.pauseModalTitle}>Oyun Duraklatıldı</Text>
              <Text style={styles.pauseModalSubtitle}>
                Süre durduruldu. Hazır olduğunuzda devam edebilirsiniz.
              </Text>
            </View>

            <View style={styles.pauseInfoBox}>
              <View style={styles.pauseInfoItem}>
                <Text style={styles.pauseInfoLabel}>Mevcut Tur</Text>
                <Text style={styles.pauseInfoValue}>
                  {roomState?.currentRound ?? 1} / {roomState?.config.totalRounds ?? 5}
                </Text>
              </View>
              <View style={styles.pauseInfoDivider} />
              <View style={styles.pauseInfoItem}>
                <Text style={styles.pauseInfoLabel}>Kalan Süre</Text>
                <Text style={styles.pauseInfoValue}>{secondsLeft} sn</Text>
              </View>
            </View>

            <View style={styles.pauseActions}>
              <Button
                label="Oyuna Devam Et"
                onPress={handleTogglePause}
                variant="lime"
                fullWidth
                icon={<Play color="#171026" size={18} fill="#171026" />}
                style={{ marginBottom: 10 }}
              />
              <Button
                label="Lobiden Ayrıl / Çıkış"
                onPress={handleLeaveGame}
                variant="secondary"
                fullWidth
                icon={<LogOut color={colors.textSecondary} size={18} />}
              />
            </View>
          </Card>
        </View>
      </Modal>
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
    paddingBottom: spacing.md,
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
    borderWidth: 2.5,
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
    minWidth: 0,
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
  pauseBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 6, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  pauseModalCard: {
    width: '100%',
    maxWidth: 380,
    padding: spacing.xl,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  pauseHeaderRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pauseIconCircle: {
    width: 60,
    height: 60,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 113, 59, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pauseModalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  pauseModalSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  pauseInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pauseInfoItem: {
    alignItems: 'center',
  },
  pauseInfoLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  pauseInfoValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.orange,
    marginTop: 2,
  },
  pauseInfoDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  pauseActions: {
    width: '100%',
  },
  noFakeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 113, 59, 0.12)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 113, 59, 0.3)',
    padding: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  noFakeNoticeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
});
