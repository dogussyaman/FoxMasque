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
        'public.use_ability_secure(character varying, public.ability_type, uuid)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                '    IF v_player.is_blocked_current_round THEN RAISE EXCEPTION ''Bu tur bloklandığınız için yetenek kullanamazsınız''; END IF;',
                '',
                1
            )
        )
    );

    PERFORM pg_temp.replace_function_text(
        'public.confirm_ability_selection_secure(character varying)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                'IF NOT EXISTS (' || E'\n' ||
                '        SELECT 1 FROM public.room_players' || E'\n' ||
                '        WHERE room_id = v_room.id AND player_id = v_user_id AND is_active' || E'\n' ||
                '          AND NOT is_blocked_current_round' || E'\n' ||
                '    ) THEN RAISE EXCEPTION ''Bu tur yetenek seçimini tamamlayamazsınız''; END IF;',
                'IF NOT EXISTS (' || E'\n' ||
                '        SELECT 1 FROM public.room_players' || E'\n' ||
                '        WHERE room_id = v_room.id AND player_id = v_user_id AND is_active' || E'\n' ||
                '    ) THEN RAISE EXCEPTION ''Bu tur yetenek seçimini tamamlayamazsınız''; END IF;',
                1
            ),
            jsonb_build_array(
                'UPDATE public.room_players' || E'\n' ||
                '    SET ability_ready_round = v_room.current_round' || E'\n' ||
                '    WHERE room_id = v_room.id AND player_id = v_user_id AND is_active' || E'\n' ||
                '      AND NOT is_blocked_current_round;',
                'UPDATE public.room_players' || E'\n' ||
                '    SET ability_ready_round = v_room.current_round' || E'\n' ||
                '    WHERE room_id = v_room.id AND player_id = v_user_id AND is_active;',
                1
            ),
            jsonb_build_array(
                'SELECT count(*)::INTEGER INTO v_remaining' || E'\n' ||
                '    FROM public.room_players' || E'\n' ||
                '    WHERE room_id = v_room.id AND is_active AND NOT is_blocked_current_round' || E'\n' ||
                '      AND ability_ready_round <> v_room.current_round;',
                'SELECT count(*)::INTEGER INTO v_remaining' || E'\n' ||
                '    FROM public.room_players' || E'\n' ||
                '    WHERE room_id = v_room.id AND is_active' || E'\n' ||
                '      AND ability_ready_round <> v_room.current_round;',
                1
            )
        )
    );

    PERFORM pg_temp.replace_function_text(
        'public.resolve_round_authoritative(uuid, integer)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                'WHERE rp.room_id = p_room_id AND rp.is_active AND NOT rp.is_blocked_current_round',
                'WHERE rp.room_id = p_room_id AND rp.is_active',
                1
            ),
            jsonb_build_array('IF FOUND AND NOT v_blocked THEN', 'IF FOUND THEN', 1),
            jsonb_build_array(
                'AND victim.is_active AND NOT victim.is_blocked_current_round;',
                'AND victim.is_active;',
                1
            ),
            jsonb_build_array(
                'v_blocked := v_penalty_count > 0 AND NOT v_player.is_blocked_current_round;',
                'v_blocked := v_penalty_count > 0;',
                1
            ),
            jsonb_build_array('          AND NOT target.is_blocked_current_round', '', 1),
            jsonb_build_array(
                'WHEN NOT v_blocked AND v_correct AND consecutive_correct + 1 >= 3',
                'WHEN v_correct AND consecutive_correct + 1 >= 3',
                2
            ),
            jsonb_build_array('WHEN v_blocked OR NOT v_correct THEN', 'WHEN NOT v_correct THEN', 1),
            jsonb_build_array(
                'WHEN NOT v_blocked' || E'\n' || '                     AND (v_victims >= 3 OR v_victims::NUMERIC / v_total_opponents > 0.5)',
                'WHEN v_victims >= 3 OR v_victims::NUMERIC / v_total_opponents > 0.5',
                1
            )
        )
    );

    PERFORM pg_temp.replace_function_text(
        'public.submit_pick_secure(character varying, integer)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array('          AND NOT is_blocked_current_round', '', 1),
            jsonb_build_array(
                'WHERE rp.room_id = v_room.id AND rp.is_active AND NOT rp.is_blocked_current_round',
                'WHERE rp.room_id = v_room.id AND rp.is_active',
                1
            )
        )
    );

    PERFORM pg_temp.replace_function_text(
        'public.advance_expired_room_phase_secure(character varying)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                'WHERE rp.room_id = v_room.id AND rp.is_active AND NOT rp.is_blocked_current_round' || E'\n' ||
                '              AND NOT EXISTS (',
                'WHERE rp.room_id = v_room.id AND rp.is_active' || E'\n' ||
                '              AND NOT EXISTS (',
                1
            )
        )
    );

    PERFORM pg_temp.replace_function_text(
        'public.get_room_state_secure(character varying)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                'AND (v_room.phase NOT IN (''fake_answer'', ''guess'') OR NOT rp.is_blocked_current_round);',
                'AND (v_room.phase <> ''fake_answer'' OR NOT rp.is_blocked_current_round);',
                1
            ),
            jsonb_build_array(
                'WHERE p.room_id = v_room.id AND p.round_number = v_room.current_round' || E'\n' ||
                '          AND rp.is_active AND NOT rp.is_blocked_current_round;',
                'WHERE p.room_id = v_room.id AND p.round_number = v_room.current_round' || E'\n' ||
                '          AND rp.is_active;',
                1
            ),
            jsonb_build_array(
                '                ''isBlockedNextRound'', rp.is_blocked_next_round,',
                '                ''isBlockedNextRound'', rp.is_blocked_next_round,' || E'\n' ||
                '                ''blockedByPlayerId'', CASE WHEN rp.is_blocked_current_round THEN (' || E'\n' ||
                '                    SELECT block_action.player_id' || E'\n' ||
                '                    FROM public.ability_actions block_action' || E'\n' ||
                '                    WHERE block_action.room_id = v_room.id' || E'\n' ||
                '                      AND block_action.round_number = v_room.current_round - 1' || E'\n' ||
                '                      AND block_action.ability = ''block''' || E'\n' ||
                '                      AND block_action.target_id = rp.player_id' || E'\n' ||
                '                      AND NOT EXISTS (' || E'\n' ||
                '                          SELECT 1 FROM public.ability_actions shield_action' || E'\n' ||
                '                          WHERE shield_action.room_id = v_room.id' || E'\n' ||
                '                            AND shield_action.round_number = block_action.round_number' || E'\n' ||
                '                            AND shield_action.player_id = rp.player_id' || E'\n' ||
                '                            AND shield_action.ability = ''shield''' || E'\n' ||
                '                      )' || E'\n' ||
                '                    ORDER BY block_action.created_at, block_action.player_id' || E'\n' ||
                '                    LIMIT 1' || E'\n' ||
                '                ) ELSE NULL END,',
                1
            ),
            jsonb_build_array(
                'WHEN v_room.phase IN (''fake_answer'', ''guess'')' || E'\n' ||
                '                          AND rp.is_blocked_current_round THEN TRUE',
                'WHEN v_room.phase = ''fake_answer''' || E'\n' ||
                '                          AND rp.is_blocked_current_round THEN TRUE',
                1
            )
        )
    );

    PERFORM pg_temp.replace_function_text(
        'public.nudge_player_secure(character varying, uuid)'::REGPROCEDURE,
        jsonb_build_array(
            jsonb_build_array(
                'IF v_target_done OR v_target.is_blocked_current_round THEN',
                'IF v_target_done OR (v_room.phase = ''fake_answer'' AND v_target.is_blocked_current_round) THEN',
                1
            )
        )
    );
END;
$$;
