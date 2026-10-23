import { useTheme, useThemeStyles } from '@/theme/ThemeProvider';
import type { ThemeColors } from '@/theme/ThemeProvider';
import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Check, Sparkles, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Button, Badge, StickyActionBar } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';
import {
  CATEGORY_GROUPS,
  CATEGORY_OPTIONS,
  type CategoryOptionId,
} from '@/features/game/categories';
import { questionsForCategory } from '@/features/game/questions';
import { soundService } from '@/services/soundService';
import { categoryOptionImages } from '@/assets/categories/options';

export default function CategorySelectScreen() {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { trigger } = useHaptics();
  const [selectedCat, setSelectedCat] = useState<CategoryOptionId>('genel-kultur');

  const selectCat = (id: CategoryOptionId) => {
    soundService.play('click');
    trigger('light');
    setSelectedCat(id);
  };

  const currentCategory = CATEGORY_OPTIONS.find((category) => category.id === selectedCat);
  const previewQuestions = questionsForCategory(
    currentCategory?.questionCategoryId ?? 'genel-kultur'
  );

  return (
    <Screen gradient diagonalSlice>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            soundService.play('click');
            router.back();
          }}
          style={styles.backBtn}
        >
          <ChevronLeft color={colors.textPrimary} size={22} />
        </Pressable>
        <Text style={styles.screenTitle} numberOfLines={1}>Kategori Seçimi</Text>
        <Badge tone="orange" sticker>
          1 SEÇİLDİ
        </Badge>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Oyun odasında hangi soru havuzundan oynayacağını belirle. Yalnızca mevcut soruları bulunan kategoriler listelenir.
        </Text>

        {CATEGORY_GROUPS.map((group) => (
          <View key={group.id} style={styles.categoryGroup}>
            <View style={styles.categoryGroupHeading}>
              <Text style={styles.categoryGroupEmoji}>{group.emoji}</Text>
              <Text style={styles.categoryGroupTitle}>{group.name}</Text>
            </View>
            <View style={styles.grid}>
              {group.categories.map((category) => {
                const isSelected = selectedCat === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => selectCat(category.id)}
                    style={({ pressed }) => [
                      styles.card,
                      isSelected && styles.cardSelected,
                      {
                        transform: [
                          { scale: pressed ? 0.98 : 1 },
                        ],
                      },
                    ]}
                  >
                    <ImageBackground
                      source={categoryOptionImages[category.id]}
                      style={styles.cardGradient}
                      imageStyle={styles.categoryImage}
                    >
                      <LinearGradient
                        colors={['rgba(15, 9, 27, 0.2)', 'rgba(15, 9, 27, 0.82)']}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />
                      <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                          <View style={styles.emojiCircle}>
                            <Text style={styles.emoji}>{category.emoji}</Text>
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
                        <Text style={styles.catName} numberOfLines={3}>
                          {category.name}
                        </Text>
                      </View>
                    </ImageBackground>
                    {isSelected && <View pointerEvents="none" style={styles.selectedOutline} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

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
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <StickyActionBar>
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
      </StickyActionBar>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  categoryGroup: {
    marginBottom: spacing.md,
  },
  categoryGroupHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  categoryGroupEmoji: {
    fontSize: 18,
  },
  categoryGroupTitle: {
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    minWidth: 0,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    ...shadows.card,
  },
  cardSelected: {
    borderColor: colors.orange,
    ...shadows.glowOrange,
  },
  cardPreviewing: {
    borderWidth: 2,
    borderColor: colors.yellow,
  },
  cardGradient: {
    flex: 1,
    minHeight: 104,
  },
  categoryImage: {
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  selectedOutline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.xl,
    borderWidth: 2.5,
    borderColor: colors.orange,
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  catName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  catDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
});
