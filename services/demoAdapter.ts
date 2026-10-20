import type { CategoryId } from '../features/game/categories';
import { pickQuestions, QUESTIONS } from '../features/game/questions';
import { freshAbilityState } from '../features/game/abilities';
import { blendChoices, resolveZartoRound } from '../features/game/engine';
import type {
  AbilityAction,
  AnswerSubmission,
  GameState,
  Nudge,
  Player,
  PlayerId,
  RoomConfig,
  RoomPhase,
  RoundChoice,
  RoundResultRow,
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
  fakeAnswers: Record<string, string>;
  choices: RoundChoice[];
  picks: Record<string, number>;
  answers: Record<string, AnswerSubmission>;
  abilityActions: AbilityAction[];
  roundResults: Record<string, RoundResultRow>;
  nudges: Nudge[];
  createdAt: number;
  questionQueue: string[];
}

export class DemoGameService implements GameService {
  readonly kind = 'demo' as const;

  private connection: ConnectionState = 'offline';
  private handlers = new Set<ServiceEventHandler>();
  private rooms = new Map<string, DemoRoom>();
  private currentPlayer: Player | null = null;
  private leaderboard: Player[] = [];

  async connect(): Promise<void> {
    this.connection = 'online';
    this.emit({ type: 'connection', payload: { state: 'online' } });
  }

  disconnect(): void {
    this.connection = 'offline';
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
      consecutiveCorrect: 0,
      shieldsAvailable: 0,
      blocksAvailable: 0,
      isBlockedCurrentRound: false,
      isBlockedNextRound: false,
      lastBlockedPlayerId: null,
    };
    this.currentPlayer = player;
    return player;
  }

  getCurrentPlayer(): Player | null {
    return this.currentPlayer;
  }

  async updatePlayerProfile(name: string, avatarKey: string): Promise<Player> {
    if (!this.currentPlayer) {
      throw new ServiceError('PROFILE_NOT_FOUND', 'Profil bilgisi bulunamadı.');
    }
    this.currentPlayer = { ...this.currentPlayer, name, avatarKey };
    for (const [code, room] of this.rooms) {
      const player = room.players[this.currentPlayer.id];
      if (player) {
        room.players[this.currentPlayer.id] = { ...player, name, avatarKey };
        this.emit({ type: 'state', payload: this.snapshot(code) });
      }
    }
    return this.currentPlayer;
  }

  async uploadAvatar(): Promise<string> {
    throw new ServiceError('AVATAR_UPLOAD_UNAVAILABLE', 'Fotoğraf yüklemek için canlı oyun modu gerekir.');
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
      isReady: true,
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
      fakeAnswers: {},
      choices: [],
      picks: {},
      answers: {},
      abilityActions: [],
      roundResults: {},
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
    this.emit({ type: 'state', payload: this.snapshot(code) });
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
    if (readyCount < 2) throw new ServiceError('NOT_ENOUGH_READY', 'En az 2 oyuncu hazır olmalı.');

    this.prepareRoundQuestions(room);
    room.phase = 'ability_select';
    room.currentRound = 1;
    room.currentQuestionId = room.questionQueue[0] ?? QUESTIONS[0].id;
    this.emit({ type: 'phase_changed', payload: { code, phase: room.phase } });
    this.emit({ type: 'state', payload: this.snapshot(code) });
  }

  private prepareRoundQuestions(room: DemoRoom) {
    const qs = pickQuestions(room.config.selectedCategoryIds, room.config.totalRounds, room.currentRound);
    room.questionQueue = qs.map((q) => q.id);
  }

  async useAbility(code: string, action: AbilityAction): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    room.abilityActions.push(action);
    this.emit({ type: 'ability_used', payload: { code, action } });
    this.emit({ type: 'state', payload: this.snapshot(code) });
  }

  // Step 1 of round: Submit fake answer
  async submitFakeAnswer(code: string, fakeAnswer: string): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    const meId = this.currentPlayer?.id ?? 'me';
    const clean = fakeAnswer.trim();
    if (clean) {
      room.fakeAnswers[meId] = clean;
    } else {
      delete room.fakeAnswers[meId];
    }

    // Auto-populate clever bot fake answers
    const question = QUESTIONS.find((q) => q.id === room.currentQuestionId) || QUESTIONS[0];
    const decoys = question.defaultDecoys || question.options || ['Tahmin A', 'Tahmin B', 'Tahmin C'];

    let decoyIdx = 0;
    for (const p of Object.values(room.players)) {
      if (p.id !== meId && !room.fakeAnswers[p.id]) {
        room.fakeAnswers[p.id] = decoys[decoyIdx % decoys.length] || `İnandırıcı Yanıt ${decoyIdx + 1}`;
        decoyIdx++;
      }
    }

    // Blend all fake answers + true answer
    room.choices = blendChoices(question, room.fakeAnswers, room.currentRound * 17);
    room.phase = 'guess';

    this.emit({ type: 'fake_submitted', payload: { code } });
    this.emit({ type: 'phase_changed', payload: { code, phase: 'guess' } });
    this.emit({ type: 'state', payload: this.snapshot(code) });
  }

  async getRoundChoices(code: string): Promise<RoundChoice[]> {
    const room = this.rooms.get(code);
    if (!room) return [];
    const meId = this.currentPlayer?.id;
    return room.choices.map((c) => ({
      choiceIndex: c.choiceIndex,
      text: c.text,
      isOwnFake: c.authorId === meId,
    }));
  }

  // Step 2 of round: Submit choice / guess
  async submitPick(code: string, choiceIndex: number): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    const meId = this.currentPlayer?.id ?? 'me';
    room.picks[meId] = choiceIndex;

    // Bots make random picks (never picking their own fake answer)
    for (const p of Object.values(room.players)) {
      if (p.id !== meId && room.picks[p.id] === undefined) {
        const validChoices = room.choices.filter((c) => c.authorId !== p.id);
        const randomPick = validChoices[Math.floor(Math.random() * validChoices.length)];
        room.picks[p.id] = randomPick ? randomPick.choiceIndex : 0;
      }
    }

    // Resolve round authoritatively
    this.resolveRoundAuthoritatively(code);
  }

  // Backward-compatible submitAnswer
  async submitAnswer(code: string, submission: AnswerSubmission): Promise<void> {
    if (submission.fakeAnswer) {
      await this.submitFakeAnswer(code, submission.fakeAnswer);
    } else if (submission.choiceIndex !== undefined) {
      await this.submitPick(code, submission.choiceIndex);
    } else if (submission.selectedIndex !== undefined) {
      await this.submitPick(code, submission.selectedIndex);
    }
  }

  private resolveRoundAuthoritatively(code: string) {
    const room = this.rooms.get(code);
    if (!room || !room.currentQuestionId) return;
    const question = QUESTIONS.find((q) => q.id === room.currentQuestionId) || QUESTIONS[0];

    const playersList = Object.values(room.players);
    const { rows, updatedPlayers } = resolveZartoRound({
      question,
      players: playersList,
      choices: room.choices,
      picks: room.picks,
      fakeAnswers: room.fakeAnswers,
      abilityActions: room.abilityActions,
    });

    room.roundResults = rows;
    room.players = updatedPlayers;
    room.phase = 'reveal';

    this.emit({ type: 'round_resolved', payload: { code, rows } });
    this.emit({ type: 'phase_changed', payload: { code, phase: 'reveal' } });
    this.emit({ type: 'state', payload: this.snapshot(code) });
  }

  advancePhase(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');

    if (room.phase === 'ability_select') {
      room.phase = 'fake_answer';
    } else if (room.phase === 'fake_answer') {
      room.phase = 'guess';
    } else if (room.phase === 'reveal') {
      room.phase = 'scoreboard';
    } else if (room.phase === 'scoreboard') {
      if (room.currentRound >= room.config.totalRounds) {
        room.phase = 'game_over';
        this.emit({ type: 'game_over', payload: { code } });
      } else {
        room.currentRound += 1;
        room.phase = 'ability_select';
        room.fakeAnswers = {};
        room.choices = [];
        room.picks = {};
        room.answers = {};
        room.abilityActions = [];
        room.currentQuestionId = room.questionQueue[room.currentRound - 1] ?? QUESTIONS[0].id;
      }
    }

    this.emit({ type: 'phase_changed', payload: { code, phase: room.phase } });
    this.emit({ type: 'state', payload: this.snapshot(code) });
    return Promise.resolve();
  }

  async rematch(code: string): Promise<void> {
    const room = this.rooms.get(code);
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');
    room.phase = 'lobby';
    room.currentRound = 1;
    room.fakeAnswers = {};
    room.choices = [];
    room.picks = {};
    room.answers = {};
    room.abilityActions = [];
    room.roundResults = {};
    for (const id of Object.keys(room.players)) {
      room.players[id] = {
        ...room.players[id],
        score: 0,
        isReady: room.players[id].isHost,
        consecutiveCorrect: 0,
        shieldsAvailable: 0,
        blocksAvailable: 0,
        isBlockedCurrentRound: false,
        isBlockedNextRound: false,
        lastBlockedPlayerId: null,
      };
    }
    this.prepareRoundQuestions(room);
    this.emit({ type: 'phase_changed', payload: { code, phase: 'lobby' } });
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
      fakeAnswers: room.fakeAnswers,
      choices: room.choices,
      picks: room.picks,
      answers: room.answers,
      abilityActions: room.abilityActions,
      roundResults: room.roundResults,
      history: [],
    };
  }
}

void freshAbilityState;
