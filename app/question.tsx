import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Target, Zap, Clock } from 'lucide-react-native';
import { Screen, Button, Card, Badge, Avatar, ProgressBar } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { QUESTIONS, type Question } from '@/features/game/questions';
import { getCategory } from '@/features/game/categories';

export default function QuestionScreen() {
  const { roomCode, roomState, currentPlayer, service } = useGameStore();
  const { trigger } = useHaptics();

  const totalTime = roomState?.config.roundSeconds ?? 15;
  const [secondsLeft, setSecondsLeft] = useState(totalTime);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zartalTargetId, setZartalTargetId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Active question
  const currentQId = roomState?.currentQuestionId || QUESTIONS[0].id;
  const question: Question = QUESTIONS.find((q) => q.id === currentQId) || QUESTIONS[0];
  const category = getCategory(question.categoryId);

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const opponents = playersList.filter((p) => p.id !== me?.id);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleAutoSubmit();
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

  const handleSelectOption = (idx: number) => {
    trigger('light');
    setSelectedIndex(idx);
  };

  const handleSelectZartalTarget = (id: string) => {
    trigger('light');
    setZartalTargetId((prev) => (prev === id ? null : id));
  };

  const handleAutoSubmit = () => {
    if (submitting) return;
    submitCurrentAnswer(selectedIndex ?? -1);
  };

  const handleSubmit = () => {
    if (selectedIndex === null) return;
    trigger('medium');
    submitCurrentAnswer(selectedIndex);
  };

  const submitCurrentAnswer = async (choiceIndex: number) => {
    if (!roomCode || !me || submitting) return;
    setSubmitting(true);
    try {
      await service.submitAnswer(roomCode, {
        playerId: me.id,
        questionId: question.id,
        selectedIndex: choiceIndex,
        zartalTargetId: zartalTargetId || undefined,
      });
      router.replace('/waiting');
    } catch {
      router.replace('/waiting');
    }
  };

  const progressFraction = Math.max(0, secondsLeft / totalTime);

  return (
    <Screen>
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

        {/* Options */}
        <View style={styles.optionsList}>
          {question.options.map((option, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx] || `${idx + 1}`;
            const isSelected = selectedIndex === idx;

            return (
              <Pressable
                key={option}
                onPress={() => handleSelectOption(idx)}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              >
                <View style={[styles.letterCircle, isSelected && styles.letterCircleSelected]}>
                  <Text style={[styles.letterText, isSelected && styles.letterTextSelected]}>
                    {letter}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Zartal Target Selector */}
        {opponents.length > 0 ? (
          <View style={styles.zartalSection}>
            <View style={styles.zartalHeader}>
              <View style={styles.zartalTitleRow}>
                <Zap color={colors.orange} size={18} />
                <Text style={styles.zartalTitle}>Zartala! (Hedef Seç)</Text>
              </View>
              <Text style={styles.zartalHint}>Hedefin yanılırsa +50 puan alırsın</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.opponentsRow}>
              {opponents.map((opp) => {
                const isTarget = zartalTargetId === opp.id;
                return (
                  <Pressable
                    key={opp.id}
                    onPress={() => handleSelectZartalTarget(opp.id)}
                    style={[styles.targetBtn, isTarget && styles.targetBtnActive]}
                  >
                    <Avatar avatarKey={opp.avatarKey} size={38} />
                    <Text style={[styles.targetName, isTarget && styles.targetNameActive]} numberOfLines={1}>
                      {opp.name}
                    </Text>
                    {isTarget && (
                      <View style={styles.targetMark}>
                        <Target color="#FFF" size={12} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Submit Button */}
        <View style={styles.actionWrap}>
          <Button
            label={selectedIndex === null ? 'Lütfen Bir Şık Seç' : 'Cevabı Gönder'}
            onPress={handleSubmit}
            variant="primary"
            disabled={selectedIndex === null || submitting}
            loading={submitting}
            fullWidth
          />
        </View>
      </ScrollView>
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
  optionsList: {
    gap: 10,
    marginBottom: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 14,
  },
  optionCardSelected: {
    borderColor: colors.purpleSoft,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
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
  letterText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  letterTextSelected: {
    color: colors.textOnAccent,
  },
  optionText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: 'Poppins-Bold',
    color: colors.textOnAccent,
  },
  zartalSection: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.sm,
  },
  zartalHeader: {
    marginBottom: 10,
  },
  zartalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zartalTitle: {
    ...typography.caption,
    color: colors.orange,
    fontFamily: 'Poppins-Bold',
  },
  zartalHint: {
    ...typography.small,
    color: colors.textMuted,
    fontSize: 12,
  },
  opponentsRow: {
    gap: 10,
    paddingVertical: 4,
  },
  targetBtn: {
    alignItems: 'center',
    backgroundColor: colors.bgSurfaceAlt,
    padding: 8,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    width: 76,
  },
  targetBtnActive: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
  },
  targetName: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: 4,
    fontSize: 11,
  },
  targetNameActive: {
    color: colors.orange,
    fontFamily: 'Poppins-Bold',
  },
  targetMark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.orange,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionWrap: {
    marginTop: spacing.md,
  },
});
