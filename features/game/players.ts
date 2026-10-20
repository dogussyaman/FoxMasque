import type { Player, PlayerId } from '../../types/game';

export const AVATARS = {
  fox: { key: 'fox', emoji: '🦊', gradient: ['#F97316', '#FB923C'] as const },
  panda: { key: 'panda', emoji: '🐼', gradient: ['#3B82F6', '#60A5FA'] as const },
  lion: { key: 'lion', emoji: '🦁', gradient: ['#F59E0B', '#FBBF24'] as const },
  frog: { key: 'frog', emoji: '🐸', gradient: ['#22C55E', '#4ADE80'] as const },
  unicorn: { key: 'unicorn', emoji: '🦄', gradient: ['#A78BFA', '#C4B5FD'] as const },
  owl: { key: 'owl', emoji: '🦉', gradient: ['#8B5CF6', '#A78BFA'] as const },
  tiger: { key: 'tiger', emoji: '🐯', gradient: ['#FB7185', '#F87171'] as const },
  monkey: { key: 'monkey', emoji: '🐵', gradient: ['#FBBF24', '#FCD34D'] as const },
  bear: { key: 'bear', emoji: '🐻', gradient: ['#D97706', '#F59E0B'] as const },
  rabbit: { key: 'rabbit', emoji: '🐰', gradient: ['#F472B6', '#F9A8D4'] as const },
} as const;

export type AvatarKey = keyof typeof AVATARS;

export const AVATAR_KEYS = Object.keys(AVATARS) as AvatarKey[];

export function avatarOf(key: string) {
  return (AVATARS as Record<string, (typeof AVATARS)[AvatarKey]>)[key] ?? AVATARS.fox;
}

export const SAMPLE_PLAYER_NAMES = [
  'Elif',
  'Mert',
  'Zeynep',
  'Can',
  'Asya',
  'Burak',
  'Deniz',
  'Ela',
  'Kerem',
  'Selin',
] as const;

export function makeSamplePlayers(
  count: number,
  hostIndex = 0
): Player[] {
  const players: Player[] = [];
  for (let i = 0; i < Math.min(count, 10); i++) {
    const avatarKey = AVATAR_KEYS[i % AVATAR_KEYS.length];
    players.push({
      id: `sample-${i}`,
      name: SAMPLE_PLAYER_NAMES[i] ?? `Oyuncu ${i + 1}`,
      avatarKey,
      isHost: i === hostIndex,
      isReady: i === 0, // host ready by default
      isOnline: true,
      score: 0,
      abilityUsedCounts: { block: 0, shield: 0, penalty: 0, counter: 0 },
    });
  }
  return players;
}

export function pickAvatarKey(used: string[]): AvatarKey {
  const free = AVATAR_KEYS.filter((k) => !used.includes(k));
  if (free.length) return free[Math.floor(Math.random() * free.length)];
  return AVATAR_KEYS[Math.floor(Math.random() * AVATAR_KEYS.length)];
}
