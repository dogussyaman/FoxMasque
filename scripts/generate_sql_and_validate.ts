import * as fs from 'fs';
import * as path from 'path';
import { QUESTIONS } from '../features/game/questions';
import { CATEGORIES } from '../features/game/categories';
import { normalizeChoiceText } from '../features/game/engine';

const EXPECTED_QUESTION_COUNTS: Record<string, number> = {
  'genel-kultur': 400,
  'hayvanlar-alem': 400,
  'film-ve-dizi': 400,
  'osmanli-donemi': 400,
  'dunya-tarihi': 400,
  cografya: 400,
};

function escapeSqlString(val: string): string {
  return "'" + val.replace(/'/g, "''") + "'";
}

function main() {
  console.log(`Analyzing ${QUESTIONS.length} questions...`);

  // 1. Total Count
  const expectedTotal = Object.values(EXPECTED_QUESTION_COUNTS).reduce((sum, count) => sum + count, 0);
  if (QUESTIONS.length !== expectedTotal) {
    throw new Error(`Expected exactly ${expectedTotal} questions, got ${QUESTIONS.length}`);
  }

  // 2. Uniqueness Checks
  const seenIds = new Set<string>();
  const seenPrompts = new Set<string>();

  const categoryCounts: Record<string, { total: number; easy: number; medium: number; hard: number }> = {};
  const validCategoryIds = new Set(CATEGORIES.map(c => c.id));

  for (const c of CATEGORIES) {
    categoryCounts[c.id] = { total: 0, easy: 0, medium: 0, hard: 0 };
  }

  for (const q of QUESTIONS) {
    if (!q.id) {
      throw new Error(`Found question without ID: ${JSON.stringify(q)}`);
    }
    if (seenIds.has(q.id)) {
      throw new Error(`Duplicate ID found: ${q.id}`);
    }
    seenIds.add(q.id);

    const normPrompt = q.prompt.trim().toLowerCase();
    if (seenPrompts.has(normPrompt)) {
      throw new Error(`Duplicate prompt detected: "${q.prompt}" (ID: ${q.id})`);
    }
    seenPrompts.add(normPrompt);

    if (!validCategoryIds.has(q.categoryId)) {
      throw new Error(`Invalid categoryId "${q.categoryId}" on question ${q.id}`);
    }

    if (!q.correctAnswer || q.correctAnswer.trim() === '') {
      throw new Error(`Missing correct answer on question ${q.id}`);
    }

    if (!q.explanation || q.explanation.trim() === '') {
      throw new Error(`Missing explanation on question ${q.id}`);
    }

    if (!q.difficulty || !['easy', 'medium', 'hard'].includes(q.difficulty)) {
      throw new Error(`Invalid difficulty "${q.difficulty}" on question ${q.id}`);
    }

    // Check normalization does not fail
    const normalized = normalizeChoiceText(q.correctAnswer);
    if (!normalized || normalized.trim() === '') {
      throw new Error(`Normalized answer empty for "${q.correctAnswer}" on question ${q.id}`);
    }

    const catStats = categoryCounts[q.categoryId];
    catStats.total++;
    catStats[q.difficulty]++;
  }

  console.log('Category Distribution Summary:');
  for (const [catId, stats] of Object.entries(categoryCounts)) {
    console.log(`- ${catId}: Total ${stats.total} (Easy: ${stats.easy}, Med: ${stats.medium}, Hard: ${stats.hard})`);
    const expectedCount = EXPECTED_QUESTION_COUNTS[catId];
    if (expectedCount === undefined || stats.total !== expectedCount) {
      throw new Error(`Category ${catId} must have ${expectedCount ?? 0} questions (has ${stats.total})`);
    }
  }

  console.log(`All ${expectedTotal} questions validated successfully!`);

  // Generate SQL values
  const sqlValues = QUESTIONS.map((q) => {
    const id = escapeSqlString(q.id);
    const cat = escapeSqlString(q.categoryId);
    const prompt = escapeSqlString(q.prompt);
    const ans = escapeSqlString(q.correctAnswer || '');
    const expl = escapeSqlString(q.explanation || '');
    const diff = escapeSqlString(q.difficulty || 'medium');
    const status = escapeSqlString(q.status || 'approved');
    return `    (${id}, ${cat}, ${prompt}, ${ans}, ARRAY[]::TEXT[], ${expl}, TRUE, ${diff}, ${status})`;
  }).join(',\n');

  const migrationSql = `-- ============================================================================
-- KIZILKUYRUK — QUESTION BANK EXPANSION (${expectedTotal} QUESTIONS)
-- Migration: 20261028000001_expand_question_bank_2400.sql
-- Categories: 400 questions each across all six categories
-- Authoritative, bluff-compliant: default_decoys = ARRAY[]::TEXT[]
-- ============================================================================

INSERT INTO public.questions (
    id,
    category_id,
    prompt,
    correct_answer,
    default_decoys,
    explanation,
    is_active,
    difficulty,
    status
)
VALUES
${sqlValues}
ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    prompt = EXCLUDED.prompt,
    correct_answer = EXCLUDED.correct_answer,
    default_decoys = EXCLUDED.default_decoys,
    explanation = EXCLUDED.explanation,
    is_active = EXCLUDED.is_active,
    difficulty = EXCLUDED.difficulty,
    status = EXCLUDED.status;

-- Verify count
DO $$
DECLARE
    v_total INTEGER;
    v_active INTEGER;
BEGIN
    SELECT count(*), count(*) FILTER (WHERE is_active)
    INTO v_total, v_active
    FROM public.questions;

    RAISE NOTICE 'Total questions in DB: %, Active: %', v_total, v_active;
END;
$$;
`;

  const migrationPath = path.resolve(__dirname, '../supabase/migrations/20261028000001_expand_question_bank_2400.sql');
  fs.writeFileSync(migrationPath, migrationSql, 'utf-8');
  console.log(`Generated migration: ${migrationPath}`);

  const seedPath = path.resolve(__dirname, '../supabase/seed_questions_2400.sql');
  fs.writeFileSync(seedPath, migrationSql, 'utf-8');
  console.log(`Generated seed file: ${seedPath}`);
}

main();
