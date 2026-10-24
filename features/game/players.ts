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

export const DICEBEAR_STYLES = ['lorelei', 'adventurer', 'bottts', 'fun-emoji', 'fashion', 'streetwear'] as const;
export type DiceBearStyle = (typeof DICEBEAR_STYLES)[number];

export function createDiceBearAvatarKey(style: DiceBearStyle, seed: string): string {
  return `db:${style}:${seed}`;
}

export const DICEBEAR_AVATAR_KEYS = DICEBEAR_STYLES.flatMap((style) =>
  Array.from({ length: 16 }, (_, index) =>
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

function customPortraitSvg(seed: string, style: 'fashion' | 'streetwear'): string {
  const pick = <T,>(items: readonly T[], salt: number): T => {
    const hash = Number.parseInt(hashSeed(seed, salt), 36) || 0;
    return items[hash % items.length];
  };
  const skin = pick(['#F7D7C5', '#D9A17E', '#A86D50', '#F0C2A0', '#754833', '#E7B48F'] as const, 2166136261);
  const hair = pick(['#211B2B', '#513126', '#D8A13D', '#A73555', '#BFC8D7', '#E8D6B5', '#3D627A', '#754B91'] as const, 2246822519);
  const outfit = pick(['#FF4F9A', '#8057F5', '#21A6A1', '#FF784F', '#20243B', '#E0A72E', '#4E86E8', '#E8E9F4'] as const, 3266489917);
  const backdrop = pick(['#FCE7F3', '#EDE9FE', '#DBF4F0', '#FFE8D9', '#DCEBFF', '#F4E8D5'] as const, 668265263);
  const eye = pick(['#30243B', '#386A79', '#5B7549', '#6B4432'] as const, 374761393);
  const hairShape = style === 'fashion'
    ? '<path d="M24 65 Q14 18 64 13 Q113 16 104 69 L99 99 L83 76 L42 79 L28 100 Z" fill="' + hair + '"/>'
    : '<path d="M24 56 Q21 19 64 18 Q105 18 104 57 L100 87 L86 70 L42 72 L28 88 Z" fill="' + hair + '"/>';
  const fringe = style === 'fashion'
    ? '<path d="M26 49 Q34 20 64 27 Q87 18 101 48 Q79 39 66 45 Q44 36 26 49 Z" fill="' + hair + '"/><path d="M83 26 Q103 40 96 67" fill="none" stroke="' + hair + '" stroke-width="7" stroke-linecap="round"/>'
    : '<path d="M28 47 Q34 23 62 27 Q82 20 100 43 L89 39 L78 47 L65 36 L50 47 L40 40 Z" fill="' + hair + '"/><path d="M88 31 L96 54" stroke="' + hair + '" stroke-width="6" stroke-linecap="round"/>';
  const accessory = style === 'fashion'
    ? '<circle cx="31" cy="68" r="4" fill="#FFD166"/><circle cx="97" cy="68" r="4" fill="#FFD166"/><path d="M42 91 Q64 101 86 91" fill="none" stroke="#E98B9B" stroke-width="2" stroke-linecap="round"/><path d="M94 24 l3 -6 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 Z" fill="#FFF5B8"/>'
    : '<path d="M18 52 Q13 29 31 27" fill="none" stroke="#25243A" stroke-width="5" stroke-linecap="round"/><path d="M97 27 Q115 31 110 52" fill="none" stroke="#25243A" stroke-width="5" stroke-linecap="round"/><path d="M27 30 Q64 9 101 30 L97 39 L31 39 Z" fill="' + outfit + '"/><path d="M38 31 Q64 22 90 31" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".7"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="64" fill="${backdrop}"/>
    <circle cx="103" cy="23" r="13" fill="#FFFFFF" opacity=".42"/>
    <path d="M13 128 Q17 91 43 87 L85 87 Q111 93 115 128 Z" fill="${outfit}"/>
    <path d="M49 84 L64 100 L79 84" fill="#FFFFFF" opacity=".85"/>
    ${hairShape}
    <path d="M42 76 L42 92 Q64 106 86 92 L86 76 Z" fill="${skin}"/>
    <ellipse cx="64" cy="58" rx="34" ry="39" fill="${skin}"/>
    <ellipse cx="29" cy="63" rx="5" ry="9" fill="${skin}"/>
    <ellipse cx="99" cy="63" rx="5" ry="9" fill="${skin}"/>
    <path d="M43 54 Q49 50 55 54" stroke="${hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M73 54 Q79 50 85 54" stroke="${hair}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="49" cy="60" rx="4" ry="5" fill="${eye}"/>
    <ellipse cx="79" cy="60" rx="4" ry="5" fill="${eye}"/>
    <circle cx="50" cy="58" r="1.4" fill="#FFFFFF"/>
    <circle cx="80" cy="58" r="1.4" fill="#FFFFFF"/>
    <path d="M63 62 L59 73 Q64 76 68 73" fill="none" stroke="#C18A78" stroke-width="2" stroke-linecap="round"/>
    <path d="M53 81 Q64 88 75 81 Q64 94 53 81 Z" fill="${style === 'fashion' ? '#D94E79' : '#9C5361'}"/>
    <circle cx="43" cy="72" r="5" fill="#F08B98" opacity=".45"/>
    <circle cx="85" cy="72" r="5" fill="#F08B98" opacity=".45"/>
    ${fringe}
    ${accessory}
    <path d="M53 104 L64 115 L75 104" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".8"/>
  </svg>`;
}

const avatarSvgCache = new Map<string, string>();
const MAX_CACHED_AVATARS = 128;

export function diceBearAvatarSvg(key: string): string | null {
  const cached = avatarSvgCache.get(key);
  if (cached) return cached;

  let svg: string | null = null;
  const selection = /^db:(lorelei|bottts|adventurer|fun-emoji|fashion|streetwear):([a-zA-Z0-9_-]{1,80})$/.exec(key);
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
      case 'fun-emoji':
        svg = createAvatar(funEmoji, { seed }).toString();
        break;
      case 'fashion':
      case 'streetwear':
        svg = customPortraitSvg(seed, selection[1] as 'fashion' | 'streetwear');
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
