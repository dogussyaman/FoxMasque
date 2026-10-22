CREATE OR REPLACE FUNCTION public._apply_round_block_effects(
    p_room_id UUID,
    p_round_number INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_room public.rooms;
BEGIN
    SELECT * INTO v_room
    FROM public.rooms
    WHERE id = p_room_id
    FOR UPDATE;
    IF NOT FOUND OR v_room.current_round <> p_round_number
       OR v_room.phase <> 'ability_select' THEN
        RAISE EXCEPTION 'Yetenek seçimi turu artık aktif değil';
    END IF;

    UPDATE public.room_players target
    SET is_blocked_current_round = TRUE
    WHERE target.room_id = p_room_id AND target.is_active
      AND EXISTS (
          SELECT 1
          FROM public.ability_actions block_action
          WHERE block_action.room_id = p_room_id
            AND block_action.round_number = p_round_number
            AND block_action.ability = 'block'
            AND block_action.target_id = target.player_id
      )
      AND NOT EXISTS (
          SELECT 1
          FROM public.ability_actions shield_action
          WHERE shield_action.room_id = p_room_id
            AND shield_action.round_number = p_round_number
            AND shield_action.ability = 'shield'
            AND shield_action.player_id = target.player_id
      );
END;
$$;

REVOKE ALL ON FUNCTION public._apply_round_block_effects(UUID, INTEGER)
FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
    CREATE OR REPLACE FUNCTION pg_temp.replace_function_text(
        p_signature REGPROCEDURE,
        p_replacements JSONB
    )
    RETURNS VOID
    LANGUAGE plpgsql
    AS $helper$
    DECLARE
        v_definition TEXT := pg_get_functiondef(p_signature);
        v_pair JSONB;
        v_old TEXT;
        v_new TEXT;
        v_pattern TEXT;
        v_character TEXT;
        v_previous_was_space BOOLEAN;
        v_index INTEGER;
        v_expected INTEGER;
        v_actual INTEGER;
        v_new_actual INTEGER;
    BEGIN
        FOR v_pair IN SELECT value FROM jsonb_array_elements(p_replacements)
        LOOP
            v_old := v_pair ->> 0;
            v_new := v_pair ->> 1;
            v_expected := (v_pair ->> 2)::INTEGER;
            v_pattern := '';
            v_previous_was_space := FALSE;
            v_old := btrim(v_old);
            v_index := 1;
            WHILE v_index <= char_length(v_old)
            LOOP
                v_character := substr(v_old, v_index, 1);
                IF v_character ~ '[[:space:]]' THEN
                    IF NOT v_previous_was_space THEN
                        v_pattern := v_pattern || '[[:space:]]+';
                    END IF;
                    v_previous_was_space := TRUE;
                ELSE
                    IF v_character IN (chr(92), '.', '^', '$', '|', '?', '*', '+', '(', ')', '[', ']', '{', '}') THEN
                        v_pattern := v_pattern || chr(92);
                    END IF;
                    v_pattern := v_pattern || v_character;
                    v_previous_was_space := FALSE;
                END IF;
                v_index := v_index + 1;
            END LOOP;
            SELECT count(*)::INTEGER INTO v_actual
            FROM regexp_matches(v_definition, v_pattern, 'g');
            IF v_new <> '' THEN
                v_pattern := '';
                v_previous_was_space := FALSE;
                v_index := 1;
                WHILE v_index <= char_length(v_new)
                LOOP
                    v_character := substr(v_new, v_index, 1);
                    IF v_character ~ '[[:space:]]' THEN
                        IF NOT v_previous_was_space THEN
                            v_pattern := v_pattern || '[[:space:]]+';
                        END IF;
                        v_previous_was_space := TRUE;
                    ELSE
                        IF v_character IN (chr(92), '.', '^', '$', '|', '?', '*', '+', '(', ')', '[', ']', '{', '}') THEN
                            v_pattern := v_pattern || chr(92);
                        END IF;
                        v_pattern := v_pattern || v_character;
                        v_previous_was_space := FALSE;
                    END IF;
                    v_index := v_index + 1;
                END LOOP;
                SELECT count(*)::INTEGER INTO v_new_actual
                FROM regexp_matches(v_definition, v_pattern, 'g');
                IF v_new_actual = v_expected THEN
                    CONTINUE;
                END IF;
            END IF;
            IF v_actual = 0 AND v_new = '' THEN
                CONTINUE;
            END IF;
            IF v_actual <> v_expected THEN
                RAISE EXCEPTION 'Expected % occurrence(s) of text in %, found %. Pattern: %',
                    v_expected, p_signature, v_actual, left(v_old, 120);
            END IF;
            v_definition := regexp_replace(v_definition, v_pattern, v_new, 'g');
        END LOOP;
        EXECUTE v_definition;
    END;
    $helper$;

    PERFORM pg_temp.replace_function_text(
        'public.confirm_ability_selection_secure(character varying)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                'IF v_remaining = 0 THEN' || E'\n' ||
                '        PERFORM public._set_room_phase(v_room.id, ''fake_answer'', v_room.round_seconds);',
                'IF v_remaining = 0 THEN' || E'\n' ||
                '        PERFORM public._apply_round_block_effects(v_room.id, v_room.current_round);' || E'\n' ||
                '        PERFORM public._set_room_phase(v_room.id, ''fake_answer'', v_room.round_seconds);',
                1
            )
        )
    );

    PERFORM pg_temp.replace_function_text(
        'public.advance_expired_room_phase_secure(character varying)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                'IF v_room.phase = ''ability_select'' THEN' || E'\n' ||
                '        PERFORM public._set_room_phase(v_room.id, ''fake_answer'', v_room.round_seconds);',
                'IF v_room.phase = ''ability_select'' THEN' || E'\n' ||
                '        PERFORM public._apply_round_block_effects(v_room.id, v_room.current_round);' || E'\n' ||
                '        PERFORM public._set_room_phase(v_room.id, ''fake_answer'', v_room.round_seconds);',
                1
            )
        )
    );

    PERFORM pg_temp.replace_function_text(
        'public.advance_round_secure(character varying)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                'IF v_room.phase = ''ability_select'' THEN' || E'\n' ||
                '        PERFORM public._set_room_phase(v_room.id, ''fake_answer'', v_room.round_seconds);',
                'IF v_room.phase = ''ability_select'' THEN' || E'\n' ||
                '        PERFORM public._apply_round_block_effects(v_room.id, v_room.current_round);' || E'\n' ||
                '        PERFORM public._set_room_phase(v_room.id, ''fake_answer'', v_room.round_seconds);',
                1
            ),
            jsonb_build_array(
                'SET is_blocked_current_round = is_blocked_next_round,' || E'\n' ||
                '                is_blocked_next_round = FALSE,',
                'SET is_blocked_current_round = FALSE,' || E'\n' ||
                '                is_blocked_next_round = FALSE,',
                1
            )
        )
    );

    PERFORM pg_temp.replace_function_text(
        'public.resolve_round_authoritative(uuid, integer)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                '    v_insert_count INTEGER;',
                '    v_insert_count INTEGER;' || E'\n' ||
                '    v_has_pick BOOLEAN;',
                1
            ),
            jsonb_build_array(
                '    SELECT count(*)::INTEGER INTO v_remaining' || E'\n' ||
                '    FROM public.room_players rp' || E'\n' ||
                '    WHERE rp.room_id = p_room_id AND rp.is_active' || E'\n' ||
                '      AND NOT EXISTS (' || E'\n' ||
                '          SELECT 1 FROM public.round_picks p' || E'\n' ||
                '          WHERE p.room_id = p_room_id AND p.round_number = p_round_number' || E'\n' ||
                '            AND p.player_id = rp.player_id' || E'\n' ||
                '      );' || E'\n' ||
                '    IF v_remaining > 0 THEN RAISE EXCEPTION ''Tüm oyuncular tahminini göndermedi''; END IF;',
                '',
                1
            ),
            jsonb_build_array(
                '        SELECT * INTO v_pick FROM public.round_picks' || E'\n' ||
                '        WHERE room_id = p_room_id AND round_number = p_round_number' || E'\n' ||
                '          AND player_id = v_player.player_id;' || E'\n' ||
                '        IF FOUND THEN',
                '        SELECT * INTO v_pick FROM public.round_picks' || E'\n' ||
                '        WHERE room_id = p_room_id AND round_number = p_round_number' || E'\n' ||
                '          AND player_id = v_player.player_id;' || E'\n' ||
                '        v_has_pick := FOUND;' || E'\n' ||
                '        IF v_has_pick THEN',
                1
            ),
            jsonb_build_array(
                '        v_delta := v_delta + v_victims * 50;',
                '        IF NOT v_has_pick THEN' || E'\n' ||
                '            v_delta := 0;' || E'\n' ||
                '            v_victims := 0;' || E'\n' ||
                '        ELSE' || E'\n' ||
                '            v_delta := v_delta + v_victims * 50;' || E'\n' ||
                '        END IF;',
                1
            ),
            jsonb_build_array(
                'WHEN v_victims >= 3 OR v_victims::NUMERIC / v_total_opponents > 0.5',
                'WHEN v_has_pick AND (v_victims >= 3 OR v_victims::NUMERIC / v_total_opponents > 0.5)',
                1
            ),
            jsonb_build_array(
                'UPDATE public.room_players target' || E'\n' ||
                '    SET is_blocked_next_round = TRUE' || E'\n' ||
                '    WHERE target.room_id = p_room_id AND target.is_active' || E'\n' ||
                '      AND NOT EXISTS (' || E'\n' ||
                '          SELECT 1 FROM public.ability_actions shield' || E'\n' ||
                '          WHERE shield.room_id = p_room_id AND shield.round_number = p_round_number' || E'\n' ||
                '            AND shield.player_id = target.player_id AND shield.ability = ''shield''' || E'\n' ||
                '      )' || E'\n' ||
                '      AND EXISTS (' || E'\n' ||
                '          SELECT 1 FROM public.ability_actions block_action' || E'\n' ||
                '          WHERE block_action.room_id = p_room_id AND block_action.round_number = p_round_number' || E'\n' ||
                '            AND block_action.target_id = target.player_id AND block_action.ability = ''block''' || E'\n' ||
                '      );',
                '',
                1
            )
        )
    );

    PERFORM pg_temp.replace_function_text(
        'public.get_room_state_secure(character varying)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                'AND block_action.round_number = v_room.current_round - 1',
                'AND block_action.round_number = v_room.current_round',
                1
            ),
            jsonb_build_array(
                'ORDER BY block_action.created_at, block_action.player_id',
                'ORDER BY block_action.player_id',
                1
            )
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.advance_expired_room_phase_secure(p_room_code VARCHAR(6))
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_room public.rooms;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    SELECT * INTO v_room FROM public.rooms WHERE code = upper(p_room_code) FOR UPDATE;
    IF NOT FOUND OR NOT public.is_room_member(v_room.id) THEN
        RAISE EXCEPTION 'Odaya erişim izniniz yok';
    END IF;
    IF v_room.phase_deadline_at IS NULL OR v_room.phase_deadline_at > now() THEN
        RETURN FALSE;
    END IF;
    IF v_room.phase = 'ability_select' THEN
        PERFORM public._apply_round_block_effects(v_room.id, v_room.current_round);
        PERFORM public._set_room_phase(v_room.id, 'fake_answer', v_room.round_seconds);
    ELSIF v_room.phase = 'fake_answer' THEN
        INSERT INTO public.round_fake_answers (room_id, round_number, player_id, fake_answer)
        SELECT v_room.id, v_room.current_round, rp.player_id, ''
        FROM public.room_players rp
        WHERE rp.room_id = v_room.id AND rp.is_active AND NOT rp.is_blocked_current_round
        ON CONFLICT (room_id, round_number, player_id) DO NOTHING;
        PERFORM public._build_round_choices(v_room.id, v_room.current_round);
        PERFORM public._set_room_phase(v_room.id, 'guess', v_room.round_seconds);
    ELSIF v_room.phase = 'guess' THEN
        PERFORM public.resolve_round_authoritative(v_room.id, v_room.current_round);
    ELSE
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$;

UPDATE public.room_players
SET is_blocked_next_round = FALSE
WHERE is_blocked_next_round;
