export const categoryImages = {
  'genel-kultur': require('./cat_genel_kultur.jpg'),
  'osmanli-donemi': require('./cat_osmanli.jpg'),
  'dunya-tarihi': require('./cat_history.jpg'),
  'cografya': require('./cat_geography.jpg'),
  'hayvanlar-alem': require('./cat_animals.jpg'),
  'film-ve-dizi': require('./cat_cinema.jpg'),
} as const;

export type CategoryImageKey = keyof typeof categoryImages;
