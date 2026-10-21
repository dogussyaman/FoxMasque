import type { ImageSourcePropType } from 'react-native';
import type { CategoryOptionId } from '@/features/game/categories';

export const categoryOptionImages: Record<CategoryOptionId, ImageSourcePropType> = {
  'genel-kultur': require('./genel-kultur.jpg'),
  cografya: require('./cografya.jpg'),
  'hayvanlar-alemi': require('./hayvanlar-alem.jpg'),
  'film-ve-dizi': require('./film-ve-diziler.jpg'),
  'dunya-tarihi': require('./tarih.jpg'),
  'osmanli-donemi': require('./cat_osmanli.jpg'),
};
