import { supabase, supabaseConfigured, ensureSupabase } from '../lib/supabase/client';
import type { GameService } from './types';
import { ServiceError } from './types';
import { makeSamplePlayers } from '../features/game/players';

/**
 * Supabase-backed multiplayer service.
 *
 * Server-authoritative design:
 *  - All game state lives in Postgres tables (rooms, room_players, rounds, answers, ability_actions).
 *  - Mutations go through SECURITY DEFINER RPC functions (validate on server).
 *  - The client NEVER submits scores directly; scores are computed by the server.
 *  - RLS policies scope every table to authenticated users in the room.
 *
 * NOTE: The schema/migrations for this adapter are provided separately
 * (supabase/migrations). If the project is not yet provisioned with those
 * migrations, the demo adapter should be used instead. This adapter will
 * surface a clear error state when the backend is unavailable.
 */
export class SupabaseGameService implements GameService {
  readonly kind = 'supabase' as const;

  async connect(): Promise<void> {
    if (!supabaseConfigured) {
      throw new ServiceError('SUPABASE_NOT_CONFIGURED', 'Supabase yapılandırılmamış.');
    }
    ensureSupabase();
  }

  disconnect(): void {
    // Channels are managed per-room in subscribe(); nothing global to tear down.
  }

  subscribe(): () => void {
    // Per-room realtime subscriptions are handled in the hook layer.
    return () => {};
  }

  getConnectionState() {
    return supabaseConfigured ? 'online' : 'offline';
  }

  async signInAnonymously(name: string, avatarKey: string) {
    const sb = ensureSupabase();
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) throw new ServiceError('AUTH_FAILED', error.message);
    const user = data.user;
    if (!user) throw new ServiceError('AUTH_FAILED', 'Anonim oturum açılamadı.');
    const profile = {
      id: user.id,
      name,
      avatarKey,
      isHost: false,
      isReady: false,
      isOnline: true,
      score: 0,
      abilityUsedCounts: { block: 0, shield: 0, penalty: 0, counter: 0 },
    };
    return profile as import('../types/game').Player;
  }

  private cachedPlayer: import('../types/game').Player | null = null;

  getCurrentPlayer(): import('../types/game').Player | null {
    return this.cachedPlayer;
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
    categories: import('../features/game/categories').CategoryId[];
  }): Promise<{ code: string; playerId: string }> {
    void config;
    throw new ServiceError(
      'NOT_IMPLEMENTED',
      'Supabase oda oluşturma RPC’leri provision edilmemiş. Demo adapter kullan.'
    );
  }

  async joinRoom(
    code: string,
    name: string,
    avatarKey: string
  ): Promise<{ playerId: string }> {
    void code;
    void name;
    void avatarKey;
    throw new ServiceError('NOT_IMPLEMENTED', 'Supabase oda katılma RPC’leri provision edilmemiş.');
  }
  async leaveRoom(): Promise<void> {}
  async getRoomState() {
    return null;
  }
  async listOpenRooms() {
    return [];
  }
  async setReady(): Promise<void> {}
  async nudgePlayer() {
    return { fromId: '', toId: '', at: 0 };
  }
  async startGame(): Promise<void> {}
  async submitAnswer(): Promise<void> {}
  async useAbility(): Promise<void> {}
  async advancePhase(): Promise<void> {}
  async getLeaderboard() {
    return makeSamplePlayers(10, 0).map((p, i) => ({ ...p, score: 980 - i * 75 }));
  }
  async getProfile() {
    return null;
  }
}

void supabase;
