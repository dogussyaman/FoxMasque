import { supabaseConfigured } from '../lib/supabase/client';
import { DemoGameService } from './demoAdapter';
import { SupabaseGameService } from './supabaseAdapter';
import type { GameService } from './types';

/**
 * Returns the active game service.
 *
 * If Supabase is configured with valid credentials, the Supabase adapter is
 * used (live multiplayer). Otherwise the local demo adapter is used, which is
 * clearly labeled and seeded with sample players — it is NOT live multiplayer.
 */
export function createGameService(): GameService {
  if (supabaseConfigured) {
    return new SupabaseGameService();
  }
  return new DemoGameService();
}

export { supabaseConfigured };
export type { GameService } from './types';
