import type { CategoryId } from './categories';
import { GENEL_KULTUR_QUESTIONS } from './questions/genelKultur';
import { HAYVANLAR_ALEMI_QUESTIONS } from './questions/hayvanlarAlemi';
import { FILM_VE_DIZI_QUESTIONS } from './questions/filmVeDizi';
import { OSMANLI_DONEMI_QUESTIONS } from './questions/osmanliDonemi';
import { DUNYA_TARIHI_QUESTIONS } from './questions/dunyaTarihi';
import { COGRAFYA_QUESTIONS } from './questions/cografya';

export type QuestionId = string;

export interface Question {
  id: QuestionId;
  categoryId: CategoryId;
  prompt: string;
  correctAnswer?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  subcategory?: string;
  explanation?: string;
  sourceUrl?: string;
  status?: 'draft' | 'approved' | 'archived';
}

export const QUESTIONS: readonly Question[] = [
  ...GENEL_KULTUR_QUESTIONS,
  ...HAYVANLAR_ALEMI_QUESTIONS,
  ...FILM_VE_DIZI_QUESTIONS,
  ...OSMANLI_DONEMI_QUESTIONS,
  ...DUNYA_TARIHI_QUESTIONS,
  ...COGRAFYA_QUESTIONS,
] as const;

export {
  GENEL_KULTUR_QUESTIONS,
  HAYVANLAR_ALEMI_QUESTIONS,
  FILM_VE_DIZI_QUESTIONS,
  OSMANLI_DONEMI_QUESTIONS,
  DUNYA_TARIHI_QUESTIONS,
  COGRAFYA_QUESTIONS,
};

export function questionsForCategory(
  categoryId: CategoryId
): Question[] {
  return QUESTIONS.filter((q) => q.categoryId === categoryId);
}

export function pickQuestions(
  categoryIds: readonly CategoryId[],
  count: number,
  seed = 1,
  excludedQuestionIds: readonly QuestionId[] = []
): Question[] {
  const excluded = new Set(excludedQuestionIds);
  const pool = QUESTIONS.filter((q) =>
    categoryIds.includes(q.categoryId) && !excluded.has(q.id)
  );
  if (pool.length < count) {
    throw new Error(`Seçilen kategorilerde daha önce görülmemiş ${count} tur için yeterli soru yok.`);
  }
  // Deterministic shuffle with a seed so demo games are stable per round.
  const arr = [...pool];
  let s = seed * 9301 + 49297;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}
