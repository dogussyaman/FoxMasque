import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createGameService, supabaseConfigured } from '@/services';
import type { GameService, ServiceEvent } from '@/services/types';
import type { ConnectionState } from '@/services/types';
import type { GameState, Player } from '@/types/game';

interface GameStoreValue {
  service: GameService;
  isLive: boolean;
  currentPlayer: Player | null;
  connection: ConnectionState;
  roomCode: string | null;
  roomState: GameState | null;
  lastNudge: { fromId: string; toId: string; at: number } | null;
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
  const serviceRef = useRef<GameService>(createGameService());
  const service = serviceRef.current;
  const isLive = supabaseConfigured;

  const [currentPlayer, setPlayer] = useState<Player | null>(null);
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

  const value = useMemo<GameStoreValue>(
    () => ({
      service,
      isLive,
      currentPlayer,
      connection,
      roomCode,
      roomState,
      lastNudge,
      error,
      init: async () => {
        try {
          await service.connect();
          setConnection(service.getConnectionState());
          setPlayer(service.getCurrentPlayer());
        } catch (e) {
          setError((e as Error).message);
          setConnection('error');
        }
      },
      setCurrentPlayer: setPlayer,
      setRoomCode,
      setRoomState,
      setError,
      refreshRoom: async () => {
        if (!roomCode) return;
        const snap = await service.getRoomState(roomCode);
        setRoomState(snap);
      },
    }),
    [service, isLive, currentPlayer, connection, roomCode, roomState, lastNudge, error]
  );

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}

export function useGameStore() {
  const ctx = useContext(GameStoreContext);
  if (!ctx) throw new Error('useGameStore must be used within GameStoreProvider');
  return ctx;
}
