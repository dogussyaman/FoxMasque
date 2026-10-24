import { AVATARS } from './players';
import { SPECIAL_AVATARS } from './specialAvatars';

export interface PresetCharacterIdentity {
  avatarKey: string;
  displayName: string;
  avatarLabel: string;
}

const ANIMAL_CHARACTERS: Record<string, { displayName: string; avatarLabel: string }> = {
  fox: { displayName: 'Tilki Reis', avatarLabel: 'Tilki' },
  panda: { displayName: 'Panda Pati', avatarLabel: 'Panda' },
  lion: { displayName: 'Aslan Kral', avatarLabel: 'Aslan' },
  frog: { displayName: 'Kurbağa Kıpır', avatarLabel: 'Kurbağa' },
  unicorn: { displayName: 'Unicorn Nila', avatarLabel: 'Unicorn' },
  owl: { displayName: 'Baykuş Bilge', avatarLabel: 'Baykuş' },
  tiger: { displayName: 'Kaplan Pusu', avatarLabel: 'Kaplan' },
  monkey: { displayName: 'Maymun Muzo', avatarLabel: 'Maymun' },
  bear: { displayName: 'Ayı Badi', avatarLabel: 'Ayı' },
  rabbit: { displayName: 'Tavşan Zıpır', avatarLabel: 'Tavşan' },
};

const SPECIAL_CHARACTERS: Record<string, string> = {
  'special:photographer': 'Lens Avcısı',
  'special:alien': 'Uzaylı Zeno',
  'special:pirate': 'Kaptan Kara',
  'special:gorilla': 'Gogo',
  'special:gold-woman': 'Altın Diva',
  'special:cute-girl': 'Papatya',
  'special:boy': 'Mert Vites',
  'special:anime-girl': 'Hikari',
  'special:gold-girl': 'Aurora',
  'special:hijab-girl': 'Ayla',
  'special:purple-woman': 'Violet',
  'special:pink-white-girl': 'Lalin',
  'special:pink-watercolor': 'Pembe Bulut',
  'special:witch': 'Gece Cadısı',
  'special:abstract': 'Soyut Rüya',
  'special:yellow-blue-girl': 'Maviş',
};

const DICEBEAR_CHARACTER_NAMES: Record<string, readonly string[]> = {
  lorelei: ['Ada', 'Alara', 'Arya', 'Defne', 'Duru', 'Eylül', 'İdil', 'Lara', 'Luna', 'Mina', 'Mira', 'Narin', 'Nova', 'Peri', 'Rüya', 'Vera'],
  adventurer: ['Aras', 'Atlas', 'Baran', 'Bora', 'Demir', 'Doruk', 'Efe', 'Kaan', 'Kuzey', 'Mert', 'Poyraz', 'Rüzgar', 'Sarp', 'Toprak', 'Yiğit', 'Yaman'],
  bottts: ['Bitron', 'Byte', 'Circuit', 'Glitch', 'Hexa', 'Krom', 'Metrix', 'Nano', 'Neo', 'Oniks', 'Pixel', 'Robo', 'Tekno', 'Volt', 'Zeta', 'Astro'],
  'fun-emoji': ['Badem', 'Bonbon', 'Bıcır', 'Ceviz', 'Cingöz', 'Fındık', 'Fıstık', 'Gofret', 'Köpük', 'Lokum', 'Mırmır', 'Minnoş', 'Pofuduk', 'Ponçik', 'Pıtırcık', 'Tospik'],
  fashion: ['Alin', 'Bella', 'Beren', 'Coco', 'Ece', 'Ela', 'İnci', 'Jade', 'Lola', 'Melis', 'Neva', 'Paris', 'Roxy', 'Sera', 'Stella', 'Yasmin'],
  streetwear: ['Akım', 'Baskı', 'Duman', 'Frekans', 'Flow', 'Graffiti', 'Hype', 'Jet', 'Kobra', 'Kicks', 'Neon', 'Rebel', 'Riff', 'Rota', 'Skate', 'Vandal'],
};

function stableIndex(value: string, length: number): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  }
  return (hash >>> 0) % length;
}

/**
 * Maps each shipped avatar to a stable in-game character name.
 * These are display identities, not shared login credentials or email accounts.
 */
export function getPresetCharacterIdentity(avatarKey: string): PresetCharacterIdentity {
  const animal = ANIMAL_CHARACTERS[avatarKey];
  if (animal && avatarKey in AVATARS) {
    return { avatarKey, displayName: animal.displayName, avatarLabel: animal.avatarLabel };
  }

  const specialName = SPECIAL_CHARACTERS[avatarKey];
  if (specialName && avatarKey in SPECIAL_AVATARS) {
    return {
      avatarKey,
      displayName: specialName,
      avatarLabel: SPECIAL_AVATARS[avatarKey].label,
    };
  }

  const diceBearMatch = /^db:(lorelei|adventurer|bottts|fun-emoji|fashion|streetwear):([a-zA-Z0-9_-]{1,80})$/.exec(avatarKey);
  if (diceBearMatch) {
    const style = diceBearMatch[1];
    const seed = diceBearMatch[2];
    const names = DICEBEAR_CHARACTER_NAMES[style];
    const numberedSeed = /(?:^|-)foxmasque-(\d{2})$/.exec(seed);
    const index = numberedSeed
      ? (Number(numberedSeed[1]) - 1 + names.length) % names.length
      : stableIndex(seed, names.length);
    const styleLabels: Record<string, string> = {
      lorelei: 'Portre',
      adventurer: 'Maceracı',
      bottts: 'Robot',
      'fun-emoji': 'Emoji',
      fashion: 'Moda',
      streetwear: 'Sokak stili',
    };
    return {
      avatarKey,
      displayName: names[index],
      avatarLabel: styleLabels[style] ?? 'Karakter',
    };
  }

  return {
    avatarKey,
    displayName: 'Kuyruk Misafiri',
    avatarLabel: 'Karakter',
  };
}
