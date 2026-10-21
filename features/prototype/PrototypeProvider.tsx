import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type WaitingPhase = 'fake_answer' | 'guess';

interface PrototypeToast {
  message: string;
  targetId: string;
  timestamp: number;
}

interface PrototypeValue {
  readyOverrides: Record<string, boolean>;
  answerOverrides: Record<string, boolean>;
  waitingStage: { id: string; phase: WaitingPhase } | null;
  toast: PrototypeToast | null;
  getReady: (playerId: string, fallback: boolean) => boolean;
  setReady: (playerId: string, isReady: boolean) => void;
  clearReadyOverrides: () => void;
  isAnswered: (stageId: string, playerId: string, fallback: boolean) => boolean;
  setAnswered: (stageId: string, playerId: string, answered: boolean) => void;
  clearAnswers: (stageId: string) => void;
  beginWaiting: (stageId: string, phase: WaitingPhase, playerId: string) => void;
  finishWaiting: (stageId: string) => void;
  canNudge: (stageId: string, playerId: string) => boolean;
  nudge: (stageId: string, playerId: string, senderName: string, targetName: string) => void;
}

const PrototypeContext = createContext<PrototypeValue | null>(null);

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [readyOverrides, setReadyOverrides] = useState<Record<string, boolean>>({});
  const [answerOverrides, setAnswerOverrides] = useState<Record<string, boolean>>({});
  const [waitingStage, setWaitingStage] = useState<PrototypeValue['waitingStage']>(null);
  const [usedNudges, setUsedNudges] = useState<Record<string, true>>({});
  const usedNudgesRef = useRef<Record<string, true>>({});
  const [toast, setToast] = useState<PrototypeToast | null>(null);

  const getReady = useCallback(
    (playerId: string, fallback: boolean) => readyOverrides[playerId] ?? fallback,
    [readyOverrides],
  );
  const setReady = useCallback((playerId: string, isReady: boolean) => {
    setReadyOverrides((current) => ({ ...current, [playerId]: isReady }));
  }, []);
  const clearReadyOverrides = useCallback(() => setReadyOverrides({}), []);
  const isAnswered = useCallback(
    (stageId: string, playerId: string, fallback: boolean) =>
      answerOverrides[`${stageId}:${playerId}`] ?? fallback,
    [answerOverrides],
  );
  const setAnswered = useCallback((stageId: string, playerId: string, answered: boolean) => {
    setAnswerOverrides((current) => ({
      ...current,
      [`${stageId}:${playerId}`]: answered,
    }));
  }, []);
  const clearAnswers = useCallback((stageId: string) => {
    const prefix = `${stageId}:`;
    setAnswerOverrides((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(prefix)),
    ));
  }, []);
  const beginWaiting = useCallback((stageId: string, phase: WaitingPhase, playerId: string) => {
    setWaitingStage({ id: stageId, phase });
    setAnswered(stageId, playerId, true);
  }, [setAnswered]);
  const finishWaiting = useCallback((stageId: string) => {
    setWaitingStage((current) => current?.id === stageId ? null : current);
  }, []);
  const canNudge = useCallback(
    (stageId: string, playerId: string) => !usedNudges[`${stageId}:${playerId}`],
    [usedNudges],
  );
  const nudge = useCallback((
    stageId: string,
    playerId: string,
    senderName: string,
    targetName: string,
  ) => {
    const key = `${stageId}:${playerId}`;
    if (usedNudgesRef.current[key]) return;
    usedNudgesRef.current[key] = true;
    setUsedNudges((current) => ({ ...current, [key]: true }));
    const timestamp = Date.now();
    setToast({
      message: `🦊 ${senderName}, ${targetName} oyuncusunu dürttü!`,
      targetId: playerId,
      timestamp,
    });
    setTimeout(() => {
      setToast((current) => current?.timestamp === timestamp ? null : current);
    }, 3200);
  }, [usedNudges]);
  const value = useMemo<PrototypeValue>(() => ({
    readyOverrides,
    answerOverrides,
    waitingStage,
    toast,
    getReady,
    setReady,
    clearReadyOverrides,
    isAnswered,
    setAnswered,
    clearAnswers,
    beginWaiting,
    finishWaiting,
    canNudge,
    nudge,
  }), [
    readyOverrides,
    answerOverrides,
    waitingStage,
    toast,
    getReady,
    setReady,
    clearReadyOverrides,
    isAnswered,
    setAnswered,
    clearAnswers,
    beginWaiting,
    finishWaiting,
    canNudge,
    nudge,
  ]);

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  const context = useContext(PrototypeContext);
  if (!context) throw new Error('usePrototype must be used within PrototypeProvider');
  return context;
}
