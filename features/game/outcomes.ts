export type OutcomeKind =
  | 'correct' // DOĞRU BİLDİN (+2)
  | 'zartaladın' // ZARTALADIN (+50 per victim tricked by your fake answer)
  | 'zartalandın' // ZARTALANDIN (-40 when you chose another player's fake answer)
  | 'blocked'; // Turu atladın / bloklandın

export interface RoundOutcome {
  correct: boolean;
  zartaladın: boolean;
  zartalandın: boolean;
  victimsCount: number;
  pointsEarned: number;
  labels: OutcomeLabel[];
}

export type OutcomeLabel =
  | { kind: 'correct'; text: 'DOĞRU BİLDİN'; detail: string; tone: 'success' }
  | { kind: 'zartaladın'; text: 'TUZAĞA DÜŞÜRDÜN'; detail: string; tone: 'purple' }
  | { kind: 'zartalandın'; text: 'TUZAĞA DÜŞTÜN'; detail: string; tone: 'danger' }
  | { kind: 'blocked'; text: 'BLOKLANDIN'; detail: string; tone: 'neutral' };

export const POINTS = {
  correct: 2,
  fakeChosenBonus: 1,
  zartaladınBonus: 1,
  tuzakKurdunBonus: 1,
  tuzağaDüşürdünBonus: 1,
  victimPenalty: 0,
  zartalandınPenalty: 0,
  tuzağaDüştünPenalty: 0,
  wrong: 0,
} as const;} as const;

/**
 * Compute the outcome for a single player in a TUZAK round.
 *
 * Rules:
 * - If you chose the real answer: DOĞRU BİLDİN (+2)
 * - For each rival that chose your fake answer: TUZAĞA DÜŞÜRDÜN (+1 per victim)
 * - If you chose another player's fake answer: TUZAĞA DÜŞTÜN (no score penalty)
 * - Both can occur in the same round: correct (+2) + tricks (e.g. 2 x +1) => +4!
 */
export function computeOutcome(input: {
  answeredCorrectly: boolean;
  victimsCount: number;
  choseRivalFake: boolean;
  isBlocked?: boolean;
}): RoundOutcome {
  const { answeredCorrectly, victimsCount, choseRivalFake, isBlocked } = input;

  if (isBlocked) {
    return {
      correct: false,
      zartaladın: false,
      zartalandın: false,
      victimsCount: 0,
      pointsEarned: 0,
      labels: [
        {
          kind: 'blocked',
          text: 'BLOKLANDIN',
          detail: 'Bu tur bloklandığın için puan kazanamadın.',
          tone: 'neutral',
        },
      ],
    };
  }

  let points = 0;
  const labels: OutcomeLabel[] = [];

  // 1. Correct answer
  if (answeredCorrectly) {
    points += POINTS.correct;
    labels.push({
      kind: 'correct',
      text: 'DOĞRU BİLDİN',
      detail: 'Gerçek cevabı buldun, +2 puan!',
      tone: 'success',
    });
  }

  // 2. Tricked rivals with your fake answer
  if (victimsCount > 0) {
    const bonus = victimsCount * POINTS.fakeChosenBonus;
    points += bonus;
    labels.push({
      kind: 'zartaladın',
      text: 'TUZAĞA DÜŞÜRDÜN',
      detail: `${victimsCount} rakip senin tuzağına düştü (+${bonus} puan)!`,
      tone: 'purple',
    });
  }

  // 3. You fell for another player's fake answer
  if (choseRivalFake) {
    points += POINTS.victimPenalty;
    labels.push({
      kind: 'zartalandın',
      text: 'TUZAĞA DÜŞTÜN',
      detail: 'Bu tur doğru cevabı bulamadın; puan kaybetmedin.',
      tone: 'danger',
    });
  }

  return {
    correct: answeredCorrectly,
    zartaladın: victimsCount > 0,
    zartalandın: choseRivalFake,
    victimsCount,
    pointsEarned: points,
    labels,
  };
}
