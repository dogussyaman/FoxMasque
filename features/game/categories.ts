export type CategoryId =
  | 'genel-kultur'
  | 'hayvanlar-alem'
  | 'moda-ve-stil'
  | 'film-ve-dizi'
  | 'muzik'
  | 'yemek-ve-lezzet';

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
    id: 'genel-kultur',
    name: 'Genel Kültür',
    emoji: '🧠',
    description: 'Tarih, coğrafya ve karışık bilgilere dair her şey.',
    gradient: ['#6D28D9', '#8B5CF6'],
    accent: '#8B5CF6',
  },
  {
    id: 'hayvanlar-alem',
    name: 'Hayvanlar Alemi',
    emoji: '🦁',
    description: 'Vahşi doğa, evcil dostlar ve ilginç canlılar.',
    gradient: ['#15803D', '#22C55E'],
    accent: '#22C55E',
  },
  {
    id: 'moda-ve-stil',
    name: 'Moda ve Stil',
    emoji: '👗',
    description: 'Trendler, markalar ve tarz dünyasından sorular.',
    gradient: ['#DB2777', '#F472B6'],
    accent: '#F472B6',
  },
  {
    id: 'film-ve-dizi',
    name: 'Film ve Dizi',
    emoji: '🎬',
    description: 'Sinema, platformlar ve unutulmaz sahneler.',
    gradient: ['#B45309', '#F59E0B'],
    accent: '#F59E0B',
  },
  {
    id: 'muzik',
    name: 'Müzik',
    emoji: '🎤',
    description: 'Sanatçılar, albümler ve ikonik şarkılar.',
    gradient: ['#1D4ED8', '#3B82F6'],
    accent: '#3B82F6',
  },
  {
    id: 'yemek-ve-lezzet',
    name: 'Yemek ve Lezzet',
    emoji: '🍕',
    description: 'Mutfaklar, tarifler ve damak tadı kültürü.',
    gradient: ['#C2410C', '#FB923C'],
    accent: '#FB923C',
  },
] as const;

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}
