import type { CategoryId } from '../features/game/categories';
import { pickQuestions, QUESTIONS } from '../features/game/questions';
import {
  freshAbilityState,
} from '../features/game/abilities';
import {
  applyAbilityActionsToPlayers,
  applyRoundToPlayers,
  resolveRound,
} from '../features/game/engine';
import type {
  AbilityAction,
  AnswerSubmission,
  GameState,
  Nudge,
  Player,
  RoomConfig,
  RoomPhase,
} from '../types/game';
import { makeSamplePlayers, pickAvatarKey } from '../features/game/players';
import type {
  ConnectionState,
  GameService,
  RoomSummary,
  ServiceEvent,
  ServiceEventHandler,
} from './types';
import { ServiceError } from './types';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

interface DemoRoom {
  config: RoomConfig;
  players: Record<string, Player>;
  phase: RoomPhase;
  currentRound: number;
  currentQuestionId: string | null;
  answers: Record<string, AnswerSubmission>;
  abilityActions: AbilityAction[];
  nudges: Nudge[];
  createdAt: number;
  questionQueue: string[];
}

/**
 * Local demo adapter — single-device, seeded with sample players.
 * Clearly labeled: NOT live multiplayer. Use the Supabase adapter for online play.
 */
export class DemoGameService implements GameService {
  readonly kind = 'demo' as const;

  private connection: ConnectionState = 'offline';
  private handlers = new Set<ServiceEventHandler>();
  private rooms = new Map<string, DemoRoom>();
  private currentPlayer: Player | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private leaderboard: Player[] = [];

  async connect(): Promise<void> {
    this.connection = 'online';
    this.emit({ type: 'connection', payload: { state: 'online' } });
  }

  disconnect(): void {
    this.connection = 'offline';
    if (this.timer) clearTimeout(this.timer);
  }

  subscribe(handler: ServiceEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  getConnectionState(): ConnectionState {
    return this.connection;
  }

  private emit(event: ServiceEvent) {
    for (const h of this.handlers) h(event);
  }

  async signInAnonymously(name: string, avatarKey: string): Promise<Player> {
    const player: Player = {
      id: `me-${Date.now()}`,
      name: name.trim() || 'Sen',
      avatarKey,
      isHost: false,
      isReady: false,
      isOnline: true,
      score: 0,
      abilityUsedCounts: { block: 0, shield: 0, penalty: 0, counter: 0 },
    };
    this.currentPlayer = player;
    return player;
  }

  getCurrentPlayer(): Player | null {
    return this.currentPlayer;
  }

  async signOut(): Promise<void> {
    this.currentPlayer = null;
  }

  async createRoom(config: {
    hostName: string;
    avatarKey: string;
    totalRounds: number;
    roundSeconds: number;
    categories: CategoryId[];
  }): Promise<{ code: string; playerId: string }> {
    if (!this.currentPlayer) {
      await this.signInAnonymously(config.hostName, config.avatarKey);
    }
    const me = this.currentPlayer!;
    const code = generateCode();
    const hostId = me.id;
    const hostPlayer: Player = {
      ...me,
      isHost: true,
      isReady: true,
    };
    const samples = makeSamplePlayers(3, -1).map((p) => ({
      ...p,
      id: `${code}-${p.id}`,
      isHost: false,
    }));
    const players: Record<string, Player> = { [hostId]: hostPlayer };
    for (const s of samples) players[s.id] = s;

    const roomConfig: RoomConfig = {
      code,
      hostId,
      maxPlayers: 10,
      minPlayers: 2,
      totalRounds: config.totalRounds,
      roundSeconds: config.roundSeconds,
      selectedCategoryIds: config.categories,
    };

    const room: DemoRoom = {
      config: roomConfig,
      players,
      phase: 'lobby',
      currentRound: 1,
      currentQuestionId: null,
      answers: {},
      abilityActions: [],
      nudges: [],
      createdAt: Date.now(),
      questionQueue: [],
    };
    this.rooms.set(code, room);
    this.currentPlayer = hostPlayer;
    this.emit({ type: 'state', payload: this.snapshot(code) });
    return { code, playerId: hostId };
  }

  async joinRoom(code: string, name: string, avatarKey: string): Promise<{ playerId: string }> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    const ids = Object.values(room.players).map((p) => p.avatarKey);
    const key = avatarKey || pickAvatarKey(ids);
    if (!this.currentPlayer) await this.signInAnonymously(name, key);
    const me = this.currentPlayer!;
    if (!room.players[me.id]) {
      room.players[me.id] = { ...me, isReady: false };
    }
    this.emit({ type: 'player_joined', payload: { code, player: room.players[me.id] } });
    this.emit({ type: 'state', payload: this.snapshot(code) });
    return { playerId: me.id };
  }

  async leaveRoom(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) return;
    if (this.currentPlayer) delete room.players[this.currentPlayer.id];
    this.emit({ type: 'player_left', payload: { code } });
  }

  getRoomState(code: string): Promise<GameState | null> {
    return Promise.resolve(this.snapshot(code));
  }

  listOpenRooms(): Promise<RoomSummary[]> {
    const list: RoomSummary[] = [];
    for (const room of this.rooms.values()) {
      const host = Object.values(room.players).find((p) => p.isHost);
      list.push({
        code: room.config.code,
        hostName: host?.name ?? 'Bilinmiyor',
        playerCount: Object.keys(room.players).length,
        phase: room.phase,
        createdAt: room.createdAt,
      });
    }
    return Promise.resolve(list);
  }

  async setReady(code: string, ready: boolean): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    if (this.currentPlayer) {
      room.players[this.currentPlayer.id] = {
        ...room.players[this.currentPlayer.id],
        isReady: ready,
      };
    }
    this.emit({ type: 'player_ready', payload: { code } });
    this.emit({ type: 'state', payload: this.snapshot(code) });
  }

  async nudgePlayer(code: string, toId: string): Promise<Nudge> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    const nudge: Nudge = {
      fromId: this.currentPlayer?.id ?? '',
      toId,
      at: Date.now(),
    };
    room.nudges.push(nudge);
    this.emit({ type: 'nudge', payload: { code, nudge } });
    return nudge;
  }

  async startGame(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    const readyCount = Object.values(room.players).filter((p) => p.isReady).length;
    const total = Object.keys(room.players).length;
    if (readyCount < 2) throw new ServiceError('NOT_ENOUGH_READY', 'En az 2 oyuncu hazır olmalı.');
    void total;
    room.phase = 'ability_select';
    room.currentRound = 1;
    this.prepareRoundQuestions(room);
    this.emit({ type: 'phase_changed', payload: { code, phase: room.phase } });
    this.emit({ type: 'state', payload: this.snapshot(code) });
  }

  private prepareRoundQuestions(room: DemoRoom) {
    const qs = pickQuestions(room.config.selectedCategoryIds, room.config.totalRounds, room.currentRound);
    room.questionQueue = qs.map((q) => q.id);
  }

  async submitAnswer(code: string, submission: AnswerSubmission): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    room.answers[submission.playerId] = submission;
    this.emit({ type: 'answer_submitted', payload: { code } });
    // Demo: auto-advance once everyone (or a majority) submitted
    const total = Object.keys(room.players).length;
    const submitted = Object.keys(room.answers).length;
    if (submitted >= total) {
      room.phase = 'reveal';
      this.resolveAndBroadcast(code);
    } else {
      this.emit({ type: 'state', payload: this.snapshot(code) });
    }
  }

  async useAbility(code: string, action: AbilityAction): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    room.abilityActions.push(action);
    this.emit({ type: 'ability_used', payload: { code, action } });
    this.emit({ type: 'state', payload: this.snapshot(code) });
  }

  advancePhase(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    this.advance(code);
    return Promise.resolve();
  }

  private advance(code: string) {
    const room = this.rooms.get(code);
    if (!room) return;
    const order: RoomPhase[] = [
      'ability_select',
      'question',
      'reveal',
      'scoreboard',
    ];
    const idx = order.indexOf(room.phase);
    if (room.phase === 'reveal') {
      room.phase = 'scoreboard';
      this.emit({ type: 'phase_changed', payload: { code, phase: room.phase } });
      this.emit({ type: 'state', payload: this.snapshot(code) });
      return;
    }
    if (room.phase === 'scoreboard') {
      if (room.currentRound >= room.config.totalRounds) {
        room.phase = 'game_over';
        this.emit({ type: 'game_over', payload: { code } });
      } else {
        room.currentRound += 1;
        room.phase = 'ability_select';
        room.answers = {};
        room.abilityActions = [];
        this.prepareRoundQuestions(room);
      }
      this.emit({ type: 'phase_changed', payload: { code, phase: room.phase } });
      this.emit({ type: 'state', payload: this.snapshot(code) });
      return;
    }
    if (idx >= 0 && idx < order.length - 1) {
      room.phase = order[idx + 1];
      if (room.phase === 'question') {
        room.currentQuestionId = room.questionQueue[0] ?? null;
      }
      this.emit({ type: 'phase_changed', payload: { code, phase: room.phase } });
      this.emit({ type: 'state', payload: this.snapshot(code) });
    }
  }

  private resolveAndBroadcast(code: string) {
    const room = this.rooms.get(code);
    if (!room || !room.currentQuestionId) return;
    const question = QUESTIONS.find((q) => q.id === room.currentQuestionId);
    if (!question) return;

    const playersList = Object.values(room.players);
    const { rows } = resolveRound({
      question,
      players: playersList,
      answers: room.answers,
      abilityActions: room.abilityActions,
    });
    room.players = applyRoundToPlayers(room.players, rows);
    room.players = applyAbilityActionsToPlayers(room.players, room.abilityActions);
    this.emit({ type: 'round_resolved', payload: { code, rows } });
    this.emit({ type: 'state', payload: this.snapshot(code) });
  }

  async getLeaderboard(): Promise<Player[]> {
    if (this.leaderboard.length === 0) {
      this.leaderboard = makeSamplePlayers(10, 0).map((p, i) => ({
        ...p,
        score: 980 - i * 75,
        name: p.name,
      }));
    }
    return [...this.leaderboard].sort((a, b) => b.score - a.score);
  }

  async getProfile(playerId: string): Promise<Player | null> {
    if (this.currentPlayer?.id === playerId) return this.currentPlayer;
    const lb = await this.getLeaderboard();
    return lb.find((p) => p.id === playerId) ?? null;
  }

  private snapshot(code: string): GameState | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    return {
      config: room.config,
      players: room.players,
      phase: room.phase,
      currentRound: room.currentRound,
      currentQuestionId: room.currentQuestionId,
      answers: room.answers,
      abilityActions: room.abilityActions,
      roundResults: {},
      history: [],
    };
  }
}

void freshAbilityState;
