import type {
  RoomConfig,
  Player,
  GameState,
  AbilityAction,
  AnswerSubmission,
  Nudge,
  RoomPhase,
  RoundChoice,
} from '../types/game';
import type { CategoryId } from '../features/game/categories';

export interface RoomSummary {
  code: string;
  hostName: string;
  playerCount: number;
  phase: RoomPhase;
  createdAt: number;
}

export type ConnectionState = 'connecting' | 'online' | 'reconnecting' | 'offline' | 'error';

export interface ServiceEvent {
  type:
    | 'state'
    | 'player_joined'
    | 'player_left'
    | 'player_ready'
    | 'nudge'
    | 'phase_changed'
    | 'fake_submitted'
    | 'choices_ready'
    | 'pick_submitted'
    | 'answer_submitted'
    | 'ability_used'
    | 'round_resolved'
    | 'game_over'
    | 'connection'
    | 'error';
  payload?: unknown;
}

export type ServiceEventHandler = (event: ServiceEvent) => void;

export interface GameService {
  readonly kind: 'demo' | 'supabase';

  connect(): Promise<void>;
  disconnect(): void;
  subscribe(handler: ServiceEventHandler): () => void;

  getConnectionState(): ConnectionState;

  // Auth
  signInAnonymously(name: string, avatarKey: string): Promise<Player>;
  getCurrentPlayer(): Player | null;
  signOut(): Promise<void>;

  // Rooms
  createRoom(config: {
    hostName: string;
    avatarKey: string;
    totalRounds: number;
    roundSeconds: number;
    categories: CategoryId[];
  }): Promise<{ code: string; playerId: string }>;
  joinRoom(code: string, name: string, avatarKey: string): Promise<{ playerId: string }>;
  leaveRoom(code: string): Promise<void>;
  getRoomState(code: string): Promise<GameState | null>;
  listOpenRooms(): Promise<RoomSummary[]>;

  // Lobby
  setReady(code: string, ready: boolean): Promise<void>;
  nudgePlayer(code: string, toId: string): Promise<Nudge>;
  startGame(code: string): Promise<void>;

  // ZARTO Bluff Game flow
  submitFakeAnswer(code: string, fakeAnswer: string): Promise<void>;
  getRoundChoices(code: string): Promise<RoundChoice[]>;
  submitPick(code: string, choiceIndex: number): Promise<void>;
  useAbility(code: string, action: AbilityAction): Promise<void>;
  advancePhase(code: string): Promise<void>;
  rematch(code: string): Promise<void>;

  // Backward-compatible submit
  submitAnswer(code: string, submission: AnswerSubmission): Promise<void>;

  // Profile / leaderboard
  getLeaderboard(): Promise<Player[]>;
  getProfile(playerId: string): Promise<Player | null>;
}

export class ServiceError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ServiceError';
  }
}
