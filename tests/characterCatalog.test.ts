import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { AVATAR_KEYS, DICEBEAR_AVATAR_KEYS } from '../features/game/players';
import { getPresetCharacterIdentity, PRESET_PRESET_SPECIAL_AVATAR_KEYS } from '../features/game/characterCatalog';

describe('Preset guest character identities', () => {
  test('every selectable shipped avatar has a stable character name', () => {
    const avatarKeys = [...PRESET_PRESET_SPECIAL_AVATAR_KEYS, ...AVATAR_KEYS, ...DICEBEAR_AVATAR_KEYS];

    for (const avatarKey of avatarKeys) {
      const first = getPresetCharacterIdentity(avatarKey);
      const second = getPresetCharacterIdentity(avatarKey);

      assert.equal(first.avatarKey, avatarKey);
      assert.ok(first.displayName.trim().length > 0, `missing name for ${avatarKey}`);
      assert.notEqual(first.displayName, 'Kuyruk Misafiri', `fallback name used for ${avatarKey}`);
      assert.deepEqual(second, first, `identity should be stable for ${avatarKey}`);
    }
  });

  test('the predefined avatar catalogue gives each selectable avatar its own persona name', () => {
    const avatarKeys = [...PRESET_SPECIAL_AVATAR_KEYS, ...AVATAR_KEYS, ...DICEBEAR_AVATAR_KEYS];
    const names = avatarKeys.map((key) => getPresetCharacterIdentity(key).displayName);

    assert.equal(new Set(names).size, names.length);
  });
});
