export type AbilityId = 'block' | 'shield' | 'penalty' | 'counter';

export interface Ability {
  id: AbilityId;
  name: string;
  emoji: string;
  description: string;
  targetRequired: boolean;
  unlockRule: string;
}

export const ABILITIES: readonly Ability[] = [
  {
    id: 'block',
    name: 'Bloklama',
    emoji: '🛑',
    description: 'Hedef rakip bu tur sahte cevap yazamaz ama gerçek cevabı seçebilir. Art arda aynı hedefe uygulanamaz.',
    targetRequired: true,
    unlockRule: 'Sahte cevabını en az 3 rakip veya rakiplerin yarısından fazlası seçtiğinde açılır.',
  },
  {
    id: 'shield',
    name: 'Koruma Kalkanı',
    emoji: '🛡️',
    description: 'Seni bu tur gelen hedefli bloklama veya ceza yeteneklerine karşı korur. Kullanıldığında harcanır.',
    targetRequired: false,
    unlockRule: 'Arka arkaya 3 soruyu doğru bildiğinde 1 kalkan hakkı kazanırsın.',
  },
  {
    id: 'penalty',
    name: 'Ceza',
    emoji: '⚡',
    description: 'Hedef rakip soruyu bilemezse fazladan -30 puan ceza alır.',
    targetRequired: true,
    unlockRule: 'Özel stratejik hamle.',
  },
  {
    id: 'counter',
    name: 'Karşı Hamle',
    emoji: '🔁',
    description: 'Sana yöneltilen ceza veya saldırı hamlesini tersine çevirir.',
    targetRequired: false,
    unlockRule: 'Özel savunma hamlesi.',
  },
] as const;

export function getAbility(id: AbilityId): Ability {
  return ABILITIES.find((a) => a.id === id) ?? ABILITIES[0];
}

export interface AbilityState {
  playerId: string;
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
  if (id === 'block') {
    if (state.blocksAvailable <= 0) {
      return { allowed: false, reason: 'Bloklama hakkın henüz açılmadı.' };
    }
    if (!targetId) {
      return { allowed: false, reason: 'Bloklamak için bir rakip seçmelisin.' };
    }
    if (targetId === state.playerId) {
      return { allowed: false, reason: 'Kendini bloklayamazsın!' };
    }
    if (state.lastBlockedPlayerId === targetId) {
      return { allowed: false, reason: 'Aynı oyuncuyu arka arkaya iki tur bloklayamazsın.' };
    }
    return { allowed: true };
  }

  if (id === 'shield') {
    if (state.shieldsAvailable <= 0) {
      return { allowed: false, reason: 'Kalkan hakkın henüz açılmadı.' };
    }
    return { allowed: true };
  }

  if (id === 'penalty') {
    if (state.usedCounts.penalty >= 1) {
      return { allowed: false, reason: 'Ceza yeteneği oyun başına maksimum 1 kez kullanılabilir.' };
    }
    if (!targetId) {
      return { allowed: false, reason: 'Ceza vermek için bir rakip seçmelisin.' };
    }
    if (targetId === state.playerId) {
      return { allowed: false, reason: 'Kendine ceza veremezsin!' };
    }
    return { allowed: true };
  }

  if (id === 'counter') {
    if (state.usedCounts.counter >= 1) {
      return { allowed: false, reason: 'Karşı hamle maksimum 1 kez kullanılabilir.' };
    }
    return { allowed: true };
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
