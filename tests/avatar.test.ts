import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  DICEBEAR_AVATAR_KEYS,
  DICEBEAR_STYLES,
  avatarOf,
  createDiceBearAvatarKey,
  defaultDiceBearAvatarKey,
  diceBearAvatarSvg,
} from '../features/game/players';

describe('DiceBear avatars', () => {
  test('generates local SVGs for each supported style', () => {
    for (const style of DICEBEAR_STYLES) {
      const key = createDiceBearAvatarKey(style, 'test-seed');
      const svg = diceBearAvatarSvg(key);

      assert.ok(svg);
      assert.match(svg, /<svg/);
      assert.equal(diceBearAvatarSvg(key), svg);
    }
  });

  test('keeps the default seed stable per user without exposing the user ID', () => {
    const first = defaultDiceBearAvatarKey('private-user-id-1');

    assert.equal(defaultDiceBearAvatarKey('private-user-id-1'), first);
    assert.notEqual(defaultDiceBearAvatarKey('private-user-id-2'), first);
    assert.equal(first.includes('private-user-id-1'), false);
    assert.ok(diceBearAvatarSvg(first));
  });

  test('keeps legacy DiceBear keys renderable and safely handles missing profile data', () => {
    assert.ok(diceBearAvatarSvg('db-00'));
    assert.equal(diceBearAvatarSvg('db-99'), null);
    assert.equal(DICEBEAR_AVATAR_KEYS.length, 96);
    assert.equal(avatarOf(null).key, 'fox');
  });

  test('shows a mix of every avatar style in the initial picker choices', () => {
    const initialChoices = DICEBEAR_AVATAR_KEYS.slice(0, 12);
    const visibleStyles = new Set(initialChoices.map((key) => key.split(':')[1]));

    assert.deepEqual([...visibleStyles], DICEBEAR_STYLES);
  });
});
