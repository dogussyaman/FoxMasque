import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DemoGameService } from '../services/demoAdapter';
import { ServiceError } from '../services/types';

describe('Social discovery and scoped leaderboard in demo mode', () => {
  it('searches sample players by name and excludes the signed-in player', async () => {
    const service = new DemoGameService();
    await service.connect();
    const currentPlayer = await service.signInAnonymously('Elif', 'fox');

    const results = await service.searchPlayers('elif');

    assert.ok(results.length > 0);
    assert.ok(results.every((player) => player.id !== currentPlayer.id));
    assert.ok(results.every((player) => player.name.toLocaleLowerCase().includes('elif')));
    assert.ok(results.every((player) => player.relationshipStatus === 'none'));
  });

  it('rejects search terms that are shorter than two characters', async () => {
    const service = new DemoGameService();
    await assert.rejects(
      service.searchPlayers('a'),
      (error: unknown) =>
        error instanceof ServiceError && error.code === 'PLAYER_SEARCH_INVALID'
    );
  });

  it('returns no friends in the friends scope until a relationship exists', async () => {
    const service = new DemoGameService();
    await service.signInAnonymously('Test Oyuncusu', 'fox');

    assert.ok((await service.getLeaderboard('all')).length > 0);
    assert.deepEqual(await service.getLeaderboard('friends'), []);
    assert.deepEqual(await service.getLeaderboard('weekly'), []);
  });
});
