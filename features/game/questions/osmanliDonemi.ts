import type { Question } from '../questions';
import { OSMANLI_DONEMI_PART1 } from './osmanliDonemiPart1';
import { OSMANLI_DONEMI_PART2 } from './osmanliDonemiPart2';
import { OSMANLI_DONEMI_PART3 } from './osmanliDonemiPart3';

export const OSMANLI_DONEMI_QUESTIONS: readonly Question[] = [
  ...OSMANLI_DONEMI_PART1,
  ...OSMANLI_DONEMI_PART2,
  ...OSMANLI_DONEMI_PART3,
];
