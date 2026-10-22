import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  clearRoomRecovery,
  getRoomRecoveryRoute,
  readRoomRecovery,
  saveRoomRecovery,
} from '../services/roomRecovery';
import type { RecoveryState } from '../services/roomRecovery';

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: async () => value,
    setItem: async (_key: string, next: string) => { value = next; },
    removeItem: async () => { value = null; },
  };
}

describe('Room recovery persistence', () => {
  it('stores only the versioned room reference and account identity', async () => {
    const storage = memoryStorage();
    await saveRoomRecovery('abc12', 'account-1', storage);
    const record = await readRoomRecovery(storage);
    assert.equal(record?.roomCode, 'ABC12');
    assert.equal(record?.playerId, 'account-1');
    assert.equal(record?.version, 1);
    assert.equal(typeof record?.updatedAt, 'number');
  });

  it('removes malformed, stale, and unsupported records without throwing', async () => {
    for (const raw of [
      '{broken',
      JSON.stringify({ version: 99, roomCode: 'ABC12', playerId: 'p', updatedAt: Date.now() }),
      JSON.stringify({ version: 1, roomCode: '***', playerId: 'p', updatedAt: Date.now() }),
      JSON.stringify({ version: 1, roomCode: 'ABC12', playerId: 'p', updatedAt: 1 }),
    ]) {
      const storage = memoryStorage(raw);
      assert.equal(await readRoomRecovery(storage), null);
      assert.equal(await storage.getItem(), null);
    }
  });

  it('clears the reference when the player intentionally leaves', async () => {
    const storage = memoryStorage();
    await saveRoomRecovery('ABCDE', 'account-1', storage);
    await clearRoomRecovery(storage);
    assert.equal(await readRoomRecovery(storage), null);
  });

  it('routes recovery using the authoritative phase and own submission state', () => {
    const state: RecoveryState = {
      phase: 'guess',
      progress: {
        submissionStatus: { player: true },
        submittedCount: 1,
        totalCount: 1,
        completed: true,
      },
    };
    assert.equal(getRoomRecoveryRoute(state, 'player'), '/waiting');
    assert.equal(
      getRoomRecoveryRoute({
        ...state,
        progress: { ...state.progress!, submissionStatus: { player: false } },
      }, 'player'),
      '/question'
    );
    assert.equal(getRoomRecoveryRoute({ ...state, phase: 'reveal' }, 'player'), '/result');
    assert.equal(getRoomRecoveryRoute({ ...state, phase: 'scoreboard' }, 'player'), '/scoreboard');
    assert.equal(getRoomRecoveryRoute({ ...state, phase: 'game_over' }, 'player'), '/game-over');
  });
});
