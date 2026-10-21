import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key && url.startsWith('http'));

// Client is created lazily so the demo app can run without valid credentials.
export const supabase = supabaseConfigured
  ? createClient(url as string, key as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        ...(Platform.OS === 'web' ? {} : { storage: AsyncStorage }),
      },
    })
  : null;

export function ensureSupabase() {
  if (!supabase || !supabaseConfigured) {
    throw new Error('Supabase yapılandırılmamış. .env dosyasını kontrol et.');
  }
  return supabase;
}

// Keep Supabase's refresh timer aligned with native app foreground state.
if (supabase) {
  if (AppState.currentState === 'active') {
    void supabase.auth.startAutoRefresh();
  }
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
