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
    name: 'Dünya Tarihi',
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
    name: 'Genel Kültür',
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
    name: 'Film ve Dizi',
    emoji: '🎬',
    description: 'Kült filmler, popüler diziler ve unutulmaz sahneler.',
    gradient: ['#B45309', '#F59E0B'],
    accent: '#F59E0B',
  },
] as const;

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
