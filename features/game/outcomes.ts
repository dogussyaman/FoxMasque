export type OutcomeKind =
  | 'correct' // DOĞRU BİLDİN
  | 'zartaladın' // you successfully zartaled someone else (and your answer correct)
  | 'zartalandın'; // you were zartaled by someone

export interface RoundOutcome {
  correct: boolean;
  zartaladın: boolean; // you zartaled another player
  zartalandın: boolean; // you were zartaled by another
  pointsEarned: number;
  // labels for UI
  labels: OutcomeLabel[];
}

export type OutcomeLabel =
  | { kind: 'correct'; text: 'DOĞRU BİLDİN'; detail: string; tone: 'success' }
  | { kind: 'zartaladın'; text: 'ZARTALADIN'; detail: string; tone: 'purple' }
  | { kind: 'zartalandın'; text: 'ZARTALANDIN'; detail: string; tone: 'danger' };

export const POINTS = {
  correct: 100,
  zartaladınBonus: 50, // bonus for successful zartal
  zartalandınPenalty: -40, // penalty when you are zartaled
  wrong: 0,
} as const;

/**
 * Compute the outcome for a single player in a round.
 *
 * Rules:
 * - If you answered correctly: you get DOĞRU BİLDİN (+100).
 * - If you successfully zartaled another player (your answer correct AND
 *   target's answer wrong): you get ZARTALADIN (+50 bonus).
 * - If another player successfully zartaled you (their answer correct AND
 *   your answer wrong): you get ZARTALANDIN (-40 penalty).
 * - A player can both ZARTALADIN and be ZARTALANDIN in the same round only
 *   across different opponents; against the same opponent, a successful
 *   zartal blocks the incoming zartal.
 */
export function computeOutcome(input: {
  answeredCorrectly: boolean;
  zartaledByMe: boolean; // I successfully zartaled my target
  zartaledMeBy: boolean; // someone successfully zartaled me
}): RoundOutcome {
  const { answeredCorrectly, zartaledByMe, zartaledMeBy } = input;

  let points = 0;
  const labels: OutcomeLabel[] = [];

  if (answeredCorrectly) {
    points += POINTS.correct;
    labels.push({
      kind: 'correct',
      text: 'DOĞRU BİLDİN',
      detail: 'Soruyu doğru bildin, +100 puan!',
      tone: 'success',
    });
  }

  if (zartaledByMe) {
    points += POINTS.zartaladınBonus;
    labels.push({
      kind: 'zartaladın',
      text: 'ZARTALADIN',
      detail: 'Rakibini zartaladın, +50 bonus!',
      tone: 'purple',
    });
  }

  if (zartaledMeBy) {
    points += POINTS.zartalandınPenalty;
    labels.push({
      kind: 'zartalandın',
      text: 'ZARTALANDIN',
      detail: 'Bir rakip seni zartaladı, -40 puan.',
      tone: 'danger',
    });
  }

  return {
    correct: answeredCorrectly,
    zartaladın: zartaledByMe,
    zartalandın: zartaledMeBy,
    pointsEarned: points,
    labels,
  };
}

/**
 * Resolve a zartal attempt between two players.
 * A zartal is "successful" only when:
 *  - the attacker answered correctly, AND
 *  - the defender answered incorrectly, AND
 *  - the defender did not have an active Shield, AND
 *  - the attacker was not Blocked from that defender this round.
 */
export function resolveZartal(input: {
  attackerCorrect: boolean;
  defenderCorrect: boolean;
  defenderShielded: boolean;
  attackerBlocked: boolean;
}): { success: boolean; reason: string } {
  if (!input.attackerCorrect) {
    return { success: false, reason: 'Soruyu yanlış cevapladın, zartal geçersiz.' };
  }
  if (input.attackerBlocked) {
    return { success: false, reason: 'Rakibin seni engelledi, zartal bloklandı.' };
  }
  if (input.defenderCorrect) {
    return { success: false, reason: 'Rakip de doğru bildi, zartal tutmadı.' };
  }
  if (input.defenderShielded) {
    return { success: false, reason: 'Rakibin kalkanı vardı, zartal tutmadı.' };
  }
  return { success: true, reason: 'Zartal başarılı!' };
}
