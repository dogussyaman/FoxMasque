import type { Question } from '../questions';
import { GENEL_KULTUR_PART1 } from './genelKulturPart1';
import { GENEL_KULTUR_PART2 } from './genelKulturPart2';
import { GENEL_KULTUR_PART3 } from './genelKulturPart3';

export const GENEL_KULTUR_QUESTIONS: readonly Question[] = [
  ...GENEL_KULTUR_PART1,
  ...GENEL_KULTUR_PART2,
  ...GENEL_KULTUR_PART3,
];
