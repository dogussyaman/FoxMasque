import type { Question } from '../questions';
import { HAYVANLAR_ALEMI_PART1 } from './hayvanlarAlemiPart1';
import { HAYVANLAR_ALEMI_PART2 } from './hayvanlarAlemiPart2';
import { HAYVANLAR_ALEMI_PART3 } from './hayvanlarAlemiPart3';

export const HAYVANLAR_ALEMI_QUESTIONS: readonly Question[] = [
  ...HAYVANLAR_ALEMI_PART1,
  ...HAYVANLAR_ALEMI_PART2,
  ...HAYVANLAR_ALEMI_PART3,
];
