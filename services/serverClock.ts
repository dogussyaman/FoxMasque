/**
 * Estimates the server/client wall-clock offset from a server timestamp and
 * the local request round trip. The midpoint estimator reduces (but cannot
 * eliminate) error caused by network asymmetry.
 */
let serverClockOffsetMs = 0;

export function estimateServerClockOffsetMs(
  serverTimeMs: number,
  requestStartedAtMs: number,
  responseReceivedAtMs: number,
): number | null {
  if (
    !Number.isFinite(serverTimeMs)
    || !Number.isFinite(requestStartedAtMs)
    || !Number.isFinite(responseReceivedAtMs)
    || responseReceivedAtMs < requestStartedAtMs
  ) {
    return null;
  }

  const clientMidpointMs = requestStartedAtMs
    + (responseReceivedAtMs - requestStartedAtMs) / 2;
  return serverTimeMs - clientMidpointMs;
}

export function syncServerClockFromRoundTrip(
  serverTime: unknown,
  requestStartedAtMs: number,
  responseReceivedAtMs: number,
): void {
  const serverTimeMs = typeof serverTime === 'number'
    ? serverTime
    : typeof serverTime === 'string'
      ? Date.parse(serverTime)
      : Number.NaN;
  const offset = estimateServerClockOffsetMs(
    serverTimeMs,
    requestStartedAtMs,
    responseReceivedAtMs,
  );
  if (offset !== null) serverClockOffsetMs = offset;
}

export function getServerNowMs(): number {
  return Date.now() + serverClockOffsetMs;
}

export function getRemainingSeconds(deadlineMs: number, nowMs = getServerNowMs()): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}
