export const soundAssets = {
  click: require('./click.wav'),
  true: require('./true.wav'),
  zartalanma: require('./zartalanma.wav'),
  clock: require('./clock.mp3'),
} as const;

export type SoundEffect = keyof typeof soundAssets;
