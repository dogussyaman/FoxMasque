import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  computeOutcome,
  POINTS,
} from '../features/game/outcomes';
import {
  blendChoices,
  resolveZartoRound,
  applyRoundToPlayers,
} from '../features/game/engine';
import {
  canUseAbility,
  freshAbilityState,
} from '../features/game/abilities';
import type { Player, RoundChoice } from '../types/game';
import type { Question } from '../features/game/questions';

const sampleQuestion: Question = {
  id: 'test-q1',
  categoryId: 'genel-kultur',
  prompt: 'Türkiye Cumhuriyeti hangi yıl ilan edildi?',
  options: ['1920', '1923', '1925', '1930'],
  correctIndex: 1,
  correctAnswer: '1923',
  defaultDecoys: ['1920', '1925', '1930'],
  explanation: '29 Ekim 1923',
};

function createPlayer(id: string, name: string, score = 0): Player {
  return {
    id,
    name,
    avatarKey: 'fox',
    isHost: false,
    isReady: true,
    isOnline: true,
    score,
    abilityUsedCounts: { block: 0, shield: 0, penalty: 0, counter: 0 },
    consecutiveCorrect: 0,
    shieldsAvailable: 0,
    blocksAvailable: 0,
    isBlockedCurrentRound: false,
    isBlockedNextRound: false,
    lastBlockedPlayerId: null,
  };
}

describe('TUZAK Game Engine — Bluff & Scoring Tests', () => {
  describe('1. Blend Choices (True Answer + Fake Answers)', () => {
    test('Blends true answer and player fake answers, deduplicates and keeps author tags', () => {
      const fakeAnswers = {
        p1: '1920', // identical to a decoy
        p2: '1881', // novel fake
        p3: '1938', // novel fake
      };

      const choices = blendChoices(sampleQuestion, fakeAnswers, 123);
      assert.ok(choices.length >= 4, 'Should contain at least 4 choices');

      // Must contain real answer
      const real = choices.find((c) => c.text === '1923');
      assert.ok(real, 'Real answer must be present');
      assert.equal(real.isCorrect, true);
      assert.equal(real.authorId, null);

      // Must contain p2 and p3 fake answers
      const p2Choice = choices.find((c) => c.text === '1881');
      assert.ok(p2Choice);
      assert.equal(p2Choice.authorId, 'p2');
      assert.equal(p2Choice.isCorrect, false);

      const p3Choice = choices.find((c) => c.text === '1938');
      assert.ok(p3Choice);
      assert.equal(p3Choice.authorId, 'p3');
      assert.equal(p3Choice.isCorrect, false);
    });
  });

  describe('2. TUZAK Core Scoring Rules (+100, +50, -40)', () => {
    test('Correct answer chosen earns +100 points and DOĞRU BİLDİN label', () => {
      const outcome = computeOutcome({
        answeredCorrectly: true,
        victimsCount: 0,
        choseRivalFake: false,
      });

      assert.equal(outcome.pointsEarned, 100);
      assert.equal(outcome.correct, true);
      assert.equal(outcome.zartaladın, false);
      assert.equal(outcome.zartalandın, false);
      assert.equal(outcome.labels.length, 1);
      assert.equal(outcome.labels[0].kind, 'correct');
    });

    test('Having rivals pick your fake answer gives +50 per victim and TUZAĞA DÜŞÜRDÜN label', () => {
      const outcome = computeOutcome({
        answeredCorrectly: false,
        victimsCount: 2, // 2 rivals tricked
        choseRivalFake: false,
      });

      assert.equal(outcome.pointsEarned, 100); // 2 * 50 = 100
      assert.equal(outcome.correct, false);
      assert.equal(outcome.zartaladın, true);
      assert.equal(outcome.victimsCount, 2);
      assert.equal(outcome.labels.length, 1);
      assert.equal(outcome.labels[0].kind, 'zartaladın');
      assert.equal(outcome.labels[0].text, 'TUZAĞA DÜŞÜRDÜN');
    });

    test('Choosing another player fake answer results in -40 and TUZAĞA DÜŞTÜN label', () => {
      const outcome = computeOutcome({
        answeredCorrectly: false,
        victimsCount: 0,
        choseRivalFake: true,
      });

      assert.equal(outcome.pointsEarned, -40);
      assert.equal(outcome.correct, false);
      assert.equal(outcome.zartalandın, true);
      assert.equal(outcome.labels.length, 1);
      assert.equal(outcome.labels[0].kind, 'zartalandın');
      assert.equal(outcome.labels[0].text, 'TUZAĞA DÜŞTÜN');
    });

    test('Double success: Both correct answer (+100) AND deceived rivals (2 x +50 = +100) gives +200', () => {
      const outcome = computeOutcome({
        answeredCorrectly: true,
        victimsCount: 2,
        choseRivalFake: false,
      });

      assert.equal(outcome.pointsEarned, 200); // 100 + 100
      assert.equal(outcome.correct, true);
      assert.equal(outcome.zartaladın, true);
      assert.equal(outcome.labels.length, 2);
      assert.equal(outcome.labels[0].kind, 'correct');
      assert.equal(outcome.labels[1].kind, 'zartaladın');
      assert.equal(outcome.labels[1].text, 'TUZAĞA DÜŞÜRDÜN');
    });
  });

  describe('3. Full Round Resolution with Multiple Players', () => {
    test('Resolves full round: true answer, victims tricked, and fell for fake', () => {
      const p1 = createPlayer('p1', 'Ali', 50);
      const p2 = createPlayer('p2', 'Ayşe', 100);
      const p3 = createPlayer('p3', 'Mehmet', 80);

      // Choices:
      // index 0: "1923" (Real, null author)
      // index 1: "1881" (Fake by p1)
      // index 2: "1938" (Fake by p2)
      // index 3: "1919" (Decoy)
      const choices: RoundChoice[] = [
        { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
        { choiceIndex: 1, text: '1881', authorId: 'p1', isCorrect: false },
        { choiceIndex: 2, text: '1938', authorId: 'p2', isCorrect: false },
        { choiceIndex: 3, text: '1919', authorId: null, isCorrect: false },
      ];

      // Picks:
      // p1 picks 0 (Correct -> +100)
      // p2 picks 1 (Picks p1 fake -> -40, p1 gets +50)
      // p3 picks 1 (Picks p1 fake -> -40, p1 gets +50)
      const picks = {
        p1: 0,
        p2: 1,
        p3: 1,
      };

      const res = resolveZartoRound({
        question: sampleQuestion,
        players: [p1, p2, p3],
        choices,
        picks,
        fakeAnswers: { p1: '1881', p2: '1938' },
      });

      // p1: +100 (correct) + 100 (2 victims) = +200
      assert.equal(res.rows['p1'].pointsDelta, 200);
      assert.equal(res.rows['p1'].outcome.correct, true);
      assert.equal(res.rows['p1'].victimsCount, 2);
      assert.equal(res.updatedPlayers['p1'].score, 250); // 50 + 200

      // p2: -40 (tuzağa düştü by p1)
      assert.equal(res.rows['p2'].pointsDelta, -40);
      assert.equal(res.rows['p2'].outcome.zartalandın, true);
      assert.equal(res.updatedPlayers['p2'].score, 60); // 100 - 40

      // p3: -40 (tuzağa düştü by p1)
      assert.equal(res.rows['p3'].pointsDelta, -40);
      assert.equal(res.updatedPlayers['p3'].score, 40); // 80 - 40
    });

    test('Clamps score to 0 when penalty exceeds player current score', () => {
      const p1 = createPlayer('p1', 'Yeni', 20);
      const choices: RoundChoice[] = [
        { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
        { choiceIndex: 1, text: '1881', authorId: 'p2', isCorrect: false },
      ];
      const picks = { p1: 1 }; // picks rival fake -> -40

      const res = resolveZartoRound({
        question: sampleQuestion,
        players: [p1],
        choices,
        picks,
      });

      assert.equal(res.rows['p1'].pointsDelta, -40);
      assert.equal(res.updatedPlayers['p1'].score, 0); // 20 - 40 clamped to 0
    });
  });

  describe('4. Special Ability Rules & Unlock Progression', () => {
    test('3 consecutive correct answers unlocks a Shield', () => {
      const p1 = createPlayer('p1', 'Dahi', 0);
      p1.consecutiveCorrect = 2; // already 2 correct in previous rounds

      const choices: RoundChoice[] = [
        { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
      ];
      const picks = { p1: 0 }; // 3rd correct answer!

      const res = resolveZartoRound({
        question: sampleQuestion,
        players: [p1],
        choices,
        picks,
      });

      assert.equal(res.updatedPlayers['p1'].shieldsAvailable, 1);
      assert.equal(res.updatedPlayers['p1'].consecutiveCorrect, 0); // reset counter after unlock
    });

    test('Tricking at least 3 rivals unlocks a Block', () => {
      const p1 = createPlayer('p1', 'Blöfçü', 0);
      const p2 = createPlayer('p2', 'Kurban1', 100);
      const p3 = createPlayer('p3', 'Kurban2', 100);
      const p4 = createPlayer('p4', 'Kurban3', 100);

      const choices: RoundChoice[] = [
        { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
        { choiceIndex: 1, text: '1881', authorId: 'p1', isCorrect: false },
      ];

      const picks = {
        p1: 0,
        p2: 1,
        p3: 1,
        p4: 1, // 3 rivals picked p1's fake!
      };

      const res = resolveZartoRound({
        question: sampleQuestion,
        players: [p1, p2, p3, p4],
        choices,
        picks,
      });

      assert.equal(res.updatedPlayers['p1'].blocksAvailable, 1);
    });

    test('Block ability marks target as isBlockedNextRound; Shield protects defender', () => {
      const p1 = createPlayer('p1', 'Attacker', 0);
      const p2 = createPlayer('p2', 'Defender', 0);
      const p3 = createPlayer('p3', 'ShieldedDefender', 0);
      p3.shieldsAvailable = 1;

      const choices: RoundChoice[] = [
        { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
      ];
      const picks = { p1: 0, p2: 0, p3: 0 };

      const res = resolveZartoRound({
        question: sampleQuestion,
        players: [p1, p2, p3],
        choices,
        picks,
        abilityActions: [
          { playerId: 'p1', abilityId: 'block', targetId: 'p2' },
          { playerId: 'p1', abilityId: 'block', targetId: 'p3' },
          { playerId: 'p3', abilityId: 'shield' }, // p3 activates shield!
        ],
      });

      // p2 was not shielded -> blocked for next round!
      assert.equal(res.updatedPlayers['p2'].isBlockedNextRound, true);

      // p3 had active shield -> protected! Not blocked!
      assert.equal(res.updatedPlayers['p3'].isBlockedNextRound, false);
      assert.equal(res.updatedPlayers['p3'].shieldsAvailable, 0); // shield consumed
    });

    test('Blocked player skips round: receives 0 points and cannot answer', () => {
      const p1 = createPlayer('p1', 'BlockedGuy', 100);
      p1.isBlockedCurrentRound = true;

      const choices: RoundChoice[] = [
        { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
      ];
      const picks = { p1: 0 };

      const res = resolveZartoRound({
        question: sampleQuestion,
        players: [p1],
        choices,
        picks,
      });

      assert.equal(res.rows['p1'].isBlocked, true);
      assert.equal(res.rows['p1'].pointsDelta, 0);
      assert.equal(res.updatedPlayers['p1'].score, 100);
      assert.equal(res.updatedPlayers['p1'].isBlockedCurrentRound, false); // reset
    });

    test('canUseAbility enforces constraints (cannot block self, cannot block same target consecutively)', () => {
      const state = freshAbilityState('p1');
      state.blocksAvailable = 1;

      // Cannot block self
      const selfBlock = canUseAbility(state, 'block', 'p1');
      assert.equal(selfBlock.allowed, false);

      // Valid rival block
      const validBlock = canUseAbility(state, 'block', 'p2');
      assert.equal(validBlock.allowed, true);

      // Cannot block same target consecutively
      state.lastBlockedPlayerId = 'p2';
      const repeatBlock = canUseAbility(state, 'block', 'p2');
      assert.equal(repeatBlock.allowed, false);
    });
  });
});
