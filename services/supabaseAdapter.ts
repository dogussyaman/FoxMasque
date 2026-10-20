import { supabase, supabaseConfigured, ensureSupabase } from '../lib/supabase/client';
import type {
  ConnectionState,
  GameService,
  RoomSummary,
  ServiceEvent,
  ServiceEventHandler,
} from './types';
import { ServiceError } from './types';
import type {
  AbilityAction,
  AnswerSubmission,
  GameState,
  Nudge,
  Player,
  PlayerId,
  RoundChoice,
  RoundResultRow,
} from '../types/game';
import type { CategoryId } from '../features/game/categories';
import type { RealtimeChannel } from '@supabase/supabase-js';

function decodeBase64(value: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const output = new Uint8Array(Math.ceil((value.length * 3) / 4));
  let outputIndex = 0;
  let buffer = 0;
  let bits = 0;

  for (const character of value) {
    if (character === '=') break;
    const digit = alphabet.indexOf(character);
    if (digit < 0) continue;
    buffer = (buffer << 6) | digit;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output[outputIndex++] = (buffer >> bits) & 0xff;
    }
  }

  return output.subarray(0, outputIndex);
}

export class SupabaseGameService implements GameService {
  readonly kind = 'supabase' as const;

  private connection: ConnectionState = 'offline';
  private handlers = new Set<ServiceEventHandler>();
  private cachedPlayer: Player | null = null;
  private currentChannel: RealtimeChannel | null = null;
  private currentRoomCode: string | null = null;

  async connect(): Promise<void> {
    if (!supabaseConfigured) {
      this.connection = 'offline';
      throw new ServiceError('SUPABASE_NOT_CONFIGURED', 'Supabase yapılandırılmamış.');
    }

    const sb = ensureSupabase();
    const { data } = await sb.auth.getSession();
    if (data.session?.user) {
      this.cachedPlayer = {
        id: data.session.user.id,
        name: data.session.user.user_metadata?.name || 'Oyuncu',
        avatarKey: data.session.user.user_metadata?.avatarKey || 'fox',
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
    }
    this.connection = 'online';
    this.emit({ type: 'connection', payload: { state: 'online' } });
  }

  disconnect(): void {
    if (this.currentChannel) {
      const sb = ensureSupabase();
      sb.removeChannel(this.currentChannel);
      this.currentChannel = null;
    }
    this.connection = 'offline';
    this.currentRoomCode = null;
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
    const sb = ensureSupabase();
    const { data, error } = await sb.auth.signInAnonymously({
      options: {
        data: { name: name.trim(), avatarKey },
      },
    });
    if (error) throw new ServiceError('AUTH_FAILED', error.message);
    const user = data.user;
    if (!user) throw new ServiceError('AUTH_FAILED', 'Anonim oturum açılamadı.');

    const profile: Player = {
      id: user.id,
      name: name.trim() || 'Oyuncu',
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
    this.cachedPlayer = profile;
    return profile;
  }

  getCurrentPlayer(): Player | null {
    return this.cachedPlayer;
  }

  async updatePlayerProfile(name: string, avatarKey: string): Promise<Player> {
    if (!this.cachedPlayer) {
      throw new ServiceError('PROFILE_NOT_FOUND', 'Profil bilgisi bulunamadı.');
    }

    const sb = ensureSupabase();
    const { error: profileError } = await sb.rpc('update_player_profile_secure', {
      p_name: name.trim().slice(0, 32) || 'Oyuncu',
      p_avatar_key: avatarKey,
    });
    if (profileError) {
      throw new ServiceError('PROFILE_UPDATE_FAILED', profileError.message);
    }

    const nextPlayer = {
      ...this.cachedPlayer,
      name: name.trim().slice(0, 32) || 'Oyuncu',
      avatarKey,
    };
    const { error: authError } = await sb.auth.updateUser({
      data: { name: nextPlayer.name, avatarKey },
    });
    if (authError) {
      throw new ServiceError('PROFILE_UPDATE_FAILED', authError.message);
    }

    this.cachedPlayer = nextPlayer;
    if (this.currentRoomCode) {
      const roomState = await this.getRoomState(this.currentRoomCode);
      if (roomState) this.emit({ type: 'state', payload: roomState });
    }
    return nextPlayer;
  }

  async uploadAvatar(base64: string, mimeType: string): Promise<string> {
    if (!this.cachedPlayer) {
      throw new ServiceError('PROFILE_NOT_FOUND', 'Fotoğraf yüklemek için oturum açmalısın.');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      throw new ServiceError('AVATAR_INVALID_TYPE', 'JPG, PNG veya WebP formatında bir fotoğraf seç.');
    }
    const bytes = decodeBase64(base64);
    if (bytes.byteLength > 5 * 1024 * 1024) {
      throw new ServiceError('AVATAR_TOO_LARGE', 'Fotoğraf boyutu 5 MB sınırını aşamaz.');
    }

    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.slice('image/'.length);
    const sb = ensureSupabase();
    const { error } = await sb.storage
      .from('avatars')
      .upload(`${this.cachedPlayer.id}/avatar.${extension}`, bytes, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: true,
      });
    if (error) {
      throw new ServiceError('AVATAR_UPLOAD_FAILED', error.message);
    }

    const { data } = sb.storage
      .from('avatars')
      .getPublicUrl(`${this.cachedPlayer.id}/avatar.${extension}`);
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async signOut(): Promise<void> {
    this.cachedPlayer = null;
    const sb = ensureSupabase();
    await sb.auth.signOut();
  }

  async createRoom(config: {
    hostName: string;
    avatarKey: string;
    totalRounds: number;
    roundSeconds: number;
    categories: CategoryId[];
  }): Promise<{ code: string; playerId: string }> {
    const sb = ensureSupabase();
    if (!this.cachedPlayer) {
      await this.signInAnonymously(config.hostName, config.avatarKey);
    }
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];

    const { data, error } = await sb.rpc('create_room_secure', {
      p_code: code,
      p_name: config.hostName.trim() || 'Ev Sahibi',
      p_avatar_key: config.avatarKey,
      p_total_rounds: config.totalRounds,
      p_round_seconds: config.roundSeconds,
      p_categories: config.categories,
    });

    if (error) {
      throw new ServiceError('CREATE_ROOM_FAILED', error.message);
    }

    const hostId = this.cachedPlayer!.id;
    this.cachedPlayer = {
      ...this.cachedPlayer!,
      isHost: true,
      isReady: true,
    };

    this.setupRealtimeSubscription(code);
    return { code, playerId: hostId };
  }

  async joinRoom(
    code: string,
    name: string,
    avatarKey: string
  ): Promise<{ playerId: string }> {
    const sb = ensureSupabase();
    const cleanCode = code.trim().toUpperCase();
    if (!this.cachedPlayer) {
      await this.signInAnonymously(name, avatarKey);
    }

    const { data, error } = await sb.rpc('join_room_secure', {
      p_code: cleanCode,
      p_name: name.trim() || 'Oyuncu',
      p_avatar_key: avatarKey,
    });

    if (error) {
      throw new ServiceError('JOIN_ROOM_FAILED', error.message);
    }

    const playerId = this.cachedPlayer!.id;
    this.setupRealtimeSubscription(cleanCode);
    return { playerId };
  }

  async leaveRoom(code: string): Promise<void> {
    const sb = ensureSupabase();
    await sb.rpc('leave_room_secure', { p_room_code: code.toUpperCase() });
    if (this.currentChannel) {
      sb.removeChannel(this.currentChannel);
      this.currentChannel = null;
    }
    this.currentRoomCode = null;
    this.emit({ type: 'player_left', payload: { code } });
  }

  async getRoomState(code: string): Promise<GameState | null> {
    const sb = ensureSupabase();
    const cleanCode = code.toUpperCase();

    const { data: room, error: roomError } = await sb
      .from('rooms')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (roomError || !room) return null;

    const { data: playerRows } = await sb
      .from('room_players')
      .select('*')
      .eq('room_id', room.id);

    const players: Record<PlayerId, Player> = {};
    for (const r of playerRows ?? []) {
      players[r.player_id] = {
        id: r.player_id,
        name: r.name,
        avatarKey: r.avatar_key,
        isHost: r.is_host,
        isReady: r.is_ready,
        isOnline: r.is_online,
        score: r.score,
        abilityUsedCounts: r.ability_uses ?? { block: 0, shield: 0, penalty: 0, counter: 0 },
        consecutiveCorrect: r.consecutive_correct ?? 0,
        shieldsAvailable: r.shields_available ?? 0,
        blocksAvailable: r.blocks_available ?? 0,
        isBlockedCurrentRound: r.is_blocked_current_round ?? false,
        isBlockedNextRound: r.is_blocked_next_round ?? false,
        lastBlockedPlayerId: r.last_blocked_player_id,
      };
    }

    // Read round results if in reveal/scoreboard
    const roundResults: Record<PlayerId, RoundResultRow> = {};
    if (['reveal', 'scoreboard', 'game_over'].includes(room.phase)) {
      const { data: resultRows } = await sb
        .from('round_results')
        .select('*')
        .eq('room_id', room.id)
        .eq('round_number', room.current_round);

      for (const res of resultRows ?? []) {
        roundResults[res.player_id] = {
          playerId: res.player_id,
          outcome: {
            correct: res.answered_correctly,
            zartaladın: res.zartaladın,
            zartalandın: res.zartalandın,
            victimsCount: res.victims_count ?? 0,
            pointsEarned: res.points_delta,
            labels: [],
          },
          labels: [],
          pointsDelta: res.points_delta,
          victimsCount: res.victims_count ?? 0,
          deceivedByAuthorId: res.deceived_by_author_id,
          pickedText: res.picked_text,
          ownFakeText: res.own_fake_text,
        };
      }
    }

    return {
      config: {
        code: room.code,
        hostId: room.host_id,
        maxPlayers: 10,
        minPlayers: 2,
        totalRounds: room.total_rounds,
        roundSeconds: room.round_seconds,
        selectedCategoryIds: room.selected_categories,
      },
      players,
      phase: room.phase,
      currentRound: room.current_round,
      currentQuestionId: room.current_question_id,
      fakeAnswers: {},
      choices: [],
      picks: {},
      answers: {},
      abilityActions: [],
      roundResults,
      history: [],
    };
  }

  async listOpenRooms(): Promise<RoomSummary[]> {
    const sb = ensureSupabase();
    const { data, error } = await sb
      .from('rooms')
      .select('code, host_id, phase, created_at')
      .eq('phase', 'lobby')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];

    return data.map((r) => ({
      code: r.code,
      hostName: 'Parti Odası',
      playerCount: 1,
      phase: r.phase,
      createdAt: new Date(r.created_at).getTime(),
    }));
  }

  async setReady(code: string, ready: boolean): Promise<void> {
    const sb = ensureSupabase();
    const { error } = await sb.rpc('set_player_ready_secure', {
      p_room_code: code.toUpperCase(),
      p_ready: ready,
    });
    if (error) throw new ServiceError('SET_READY_FAILED', error.message);
  }

  async nudgePlayer(code: string, toId: string): Promise<Nudge> {
    const sb = ensureSupabase();
    const meId = this.cachedPlayer?.id ?? '';
    const { data: room } = await sb.from('rooms').select('id').eq('code', code.toUpperCase()).single();
    if (!room) throw new ServiceError('ROOM_NOT_FOUND', 'Oda bulunamadı.');

    const nudge: Nudge = {
      fromId: meId,
      toId,
      at: Date.now(),
    };

    await sb.from('nudges').insert({
      room_id: room.id,
      from_id: meId,
      to_id: toId,
    });

    return nudge;
  }

  async startGame(code: string): Promise<void> {
    const sb = ensureSupabase();
    const { error } = await sb.rpc('start_game_secure', {
      p_room_code: code.toUpperCase(),
    });
    if (error) throw new ServiceError('START_GAME_FAILED', error.message);
  }

  async submitFakeAnswer(code: string, fakeAnswer: string): Promise<void> {
    const sb = ensureSupabase();
    const { error } = await sb.rpc('submit_fake_answer_secure', {
      p_room_code: code.toUpperCase(),
      p_fake_answer: fakeAnswer.trim(),
    });
    if (error) throw new ServiceError('SUBMIT_FAKE_FAILED', error.message);
  }

  async getRoundChoices(code: string): Promise<RoundChoice[]> {
    const sb = ensureSupabase();
    const { data, error } = await sb.rpc('get_round_choices_secure', {
      p_room_code: code.toUpperCase(),
    });
    if (error || !data) return [];
    return data.map((d: { choice_index: number; choice_text: string; is_own_fake: boolean }) => ({
      choiceIndex: d.choice_index,
      text: d.choice_text,
      isOwnFake: d.is_own_fake,
    }));
  }

  async submitPick(code: string, choiceIndex: number): Promise<void> {
    const sb = ensureSupabase();
    const { error } = await sb.rpc('submit_pick_secure', {
      p_room_code: code.toUpperCase(),
      p_choice_index: choiceIndex,
    });
    if (error) throw new ServiceError('SUBMIT_PICK_FAILED', error.message);
  }

  async useAbility(code: string, action: AbilityAction): Promise<void> {
    const sb = ensureSupabase();
    const { error } = await sb.rpc('use_ability_secure', {
      p_room_code: code.toUpperCase(),
      p_ability: action.abilityId,
      p_target_id: action.targetId || null,
    });
    if (error) throw new ServiceError('USE_ABILITY_FAILED', error.message);
  }

  async advancePhase(code: string): Promise<void> {
    const sb = ensureSupabase();
    const { error } = await sb.rpc('advance_round_secure', {
      p_room_code: code.toUpperCase(),
    });
    if (error) throw new ServiceError('ADVANCE_FAILED', error.message);
  }

  async rematch(code: string): Promise<void> {
    const sb = ensureSupabase();
    const { error } = await sb.rpc('rematch_room_secure', {
      p_room_code: code.toUpperCase(),
    });
    if (error) throw new ServiceError('REMATCH_FAILED', error.message);
  }

  async submitAnswer(code: string, submission: AnswerSubmission): Promise<void> {
    if (submission.fakeAnswer) {
      await this.submitFakeAnswer(code, submission.fakeAnswer);
    } else if (submission.choiceIndex !== undefined) {
      await this.submitPick(code, submission.choiceIndex);
    } else if (submission.selectedIndex !== undefined) {
      await this.submitPick(code, submission.selectedIndex);
    }
  }

  async getLeaderboard(): Promise<Player[]> {
    const sb = ensureSupabase();
    const { data } = await sb
      .from('room_players')
      .select('player_id, name, avatar_key, score')
      .order('score', { ascending: false })
      .limit(20);

    if (!data) return [];
    return data.map((d) => ({
      id: d.player_id,
      name: d.name,
      avatarKey: d.avatar_key,
      isHost: false,
      isReady: false,
      isOnline: true,
      score: d.score,
      abilityUsedCounts: { block: 0, shield: 0, penalty: 0, counter: 0 },
      consecutiveCorrect: 0,
      shieldsAvailable: 0,
      blocksAvailable: 0,
      isBlockedCurrentRound: false,
      isBlockedNextRound: false,
      lastBlockedPlayerId: null,
    }));
  }

  async getProfile(playerId: string): Promise<Player | null> {
    if (this.cachedPlayer?.id === playerId) return this.cachedPlayer;
    return null;
  }

  private setupRealtimeSubscription(code: string) {
    if (this.currentRoomCode === code && this.currentChannel) return;

    const sb = ensureSupabase();
    if (this.currentChannel) {
      sb.removeChannel(this.currentChannel);
    }
    this.currentRoomCode = code;

    const channel = sb.channel(`room:${code}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        async () => {
          const state = await this.getRoomState(code);
          if (state) {
            this.emit({ type: 'phase_changed', payload: { code, phase: state.phase } });
            this.emit({ type: 'state', payload: state });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players' },
        async () => {
          const state = await this.getRoomState(code);
          if (state) this.emit({ type: 'state', payload: state });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'round_results' },
        async () => {
          const state = await this.getRoomState(code);
          if (state) {
            this.emit({ type: 'round_resolved', payload: { code, rows: state.roundResults } });
            this.emit({ type: 'state', payload: state });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'nudges' },
        (payload) => {
          const n = payload.new as { from_id: string; to_id: string; created_at: string };
          this.emit({
            type: 'nudge',
            payload: {
              code,
              nudge: {
                fromId: n.from_id,
                toId: n.to_id,
                at: new Date(n.created_at).getTime(),
              },
            },
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.connection = 'online';
          this.emit({ type: 'connection', payload: { state: 'online' } });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.connection = 'reconnecting';
          this.emit({ type: 'connection', payload: { state: 'reconnecting' } });
        }
      });

    this.currentChannel = channel;
  }
}
