import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Check, Sparkles, BookOpen } from 'lucide-react-native';
import { Screen, Button, Badge } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { CATEGORIES, type CategoryId } from '@/features/game/categories';
import { questionsForCategory } from '@/features/game/questions';

export default function CategorySelectScreen() {
  const { trigger } = useHaptics();
  const [selectedCats, setSelectedCats] = useState<CategoryId[]>(CATEGORIES.map((c) => c.id));
  const [activePreviewCat, setActivePreviewCat] = useState<CategoryId>('genel-kultur');

  const toggleCat = (id: CategoryId) => {
    trigger('light');
    if (selectedCats.includes(id)) {
      if (selectedCats.length <= 1) return;
      setSelectedCats(selectedCats.filter((c) => c !== id));
    } else {
      setSelectedCats([...selectedCats, id]);
    }
  };

  const previewQuestions = questionsForCategory(activePreviewCat);

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={colors.textPrimary} size={24} />
        </Pressable>
        <Text style={styles.screenTitle}>Kategoriler</Text>
        <Badge tone="purple">{selectedCats.length} Seçili</Badge>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Oyunda hangi alanlardan sorular çıkacağını belirle ve örnek soruları incele.
        </Text>

        {/* Categories Grid */}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCats.includes(cat.id);
            const isPreviewing = activePreviewCat === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  toggleCat(cat.id);
                  setActivePreviewCat(cat.id);
                }}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                  isPreviewing && styles.cardPreviewing,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.emoji}>{cat.emoji}</Text>
                  {isSelected && (
                    <View style={styles.checkWrap}>
                      <Check color="#FFF" size={14} />
                    </View>
                  )}
                </View>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catDesc} numberOfLines={2}>
                  {cat.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Sample Questions Drawer */}
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <BookOpen color={colors.purpleSoft} size={18} />
            <Text style={styles.previewTitle}>Örnek Sorular: {CATEGORIES.find((c) => c.id === activePreviewCat)?.name}</Text>
          </View>

          {previewQuestions.slice(0, 3).map((q, idx) => (
            <View key={q.id} style={styles.questionItem}>
              <Text style={styles.questionIndex}>Soru {idx + 1}</Text>
              <Text style={styles.questionPrompt}>{q.prompt}</Text>
              <View style={styles.optionsWrap}>
                {q.options.map((opt, optIdx) => (
                  <View
                    key={opt}
                    style={[
                      styles.optBadge,
                      optIdx === q.correctIndex && styles.optBadgeCorrect,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optText,
                        optIdx === q.correctIndex && styles.optTextCorrect,
                      ]}
                    >
                      {opt} {optIdx === q.correctIndex ? '✓' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <Button
          label="Seçimleri Kaydet"
          onPress={() => {
            trigger('medium');
            router.back();
          }}
          variant="primary"
          fullWidth
          icon={<Sparkles color="#FFF" size={20} />}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.bgSurfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginVertical: spacing.sm,
  },
  scroll: {
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: spacing.md,
  },
  card: {
    width: '48%',
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.purpleSoft,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  cardPreviewing: {
    borderWidth: 2,
    borderColor: colors.purple,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 26,
  },
  checkWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  catDesc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  previewSection: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  previewTitle: {
    ...typography.bodyMedium,
    color: colors.purpleSoft,
  },
  questionItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  questionIndex: {
    ...typography.caption,
    color: colors.textMuted,
  },
  questionPrompt: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginVertical: 4,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  optBadge: {
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  optBadgeCorrect: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: colors.success,
  },
  optText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  optTextCorrect: {
    color: colors.success,
    fontFamily: 'Poppins-SemiBold',
  },
});
