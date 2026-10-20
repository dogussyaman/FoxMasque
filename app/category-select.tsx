import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Check, Sparkles, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Button, Badge } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';
import { CATEGORIES, type CategoryId } from '@/features/game/categories';
import { questionsForCategory } from '@/features/game/questions';
import { categoryImages } from '@/assets/categories';

export default function CategorySelectScreen() {
  const { trigger } = useHaptics();
  const [selectedCat, setSelectedCat] = useState<CategoryId>('genel-kultur');

  const selectCat = (id: CategoryId) => {
    trigger('light');
    setSelectedCat(id);
  };

  const currentCategory = CATEGORIES.find((c) => c.id === selectedCat);
  const previewQuestions = questionsForCategory(selectedCat);

  return (
    <Screen gradient diagonalSlice>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.screenTitle} numberOfLines={1}>Kategori Seçimi</Text>
        <Badge tone="orange" sticker>
          1 SEÇİLDİ
        </Badge>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Oyun odasında hangi alandan soruların geleceğini belirle. Oynamak istediğin tek kategoriyi seç.
        </Text>

        {/* Categories 2-Column Grid (Single Select) */}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat.id;
            const bgImage = categoryImages[cat.id];
            return (
              <Pressable
                key={cat.id}
                onPress={() => selectCat(cat.id)}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  {
                    transform: [
                      { scale: pressed ? 0.97 : isSelected ? 1.015 : 1 },
                    ],
                  },
                ]}
              >
                {/* Category Background Artwork */}
                {bgImage ? (
                  <Image
                    source={bgImage}
                    style={styles.cardBgImage}
                    resizeMode="cover"
                  />
                ) : null}

                {/* Dark Vignette & Dynamic Gradient Overlay */}
                <LinearGradient
                  colors={
                    isSelected
                      ? ['rgba(23, 16, 38, 0.40)', 'rgba(32, 16, 59, 0.85)', cat.gradient[0] + 'F5']
                      : ['rgba(15, 10, 26, 0.55)', 'rgba(23, 16, 38, 0.85)', 'rgba(32, 16, 59, 0.96)']
                  }
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.emojiCircle,
                        isSelected && {
                          backgroundColor: cat.accent + '33',
                          borderColor: cat.accent,
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <Text style={styles.emoji}>{cat.emoji}</Text>
                    </View>
                    <View
                      style={[
                        styles.checkWrap,
                        isSelected ? styles.checkWrapActive : styles.checkWrapInactive,
                      ]}
                    >
                      {isSelected ? <Check color="#171026" size={14} strokeWidth={3} /> : null}
                    </View>
                  </View>

                  <View style={styles.cardTextWrap}>
                    <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                    <Text style={styles.catDesc} numberOfLines={2}>
                      {cat.description}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        {/* Sample Question Preview Section */}
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <BookOpen color={colors.orange} size={18} />
            <Text style={styles.previewTitle}>
              Örnek Soru: {currentCategory?.name}
            </Text>
          </View>

          {previewQuestions.slice(0, 2).map((q, idx) => (
            <View key={q.id} style={styles.questionItem}>
              <Text style={styles.questionIndex}>Örnek {idx + 1}</Text>
              <Text style={styles.questionPrompt}>{q.prompt}</Text>
              <View style={styles.optionsWrap}>
                <View style={styles.optBadgeCorrect}>
                  <Text style={styles.optTextCorrect}>Gerçek Cevap: {q.options[q.correctIndex]}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Button
          label="Seçimi Kaydet"
          onPress={() => {
            trigger('medium');
            router.back();
          }}
          variant="orange"
          fullWidth
          icon={<Sparkles color="#FFF" size={20} />}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    minHeight: 52,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    fontSize: 13,
    lineHeight: 18,
  },
  scroll: {
    paddingBottom: 48,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
    backgroundColor: colors.bgCard,
    ...shadows.card,
  },
  cardSelected: {
    borderColor: colors.orange,
    borderWidth: 2,
    ...shadows.glowOrange,
  },
  cardPreviewing: {
    borderWidth: 2,
    borderColor: colors.yellow,
  },
  cardBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.42,
  },
  cardGradient: {
    padding: spacing.md,
    minHeight: 135,
    justifyContent: 'space-between',
  },
  cardTextWrap: {
    marginTop: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emojiCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrapActive: {
    backgroundColor: colors.lime,
  },
  checkWrapInactive: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  catName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFF',
  },
  catDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  previewSection: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginVertical: spacing.lg,
    ...shadows.card,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  previewTitle: {
    ...typography.bodyMedium,
    color: colors.orange,
    fontFamily: 'Poppins-Bold',
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
    marginTop: 4,
  },
  optBadgeCorrect: {
    backgroundColor: 'rgba(198, 243, 107, 0.2)',
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.lime,
  },
  optTextCorrect: {
    color: colors.lime,
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
  },
  bottomBar: {
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 247, 240, 0.08)',
  },
});
