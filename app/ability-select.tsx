import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Shield, Sparkles, ChevronRight, Check, Zap } from 'lucide-react-native';
import { Screen, Button, Card, Badge, Avatar, StaggerRow } from '@/components/ui';
import { colors, spacing, typography, radii, shadows } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { useHaptics } from '@/hooks/useHaptics';
import { ABILITIES, type AbilityId, canUseAbility, remainingUses } from '@/features/game/abilities';
import type { Player } from '@/types/game';

export default function AbilitySelectScreen() {
  const { roomCode, roomState, currentPlayer, service } = useGameStore();
  const { trigger } = useHaptics();

  const [selectedAbility, setSelectedAbility] = useState<AbilityId | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Transition to question screen once room enters 'fake_answer' or 'question' phase
  useEffect(() => {
    if (roomState?.phase === 'fake_answer' || roomState?.phase === 'guess' || roomState?.phase === 'question') {
      router.replace('/question');
    }
  }, [roomState?.phase]);

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const opponents = playersList.filter((p) => p.id !== me?.id);

  const abilityState = {
    playerId: me?.id ?? '',
    usedCounts: me?.abilityUsedCounts ?? { block: 0, shield: 0, penalty: 0, counter: 0 },
    shieldsAvailable: me?.shieldsAvailable ?? 0,
    blocksAvailable: me?.blocksAvailable ?? 0,
    isBlockedCurrentRound: me?.isBlockedCurrentRound ?? false,
    isBlockedNextRound: me?.isBlockedNextRound ?? false,
    lastBlockedPlayerId: me?.lastBlockedPlayerId ?? null,
  };

  const handleSelectAbility = (id: AbilityId) => {
    const check = canUseAbility(abilityState, id, targetId || undefined);
    if (!check.allowed) {
      trigger('heavy');
      return;
    }
    trigger('light');
    if (selectedAbility === id) {
      setSelectedAbility(null);
      setTargetId(null);
    } else {
      setSelectedAbility(id);
      const ab = ABILITIES.find((a) => a.id === id);
      if (!ab?.targetRequired) {
        setTargetId(null);
      } else if (opponents.length > 0 && !targetId) {
        setTargetId(opponents[0].id);
      }
    }
  };

  const handleConfirm = async () => {
    if (!roomCode || !me) return;
    trigger('medium');
    setLoading(true);
    try {
      if (selectedAbility) {
        await service.useAbility(roomCode, {
          playerId: me.id,
          abilityId: selectedAbility,
          targetId: targetId || undefined,
        });
      }
      setConfirmed(true);

      // Advance phase to 'fake_answer'
      await service.advancePhase(roomCode);
    } catch {
      router.replace('/question');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!roomCode) return;
    trigger('light');
    setConfirmed(true);
    await service.advancePhase(roomCode);
  };

  const currentAbilityObj = ABILITIES.find((a) => a.id === selectedAbility);

  return (
    <Screen gradient diagonalSlice>
      <View style={styles.header}>
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>
            Tur {roomState?.currentRound ?? 1} / {roomState?.config.totalRounds ?? 5}
          </Text>
        </View>
        <Text style={styles.screenTitle}>Strateji & Yetenek</Text>
        <Text style={styles.subtitle}>
          Bu tur için gizli bir hamle seç ya da hakkını sonraki turlara sakla.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.abilitiesList}>
          {ABILITIES.map((ab, idx) => {
            const check = canUseAbility(abilityState, ab.id, targetId || undefined);
            const left = remainingUses(abilityState, ab.id);
            const isSelected = selectedAbility === ab.id;

            return (
              <StaggerRow key={ab.id} index={idx} delay={70}>
                <Pressable
                  onPress={() => handleSelectAbility(ab.id)}
                  disabled={!check.allowed || confirmed}
                  style={({ pressed }) => [
                    styles.abilityCard,
                    isSelected && styles.abilityCardSelected,
                    !check.allowed && styles.abilityCardDisabled,
                    {
                      transform: [
                        { scale: pressed ? 0.98 : isSelected ? 1.015 : 1 },
                      ],
                    },
                  ]}
                >
                  <View style={styles.abilityTopRow}>
                    <View style={styles.nameRow}>
                      <Text style={styles.emoji}>{ab.emoji}</Text>
                      <Text style={styles.name}>{ab.name}</Text>
                    </View>
                    <Badge tone={check.allowed ? (isSelected ? 'orange' : 'lime') : 'neutral'} sticker>
                      {check.allowed ? `${left} HAK` : 'KİLİTLİ'}
                    </Badge>
                  </View>
                  <Text style={styles.desc}>{ab.description}</Text>
                  <Text style={styles.unlockDesc}>🔒 Kural: {ab.unlockRule}</Text>
                </Pressable>
              </StaggerRow>
            );
          })}
        </View>

        {/* Target selection if needed */}
        {selectedAbility && currentAbilityObj?.targetRequired && opponents.length > 0 && (
          <View style={styles.targetSection}>
            <Text style={styles.targetTitle}>KİMİ HEDEFLİYORSUN?</Text>
            <View style={styles.targetsRow}>
              {opponents.map((opp) => {
                const isTarget = targetId === opp.id;
                return (
                  <Pressable
                    key={opp.id}
                    onPress={() => {
                      trigger('light');
                      setTargetId(opp.id);
                    }}
                    style={[styles.targetChip, isTarget && styles.targetChipActive]}
                  >
                    <Avatar avatarKey={opp.avatarKey} size={36} ring={isTarget} />
                    <Text style={[styles.targetName, isTarget && styles.targetNameActive]}>
                      {opp.name}
                    </Text>
                    {isTarget && <Check color="#FFF" size={14} strokeWidth={2.5} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.actionWrap}>
          <Button
            label={
              selectedAbility
                ? `${currentAbilityObj?.name} ile Onayla`
                : 'Yetenek Kullanmadan Devam Et'
            }
            onPress={selectedAbility ? handleConfirm : handleSkip}
            variant={selectedAbility ? 'orange' : 'secondary'}
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
  header: {
    paddingVertical: 10,
  },
  roundBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bgSurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  roundText: {
    ...typography.caption,
    color: colors.orange,
    fontFamily: 'Poppins-Bold',
  },
  screenTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
  scroll: {
    paddingBottom: 48,
  },
  abilitiesList: {
    gap: 12,
    marginVertical: spacing.md,
  },
  abilityCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.card,
  },
  abilityCardSelected: {
    borderColor: colors.orange,
    backgroundColor: 'rgba(255, 113, 59, 0.15)',
    ...shadows.glowOrange,
  },
  abilityCardDisabled: {
    opacity: 0.45,
  },
  abilityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 22,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  desc: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unlockDesc: {
    ...typography.caption,
    color: colors.yellow,
    marginTop: 6,
    fontStyle: 'italic',
  },
  targetSection: {
    marginTop: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  targetTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  targetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.bgSurfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  targetChipActive: {
    backgroundColor: colors.orange,
    borderColor: '#FFA07A',
  },
  targetName: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },
  targetNameActive: {
    color: '#FFF',
  },
  actionWrap: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
});
