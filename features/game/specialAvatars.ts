import type { ImageSourcePropType } from 'react-native';

export interface SpecialAvatarItem {
  key: string;
  label: string;
  source: ImageSourcePropType;
}

export const SPECIAL_AVATARS: Record<string, SpecialAvatarItem> = {
  'special:photographer': {
    key: 'special:photographer',
    label: 'Fotoğrafçı',
    source: require('../../assets/ozel_avatar/photographer.png'),
  },
  'special:alien': {
    key: 'special:alien',
    label: 'Uzaylı',
    source: require('../../assets/ozel_avatar/alien.png'),
  },
  'special:pirate': {
    key: 'special:pirate',
    label: 'Korsan',
    source: require('../../assets/ozel_avatar/pirate.png'),
  },
  'special:gorilla': {
    key: 'special:gorilla',
    label: 'Goril',
    source: require('../../assets/ozel_avatar/gorilla.png'),
  },
  'special:gold-woman': {
    key: 'special:gold-woman',
    label: 'Altın Kadın',
    source: require('../../assets/ozel_avatar/gold_woman.png'),
  },
  'special:cute-girl': {
    key: 'special:cute-girl',
    label: 'Sevimli Kız',
    source: require('../../assets/ozel_avatar/cute_girl.png'),
  },
  'special:boy': {
    key: 'special:boy',
    label: 'Genç Çocuk',
    source: require('../../assets/ozel_avatar/boy.png'),
  },
  'special:anime-girl': {
    key: 'special:anime-girl',
    label: 'Anime Kız',
    source: require('../../assets/ozel_avatar/anime_girl.png'),
  },
  'special:gold-girl': {
    key: 'special:gold-girl',
    label: 'Parıltılı Kız',
    source: require('../../assets/ozel_avatar/gold_girl.png'),
  },
  'special:hijab-girl': {
    key: 'special:hijab-girl',
    label: 'Tropik Güzel',
    source: require('../../assets/ozel_avatar/hijab_girl.png'),
  },
  'special:purple-woman': {
    key: 'special:purple-woman',
    label: 'Mor Kadın',
    source: require('../../assets/ozel_avatar/purple_woman.png'),
  },
  'special:pink-white-girl': {
    key: 'special:pink-white-girl',
    label: 'Zarif Kız',
    source: require('../../assets/ozel_avatar/pink_white_girl.png'),
  },
  'special:pink-watercolor': {
    key: 'special:pink-watercolor',
    label: 'Sulu Boya',
    source: require('../../assets/ozel_avatar/pink_watercolor.png'),
  },
  'special:witch': {
    key: 'special:witch',
    label: 'Cadı',
    source: require('../../assets/ozel_avatar/witch.png'),
  },
  'special:abstract': {
    key: 'special:abstract',
    label: 'Soyut Rüya',
    source: require('../../assets/ozel_avatar/abstract.png'),
  },
  'special:yellow-blue-girl': {
    key: 'special:yellow-blue-girl',
    label: 'Mavi Şapkalı',
    source: require('../../assets/ozel_avatar/yellow_blue_girl.png'),
  },
};

export const SPECIAL_AVATAR_KEYS = Object.keys(SPECIAL_AVATARS);

export function getSpecialAvatar(key?: string | null): SpecialAvatarItem | null {
  if (!key) return null;
  return SPECIAL_AVATARS[key] ?? null;
}

export function isSpecialAvatar(key?: string | null): boolean {
  if (!key) return false;
  return key in SPECIAL_AVATARS;
}
