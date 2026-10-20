export type AbilityId = 'block' | 'shield' | 'penalty' | 'counter';

export interface Ability {
  id: AbilityId;
  name: string;
  emoji: string;
  description: string;
  maxUses: number;
  targetRequired: boolean;
}

export const ABILITIES: readonly Ability[] = [
  {
    id: 'block',
    name: 'Blok',
    emoji: '🛡️',
    description:
      'Bir rakibin bu turdaki zartal girişimini engeller. Hedef bir oyuncu seç.',
    maxUses: 2,
    targetRequired: true,
  },
  {
    id: 'shield',
    name: 'Kalkan',
    emoji: '🟣',
    description: 'Bu tur boyunca zartalanmaya karşı korur. Hedef gerekmez.',
    maxUses: 2,
    targetRequired: false,
  },
  {
    id: 'penalty',
    name: 'Ceza',
    emoji: '⚡',
    description: 'Hedef rakibe -30 puan ceza uygular (sadece yanlış cevabında).',
    maxUses: 1,
    targetRequired: true,
  },
  {
    id: 'counter',
    name: 'Karşı Hamle',
    emoji: '🔁',
    description:
      'Sana zartal yapan rakibin zartalını geri çevir; saldırgan -40 puan alır.',
    maxUses: 1,
    targetRequired: false,
  },
] as const;

export function getAbility(id: AbilityId): Ability {
  return ABILITIES.find((a) => a.id === id) ?? ABILITIES[0];
}

export interface AbilityState {
  playerId: string;
  usedCounts: Record<AbilityId, number>;
}

export function freshAbilityState(playerId: string): AbilityState {
  return {
    playerId,
    usedCounts: { block: 0, shield: 0, penalty: 0, counter: 0 },
  };
}

export function canUseAbility(state: AbilityState, id: AbilityId): boolean {
  const ability = getAbility(id);
  return state.usedCounts[id] < ability.maxUses;
}

export function applyAbilityUse(
  state: AbilityState,
  id: AbilityId
): AbilityState {
  if (!canUseAbility(state, id)) return state;
  return {
    ...state,
    usedCounts: { ...state.usedCounts, [id]: state.usedCounts[id] + 1 },
  };
}

export function remainingUses(state: AbilityState, id: AbilityId): number {
  const ability = getAbility(id);
  return Math.max(0, ability.maxUses - state.usedCounts[id]);
}

/**
 * Whether a "counter" can fire against an incoming zartal on this player.
 */
export function canCounterZartal(state: AbilityState): boolean {
  return canUseAbility(state, 'counter');
}
