export type OutcomeKind =
  | 'correct' // DOĞRU BİLDİN (+100)
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
  | { kind: 'zartaladın'; text: 'TUZAK KURDUN'; detail: string; tone: 'purple' }
  | { kind: 'zartalandın'; text: 'TUZAĞA DÜŞTÜN'; detail: string; tone: 'danger' }
  | { kind: 'blocked'; text: 'BLOKLANDIN'; detail: string; tone: 'neutral' };

export const POINTS = {
  correct: 100,
  fakeChosenBonus: 50, // bonus per victim choosing your fake answer
  zartaladınBonus: 50, // alias for backward-compatibility
  tuzakKurdunBonus: 50, // alias
  victimPenalty: -40, // penalty when you choose someone else's fake answer
  zartalandınPenalty: -40, // alias for backward-compatibility
  tuzağaDüştünPenalty: -40, // alias
  wrong: 0,
} as const;

/**
 * Compute the outcome for a single player in a TUZAK round.
 *
 * Rules:
 * - If you chose the real answer: DOĞRU BİLDİN (+100)
 * - For each rival that chose your fake answer: TUZAK KURDUN (+50 per victim)
 * - If you chose another player's fake answer: TUZAĞA DÜŞTÜN (-40 penalty, never show DOĞRU BİLDİN)
 * - Both can occur in the same round: correct (+100) + tricks (e.g. 2 x +50 = +100) => +200!
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
      detail: 'Gerçek cevabı buldun, +100 puan!',
      tone: 'success',
    });
  }

  // 2. Tricked rivals with your fake answer
  if (victimsCount > 0) {
    const bonus = victimsCount * POINTS.fakeChosenBonus;
    points += bonus;
    labels.push({
      kind: 'zartaladın',
      text: 'TUZAK KURDUN',
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
      detail: 'Bir rakibin tuzağına düştün, -40 puan.',
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
