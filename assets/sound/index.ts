export const soundAssets = {
  click: require('./click.wav'),
  true: require('./true.wav'),
  zartalanma: require('./zartalanma.wav'),
} as const;

export type SoundEffect = keyof typeof soundAssets;
