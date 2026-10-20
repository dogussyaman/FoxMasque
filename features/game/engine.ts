import { applyAbilityUse } from './abilities';
import type { AbilityAction, AnswerSubmission, Player, RoundResultRow } from '../../types/game';
import { computeOutcome, resolveZartal, POINTS } from './outcomes';
import type { Question } from './questions';

export interface RoundResolutionInput {
  question: Question;
  players: Player[];
  answers: Record<string, AnswerSubmission>;
  abilityActions: AbilityAction[];
}

export interface RoundResolution {
  rows: Record<string, RoundResultRow>;
  rowsList: RoundResultRow[];
}

/**
 * Resolve a full round deterministically from inputs.
 * This is the authoritative logic — the UI must never compute scores itself.
 */
export function resolveRound(input: RoundResolutionInput): RoundResolution {
  const { question, players, answers, abilityActions } = input;

  // 1. Determine correctness per player
  const correctMap: Record<string, boolean> = {};
  for (const p of players) {
    const a = answers[p.id];
    correctMap[p.id] = !!a && a.selectedIndex === question.correctIndex;
  }

  // 2. Index ability actions
  const shields = new Set<string>();
  const blocksByTarget: Record<string, Set<string>> = {}; // defenderId -> set of attackerIds blocked
  const penaltiesByTarget: Record<string, number> = {}; // targetId -> count
  const counters = new Set<string>(); // playerIds who activated counter

  for (const action of abilityActions) {
    switch (action.abilityId) {
      case 'shield':
        shields.add(action.playerId);
        break;
      case 'block':
        if (action.targetId) {
          if (!blocksByTarget[action.targetId])
            blocksByTarget[action.targetId] = new Set();
          blocksByTarget[action.targetId].add(action.playerId);
        }
        break;
      case 'penalty':
        if (action.targetId) {
          penaltiesByTarget[action.targetId] =
            (penaltiesByTarget[action.targetId] ?? 0) + 1;
        }
        break;
      case 'counter':
        counters.add(action.playerId);
        break;
    }
  }

  // 3. Resolve zartal attempts (attacker -> defender)
  interface ZartalResolution {
    attackerId: string;
    defenderId: string;
    success: boolean;
    counterFired: boolean;
  }
  const zartalResolutions: ZartalResolution[] = [];
  const successfulAttackers = new Set<string>();
  const successfulDefenders = new Set<string>();
  const counterFiredBy = new Set<string>();

  const attempts: { attackerId: string; defenderId: string }[] = [];
  for (const p of players) {
    const a = answers[p.id];
    if (a?.zartalTargetId && a.zartalTargetId !== p.id) {
      attempts.push({ attackerId: p.id, defenderId: a.zartalTargetId });
    }
  }

  for (const att of attempts) {
    const attackerCorrect = correctMap[att.attackerId] ?? false;
    const defenderCorrect = correctMap[att.defenderId] ?? false;
    const defenderShielded = shields.has(att.defenderId);
    const attackerBlocked =
      blocksByTarget[att.defenderId]?.has(att.attackerId) ?? false;

    const res = resolveZartal({
      attackerCorrect,
      defenderCorrect,
      defenderShielded,
      attackerBlocked,
    });

    let success = res.success;
    let counterFired = false;

    // Counter: if defender activated counter and this zartal would succeed,
    // the zartal is reflected back: attacker takes the zartal penalty instead.
    if (success && counters.has(att.defenderId) && !counterFiredBy.has(att.defenderId)) {
      counterFired = true;
      counterFiredBy.add(att.defenderId);
      success = false;
      // attacker takes -40 (counter penalty)
      successfulDefenders.add(att.attackerId); // mark attacker as "zartaled"
    }

    zartalResolutions.push({
      attackerId: att.attackerId,
      defenderId: att.defenderId,
      success,
      counterFired,
    });

    if (success) {
      successfulAttackers.add(att.attackerId);
      successfulDefenders.add(att.defenderId);
    }
  }

  // 4. Build result rows
  const rows: Record<string, RoundResultRow> = {};
  const rowsList: RoundResultRow[] = [];

  for (const p of players) {
    const answeredCorrectly = correctMap[p.id] ?? false;
    const zartaledByMe = successfulAttackers.has(p.id);
    const zartaledMeBy = successfulDefenders.has(p.id);

    const outcome = computeOutcome({
      answeredCorrectly,
      zartaledByMe,
      zartaledMeBy,
    });

    let pointsDelta = outcome.pointsEarned;

    // Penalty ability: -30 per penalty on a player who answered wrong
    if (penaltiesByTarget[p.id] && !answeredCorrectly) {
      pointsDelta += penaltiesByTarget[p.id] * -30;
    }

    const row: RoundResultRow = {
      playerId: p.id,
      outcome,
      labels: outcome.labels,
      pointsDelta,
    };
    rows[p.id] = row;
    rowsList.push(row);
  }

  return { rows, rowsList };
}

/**
 * Apply round deltas to players and return a new players map.
 */
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
    const nextAbility = applyAbilityUse(
      {
        playerId: p.id,
        usedCounts: p.abilityUsedCounts,
      },
      a.abilityId
    );
    next[a.playerId] = {
      ...p,
      abilityUsedCounts: nextAbility.usedCounts,
    };
  }
  return next;
}

export { POINTS };
