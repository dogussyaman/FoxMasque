export interface PlayerAchievementStats {
  gamesPlayed?: number | null;
  gamesWon?: number | null;
  correctAnswers?: number | null;
  successfulTraps?: number | null;
}

type AchievementMetric = keyof PlayerAchievementStats;

interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  metric: AchievementMetric;
  target: number;
}

export interface AchievementProgress extends AchievementDefinition {
  progress: number;
  progressPercent: number;
  unlocked: boolean;
}

const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: 'first-match', title: 'İlk Adım', description: 'İlk maçını tamamla.', icon: '🦊', metric: 'gamesPlayed', target: 1 },
  { id: 'game-regular', title: 'Oyun Kurdu', description: '10 maçı tamamla.', icon: '🎮', metric: 'gamesPlayed', target: 10 },
  { id: 'red-legend', title: 'Kızıl Efsane', description: '50 maçı tamamla.', icon: '👑', metric: 'gamesPlayed', target: 50 },
  { id: 'first-win', title: 'İlk Zafer', description: 'İlk galibiyetini kazan.', icon: '🏆', metric: 'gamesWon', target: 1 },
  { id: 'champion', title: 'Şampiyon', description: '5 maç kazan.', icon: '🥇', metric: 'gamesWon', target: 5 },
  { id: 'first-trap', title: 'İlk Tuzak', description: 'İlk başarılı tuzağını kur.', icon: '🎯', metric: 'successfulTraps', target: 1 },
  { id: 'trap-master', title: 'Tuzak Ustası', description: '10 başarılı tuzak kur.', icon: '🃏', metric: 'successfulTraps', target: 10 },
  { id: 'fox-master', title: 'Usta Tilki', description: '25 başarılı tuzağa ulaş.', icon: '🦊', metric: 'successfulTraps', target: 25 },
  { id: 'sharp-mind', title: 'Keskin Zihin', description: '25 doğru cevap ver.', icon: '🧠', metric: 'correctAnswers', target: 25 },
  { id: 'wise-fox', title: 'Bilge Tilki', description: '100 doğru cevap ver.', icon: '✨', metric: 'correctAnswers', target: 100 },
] as const;

function toSafeCount(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

/**
 * Derive achievements from persisted profile statistics. This is deliberately
 * pure: it does not mutate wallet balances, award points, or write to Supabase.
 */
export function getPlayerAchievements(
  stats: PlayerAchievementStats | null | undefined
): AchievementProgress[] {
  const safeStats = stats ?? {};

  return ACHIEVEMENTS.map((achievement) => {
    const count = toSafeCount(safeStats[achievement.metric]);
    return {
      ...achievement,
      progress: Math.min(count, achievement.target),
      progressPercent: Math.min(100, Math.floor((count / achievement.target) * 100)),
      unlocked: count >= achievement.target,
    };
  });
}
