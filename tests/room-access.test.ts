import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DemoGameService } from '../services/demoAdapter';
import { ServiceError } from '../services/types';

async function createDemoRoom(isPrivate: boolean) {
  const service = new DemoGameService();
  await service.connect();
  const room = await service.createRoom({
    hostName: 'Kurucu',
    avatarKey: 'fox',
    totalRounds: 3,
    roundSeconds: 15,
    categories: ['genel-kultur'],
    isPrivate,
    password: isPrivate ? 'guvenli-oda-123' : undefined,
  });
  return { service, code: room.code, hostId: room.playerId };
}

describe('Room access rules in local demo mode', () => {
  it('requires a password for private rooms and excludes them from public listings', async () => {
    const { service, code } = await createDemoRoom(true);
    assert.equal((await service.listOpenRooms()).some((room) => room.code === code), false);

    await service.signInAnonymously('Misafir', 'fox');
    assert.equal(await service.checkRoomAccess(code), 'password_required');
    await assert.rejects(
      service.joinRoom(code, 'Misafir', 'fox', undefined, 'untrusted-token'),
      (error: unknown) => error instanceof ServiceError && error.code === 'INVITE_UNAVAILABLE'
    );
    await assert.rejects(
      service.joinRoom(code, 'Misafir', 'fox', 'yanlis-sifre'),
      (error: unknown) => error instanceof ServiceError && error.code === 'ROOM_ACCESS_DENIED'
    );
    const joined = await service.joinRoom(code, 'Misafir', 'fox', 'guvenli-oda-123');
    assert.ok(joined.playerId);
    const state = await service.getRoomState(code);
    assert.equal(state?.players[joined.playerId]?.name, 'Misafir');
    assert.equal(JSON.stringify(state).includes('guvenli-oda-123'), false);
    assert.equal(
      (await service.joinRoom(code, 'Misafir', 'fox')).playerId,
      joined.playerId
    );
  });

  it('keeps open-room joining public and rejects new players after the match starts', async () => {
    const { service, code, hostId } = await createDemoRoom(false);
    assert.equal((await service.listOpenRooms()).some((room) => room.code === code), true);
    assert.equal(await service.checkRoomAccess(code), 'open');

    await service.startGame(code);
    await assert.rejects(service.checkRoomAccess(code));
    assert.equal((await service.getRoomState(code))?.players[hostId]?.isHost, true);

    await service.signInAnonymously('Geç Katılan', 'fox');
    await assert.rejects(
      service.joinRoom(code, 'Geç Katılan', 'fox'),
      (error: unknown) => error instanceof ServiceError && error.code === 'GAME_ALREADY_STARTED'
    );
  });

  it('does not let a non-host start or advance a match', async () => {
    const { service, code } = await createDemoRoom(false);
    await service.signInAnonymously('Misafir', 'fox');

    await assert.rejects(
      service.startGame(code),
      (error: unknown) => error instanceof ServiceError && error.code === 'HOST_ONLY'
    );
    assert.throws(
      () => service.advancePhase(code),
      (error: unknown) => error instanceof ServiceError && error.code === 'HOST_ONLY'
    );
  });
});
