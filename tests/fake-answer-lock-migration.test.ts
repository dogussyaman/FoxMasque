import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/20261114000001_restore_fake_answer_room_lock.sql', import.meta.url),
  'utf8'
);

test('fake-answer RPC locks the room before validating and inserting a submission', () => {
  assert.match(
    migration,
    /SELECT\s+\*\s+INTO\s+v_room\s+FROM\s+public\.rooms\s+WHERE\s+code\s*=\s*UPPER\(p_room_code\)\s+FOR\s+UPDATE;/i,
    'the room row lock is required to serialize concurrent submissions'
  );
  assert.match(migration, /IF v_room\.phase <> 'fake_answer' THEN/i);
  assert.match(migration, /v_player\.is_blocked_current_round/i);
  assert.match(
    migration,
    /PERFORM public\._set_room_phase\(v_room\.id,\s*'guess',\s*v_room\.round_seconds\)/i,
    'the shared guess deadline must still reset when the phase advances early'
  );
});
