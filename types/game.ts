import type { AbilityId } from '../features/game/abilities';
import type { CategoryId } from '../features/game/categories';
import type { OutcomeLabel, RoundOutcome } from '../features/game/outcomes';

export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  avatarKey: string; // key into AVATARS map
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
  score: number;
  abilityUsedCounts: Record<AbilityId, number>;
}

export type RoomPhase =
  | 'lobby'
  | 'category_select'
  | 'ability_select'
  | 'question'
  | 'submitting'
  | 'waiting'
  | 'reveal'
  | 'scoreboard'
  | 'game_over';

export interface RoomConfig {
  code: string;
  hostId: PlayerId;
  maxPlayers: number;
  minPlayers: number;
  totalRounds: number;
  roundSeconds: number;
  selectedCategoryIds: CategoryId[];
}

export interface ZartalAttempt {
  attackerId: PlayerId;
  defenderId: PlayerId;
}

export interface AbilityAction {
  playerId: PlayerId;
  abilityId: AbilityId;
  targetId?: PlayerId;
}

export interface AnswerSubmission {
  playerId: PlayerId;
  questionId: string;
  selectedIndex: number;
  zartalTargetId?: PlayerId;
}

export interface RoundResultRow {
  playerId: PlayerId;
  outcome: RoundOutcome;
  labels: OutcomeLabel[];
  pointsDelta: number;
}

export interface GameState {
  config: RoomConfig;
  players: Record<PlayerId, Player>;
  phase: RoomPhase;
  currentRound: number;
  currentQuestionId: string | null;
  answers: Record<PlayerId, AnswerSubmission>;
  abilityActions: AbilityAction[];
  roundResults: Record<PlayerId, RoundResultRow>;
  history: RoundResultRow[][];
}

export interface Nudge {
  fromId: PlayerId;
  toId: PlayerId;
  at: number;
}
