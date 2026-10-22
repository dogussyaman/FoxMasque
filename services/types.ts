import type {
  RoomConfig,
  Player,
  GameState,
  AbilityAction,
  AnswerSubmission,
  Nudge,
  RoomPhase,
  RoundChoice,
  RoundProgress,
} from '../types/game';
import type { CategoryId } from '../features/game/categories';
import type { Question } from '../features/game/questions';

export interface RoomSummary {
  code: string;
  hostName: string;
  playerCount: number;
  phase: RoomPhase;
  createdAt: number;
}

export type ConnectionState = 'connecting' | 'online' | 'reconnecting' | 'offline' | 'error';
export type RelationshipStatus =
  | 'none'
  | 'outgoing_pending'
  | 'incoming_pending'
  | 'friends'
  | 'blocked';

export interface SocialPlayer {
  id: string;
  name: string;
  avatarKey: string;
  avatarUrl?: string | null;
  relationshipStatus: RelationshipStatus;
}

export interface FriendRequest extends SocialPlayer {
  requestId: string;
  createdAt: number;
}

export interface EmailSignUpResult {
  player: Player | null;
  needsEmailConfirmation: boolean;
}

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
    | 'auth_state'
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
  signUpWithEmail(email: string, password: string, name: string): Promise<EmailSignUpResult>;
  signInWithEmail(email: string, password: string): Promise<Player>;
  signInWithGoogle(): Promise<Player>;
  completeOAuthCallback(code: string): Promise<Player>;
  sendPasswordResetEmail(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  refreshSession(): Promise<void>;
  getCurrentPlayer(): Player | null;
  updatePlayerProfile(name: string, avatarKey: string): Promise<Player>;
  uploadAvatar(base64: string, mimeType: string): Promise<string>;
  signOut(): Promise<void>;

  // Rooms
  createRoom(config: {
    hostName: string;
    avatarKey: string;
    totalRounds: number;
    roundSeconds: number;
    categories: CategoryId[];
    isPrivate?: boolean;
    password?: string;
  }): Promise<{ code: string; playerId: string }>;
  joinRoom(code: string, name: string, avatarKey: string, password?: string): Promise<{ playerId: string }>;
  leaveRoom(code: string): Promise<void>;
  getRoomState(code: string): Promise<GameState | null>;
  getCurrentQuestion(code: string): Promise<Question | null>;
  listOpenRooms(): Promise<RoomSummary[]>;

  // Lobby
  setReady(code: string, ready: boolean): Promise<void>;
  nudgePlayer(code: string, toId: string): Promise<Nudge>;
  startGame(code: string): Promise<void>;
  markCurrentQuestionSeen(code: string): Promise<void>;

  // ZARTO Bluff Game flow
  submitFakeAnswer(code: string, fakeAnswer: string): Promise<void>;
  getRoundChoices(code: string): Promise<RoundChoice[]>;
  submitPick(code: string, choiceIndex: number): Promise<void>;
  useAbility(code: string, action: AbilityAction): Promise<void>;
  confirmAbilitySelection(code: string): Promise<void>;
  advancePhase(code: string): Promise<void>;
  rematch(code: string): Promise<void>;
  advanceExpiredPhase(code: string): Promise<boolean>;
  getRoomProgress(code: string): Promise<RoundProgress>;

  // Backward-compatible submit
  submitAnswer(code: string, submission: AnswerSubmission): Promise<void>;

  // Profile / leaderboard
  getLeaderboard(): Promise<Player[]>;
  getProfile(playerId: string): Promise<Player | null>;
  getRelationshipStatus(playerId: string): Promise<RelationshipStatus>;
  sendFriendRequest(playerId: string): Promise<RelationshipStatus>;
  respondFriendRequest(requestId: string, accept: boolean): Promise<RelationshipStatus>;
  cancelFriendRequest(requestId: string): Promise<void>;
  removeFriend(playerId: string): Promise<void>;
  blockUser(playerId: string): Promise<void>;
  unblockUser(playerId: string): Promise<void>;
  listFriends(): Promise<SocialPlayer[]>;
  listFriendRequests(): Promise<FriendRequest[]>;
}

export class ServiceError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ServiceError';
  }
}
