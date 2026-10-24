export type AbilityId = 'block' | 'shield' | 'penalty' | 'counter';

export interface Ability {
  id: AbilityId;
  name: string;
  emoji: string;
  description: string;
  targetRequired: boolean;
  unlockRule: string;
  creditCost: number;
}

export const ABILITIES: readonly Ability[] = [
  {
    id: 'block',
    name: 'Bloklama',
    emoji: '🛑',
    description: 'Hedef rakip bu tur sahte cevap yazamaz ama gerçek cevabı seçebilir. Aynı hedef art arda bloklanamaz.',
    targetRequired: true,
    creditCost: 1,
    unlockRule: 'Bu tur kullanmak için 1 kredi harcanır.',
  },
  {
    id: 'shield',
    name: 'Koruma Kalkanı',
    emoji: '🛡️',
    description: 'Seni bu tur bloklamaya karşı korur. Kullanıldığında harcanır.',
    targetRequired: false,
    creditCost: 1,
    unlockRule: 'Bu tur kullanmak için 1 kredi harcanır.',
  },
] as const;

export function getAbility(id: AbilityId): Ability {
  return ABILITIES.find((a) => a.id === id) ?? ABILITIES[0];
}

export interface AbilityState {
  playerId: string;
  credits: number;
  usedCounts: Record<AbilityId, number>;
  shieldsAvailable: number;
  blocksAvailable: number;
  isBlockedCurrentRound: boolean;
  isBlockedNextRound: boolean;
  lastBlockedPlayerId?: string | null;
}

export function freshAbilityState(playerId: string): AbilityState {
  return {
    playerId,
    credits: 0,
    usedCounts: { block: 0, shield: 0, penalty: 0, counter: 0 },
    shieldsAvailable: 0,
    blocksAvailable: 0,
    isBlockedCurrentRound: false,
    isBlockedNextRound: false,
    lastBlockedPlayerId: null,
  };
}

export function canUseAbility(
  state: AbilityState,
  id: AbilityId,
  targetId?: string
): { allowed: boolean; reason?: string } {
  if (id !== 'block' && id !== 'shield') {
    return { allowed: false, reason: 'Bu yetenek kredi mağazasından kaldırıldı.' };
  }

  const cost = id === 'block' || id === 'shield' ? 1 : 0;
  if (state.credits < cost) {
    return { allowed: false, reason: `Yetersiz kredi. Bu hamle ${cost} kredi gerektiriyor.` };
  }

  if (id === 'block') {
    if (!targetId) {
      return { allowed: false, reason: 'Bloklamak için bir rakip seçmelisin.' };
    }
    if (targetId === state.playerId) {
      return { allowed: false, reason: 'Kendini bloklayamazsın!' };
    }
    if (state.lastBlockedPlayerId === targetId) {
      return { allowed: false, reason: 'Aynı oyuncuyu art arda iki tur bloklayamazsın.' };
    }
  }
  return { allowed: true };
}

export function remainingUses(state: Partial<AbilityState>, id: AbilityId): number {
  if (id === 'shield') return state.shieldsAvailable ?? 0;
  if (id === 'block') return state.blocksAvailable ?? 0;
  if (id === 'penalty') return Math.max(0, 1 - (state.usedCounts?.penalty ?? 0));
  if (id === 'counter') return Math.max(0, 1 - (state.usedCounts?.counter ?? 0));
  return 0;
}
