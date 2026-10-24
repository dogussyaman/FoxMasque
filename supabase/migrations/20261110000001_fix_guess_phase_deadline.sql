-- Enforce bluff-answer integrity at the authoritative Supabase boundary.
-- Rules: reject the actual answer and reject normalized duplicate fake answers.
-- Row locking serializes submissions for the same room/round so concurrent clients
-- cannot both pass the duplicate check.

CREATE OR REPLACE FUNCTION public.submit_fake_answer_secure(
    p_room_code VARCHAR(6),
    p_fake_answer TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_player RECORD;
    v_trimmed TEXT := btrim(p_fake_answer);
    v_normalized TEXT;
    v_correct_normalized TEXT;
    v_active_players_count INT;
    v_submitted_count INT;
    v_q RECORD;
    v_rec RECORD;
    v_idx INT := 0;
    v_i INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    IF v_trimmed IS NULL OR length(v_trimmed) < 1 OR length(v_trimmed) > 120 THEN
        RAISE EXCEPTION 'Sahte cevap 1-120 karakter arasında olmalıdır';
    END IF;

    SELECT * INTO v_room
    FROM public.rooms
    WHERE code = UPPER(p_room_code)
    FOR UPDATE;

    IF v_room.id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    IF v_room.phase <> 'fake_answer' THEN
        RAISE EXCEPTION 'Sahte cevap aşaması aktif değil';
    END IF;

    SELECT * INTO v_player
    FROM public.room_players
    WHERE room_id = v_room.id AND player_id = v_user_id;

    IF v_player.player_id IS NULL THEN
        RAISE EXCEPTION 'Oda üyesi değilsiniz';
    END IF;

    IF v_player.is_blocked_current_round THEN
        RAISE EXCEPTION 'Bu tur bloklandığınız için cevap veremezsiniz';
    END IF;

    SELECT * INTO v_q
    FROM public.questions
    WHERE id = v_room.current_question_id;

    IF v_q.id IS NULL OR v_q.correct_answer IS NULL THEN
        RAISE EXCEPTION 'Bu tur için doğru cevap bulunamadı';
    END IF;

    -- Case-insensitive and whitespace-insensitive matching; preserve punctuation.
    v_normalized := lower(regexp_replace(normalize(btrim(v_trimmed), NFKC), '[[:space:]]+', ' ', 'g'));
    v_correct_normalized := lower(regexp_replace(normalize(btrim(v_q.correct_answer), NFKC), '[[:space:]]+', ' ', 'g'));

    IF v_normalized = v_correct_normalized THEN
        RAISE EXCEPTION 'Gerçek cevabı sahte cevap olarak gönderemezsiniz. Başka bir cevap yazın';
    END IF;

    -- Exclude this player to permit their own in-phase retry/update.
    IF EXISTS (
        SELECT 1
        FROM public.round_fake_answers fa
        WHERE fa.room_id = v_room.id
          AND fa.round_number = v_room.current_round
          AND fa.player_id <> v_user_id
          AND lower(regexp_replace(normalize(btrim(fa.fake_answer), NFKC), '[[:space:]]+', ' ', 'g')) = v_normalized
    ) THEN
        RAISE EXCEPTION 'Bu cevap başka bir oyuncu tarafından gönderildi. Farklı bir cevap yazın';
    END IF;

    INSERT INTO public.round_fake_answers (room_id, round_number, player_id, fake_answer)
    VALUES (v_room.id, v_room.current_round, v_user_id, v_trimmed)
    ON CONFLICT (room_id, round_number, player_id)
    DO UPDATE SET fake_answer = EXCLUDED.fake_answer;

    SELECT COUNT(*) INTO v_active_players_count
    FROM public.room_players
    WHERE room_id = v_room.id
      AND is_online = TRUE
      AND is_blocked_current_round = FALSE;

    SELECT COUNT(*) INTO v_submitted_count
    FROM public.round_fake_answers fa
    JOIN public.room_players rp
      ON rp.room_id = fa.room_id AND rp.player_id = fa.player_id
    WHERE fa.room_id = v_room.id
      AND fa.round_number = v_room.current_round
      AND rp.is_online = TRUE
      AND rp.is_blocked_current_round = FALSE;

    IF v_submitted_count >= v_active_players_count THEN
        DELETE FROM public.round_choices
        WHERE room_id = v_room.id AND round_number = v_room.current_round;

        CREATE TEMP TABLE temp_blended_choices (
            choice_text TEXT,
            author_id UUID,
            is_correct BOOLEAN
        ) ON COMMIT DROP;

        INSERT INTO temp_blended_choices (choice_text, author_id, is_correct)
        VALUES (btrim(v_q.correct_answer), NULL, TRUE);

        -- Deduplicate legacy rows too, using the same canonical comparison.
        FOR v_rec IN
            SELECT fake_answer, player_id
            FROM public.round_fake_answers
            WHERE room_id = v_room.id AND round_number = v_room.current_round
            ORDER BY submitted_at, player_id
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM temp_blended_choices t
                WHERE lower(regexp_replace(normalize(btrim(t.choice_text), NFKC), '[[:space:]]+', ' ', 'g'))
                    = lower(regexp_replace(normalize(btrim(v_rec.fake_answer), NFKC), '[[:space:]]+', ' ', 'g'))
            ) THEN
                INSERT INTO temp_blended_choices (choice_text, author_id, is_correct)
                VALUES (btrim(v_rec.fake_answer), v_rec.player_id, FALSE);
            END IF;
        END LOOP;

        IF v_q.default_decoys IS NOT NULL THEN
            FOR v_i IN 1..COALESCE(array_length(v_q.default_decoys, 1), 0) LOOP
                IF (SELECT COUNT(*) FROM temp_blended_choices) >= 4 THEN
                    EXIT;
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM temp_blended_choices t
                    WHERE lower(regexp_replace(normalize(btrim(t.choice_text), NFKC), '[[:space:]]+', ' ', 'g'))
                        = lower(regexp_replace(normalize(btrim(v_q.default_decoys[v_i]), NFKC), '[[:space:]]+', ' ', 'g'))
                ) THEN
                    INSERT INTO temp_blended_choices (choice_text, author_id, is_correct)
                    VALUES (btrim(v_q.default_decoys[v_i]), NULL, FALSE);
                END IF;
            END LOOP;
        END IF;

        v_idx := 0;
        FOR v_rec IN
            SELECT * FROM temp_blended_choices ORDER BY random()
        LOOP
            INSERT INTO public.round_choices (room_id, round_number, choice_index, text, author_id, is_correct)
            VALUES (v_room.id, v_room.current_round, v_idx, v_rec.choice_text, v_rec.author_id, v_rec.is_correct);
            v_idx := v_idx + 1;
        END LOOP;

        -- Reset the shared deadline whenever the guess phase starts early.
        PERFORM public._set_room_phase(v_room.id, 'guess', v_room.round_seconds);
    END IF;
END;
$$;
