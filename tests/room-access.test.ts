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
    const listedRoom = (await service.listOpenRooms()).find((room) => room.code === code);
    assert.ok(listedRoom);
    assert.deepEqual(listedRoom.categoryIds, ['genel-kultur']);
    assert.equal(listedRoom.categoryStatus, 'selected');
    assert.equal(listedRoom.maxPlayers, 10);
    assert.equal(await service.checkRoomAccess(code), 'open');

    await service.startGame(code);
    await assert.rejects(service.checkRoomAccess(code));
    assert.equal((await service.getRoomState(code))?.players[hostId]?.isHost, true);
    await service.signInAnonymously('Misafir', 'fox');
    await assert.rejects(
      service.joinRoom(code, 'Misafir', 'fox'),
      (error: unknown) => error instanceof ServiceError && error.code === 'GAME_ALREADY_STARTED'
    );
  });

  it('joins a listed open room directly without a password', async () => {
    const { service, code } = await createDemoRoom(false);
    assert.ok((await service.listOpenRooms()).some((room) => room.code === code));
    await service.signInAnonymously('Misafir', 'fox');
    const joined = await service.joinRoom(code, 'Misafir', 'fox');
    assert.ok(joined.playerId);
    assert.equal((await service.getRoomState(code))?.players[joined.playerId]?.name, 'Misafir');
  });

  it('rejects a full room when the server-side join is attempted', async () => {
    const { service, code } = await createDemoRoom(false);
    for (let i = 0; i < 6; i += 1) {
      await service.signInAnonymously(`Misafir ${i}`, 'fox');
      await service.joinRoom(code, `Misafir ${i}`, 'fox');
    }
    await service.signInAnonymously('Son Misafir', 'fox');
    await assert.rejects(
      service.joinRoom(code, 'Son Misafir', 'fox'),
      (error: unknown) => error instanceof ServiceError && error.code === 'ROOM_FULL'
    );
  });

  it('lets the room host remove a lobby player and blocks non-host kick attempts', async () => {
    const { service, code } = await createDemoRoom(false);
    const before = await service.getRoomState(code);
    assert.ok(before);
    const target = Object.values(before.players).find((player) => !player.isHost);
    assert.ok(target);

    await service.kickPlayer(code, target.id);
    const after = await service.getRoomState(code);
    assert.ok(after);
    assert.equal(after.players[target.id], undefined);
    await assert.rejects(
      service.kickPlayer(code, target.id),
      (error: unknown) => error instanceof ServiceError && error.code === 'ROOM_PLAYER_NOT_FOUND'
    );

    const remainingTarget = Object.values(after.players).find((player) => !player.isHost);
    assert.ok(remainingTarget);
    await service.signInAnonymously('Misafir', 'fox');
    await assert.rejects(
      service.kickPlayer(code, remainingTarget.id),
      (error: unknown) => error instanceof ServiceError && error.code === 'HOST_ONLY'
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
