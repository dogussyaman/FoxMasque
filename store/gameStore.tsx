import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AppState } from 'react-native';
import { createGameService, supabaseConfigured } from '@/services';
import type { ConnectionState, GameService, ServiceEvent } from '@/services/types';
import type { GameState, Nudge, Player } from '@/types/game';

export type AuthStatus = 'loading' | 'signed_in' | 'signed_out';

interface GameStoreValue {
  service: GameService;
  isLive: boolean;
  authStatus: AuthStatus;
  isAnonymous: boolean;
  currentPlayer: Player | null;
  connection: ConnectionState;
  roomCode: string | null;
  roomState: GameState | null;
  lastNudge: Nudge | null;
  error: string | null;
  init: () => Promise<void>;
  setCurrentPlayer: (p: Player | null) => void;
  setRoomCode: (code: string | null) => void;
  setRoomState: (s: GameState | null) => void;
  setError: (e: string | null) => void;
  refreshRoom: () => Promise<void>;
}

const GameStoreContext = createContext<GameStoreValue | null>(null);

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [service] = useState<GameService>(() => createGameService());
  const isLive = supabaseConfigured;

  const [currentPlayer, setPlayer] = useState<Player | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(isLive ? 'loading' : 'signed_in');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<GameState | null>(null);
  const [lastNudge, setLastNudge] = useState<GameStoreValue['lastNudge']>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = service.subscribe((event: ServiceEvent) => {
      switch (event.type) {
        case 'connection': {
          const s = (event.payload as { state: ConnectionState })?.state;
          if (s) setConnection(s);
          break;
        }
        case 'state': {
          const snap = event.payload as GameState | null;
          if (snap) setRoomState(snap);
          break;
        }
        case 'auth_state': {
          const payload = event.payload as { player: Player | null; isAnonymous: boolean };
          setPlayer(payload.player);
          setIsAnonymous(payload.isAnonymous);
          setAuthStatus(payload.player ? 'signed_in' : 'signed_out');
          break;
        }
        case 'phase_changed': {
          const p = (event.payload as { phase: GameState['phase'] })?.phase;
          if (p) {
            setRoomState((prev) => (prev ? { ...prev, phase: p } : null));
          }
          break;
        }
        case 'nudge': {
          const p = event.payload as { nudge: GameStoreValue['lastNudge'] };
          if (p?.nudge) setLastNudge(p.nudge);
          break;
        }
        case 'error': {
          const p = event.payload as { message: string };
          if (p?.message) setError(p.message);
          break;
        }
      }
    });
    return unsub;
  }, [service]);

  // Handle app coming to foreground: refresh room state immediately to prevent stale state
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && roomCode) {
        service.getRoomState(roomCode).then((snap) => {
          if (snap) setRoomState(snap);
        }).catch((e) => setError((e as Error).message));
      }
    });
    return () => subscription.remove();
  }, [roomCode, service]);

  const init = useCallback(async () => {
    try {
      await service.connect();
      setConnection(service.getConnectionState());
      const player = service.getCurrentPlayer();
      setPlayer(player);
      setAuthStatus(isLive && !player ? 'signed_out' : 'signed_in');
    } catch (e) {
      setError((e as Error).message);
      setConnection('error');
      setAuthStatus(isLive ? 'signed_out' : 'signed_in');
    }
  }, [service, isLive]);

  const setCurrentPlayer = useCallback((player: Player | null) => {
    setPlayer(player);
    setAuthStatus(player ? 'signed_in' : (isLive ? 'signed_out' : 'signed_in'));
  }, [isLive]);

  const refreshRoom = useCallback(async () => {
    if (!roomCode) return;
    const snap = await service.getRoomState(roomCode);
    setRoomState(snap);
  }, [roomCode, service]);

  const value = useMemo<GameStoreValue>(
    () => ({
      service,
      isLive,
      authStatus,
      isAnonymous,
      currentPlayer,
      connection,
      roomCode,
      roomState,
      lastNudge,
      error,
      init,
      setCurrentPlayer,
      setRoomCode,
      setRoomState,
      setError,
      refreshRoom,
    }),
    [service, isLive, authStatus, isAnonymous, currentPlayer, connection, roomCode, roomState, lastNudge, error, init, setCurrentPlayer, refreshRoom]
  );

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}

export function useGameStore() {
  const ctx = useContext(GameStoreContext);
  if (!ctx) throw new Error('useGameStore must be used within GameStoreProvider');
  return ctx;
}
