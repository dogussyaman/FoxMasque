import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Shield, Sparkles, ChevronRight, Check } from 'lucide-react-native';
import { Screen, Button, Card, Badge, Avatar } from '@/components/ui';
import { colors, spacing, typography, radii } from '@/theme';
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

  // Transition to question screen once room enters 'question' phase
  useEffect(() => {
    if (roomState?.phase === 'question') {
      router.replace('/question');
    }
  }, [roomState?.phase]);

  const playersList = roomState ? Object.values(roomState.players) : [];
  const me = playersList.find((p) => p.id === currentPlayer?.id) || currentPlayer;
  const opponents = playersList.filter((p) => p.id !== me?.id);

  const abilityState = {
    playerId: me?.id ?? '',
    usedCounts: me?.abilityUsedCounts ?? { block: 0, shield: 0, penalty: 0, counter: 0 },
  };

  const handleSelectAbility = (id: AbilityId) => {
    if (!canUseAbility(abilityState, id)) {
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

      // In demo mode or if host, advance phase to 'question'
      await service.advancePhase(roomCode);
    } catch {
      // fallback advance
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
    <Screen>
      <View style={styles.header}>
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>
            Tur {roomState?.currentRound ?? 1} / {roomState?.config.totalRounds ?? 5}
          </Text>
        </View>
        <Text style={styles.screenTitle}>Strateji & Yetenek</Text>
        <Text style={styles.subtitle}>
          Bu tur için gizli bir savunma veya saldırı hamlesi seç ya da yeteneğini sonraya sakla.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.abilitiesList}>
          {ABILITIES.map((ab) => {
            const available = canUseAbility(abilityState, ab.id);
            const left = remainingUses(abilityState, ab.id);
            const isSelected = selectedAbility === ab.id;

            return (
              <Pressable
                key={ab.id}
                onPress={() => handleSelectAbility(ab.id)}
                disabled={!available || confirmed}
                style={[
                  styles.abilityCard,
                  isSelected && styles.abilityCardSelected,
                  !available && styles.abilityCardDisabled,
                ]}
              >
                <View style={styles.abilityTopRow}>
                  <View style={styles.nameRow}>
                    <Text style={styles.emoji}>{ab.emoji}</Text>
                    <Text style={styles.name}>{ab.name}</Text>
                  </View>
                  <Badge tone={available ? (isSelected ? 'purple' : 'neutral') : 'danger'}>
                    {available ? `${left} Hak Kaldı` : 'Tükendi'}
                  </Badge>
                </View>
                <Text style={styles.desc}>{ab.description}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Target selection if needed */}
        {selectedAbility && currentAbilityObj?.targetRequired && opponents.length > 0 ? (
          <View style={styles.targetSection}>
            <Text style={styles.targetTitle}>Kimi Hedefliyorsun?</Text>
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
                    <Avatar avatarKey={opp.avatarKey} size={36} />
                    <Text style={[styles.targetName, isTarget && styles.targetNameActive]}>
                      {opp.name}
                    </Text>
                    {isTarget && <Check color="#FFF" size={14} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.actionWrap}>
          <Button
            label={
              selectedAbility
                ? `${currentAbilityObj?.name} ile Onayla`
                : 'Yetenek Kullanmadan Devam Et'
            }
            onPress={selectedAbility ? handleConfirm : handleSkip}
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
  header: {
    paddingVertical: 12,
  },
  roundBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: 6,
  },
  roundText: {
    ...typography.caption,
    color: colors.purpleSoft,
    fontFamily: 'Poppins-SemiBold',
  },
  screenTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 4,
  },
  scroll: {
    paddingBottom: 40,
  },
  abilitiesList: {
    gap: 12,
    marginVertical: spacing.md,
  },
  abilityCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  abilityCardSelected: {
    borderColor: colors.purpleSoft,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
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
  targetSection: {
    marginTop: spacing.md,
    backgroundColor: colors.bgSurfaceAlt,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  targetTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'Poppins-SemiBold',
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
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetChipActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purpleSoft,
  },
  targetName: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  targetNameActive: {
    color: colors.textOnAccent,
    fontFamily: 'Poppins-SemiBold',
  },
  actionWrap: {
    marginTop: spacing.xl,
  },
});
