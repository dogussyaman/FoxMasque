import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import {
  computeOutcome,
  POINTS,
} from '../features/game/outcomes';
import {
  blendChoices,
  normalizeChoiceText,
  resolveZartoRound,
  applyRoundToPlayers,
  applyRoundBlockEffects,
  clearRoundBlockState,
} from '../features/game/engine';
import {
  canUseAbility,
  freshAbilityState,
} from '../features/game/abilities';
import { DemoGameService } from '../services/demoAdapter';
import { pickQuestions, questionsForCategory } from '../features/game/questions';
import type { Player, RoundChoice } from '../types/game';
import type { Question } from '../features/game/questions';
import './soundService.test';
import './avatar.test';

const sampleQuestion: Question = {
  id: 'test-q1',
  categoryId: 'genel-kultur',
  prompt: 'Türkiye Cumhuriyeti hangi yıl ilan edildi?',
  correctAnswer: '1923',
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

async function createDemoBlockRound(roundSeconds = 30) {
  const host = new DemoGameService();
  await host.connect();
  const room = await host.createRoom({
    hostName: 'Host',
    avatarKey: 'fox',
    totalRounds: 2,
    roundSeconds,
    categories: ['genel-kultur'],
  });
  await host.startGame(room.code);

  const state = await host.getRoomState(room.code);
  assert.ok(state);
  const targetId = Object.keys(state.players).find((id) => id !== room.playerId);
  assert.ok(targetId);
  state.players[room.playerId].blocksAvailable = 1;
  await host.useAbility(room.code, {
    playerId: room.playerId,
    abilityId: 'block',
    targetId,
  });

  return { host, roomCode: room.code, targetId };
}

describe('TUZAK Game Engine — Bluff & Scoring Tests', () => {
  test('Normalizes Turkish casing and compatibility characters without stripping punctuation', () => {
    assert.equal(normalizeChoiceText('  İSTANBUL  '), normalizeChoiceText('İstanbul'));
    assert.equal(normalizeChoiceText('Ａ'), normalizeChoiceText('A'));
    assert.notEqual(normalizeChoiceText('1.000'), normalizeChoiceText('1000'));
  });

  describe('Question selection history', () => {
    test('Returns distinct unseen questions and allows another player to see the same question', () => {
      const firstPlayer = pickQuestions(['genel-kultur'], 2, 1);
      const secondPlayer = pickQuestions(['genel-kultur'], 2, 1);

      assert.equal(new Set(firstPlayer.map((question) => question.id)).size, 2);
      assert.deepEqual(
        firstPlayer.map((question) => question.id),
        secondPlayer.map((question) => question.id)
      );
    });

    test('Skips a player’s previously seen questions on later games', () => {
      const firstGame = pickQuestions(['genel-kultur'], 2, 1);
      const nextGame = pickQuestions(
        ['genel-kultur'],
        2,
        2,
        firstGame.map((question) => question.id)
      );

      assert.equal(new Set(nextGame.map((question) => question.id)).size, 2);
      assert.ok(nextGame.every((question) =>
        !firstGame.some((seenQuestion) => seenQuestion.id === question.id)
      ));
    });

    test('Fails rather than repeating when the unseen category pool is exhausted', () => {
      const categoryQuestions = questionsForCategory('genel-kultur');
      assert.throws(
        () => pickQuestions(
          ['genel-kultur'],
          1,
          1,
          categoryQuestions.map((question) => question.id)
        ),
        /daha önce görülmemiş/
      );
    });
  });

  describe('1. Blend Choices (True Answer + Fake Answers)', () => {
    test('Blends true answer and player fake answers, deduplicates and keeps author tags', () => {
      const fakeAnswers = {
        p1: '1920',
        p2: '1881', // novel fake
        p3: '1938', // novel fake
      };

      const choices = blendChoices(sampleQuestion, fakeAnswers, 123);
      assert.equal(choices.length, 4, 'Should contain only the correct answer and submitted fakes');
      assert.deepEqual(
        new Set(choices.map((choice) => choice.text)),
        new Set(['1923', '1920', '1881', '1938'])
      );

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

    test('Does not add question distractors when no players submitted fake answers', () => {
      const choices = blendChoices(sampleQuestion, {});
      assert.equal(choices.length, 1);
      assert.equal(choices[0].text, '1923');
      assert.equal(choices[0].isCorrect, true);
    });

    test('Rejects a question without a verified correct answer', () => {
      const questionWithoutAnswer: Question = {
        id: 'test-q2',
        categoryId: 'genel-kultur',
        prompt: 'Cevabı eksik soru',
      };
      assert.throws(
        () => blendChoices(questionWithoutAnswer, {}),
        /doğrulanmış doğru cevap/
      );
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

    test('Block applies before fake answers, while a same-round shield protects its user', () => {
      const p1 = createPlayer('p1', 'Attacker', 0);
      const p2 = createPlayer('p2', 'Defender', 0);
      const p3 = createPlayer('p3', 'ShieldedDefender', 0);
      const p4 = createPlayer('p4', 'SecondAttacker', 0);
      p1.blocksAvailable = 1;
      p4.blocksAvailable = 1;
      p3.shieldsAvailable = 1;

      const choices: RoundChoice[] = [
        { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
      ];
      const picks = { p1: 0, p2: 0, p3: 0, p4: 0 };

      const abilityActions = [
        { playerId: 'p1', abilityId: 'block' as const, targetId: 'p2' },
        { playerId: 'p4', abilityId: 'block' as const, targetId: 'p3' },
        { playerId: 'p3', abilityId: 'shield' as const },
      ];
      const selectionPlayers = applyRoundBlockEffects(
        [p1, p2, p3, p4],
        abilityActions
      );

      assert.equal(selectionPlayers.p2.isBlockedCurrentRound, true);
      assert.equal(selectionPlayers.p2.isBlockedNextRound, false);
      assert.equal(selectionPlayers.p2.blockedByPlayerId, 'p1');
      assert.equal(selectionPlayers.p3.isBlockedCurrentRound, false);

      const res = resolveZartoRound({
        question: sampleQuestion,
        players: Object.values(selectionPlayers),
        choices,
        picks,
        abilityActions,
      });
      assert.equal(res.updatedPlayers.p2.isBlockedCurrentRound, true);
      assert.equal(res.updatedPlayers.p2.isBlockedNextRound, false);
      assert.equal(res.rows.p2.pointsDelta, 100);
      assert.equal(res.updatedPlayers.p2.score, 100);
      assert.equal(res.updatedPlayers.p3.isBlockedCurrentRound, false);
      assert.equal(res.updatedPlayers.p3.shieldsAvailable, 0);
      assert.equal(res.updatedPlayers.p1.blocksAvailable, 0);
      assert.equal(res.updatedPlayers.p4.blocksAvailable, 0);

      const nextRoundPlayers = clearRoundBlockState(Object.values(res.updatedPlayers));
      assert.equal(nextRoundPlayers.p2.isBlockedCurrentRound, false);
      assert.equal(nextRoundPlayers.p2.blockedByPlayerId, null);
    });

    test('Multiple blocks prevent fake answers once and choose a stable blocker', () => {
      const players = [
        createPlayer('player-a', 'A'),
        createPlayer('player-b', 'B'),
        createPlayer('target', 'Target'),
      ];
      const result = applyRoundBlockEffects(players, [
        { playerId: 'player-b', abilityId: 'block', targetId: 'target' },
        { playerId: 'player-a', abilityId: 'block', targetId: 'target' },
      ]);

      assert.equal(result.target.isBlockedCurrentRound, true);
      assert.equal(result.target.blockedByPlayerId, 'player-a');
      assert.equal(result.target.isBlockedNextRound, false);
    });

    test('A player who does not pick earns no points or ability unlocks', () => {
      const unanswered = createPlayer('unanswered', 'Unanswered');
      const picker = createPlayer('picker', 'Picker');
      const result = resolveZartoRound({
        question: sampleQuestion,
        players: [unanswered, picker],
        choices: [
          { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
          { choiceIndex: 1, text: 'Blöf', authorId: 'unanswered', isCorrect: false },
        ],
        picks: { picker: 1 },
      });

      assert.equal(result.rows.unanswered.victimsCount, 0);
      assert.equal(result.rows.unanswered.pointsDelta, 0);
      assert.equal(result.updatedPlayers.unanswered.score, 0);
      assert.equal(result.updatedPlayers.unanswered.blocksAvailable, 0);
    });

    test('Penalty applies on a wrong pick and counter reflects it to the attacker', () => {
      const attacker = createPlayer('attacker', 'Attacker', 100);
      const target = createPlayer('target', 'Target', 100);
      const choices: RoundChoice[] = [
        { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
        { choiceIndex: 1, text: 'Yanlış', authorId: null, isCorrect: false },
      ];
      const picks = { attacker: 0, target: 1 };
      const penalty = resolveZartoRound({
        question: sampleQuestion,
        players: [attacker, target],
        choices,
        picks,
        abilityActions: [{ playerId: 'attacker', abilityId: 'penalty', targetId: 'target' }],
      });
      assert.equal(penalty.rows.target.pointsDelta, -30);
      assert.equal(penalty.rows.target.penaltyDelta, -30);
      assert.equal(penalty.updatedPlayers.target.score, 70);

      const counter = resolveZartoRound({
        question: sampleQuestion,
        players: [attacker, target],
        choices,
        picks,
        abilityActions: [
          { playerId: 'attacker', abilityId: 'penalty', targetId: 'target' },
          { playerId: 'target', abilityId: 'counter' },
        ],
      });
      assert.equal(counter.rows.target.pointsDelta, 0);
      assert.equal(counter.rows.attacker.pointsDelta, 70);
      assert.equal(counter.rows.attacker.penaltyDelta, -30);
      assert.equal(counter.updatedPlayers.attacker.score, 170);
      assert.equal(counter.updatedPlayers.target.score, 100);
    });

    test('Shield absorbs a penalty without changing the target score', () => {
      const attacker = createPlayer('attacker', 'Attacker', 100);
      const target = createPlayer('target', 'Target', 100);
      target.shieldsAvailable = 1;
      const result = resolveZartoRound({
        question: sampleQuestion,
        players: [attacker, target],
        choices: [
          { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
          { choiceIndex: 1, text: 'Yanlış', authorId: 'attacker', isCorrect: false },
        ],
        picks: { attacker: 0, target: 1 },
        abilityActions: [
          { playerId: 'attacker', abilityId: 'penalty', targetId: 'target' },
          { playerId: 'target', abilityId: 'shield' },
        ],
      });

      assert.equal(result.rows.target.pointsDelta, -40);
      assert.equal(result.rows.target.penaltyDelta, 0);
      assert.equal(result.updatedPlayers.target.score, 60);
      assert.equal(result.updatedPlayers.target.shieldsAvailable, 0);
    });

    test('Multiple penalties stack on an incorrect answer', () => {
      const target = createPlayer('target', 'Target', 200);
      const result = resolveZartoRound({
        question: sampleQuestion,
        players: [
          createPlayer('attacker-1', 'Attacker 1', 100),
          createPlayer('attacker-2', 'Attacker 2', 100),
          target,
        ],
        picks: { 'attacker-1': 0, 'attacker-2': 0, target: 1 },
        choices: [
          { choiceIndex: 0, text: '1923', authorId: null, isCorrect: true },
          { choiceIndex: 1, text: 'Yanlış', authorId: 'attacker-1', isCorrect: false },
        ],
        abilityActions: [
          { playerId: 'attacker-1', abilityId: 'penalty', targetId: 'target' },
          { playerId: 'attacker-2', abilityId: 'penalty', targetId: 'target' },
        ],
      });

      assert.equal(result.rows.target.pointsDelta, -100);
      assert.equal(result.rows.target.penaltyDelta, -60);
      assert.equal(result.updatedPlayers.target.score, 100);
    });

    test('Blocked player can guess correctly but cannot submit a fake answer', () => {
      const p1 = createPlayer('p1', 'BlockedGuy', 100);
      p1.isBlockedCurrentRound = true;
      p1.blockedByPlayerId = 'attacker';

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
      assert.equal(res.rows['p1'].outcome.correct, true);
      assert.equal(res.rows['p1'].pointsDelta, 100);
      assert.equal(res.updatedPlayers['p1'].score, 200);
      assert.equal(res.updatedPlayers['p1'].consecutiveCorrect, 1);
      assert.equal(res.updatedPlayers['p1'].isBlockedCurrentRound, true);
      assert.equal(res.updatedPlayers['p1'].blockedByPlayerId, 'attacker');
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

      state.isBlockedCurrentRound = true;
      state.shieldsAvailable = 1;
      const shieldWhileBlocked = canUseAbility(state, 'shield');
      assert.equal(shieldWhileBlocked.allowed, true);

      // Cannot block same target consecutively
      state.lastBlockedPlayerId = 'p2';
      const repeatBlock = canUseAbility(state, 'block', 'p2');
      assert.equal(repeatBlock.allowed, false);
    });

    describe('Block phase integration in demo mode', () => {
      test('Pauses the shared round timer and resumes with the remaining time intact', async () => {
        const { host, roomCode, targetId } = await createDemoBlockRound(30);
        const beforePause = await host.getRoomState(roomCode);
        const originalDeadline = beforePause?.phaseDeadlineAt;

        await host.setRoomPaused(roomCode, true);
        const pausedState = await host.getRoomState(roomCode);
        assert.ok(pausedState?.pausedAt);
        assert.equal(await host.advanceExpiredPhase(roomCode), false);
        await assert.rejects(
          host.useAbility(roomCode, {
            playerId: beforePause!.config.hostId,
            abilityId: 'block',
            targetId,
          }),
          /duraklatıldı/
        );

        await new Promise((resolve) => setTimeout(resolve, 20));
        await host.setRoomPaused(roomCode, false);
        const resumedState = await host.getRoomState(roomCode);
        assert.equal(resumedState?.pausedAt, null);
        assert.ok((resumedState?.phaseDeadlineAt ?? 0) > (originalDeadline ?? 0));
      });

      test('Confirms the block before the fake-answer phase begins', async () => {
        const { host, roomCode, targetId } = await createDemoBlockRound();
        await host.confirmAbilitySelection(roomCode);

        const fakeAnswerState = await host.getRoomState(roomCode);
        assert.equal(fakeAnswerState?.phase, 'fake_answer');
        assert.equal(fakeAnswerState?.players[targetId].isBlockedCurrentRound, true);
        assert.equal(fakeAnswerState?.players[targetId].isBlockedNextRound, false);
      });

      test('Applies a block once on ability timeout and gives no points for unanswered guesses', async () => {
        const { host, roomCode, targetId } = await createDemoBlockRound(1);
        const waitForPhaseTimeout = () => new Promise((resolve) => setTimeout(resolve, 1200));

        await waitForPhaseTimeout();
        assert.equal(await host.advanceExpiredPhase(roomCode), true);
        assert.equal(await host.advanceExpiredPhase(roomCode), false);
        let state = await host.getRoomState(roomCode);
        assert.equal(state?.phase, 'fake_answer');
        assert.equal(state?.players[targetId].isBlockedCurrentRound, true);

        await waitForPhaseTimeout();
        assert.equal(await host.advanceExpiredPhase(roomCode), true);
        state = await host.getRoomState(roomCode);
        assert.equal(state?.phase, 'guess');

        await waitForPhaseTimeout();
        assert.equal(await host.advanceExpiredPhase(roomCode), true);
        state = await host.getRoomState(roomCode);
        assert.equal(state?.phase, 'reveal');
        assert.ok(Object.values(state?.roundResults ?? {}).every((row) => row.pointsDelta === 0));
      });
    });
  });
});
