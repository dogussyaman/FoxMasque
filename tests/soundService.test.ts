import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { SoundPool, type SoundPoolPlayer } from '../services/soundPool';
import { SoundPreference } from '../services/soundPreference';
import { resolveAudioAssetUri } from '../services/audioSource';

function createFakePlayer(options: {
  ready?: () => Promise<boolean>;
  play?: () => void;
  playFromGesture?: (volume: number) => void | Promise<void>;
  seekTo?: (seconds: number) => Promise<void>;
} = {}) {
  const state = {
    plays: 0,
    pauses: 0,
    removals: 0,
    volumes: [] as number[],
    seeks: [] as number[],
  };
  const player: SoundPoolPlayer = {
    waitUntilReady: options.ready ?? (() => Promise.resolve(true)),
    play: () => {
      state.plays += 1;
      options.play?.();
    },
    playFromGesture: options.playFromGesture
      ? (volume) => {
          state.volumes.push(volume);
          return options.playFromGesture?.(volume);
        }
      : undefined,
    pause: () => {
      state.pauses += 1;
    },
    seekTo: async (seconds) => {
      state.seeks.push(seconds);
      await options.seekTo?.(seconds);
    },
    setVolume: (volume) => state.volumes.push(volume),
    remove: () => {
      state.removals += 1;
    },
  };
  return { player, state };
}

describe('web audio asset paths', () => {
  test('uses Metro web asset URLs directly', () => {
    const resolveAssetSource = () => {
      throw new Error('String web paths must not use the native asset resolver.');
    };

    assert.equal(
      resolveAudioAssetUri('/K-z-lkuyruk/assets/sound/click.wav', resolveAssetSource),
      '/K-z-lkuyruk/assets/sound/click.wav',
    );
  });

  test('resolves native asset identifiers through React Native', () => {
    assert.equal(
      resolveAudioAssetUri(42, (asset) => ({ uri: `asset://${asset}` })),
      'asset://42',
    );
  });

  test('rejects unsupported asset source values', () => {
    assert.equal(resolveAudioAssetUri(null, () => null), null);
  });
});

describe('SoundPool', () => {
  test('waits for readiness before seeking and playing', async () => {
    let markReady!: (ready: boolean) => void;
    const fake = createFakePlayer({
      ready: () => new Promise<boolean>((resolve) => {
        markReady = resolve;
      }),
    });
    const pool = new SoundPool(() => fake.player, () => {}, { click: 1 });

    const playback = pool.play('click', 0.75, 0.75);
    await Promise.resolve();
    assert.equal(fake.state.plays, 0);
    markReady(true);
    assert.equal(await playback, true);
    assert.deepEqual(fake.state.seeks, [0]);
    assert.equal(fake.state.plays, 1);
  });

  test('starts web playback synchronously from the user gesture', () => {
    let started = false;
    const fake = createFakePlayer({
      playFromGesture: () => {
        started = true;
      },
    });
    const pool = new SoundPool(() => fake.player, () => {}, { click: 1 });

    const result = pool.playFromGesture('click', 0.75, 0.75);

    assert.equal(result, true);
    assert.equal(started, true);
    assert.deepEqual(fake.state.volumes, [0.75]);
  });

  test('drops a repeated effect while its only pooled player is busy instead of queuing it', async () => {
    let finishSeek!: () => void;
    const fake = createFakePlayer({
      seekTo: () => new Promise<void>((resolve) => {
        finishSeek = resolve;
      }),
    });
    const pool = new SoundPool(() => fake.player, () => {}, { click: 1 });

    const first = pool.play('click', 0.75, 0.75);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(await pool.play('click', 0.75, 0.75), false);
    finishSeek();
    assert.equal(await first, true);
    assert.equal(fake.state.plays, 1);
  });

  test('applies clamped custom volume to the actual player and restarts from the beginning', async () => {
    const fake = createFakePlayer();
    const pool = new SoundPool(() => fake.player, () => {}, { click: 1 });

    assert.equal(await pool.play('click', 5, 0.75), true);
    assert.deepEqual(fake.state.volumes, [1]);
    assert.deepEqual(fake.state.seeks, [0]);
    assert.equal(await pool.play('click', -2, 0.75), true);
    assert.deepEqual(fake.state.volumes, [1, 0]);
  });

  test('disables only an effect whose player failed to load', async () => {
    const broken = createFakePlayer({ ready: () => Promise.resolve(false) });
    const working = createFakePlayer();
    const errors: string[] = [];
    const pool = new SoundPool(
      (effect) => effect === 'broken' ? broken.player : working.player,
      (effect) => errors.push(effect),
      { broken: 1, working: 1 },
    );

    assert.equal(await pool.play('broken', 1, 1), false);
    assert.equal(await pool.play('working', 1, 1), true);
    assert.equal(broken.state.removals, 1);
    assert.equal(working.state.plays, 1);
    assert.deepEqual(errors, ['broken']);
  });

  test('cancels pending playback when stopped before the player becomes ready', async () => {
    let markReady!: (ready: boolean) => void;
    const fake = createFakePlayer({
      ready: () => new Promise<boolean>((resolve) => {
        markReady = resolve;
      }),
    });
    const pool = new SoundPool(() => fake.player, () => {}, { clock: 1 });

    const playback = pool.play('clock', 0.55, 0.55);
    await Promise.resolve();
    pool.stop('clock');
    markReady(true);
    assert.equal(await playback, false);
    assert.equal(fake.state.plays, 0);
    assert.equal(fake.state.pauses, 1);
  });

  test('does not play while disabled and resumes when enabled again', async () => {
    const fake = createFakePlayer();
    const pool = new SoundPool(() => fake.player, () => {}, { click: 1 });

    pool.setEnabled(false);
    assert.equal(await pool.play('click', 0.75, 0.75), false);
    assert.equal(fake.state.plays, 0);

    pool.setEnabled(true);
    assert.equal(await pool.play('click', 0.75, 0.75), true);
    assert.equal(fake.state.plays, 1);
  });
});

describe('SoundPreference', () => {
  test('persists the choice and restores it in a new service instance', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const initial = new SoundPreference(storage, 'sound-enabled', () => {});
    initial.setEnabled(false);
    await initial.ready;
    await new Promise<void>((resolve) => setImmediate(resolve));

    const restored = new SoundPreference(storage, 'sound-enabled', () => {});
    await restored.ready;
    assert.equal(restored.isEnabled(), false);
  });

  test('does not let a late saved value overwrite a setting changed during startup', async () => {
    let resolveStoredValue!: (value: string | null) => void;
    const storage = {
      getItem: () => new Promise<string | null>((resolve) => {
        resolveStoredValue = resolve;
      }),
      setItem: async () => {},
    };
    const preference = new SoundPreference(storage, 'sound-enabled', () => {});

    preference.setEnabled(true);
    resolveStoredValue('false');
    await preference.ready;
    assert.equal(preference.isEnabled(), true);
  });
});
