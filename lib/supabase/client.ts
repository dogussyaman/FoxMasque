import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon && url.startsWith('http'));

// Client is created lazily so the demo app can run without valid credentials.
export const supabase = supabaseConfigured
  ? createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

export function ensureSupabase() {
  if (!supabase || !supabaseConfigured) {
    throw new Error('Supabase yapılandırılmamış. .env dosyasını kontrol et.');
  }
  return supabase;
}

// Listen to AppState to pause/resume realtime (optional, network-friendly).
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      // Realtime channels auto-reconnect; nothing to force here.
    }
  });
}
