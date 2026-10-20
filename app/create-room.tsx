import { useState } from 'react';
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
import { ChevronLeft, Sparkles, Check, Clock, Layers, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Button, Card, Avatar, Badge } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { CATEGORIES, type CategoryId } from '@/features/game/categories';
import { AVATAR_KEYS, type AvatarKey } from '@/features/game/players';
import { mascotImages } from '@/assets/illustrations';
import { categoryImages } from '@/assets/categories';

const ROUND_OPTIONS = [3, 5, 7, 10];
const TIME_OPTIONS = [10, 15, 20, 30];

export default function CreateRoomScreen() {
  const { service, currentPlayer, setCurrentPlayer, setRoomCode, setRoomState } = useGameStore();
  const { trigger } = useHaptics();

  const [hostName, setHostName] = useState(currentPlayer?.name ?? 'Ev Sahibi');
  const [avatarKey, setAvatarKey] = useState<AvatarKey>((currentPlayer?.avatarKey as AvatarKey) ?? 'fox');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [rounds, setRounds] = useState(5);
  const [roundSeconds, setRoundSeconds] = useState(15);
  const [selectedCats, setSelectedCats] = useState<CategoryId[]>(CATEGORIES.map((c) => c.id));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (id: CategoryId) => {
    trigger('light');
    if (selectedCats.includes(id)) {
      if (selectedCats.length <= 1) return;
      setSelectedCats(selectedCats.filter((c) => c !== id));
    } else {
      setSelectedCats([...selectedCats, id]);
    }
  };

  const selectAllCategories = () => {
    trigger('light');
    setSelectedCats(CATEGORIES.map((c) => c.id));
  };

  const handleCreate = async () => {
    trigger('medium');
    setLoading(true);
    setError(null);
    try {
      const res = await service.createRoom({
        hostName: hostName.trim() || 'Ev Sahibi',
        avatarKey,
        totalRounds: rounds,
        roundSeconds,
        categories: selectedCats,
      });

      setRoomCode(res.code);
      const state = await service.getRoomState(res.code);
      setRoomState(state);
      if (state?.players[res.playerId]) {
        setCurrentPlayer(state.players[res.playerId]);
      }

      router.replace('/lobby');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen gradient diagonalSlice>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={colors.textPrimary} size={22} />
          </Pressable>
          <Text style={styles.screenTitle}>Oda Oluştur</Text>
          <Badge tone="purple" sticker>HOST</Badge>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Card with Host Fox Mascot */}
          <View style={styles.mascotBanner}>
            <View style={styles.mascotBannerContent}>
              <View style={styles.mascotKickerRow}>
                <Flame color={colors.orange} size={14} />
                <Text style={styles.mascotKicker}>OYUNUN PATRONU SENSİN</Text>
              </View>
              <Text style={styles.mascotBannerTitle}>Parti Kurallarını Belirle</Text>
              <Text style={styles.mascotBannerDesc}>
                Tur sayısını, düşünme süresini ayarla ve arkadaşlarını lobide karşıla!
              </Text>
            </View>
            <Image
              source={mascotImages.lobby}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>

          {/* Host identity Card */}
          <Card variant="surface" style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Profilin & Görünüşün</Text>
            <View style={styles.hostRow}>
              <Pressable
                onPress={() => setShowAvatarPicker(!showAvatarPicker)}
                style={styles.avatarButton}
              >
                <Avatar avatarKey={avatarKey} size={54} ring />
                <View style={styles.avatarChangeBadge}>
                  <Text style={styles.avatarChangeText}>Değiştir</Text>
                </View>
              </Pressable>

              <TextInput
                value={hostName}
                onChangeText={setHostName}
                placeholder="Oda Sahibinin İsmi"
                placeholderTextColor={colors.textMuted}
                style={styles.hostInput}
                maxLength={16}
              />
            </View>

            {/* Avatar Picker Drawer */}
            {showAvatarPicker && (
              <View style={styles.avatarPickerRow}>
                {AVATAR_KEYS.map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => {
                      trigger('light');
                      setAvatarKey(k);
                      setShowAvatarPicker(false);
                    }}
                    style={[
                      styles.avatarPickItem,
                      avatarKey === k && styles.avatarPickItemActive,
                    ]}
                  >
                    <Avatar avatarKey={k} size={38} />
                  </Pressable>
                ))}
              </View>
            )}
          </Card>

          {/* Rounds selector */}
          <Card variant="surface" style={styles.sectionCard}>
            <View style={styles.labelRow}>
              <Layers color={colors.purpleSoft} size={18} />
              <Text style={styles.sectionLabel}>Tur Sayısı</Text>
              <Text style={styles.selectedSettingText}>{rounds} Tur</Text>
            </View>
            <View style={styles.optionRow}>
              {ROUND_OPTIONS.map((r) => {
                const active = rounds === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => {
                      trigger('light');
                      setRounds(r);
                    }}
                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                    <Text
                      style={[
                        styles.segmentSub,
                        active && styles.segmentSubActive,
                      ]}
                    >
                      Tur
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Time limit selector */}
          <Card variant="surface" style={styles.sectionCard}>
            <View style={styles.labelRow}>
              <Clock color={colors.orange} size={18} />
              <Text style={styles.sectionLabel}>Cevap Süresi</Text>
              <Text style={styles.selectedSettingText}>{roundSeconds} sn</Text>
            </View>
            <View style={styles.optionRow}>
              {TIME_OPTIONS.map((t) => {
                const active = roundSeconds === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      trigger('light');
                      setRoundSeconds(t);
                    }}
                    style={[styles.segmentBtn, active && styles.segmentBtnActiveTime]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                    <Text
                      style={[
                        styles.segmentSub,
                        active && styles.segmentSubActive,
                      ]}
                    >
                      sn
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Category selection */}
          <View style={styles.catHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionTitle}>Kategoriler</Text>
              <Badge tone="yellow">{selectedCats.length} Seçili</Badge>
            </View>
            <Pressable onPress={selectAllCategories}>
              <Text style={styles.allLink}>Tümünü Aç</Text>
            </Pressable>
          </View>

          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => {
              const isSelected = selectedCats.includes(c.id);
              const bgImage = categoryImages[c.id];
              return (
                <Pressable
                  key={c.id}
                  onPress={() => toggleCategory(c.id)}
                  style={({ pressed }) => [
                    styles.catCard,
                    isSelected && styles.catCardSelected,
                    { transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                >
                  {bgImage ? (
                    <Image
                      source={bgImage}
                      style={styles.catCardBgImage}
                      resizeMode="cover"
                    />
                  ) : null}

                  <LinearGradient
                    colors={
                      isSelected
                        ? ['rgba(23, 16, 38, 0.45)', 'rgba(32, 16, 59, 0.85)', c.gradient[0] + 'F2']
                        : ['rgba(15, 10, 26, 0.60)', 'rgba(23, 16, 38, 0.88)', 'rgba(32, 16, 59, 0.96)']
                    }
                    style={styles.catCardGradient}
                  >
                    <View style={styles.catTopRow}>
                      <Text style={styles.catEmoji}>{c.emoji}</Text>
                      <View
                        style={[
                          styles.checkCircle,
                          isSelected ? styles.checkCircleActive : styles.checkCircleInactive,
                        ]}
                      >
                        {isSelected && <Check color="#171026" size={13} strokeWidth={3} />}
                      </View>
                    </View>
                    <Text style={styles.catName} numberOfLines={1}>{c.name}</Text>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Bottom CTA */}
          <View style={styles.actionBtnWrap}>
            <Button
              label="Odayı Kur & Lobiye Geç"
              onPress={handleCreate}
              variant="orange"
              loading={loading}
              fullWidth
              icon={<Sparkles color="#FFF" size={20} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
  },
  scroll: {
    paddingBottom: 48,
  },
  mascotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  mascotBannerContent: {
    flex: 1.2,
    paddingRight: 6,
  },
  mascotKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  mascotKicker: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: colors.orange,
    letterSpacing: 0.6,
  },
  mascotBannerTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  mascotBannerDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mascotImage: {
    width: 82,
    height: 82,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
    flex: 1,
  },
  selectedSettingText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: colors.orange,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: spacing.xs,
  },
  avatarButton: {
    alignItems: 'center',
  },
  avatarChangeBadge: {
    marginTop: 4,
  },
  avatarChangeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: colors.orange,
  },
  avatarPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  avatarPickItem: {
    padding: 2,
    borderRadius: 24,
  },
  avatarPickItemActive: {
    borderWidth: 2,
    borderColor: colors.orange,
  },
  hostInput: {
    flex: 1,
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.bgSurfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: colors.purple,
    borderColor: '#A78BFA',
    borderBottomWidth: 3.5,
    borderBottomColor: '#7C3AED',
    ...shadows.glow,
  },
  segmentBtnActiveTime: {
    backgroundColor: colors.orange,
    borderColor: '#FFA07A',
    borderBottomWidth: 3.5,
    borderBottomColor: '#D9480F',
    ...shadows.glowOrange,
  },
  segmentText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFF',
  },
  segmentSub: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: colors.textMuted,
    marginTop: -2,
  },
  segmentSubActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  catHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  allLink: {
    ...typography.small,
    color: colors.orange,
    fontFamily: 'Poppins-Bold',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.lg,
  },
  catCard: {
    width: '48%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
    backgroundColor: colors.bgCard,
    ...shadows.card,
  },
  catCardSelected: {
    borderColor: colors.orange,
    borderWidth: 2,
    ...shadows.glowOrange,
  },
  catCardBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.38,
  },
  catCardGradient: {
    padding: spacing.md,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  catTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catEmoji: {
    fontSize: 20,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: colors.lime,
  },
  checkCircleInactive: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  catName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#FFF',
  },
  actionBtnWrap: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
});
