import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { QUESTIONS, questionsForCategory, pickQuestions } from '../features/game/questions';
import { CATEGORIES } from '../features/game/categories';
import { normalizeChoiceText } from '../features/game/engine';

describe('FOXMASQUE Question Bank — 2,400 Questions Validation', () => {
  test('Contains exactly 2,400 unique questions in total', () => {
    assert.equal(QUESTIONS.length, 2400);

    const ids = new Set<string>();
    for (const q of QUESTIONS) {
      assert.ok(!ids.has(q.id), `Duplicate question ID detected: ${q.id}`);
      ids.add(q.id);
    }
    assert.equal(ids.size, 2400);
  });

  test('All question prompts are unique across the entire bank', () => {
    const prompts = new Set<string>();
    for (const q of QUESTIONS) {
      const normalizedPrompt = q.prompt.trim().toLowerCase();
      assert.ok(
        !prompts.has(normalizedPrompt),
        `Duplicate question prompt detected: "${q.prompt}" (id: ${q.id})`
      );
      prompts.add(normalizedPrompt);
    }
    assert.equal(prompts.size, 2400);
  });

  test('Contains the expected question count in all 6 categories', () => {
    const expectedCategoryCounts: Record<(typeof CATEGORIES)[number]['id'], number> = {
      'genel-kultur': 400,
      'hayvanlar-alem': 400,
      'film-ve-dizi': 400,
      'osmanli-donemi': 400,
      'dunya-tarihi': 400,
      cografya: 400,
    } as const;

    assert.equal(CATEGORIES.length, 6);

    for (const category of CATEGORIES) {
      const expectedCount = expectedCategoryCounts[category.id];
      const categoryQuestions = questionsForCategory(category.id);
      assert.equal(
        categoryQuestions.length,
        expectedCount,
        `Category ${category.id} must have exactly ${expectedCount} questions`
      );
    }
  });

  test('Contains every Osmanlı question ID from os-1 through os-400', () => {
    const ottomanQuestionIds = new Set(
      questionsForCategory('osmanli-donemi').map((question) => question.id)
    );

    for (let id = 1; id <= 400; id++) {
      assert.ok(ottomanQuestionIds.has(`os-${id}`), `Missing Osmanlı question os-${id}`);
    }
  });

  test('Contains every Dünya Tarihi and Coğrafya question ID from 1 through 400', () => {
    for (const [categoryId, prefix] of [
      ['dunya-tarihi', 'dt'],
      ['cografya', 'cg'],
    ] as const) {
      const questionIds = new Set(
        questionsForCategory(categoryId).map((question) => question.id)
      );

      for (let id = 1; id <= 400; id++) {
        assert.ok(questionIds.has(`${prefix}-${id}`), `Missing ${prefix} question ${prefix}-${id}`);
      }
    }
  });

  test('All questions have non-empty required fields and valid answer normalizations', () => {
    for (const q of QUESTIONS) {
      assert.ok(q.prompt && q.prompt.trim().length > 5, `Question ${q.id} has invalid prompt`);
      assert.ok(q.correctAnswer && q.correctAnswer.trim().length > 0, `Question ${q.id} missing correctAnswer`);
      assert.ok(q.explanation && q.explanation.trim().length > 5, `Question ${q.id} missing explanation`);
      assert.ok(
        ['easy', 'medium', 'hard'].includes(q.difficulty || ''),
        `Question ${q.id} has invalid difficulty ${q.difficulty}`
      );

      const normalized = normalizeChoiceText(q.correctAnswer);
      assert.ok(normalized.length > 0, `Question ${q.id} normalized answer cannot be empty`);
    }
  });

  test('Original baseline questions (1-5 per category) are strictly preserved', () => {
    const baselineIds = [
      'gk-1', 'gk-2', 'gk-3', 'gk-4', 'gk-5',
      'hy-1', 'hy-2', 'hy-3', 'hy-4', 'hy-5',
      'fm-1', 'fm-2', 'fm-3', 'fm-4', 'fm-5',
      'os-1', 'os-2', 'os-3', 'os-4', 'os-5',
      'dt-1', 'dt-2', 'dt-3', 'dt-4', 'dt-5',
      'cg-1', 'cg-2', 'cg-3', 'cg-4', 'cg-5',
    ];

    for (const id of baselineIds) {
      const q = QUESTIONS.find((item) => item.id === id);
      assert.ok(q, `Baseline question ${id} must exist in the pool`);
      assert.ok(q.prompt.length > 0);
      assert.ok(q.correctAnswer && q.correctAnswer.length > 0);
    }
  });

  test('pickQuestions works properly with large pools and excluded history', () => {
    // Pick 10 questions from genel-kultur
    const batch1 = pickQuestions(['genel-kultur'], 10, 42);
    assert.equal(batch1.length, 10);

    // Pick next 10 questions excluding batch1
    const batch1Ids = batch1.map((q) => q.id);
    const batch2 = pickQuestions(['genel-kultur'], 10, 43, batch1Ids);
    assert.equal(batch2.length, 10);

    // Verify disjoint sets
    for (const q of batch2) {
      assert.ok(!batch1Ids.includes(q.id), `Question ${q.id} was picked despite being excluded`);
    }

    // Pick 100 questions from all categories combined
    const multiCatBatch = pickQuestions(
      ['genel-kultur', 'hayvanlar-alem', 'film-ve-dizi', 'osmanli-donemi', 'dunya-tarihi', 'cografya'],
      60,
      123
    );
    assert.equal(multiCatBatch.length, 60);
  });
});
