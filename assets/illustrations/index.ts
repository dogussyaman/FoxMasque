export const mascotImages = {
  hero: require('@/assets/illustrations/fox_hero.jpg'),
  cunning: require('@/assets/illustrations/fox_cunning.png'),
  smug: require('@/assets/illustrations/fox_smug.png'),
  shocked: require('@/assets/illustrations/fox_shocked.png'),
  winner: require('@/assets/illustrations/fox_winner.png'),
  lobby: require('@/assets/illustrations/fox_lobby.png'),
  searching: require('@/assets/illustrations/fox_searching.png'),
} as const;

export type MascotMood = keyof typeof mascotImages;
