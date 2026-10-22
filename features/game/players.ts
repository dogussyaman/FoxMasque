import type { Player, PlayerId } from '../../types/game';
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import * as bottts from '@dicebear/bottts';
import * as funEmoji from '@dicebear/fun-emoji';
import * as lorelei from '@dicebear/lorelei';

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

export const DICEBEAR_STYLES = ['lorelei', 'bottts', 'adventurer'] as const;
export type DiceBearStyle = (typeof DICEBEAR_STYLES)[number];

export function createDiceBearAvatarKey(style: DiceBearStyle, seed: string): string {
  return `db:${style}:${seed}`;
}

export const DICEBEAR_AVATAR_KEYS = DICEBEAR_STYLES.flatMap((style) =>
  Array.from({ length: 12 }, (_, index) =>
    createDiceBearAvatarKey(style, `foxmasque-${(index + 1).toString().padStart(2, '0')}`)
  )
);

function hashSeed(value: string, initialValue: number): string {
  let hash = initialValue;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function defaultDiceBearAvatarKey(userId?: string | null): string {
  if (!userId) return createDiceBearAvatarKey('lorelei', 'foxmasque-default');
  const seed = `user-${hashSeed(userId, 2166136261)}${hashSeed(userId, 2246822519)}`;
  return createDiceBearAvatarKey('lorelei', seed);
}

export function createRandomDiceBearAvatarKey(style: DiceBearStyle = 'lorelei'): string {
  const seed = `p-${Date.now().toString(36).slice(-6)}-${Math.random().toString(36).slice(2, 8)}`;
  return createDiceBearAvatarKey(style, seed);
}

const avatarSvgCache = new Map<string, string>();
const MAX_CACHED_AVATARS = 128;

export function diceBearAvatarSvg(key: string): string | null {
  const cached = avatarSvgCache.get(key);
  if (cached) return cached;

  let svg: string | null = null;
  const selection = /^db:(lorelei|bottts|adventurer):([a-zA-Z0-9_-]{1,80})$/.exec(key);
  if (selection) {
    const seed = selection[2];
    switch (selection[1] as DiceBearStyle) {
      case 'lorelei':
        svg = createAvatar(lorelei, { seed }).toString();
        break;
      case 'bottts':
        svg = createAvatar(bottts, { seed }).toString();
        break;
      case 'adventurer':
        svg = createAvatar(adventurer, { seed }).toString();
        break;
    }
  } else {
    const legacySelection = /^db-(\d{2})$/.exec(key);
    const index = legacySelection ? Number(legacySelection[1]) : -1;
    if (index >= 0 && index < 36) {
      const options = { seed: `foxmasque-${index + 1}` };
      if (index < 12) svg = createAvatar(adventurer, options).toString();
      else if (index < 24) svg = createAvatar(bottts, options).toString();
      else svg = createAvatar(funEmoji, options).toString();
    }
  }

  if (svg) {
    if (avatarSvgCache.size >= MAX_CACHED_AVATARS) {
      const oldestKey = avatarSvgCache.keys().next().value;
      if (oldestKey) avatarSvgCache.delete(oldestKey);
    }
    avatarSvgCache.set(key, svg);
  }
  return svg;
}

export function avatarOf(key?: string | null) {
  return (AVATARS as Record<string, (typeof AVATARS)[AvatarKey]>)[key ?? ''] ?? AVATARS.fox;
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
      consecutiveCorrect: 0,
      shieldsAvailable: 0,
      blocksAvailable: 0,
      isBlockedCurrentRound: false,
      isBlockedNextRound: false,
      lastBlockedPlayerId: null,
    });
  }
  return players;
}

export function pickAvatarKey(used: string[]): AvatarKey {
  const free = AVATAR_KEYS.filter((k) => !used.includes(k));
  if (free.length) return free[Math.floor(Math.random() * free.length)];
  return AVATAR_KEYS[Math.floor(Math.random() * AVATAR_KEYS.length)];
}
