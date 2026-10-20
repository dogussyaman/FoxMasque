import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  computeOutcome,
  resolveZartal,
  POINTS,
} from '../features/game/outcomes';
import {
  resolveRound,
  applyRoundToPlayers,
  applyAbilityActionsToPlayers,
} from '../features/game/engine';
import {
  freshAbilityState,
  canUseAbility,
  applyAbilityUse,
  remainingUses,
  ABILITIES,
} from '../features/game/abilities';
import type { Player, AnswerSubmission, AbilityAction } from '../types/game';
import type { Question } from '../features/game/questions';

const sampleQuestion: Question = {
  id: 'test-q1',
  categoryId: 'genel-kultur',
  prompt: 'Test sorusu?',
  options: ['Cevap A', 'Cevap B (Doğru)', 'Cevap C', 'Cevap D'],
  correctIndex: 1,
  explanation: 'Test açıklaması',
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
  };
}

describe('ZARTIX Game Engine Tests', () => {
  describe('1. Scoring & Outcome Combinations', () => {
    test('Correct answer earns +100 points and DOĞRU BİLDİN label', () => {
      const outcome = computeOutcome({
        answeredCorrectly: true,
        zartaledByMe: false,
        zartaledMeBy: false,
      });

      assert.equal(outcome.pointsEarned, POINTS.correct);
      assert.equal(outcome.correct, true);
      assert.equal(outcome.zartaladın, false);
      assert.equal(outcome.zartalandın, false);
      assert.equal(outcome.labels.length, 1);
      assert.equal(outcome.labels[0].kind, 'correct');
    });

    test('Both answered correctly AND zartaladın gives +150 points with both labels', () => {
      const outcome = computeOutcome({
        answeredCorrectly: true,
        zartaledByMe: true,
        zartaledMeBy: false,
      });

      assert.equal(outcome.pointsEarned, POINTS.correct + POINTS.zartaladınBonus); // 100 + 50 = 150
      assert.equal(outcome.correct, true);
      assert.equal(outcome.zartaladın, true);
      assert.equal(outcome.zartalandın, false);
      assert.equal(outcome.labels.length, 2);
      assert.equal(outcome.labels[0].kind, 'correct');
      assert.equal(outcome.labels[1].kind, 'zartaladın');
    });

    test('Wrong answer and zartalandın gives -40 points with ZARTALANDIN label', () => {
      const outcome = computeOutcome({
        answeredCorrectly: false,
        zartaledByMe: false,
        zartaledMeBy: true,
      });

      assert.equal(outcome.pointsEarned, POINTS.zartalandınPenalty); // -40
      assert.equal(outcome.correct, false);
      assert.equal(outcome.zartalandın, true);
      assert.equal(outcome.labels.length, 1);
      assert.equal(outcome.labels[0].kind, 'zartalandın');
    });

    test('Wrong answer with no zartal gives 0 points and empty labels', () => {
      const outcome = computeOutcome({
        answeredCorrectly: false,
        zartaledByMe: false,
        zartaledMeBy: false,
      });

      assert.equal(outcome.pointsEarned, 0);
      assert.equal(outcome.labels.length, 0);
    });
  });

  describe('2. Zartal Resolution Rules', () => {
    test('Zartal succeeds when attacker correct and defender wrong', () => {
      const res = resolveZartal({
        attackerCorrect: true,
        defenderCorrect: false,
        defenderShielded: false,
        attackerBlocked: false,
      });
      assert.equal(res.success, true);
    });

    test('Zartal fails if attacker is wrong', () => {
      const res = resolveZartal({
        attackerCorrect: false,
        defenderCorrect: false,
        defenderShielded: false,
        attackerBlocked: false,
      });
      assert.equal(res.success, false);
    });

    test('Zartal fails if defender also answered correctly', () => {
      const res = resolveZartal({
        attackerCorrect: true,
        defenderCorrect: true,
        defenderShielded: false,
        attackerBlocked: false,
      });
      assert.equal(res.success, false);
    });

    test('Zartal fails if defender has active Shield', () => {
      const res = resolveZartal({
        attackerCorrect: true,
        defenderCorrect: false,
        defenderShielded: true,
        attackerBlocked: false,
      });
      assert.equal(res.success, false);
    });

    test('Zartal fails if attacker is blocked by defender', () => {
      const res = resolveZartal({
        attackerCorrect: true,
        defenderCorrect: false,
        defenderShielded: false,
        attackerBlocked: true,
      });
      assert.equal(res.success, false);
    });
  });

  describe('3. Special Ability Rules & Usage Limits', () => {
    test('Shield and Block have max 2 uses, Penalty and Counter have 1 use', () => {
      const shield = ABILITIES.find((a) => a.id === 'shield');
      const block = ABILITIES.find((a) => a.id === 'block');
      const penalty = ABILITIES.find((a) => a.id === 'penalty');
      const counter = ABILITIES.find((a) => a.id === 'counter');

      assert.equal(shield?.maxUses, 2);
      assert.equal(block?.maxUses, 2);
      assert.equal(penalty?.maxUses, 1);
      assert.equal(counter?.maxUses, 1);
    });

    test('Enforces ability usage limits correctly', () => {
      let state = freshAbilityState('p1');
      assert.equal(canUseAbility(state, 'counter'), true);
      assert.equal(remainingUses(state, 'counter'), 1);

      state = applyAbilityUse(state, 'counter');
      assert.equal(canUseAbility(state, 'counter'), false);
      assert.equal(remainingUses(state, 'counter'), 0);

      // Attempting to use again does not exceed count
      const state2 = applyAbilityUse(state, 'counter');
      assert.equal(state2.usedCounts.counter, 1);
    });

    test('Counter ability reflects zartal attack back to attacker', () => {
      const p1 = createPlayer('p1', 'Attacker', 100);
      const p2 = createPlayer('p2', 'Defender', 100);

      const answers: Record<string, AnswerSubmission> = {
        p1: { playerId: 'p1', questionId: 'q1', selectedIndex: 1, zartalTargetId: 'p2' },
        p2: { playerId: 'p2', questionId: 'q1', selectedIndex: 0 }, // wrong answer
      };

      const abilities: AbilityAction[] = [
        { playerId: 'p2', abilityId: 'counter' },
      ];

      const resolution = resolveRound({
        question: sampleQuestion,
        players: [p1, p2],
        answers,
        abilityActions: abilities,
      });

      // P1 answered correct (+100) but was countered (-40) = +60
      assert.equal(resolution.rows['p1'].pointsDelta, 60);
      // P2 answered wrong (0) and counter prevented zartalandın = 0
      assert.equal(resolution.rows['p2'].pointsDelta, 0);
    });
  });

  describe('4. Full Round Resolution & Player Score Progression', () => {
    test('Applies round points deltas and prevents scores from dropping below 0', () => {
      const players: Record<string, Player> = {
        p1: createPlayer('p1', 'Ali', 20),
        p2: createPlayer('p2', 'Ayşe', 100),
      };

      const rows = {
        p1: {
          playerId: 'p1',
          outcome: computeOutcome({ answeredCorrectly: false, zartaledByMe: false, zartaledMeBy: true }),
          labels: [],
          pointsDelta: -40,
        },
        p2: {
          playerId: 'p2',
          outcome: computeOutcome({ answeredCorrectly: true, zartaledByMe: true, zartaledMeBy: false }),
          labels: [],
          pointsDelta: 150,
        },
      };

      const updated = applyRoundToPlayers(players, rows);
      // p1 score was 20, -40 => clamped to 0
      assert.equal(updated['p1'].score, 0);
      // p2 score was 100, +150 => 250
      assert.equal(updated['p2'].score, 250);
    });

    test('Tracks ability action usages in player state', () => {
      const players: Record<string, Player> = {
        p1: createPlayer('p1', 'Ali', 50),
      };

      const actions: AbilityAction[] = [
        { playerId: 'p1', abilityId: 'shield' },
      ];

      const updated = applyAbilityActionsToPlayers(players, actions);
      assert.equal(updated['p1'].abilityUsedCounts.shield, 1);
    });
  });
});
