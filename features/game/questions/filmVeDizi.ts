import type { Question } from '../questions';
import { FILM_VE_DIZI_PART1 } from './filmVeDiziPart1';
import { FILM_VE_DIZI_PART2 } from './filmVeDiziPart2';
import { FILM_VE_DIZI_PART3 } from './filmVeDiziPart3';

export const FILM_VE_DIZI_QUESTIONS: readonly Question[] = [
  ...FILM_VE_DIZI_PART1,
  ...FILM_VE_DIZI_PART2,
  ...FILM_VE_DIZI_PART3,
];
