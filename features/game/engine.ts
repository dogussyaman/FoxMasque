import type {
  AbilityAction,
  AnswerSubmission,
  Player,
  PlayerId,
  RoundChoice,
  RoundResultRow,
} from '../../types/game';
import { computeOutcome, POINTS } from './outcomes';
import type { Question } from './questions';

export interface ZartoRoundInput {
  question: Question;
  players: Player[];
  choices: RoundChoice[];
  picks: Record<PlayerId, number>; // playerId -> choiceIndex
  fakeAnswers?: Record<PlayerId, string>;
  abilityActions?: AbilityAction[];
}

export interface ZartoRoundResolution {
  rows: Record<PlayerId, RoundResultRow>;
  rowsList: RoundResultRow[];
  updatedPlayers: Record<PlayerId, Player>;
}

export function normalizeChoiceText(text: string): string {
  return text.trim().normalize('NFKC').toLocaleLowerCase('tr-TR');
}

/**
 * Blend the true answer and player fake answers into a single shuffled choice list.
 */
export function blendChoices(
  question: Question,
  fakeAnswers: Record<PlayerId, string>,
  randomSeed = 42
): RoundChoice[] {
  interface RawChoice {
    text: string;
    authorId: PlayerId | null;
    isCorrect: boolean;
  }

  const rawList: RawChoice[] = [];

  // 1. True answer
  const trueAnswer = question.correctAnswer?.trim();
  if (!trueAnswer) throw new Error('Soru için doğrulanmış doğru cevap bulunamadı.');
  rawList.push({
    text: trueAnswer,
    authorId: null,
    isCorrect: true,
  });

  // 2. Player fake answers
  const seenTexts = new Set<string>([normalizeChoiceText(trueAnswer)]);
  for (const [playerId, fakeText] of Object.entries(fakeAnswers)) {
    const clean = fakeText.trim();
    if (!clean) continue;
    // Don't add if identical to true answer
    const normalized = normalizeChoiceText(clean);
    if (seenTexts.has(normalized)) continue;
    seenTexts.add(normalized);
    rawList.push({
      text: clean,
      authorId: playerId,
      isCorrect: false,
    });
  }

  // Deterministic Fisher-Yates shuffle
  const arr = [...rawList];
  let s = randomSeed * 9301 + 49297;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.map((item, index) => ({
    choiceIndex: index,
    text: item.text,
    authorId: item.authorId,
    isCorrect: item.isCorrect,
  }));
}

/**
 * Authoritative ZARTO Round Resolution
 */
export function resolveZartoRound(input: ZartoRoundInput): ZartoRoundResolution {
  const { question, players, choices, picks, fakeAnswers = {}, abilityActions = [] } = input;

  const choicesByIndex = new Map<number, RoundChoice>();
  for (const c of choices) {
    choicesByIndex.set(c.choiceIndex, c);
  }

  const activeOpponentsCount = Math.max(1, players.filter((p) => p.isOnline).length - 1);

  // 1. Process defensive abilities (Shields, Counters)
  const shieldedPlayers = new Set<PlayerId>();
  const counters = new Set<PlayerId>();
  const blocksByTarget = new Map<PlayerId, PlayerId[]>();
  const penaltiesByTarget = new Map<PlayerId, PlayerId[]>();
  const abilityUsesByPlayer = new Map<PlayerId, Record<string, number>>();

  for (const action of abilityActions) {
    const player = players.find((candidate) => candidate.id === action.playerId);
    if (!player || player.isBlockedCurrentRound) continue;
    const uses = abilityUsesByPlayer.get(action.playerId) ?? {};
    uses[action.abilityId] = (uses[action.abilityId] ?? 0) + 1;
    abilityUsesByPlayer.set(action.playerId, uses);
    if (action.abilityId === 'shield') {
      shieldedPlayers.add(action.playerId);
    } else if (action.abilityId === 'counter') {
      counters.add(action.playerId);
    } else if (action.abilityId === 'block' && action.targetId) {
      const attackers = blocksByTarget.get(action.targetId) ?? [];
      attackers.push(action.playerId);
      blocksByTarget.set(action.targetId, attackers);
    } else if (action.abilityId === 'penalty' && action.targetId) {
      const attackers = penaltiesByTarget.get(action.targetId) ?? [];
      attackers.push(action.playerId);
      penaltiesByTarget.set(action.targetId, attackers);
    }
  }

  // 2. Calculate picks and fake answer traps
  // Count how many players picked each fake answer author
  const victimCountsByAuthor = new Map<PlayerId, number>();
  for (const p of players) {
    const pickIndex = picks[p.id];
    if (pickIndex === undefined) continue;
    const chosen = choicesByIndex.get(pickIndex);
    if (chosen && !chosen.isCorrect && chosen.authorId && chosen.authorId !== p.id) {
      victimCountsByAuthor.set(
        chosen.authorId,
        (victimCountsByAuthor.get(chosen.authorId) ?? 0) + 1
      );
    }
  }

  const rows: Record<PlayerId, RoundResultRow> = {};
  const rowsList: RoundResultRow[] = [];
  const updatedPlayers: Record<PlayerId, Player> = {};
  const reflectedPenalties = new Map<PlayerId, number>();
  const penaltiesByPlayer = new Map<PlayerId, number>();

  for (const p of players) {
    const isBlocked = !!p.isBlockedCurrentRound;

    if (isBlocked) {
      const outcome = computeOutcome({
        answeredCorrectly: false,
        victimsCount: 0,
        choseRivalFake: false,
        isBlocked: true,
      });

      const row: RoundResultRow = {
        playerId: p.id,
        outcome,
        labels: outcome.labels,
        pointsDelta: 0,
        victimsCount: 0,
        isBlocked: true,
      };

      rows[p.id] = row;
      rowsList.push(row);
      updatedPlayers[p.id] = {
        ...p,
        consecutiveCorrect: 0,
        isBlockedCurrentRound: false, // reset current round block
      };
      continue;
    }

    const pickIndex = picks[p.id];
    const chosen = pickIndex !== undefined ? choicesByIndex.get(pickIndex) : undefined;

    const answeredCorrectly = !!chosen?.isCorrect;
    const choseRivalFake = !!(chosen && !chosen.isCorrect && chosen.authorId && chosen.authorId !== p.id);
    const deceivedByAuthorId = choseRivalFake ? chosen!.authorId : null;
    const victimsCount = victimCountsByAuthor.get(p.id) ?? 0;

    const outcome = computeOutcome({
      answeredCorrectly,
      victimsCount,
      choseRivalFake,
    });

    let pointsDelta = outcome.pointsEarned;

    // Apply Penalty ability if targeted
    const penaltyAttackers = penaltiesByTarget.get(p.id) ?? [];
    if (penaltyAttackers.length > 0) {
      if (shieldedPlayers.has(p.id)) {
        // Shield absorbs penalty
      } else if (counters.has(p.id)) {
        for (const attackerId of penaltyAttackers) {
          reflectedPenalties.set(attackerId, (reflectedPenalties.get(attackerId) ?? 0) - 30);
        }
      } else if (!answeredCorrectly) {
        const penaltyDelta = -30 * penaltyAttackers.length;
        pointsDelta += penaltyDelta;
        penaltiesByPlayer.set(p.id, penaltyDelta);
      }
    }

    const incomingPenalty = reflectedPenalties.get(p.id) ?? 0;
    pointsDelta += incomingPenalty;
    const penaltyDelta = (penaltiesByPlayer.get(p.id) ?? 0) + incomingPenalty;
    const row: RoundResultRow = {
      playerId: p.id,
      outcome,
      labels: outcome.labels,
      pointsDelta,
      victimsCount,
      deceivedByAuthorId,
      pickedText: chosen?.text,
      ownFakeText: fakeAnswers[p.id],
      isBlocked: false,
      penaltyDelta,
    };

    rows[p.id] = row;
    rowsList.push(row);

    // Progressive ability unlocks
    let consecutiveCorrect = answeredCorrectly ? p.consecutiveCorrect + 1 : 0;
    let shieldsAvailable = p.shieldsAvailable;
    let blocksAvailable = p.blocksAvailable;

    // 3 in a row unlocks Shield
    if (consecutiveCorrect >= 3) {
      shieldsAvailable += 1;
      consecutiveCorrect = 0;
    }

    // Tricking >= 3 rivals OR > 50% of opponents unlocks Block
    if (victimsCount >= 3 || (victimsCount / activeOpponentsCount > 0.5)) {
      blocksAvailable += 1;
    }

    // Consume shield if player used it this round
    const usedShield = abilityUsesByPlayer.get(p.id)?.shield ?? 0;
    if (usedShield > 0) {
      shieldsAvailable = Math.max(0, shieldsAvailable - usedShield);
    }
    blocksAvailable = Math.max(
      0,
      blocksAvailable - (abilityUsesByPlayer.get(p.id)?.block ?? 0)
    );

    // Next round block state
    let isBlockedNextRound = p.isBlockedNextRound;
    if ((blocksByTarget.get(p.id)?.length ?? 0) > 0) {
      if (shieldedPlayers.has(p.id)) {
        // Shield saved defender from block!
      } else {
        isBlockedNextRound = true;
      }
    }

    const abilityUsedCounts = { ...p.abilityUsedCounts };
    for (const [abilityId, usedCount] of Object.entries(abilityUsesByPlayer.get(p.id) ?? {})) {
      abilityUsedCounts[abilityId as keyof typeof abilityUsedCounts] += usedCount;
    }

    updatedPlayers[p.id] = {
      ...p,
      score: Math.max(0, p.score + pointsDelta),
      abilityUsedCounts,
      consecutiveCorrect,
      shieldsAvailable,
      blocksAvailable,
      isBlockedCurrentRound: false,
      isBlockedNextRound,
      lastBlockedPlayerId: p.lastBlockedPlayerId,
    };
  }

  for (const [playerId, pointsDelta] of reflectedPenalties) {
    const row = rows[playerId];
    const player = players.find((candidate) => candidate.id === playerId);
    if (!row || !player) continue;
    row.pointsDelta += pointsDelta;
    row.penaltyDelta = (row.penaltyDelta ?? 0) + pointsDelta;
    updatedPlayers[playerId] = {
      ...updatedPlayers[playerId],
      score: Math.max(0, player.score + row.pointsDelta),
    };
  }

  for (const [targetId, attackerIds] of blocksByTarget) {
    for (const attackerId of attackerIds) {
      if (updatedPlayers[attackerId]) {
        updatedPlayers[attackerId].lastBlockedPlayerId = targetId;
      }
    }
  }

  return { rows, rowsList, updatedPlayers };
}

// Backward-compatible resolveRound signature for existing tests & UI
export function resolveRound(input: {
  question: Question;
  players: Player[];
  answers: Record<string, AnswerSubmission>;
  abilityActions?: AbilityAction[];
}): { rows: Record<string, RoundResultRow>; rowsList: RoundResultRow[] } {
  const { question, players, answers, abilityActions = [] } = input;

  // Adapt old AnswerSubmission to ZARTO picks / fakeAnswers
  const picks: Record<PlayerId, number> = {};
  const fakeAnswers: Record<PlayerId, string> = {};

  for (const [pid, sub] of Object.entries(answers)) {
    if (sub.choiceIndex !== undefined) {
      picks[pid] = sub.choiceIndex;
    } else if (sub.selectedIndex !== undefined) {
      picks[pid] = sub.selectedIndex;
    }
    if (sub.fakeAnswer) {
      fakeAnswers[pid] = sub.fakeAnswer;
    }
  }

  // Generate choices if not supplied
  const choices = blendChoices(question, fakeAnswers);

  const res = resolveZartoRound({
    question,
    players,
    choices,
    picks,
    fakeAnswers,
    abilityActions,
  });

  return { rows: res.rows, rowsList: res.rowsList };
}

export function applyRoundToPlayers(
  players: Record<string, Player>,
  rows: Record<string, RoundResultRow>
): Record<string, Player> {
  const next: Record<string, Player> = {};
  for (const id of Object.keys(players)) {
    const p = players[id];
    const delta = rows[id]?.pointsDelta ?? 0;
    next[id] = { ...p, score: Math.max(0, p.score + delta) };
  }
  return next;
}

export function applyAbilityActionsToPlayers(
  players: Record<string, Player>,
  actions: AbilityAction[]
): Record<string, Player> {
  const next: Record<string, Player> = {};
  for (const id of Object.keys(players)) next[id] = { ...players[id] };
  for (const a of actions) {
    const p = next[a.playerId];
    if (!p) continue;
    next[a.playerId] = {
      ...p,
      abilityUsedCounts: {
        ...p.abilityUsedCounts,
        [a.abilityId]: (p.abilityUsedCounts?.[a.abilityId] ?? 0) + 1,
      },
    };
  }
  return next;
}

export { POINTS };
