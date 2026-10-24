import { AVATARS } from './players';

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

const SPECIAL_CHARACTERS: Record<string, { displayName: string; avatarLabel: string }> = {
  'special:photographer': { displayName: 'Lens Avcısı', avatarLabel: 'Fotoğrafçı' },
  'special:alien': { displayName: 'Uzaylı Zeno', avatarLabel: 'Uzaylı' },
  'special:pirate': { displayName: 'Kaptan Kara', avatarLabel: 'Korsan' },
  'special:gorilla': { displayName: 'Gogo', avatarLabel: 'Goril' },
  'special:gold-woman': { displayName: 'Altın Diva', avatarLabel: 'Altın Kadın' },
  'special:cute-girl': { displayName: 'Papatya', avatarLabel: 'Sevimli Kız' },
  'special:boy': { displayName: 'Mert Vites', avatarLabel: 'Genç Çocuk' },
  'special:anime-girl': { displayName: 'Hikari', avatarLabel: 'Anime Kız' },
  'special:gold-girl': { displayName: 'Aurora', avatarLabel: 'Parıltılı Kız' },
  'special:hijab-girl': { displayName: 'Ayla', avatarLabel: 'Tropik Güzel' },
  'special:purple-woman': { displayName: 'Violet', avatarLabel: 'Mor Kadın' },
  'special:pink-white-girl': { displayName: 'Lalin', avatarLabel: 'Zarif Kız' },
  'special:pink-watercolor': { displayName: 'Pembe Bulut', avatarLabel: 'Sulu Boya' },
  'special:witch': { displayName: 'Gece Cadısı', avatarLabel: 'Cadı' },
  'special:abstract': { displayName: 'Soyut Rüya', avatarLabel: 'Soyut Rüya' },
  'special:yellow-blue-girl': { displayName: 'Maviş', avatarLabel: 'Mavi Şapkalı' },
};

export const PRESET_SPECIAL_AVATAR_KEYS = Object.keys(SPECIAL_CHARACTERS);

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

  const special = SPECIAL_CHARACTERS[avatarKey];
  if (special) {
    return { avatarKey, displayName: special.displayName, avatarLabel: special.avatarLabel };
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
