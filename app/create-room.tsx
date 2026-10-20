import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, Sparkles, Check, Clock, Layers } from 'lucide-react-native';
import { Screen, Button, Card, Avatar } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { CATEGORIES, type CategoryId } from '@/features/game/categories';
import { AVATAR_KEYS, type AvatarKey } from '@/features/game/players';

const ROUND_OPTIONS = [3, 5, 7, 10];
const TIME_OPTIONS = [10, 15, 20, 30];

export default function CreateRoomScreen() {
  const { service, currentPlayer, setCurrentPlayer, setRoomCode, setRoomState } = useGameStore();
  const { trigger } = useHaptics();

  const [hostName, setHostName] = useState(currentPlayer?.name ?? 'Ev Sahibi');
  const [avatarKey, setAvatarKey] = useState<AvatarKey>((currentPlayer?.avatarKey as AvatarKey) ?? 'fox');
  const [rounds, setRounds] = useState(5);
  const [roundSeconds, setRoundSeconds] = useState(15);
  const [selectedCats, setSelectedCats] = useState<CategoryId[]>(CATEGORIES.map((c) => c.id));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (id: CategoryId) => {
    trigger('light');
    if (selectedCats.includes(id)) {
      if (selectedCats.length <= 1) return; // at least 1 required
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
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={colors.textPrimary} size={24} />
        </Pressable>
        <Text style={styles.screenTitle}>Oda Oluştur</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Host identity */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Profilin</Text>
          <View style={styles.hostRow}>
            <Avatar avatarKey={avatarKey} size={54} />
            <TextInput
              value={hostName}
              onChangeText={setHostName}
              placeholder="İsmin"
              placeholderTextColor={colors.textMuted}
              style={styles.hostInput}
              maxLength={16}
            />
          </View>
        </Card>

        {/* Rounds selector */}
        <Card style={styles.sectionCard}>
          <View style={styles.labelRow}>
            <Layers color={colors.purpleSoft} size={18} />
            <Text style={styles.sectionLabel}>Tur Sayısı</Text>
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
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{r} Tur</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Time limit selector */}
        <Card style={styles.sectionCard}>
          <View style={styles.labelRow}>
            <Clock color={colors.orange} size={18} />
            <Text style={styles.sectionLabel}>Soru Başına Süre</Text>
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
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t} sn</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Category selection */}
        <View style={styles.catHeaderRow}>
          <Text style={styles.sectionTitle}>Kategoriler ({selectedCats.length}/6)</Text>
          <Pressable onPress={selectAllCategories}>
            <Text style={styles.allLink}>Tümünü Seç</Text>
          </Pressable>
        </View>

        <View style={styles.catGrid}>
          {CATEGORIES.map((c) => {
            const isSelected = selectedCats.includes(c.id);
            return (
              <Pressable
                key={c.id}
                onPress={() => toggleCategory(c.id)}
                style={[styles.catCard, isSelected && styles.catCardSelected]}
              >
                <View style={styles.catTopRow}>
                  <Text style={styles.catEmoji}>{c.emoji}</Text>
                  {isSelected ? (
                    <View style={styles.checkCircle}>
                      <Check color="#FFF" size={14} />
                    </View>
                  ) : null}
                </View>
                <Text style={styles.catName}>{c.name}</Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actionBtnWrap}>
          <Button
            label="Lobiye Git"
            onPress={handleCreate}
            variant="primary"
            loading={loading}
            fullWidth
            icon={<Sparkles color="#FFF" size={20} />}
          />
        </View>
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
  scroll: {
    paddingBottom: 40,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: spacing.sm,
  },
  hostInput: {
    flex: 1,
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.bgSurfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purpleSoft,
  },
  chipText: {
    ...typography.small,
    color: colors.textSecondary,
    fontFamily: 'Poppins-Medium',
  },
  chipTextActive: {
    color: colors.textOnAccent,
    fontFamily: 'Poppins-SemiBold',
  },
  catHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  allLink: {
    ...typography.small,
    color: colors.purpleSoft,
    fontFamily: 'Poppins-SemiBold',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.xl,
  },
  catCard: {
    width: '48%',
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catCardSelected: {
    borderColor: colors.purpleSoft,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  catTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catEmoji: {
    fontSize: 24,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    ...typography.small,
    color: colors.textPrimary,
    fontFamily: 'Poppins-SemiBold',
  },
  actionBtnWrap: {
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
