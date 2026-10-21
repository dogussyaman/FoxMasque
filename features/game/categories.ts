export type CategoryId =
  | 'osmanli-donemi'
  | 'dunya-tarihi'
  | 'cografya'
  | 'genel-kultur'
  | 'hayvanlar-alem'
  | 'film-ve-dizi';

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
  description: string;
  gradient: readonly [string, string];
  accent: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  emoji: string;
  questionCategoryId: CategoryId;
}

export interface CategoryGroup {
  id: string;
  name: string;
  emoji: string;
  gradient: readonly [string, string];
  categories: readonly CategoryOption[];
}

export const CATEGORY_GROUPS = [
  {
    id: 'genel-karisik',
    name: 'Genel / Karışık Kategoriler',
    emoji: '✨',
    gradient: ['#6D28D9', '#8B5CF6'],
    categories: [
      { id: 'genel-kultur', name: 'Genel Kültür', emoji: '🧠', questionCategoryId: 'genel-kultur' },
      { id: 'cografya', name: 'Coğrafya', emoji: '🌍', questionCategoryId: 'cografya' },
      { id: 'hayvanlar-alemi', name: 'Hayvanlar Alemi', emoji: '🦁', questionCategoryId: 'hayvanlar-alem' },
    ],
  },
  {
    id: 'dizi-film',
    name: 'Dizi ve Film',
    emoji: '🎬',
    gradient: ['#B45309', '#F59E0B'],
    categories: [
      { id: 'film-ve-dizi', name: 'Film ve Diziler', emoji: '🍿', questionCategoryId: 'film-ve-dizi' },
    ],
  },
  {
    id: 'tarih',
    name: 'Tarih',
    emoji: '🏛️',
    gradient: ['#9A3412', '#EA580C'],
    categories: [
      { id: 'dunya-tarihi', name: 'Tarih', emoji: '🏛️', questionCategoryId: 'dunya-tarihi' },
      { id: 'osmanli-donemi', name: 'Osmanlı Dönemi', emoji: '⚔️', questionCategoryId: 'osmanli-donemi' },
    ],
  },
] as const satisfies readonly CategoryGroup[];

export type CategoryOptionId =
  (typeof CATEGORY_GROUPS)[number]['categories'][number]['id'];

export const CATEGORY_OPTIONS = CATEGORY_GROUPS.flatMap((group) =>
  group.categories.map((category) => ({
    ...category,
    groupId: group.id,
    groupName: group.name,
    groupGradient: group.gradient,
  }))
);

export const CATEGORIES: readonly Category[] = [
  {
    id: 'osmanli-donemi',
    name: 'Osmanlı Dönemi',
    emoji: '⚔️',
    description: 'Padişahlar, fetihler, saray sırları ve imparatorluk tarihi.',
    gradient: ['#4C1D95', '#7C3AED'],
    accent: '#A78BFA',
  },
  {
    id: 'dunya-tarihi',
    name: 'Tarih',
    emoji: '🏛️',
    description: 'Antik medeniyetler, büyük savaşlar ve dönüm noktaları.',
    gradient: ['#9A3412', '#EA580C'],
    accent: '#FB923C',
  },
  {
    id: 'cografya',
    name: 'Coğrafya',
    emoji: '🌍',
    description: 'Ülkeler, başkentler, dağlar, okyanuslar ve keşifler.',
    gradient: ['#047857', '#10B981'],
    accent: '#34D399',
  },
  {
    id: 'genel-kultur',
    name: 'Genel / Karışık Kategoriler',
    emoji: '🧠',
    description: 'Tarih, sanat, şaşırtıcı bilgiler ve zeka soruları.',
    gradient: ['#6D28D9', '#8B5CF6'],
    accent: '#8B5CF6',
  },
  {
    id: 'hayvanlar-alem',
    name: 'Hayvanlar Alemi',
    emoji: '🦁',
    description: 'Vahşi doğa, gizemli canlılar ve hayvanlar dünyası.',
    gradient: ['#15803D', '#22C55E'],
    accent: '#22C55E',
  },
  {
    id: 'film-ve-dizi',
    name: 'Dizi ve Film',
    emoji: '🎬',
    description: 'Kült filmler, popüler diziler ve unutulmaz sahneler.',
    gradient: ['#B45309', '#F59E0B'],
    accent: '#F59E0B',
  },
] as const;

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

export function isCategoryId(id: string): id is CategoryId {
  return CATEGORIES.some((category) => category.id === id);
}
