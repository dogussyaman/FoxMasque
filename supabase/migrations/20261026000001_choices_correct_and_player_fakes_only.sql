-- Build each round's answer pool from the correct answer and submitted player
-- fakes only. Do not expose the question's multiple-choice distractors.
CREATE OR REPLACE FUNCTION public._build_round_choices(p_room_id UUID, p_round_number INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_question_id TEXT;
BEGIN
    SELECT r.current_question_id INTO v_question_id
    FROM public.rooms r
    WHERE r.id = p_room_id;
    IF v_question_id IS NULL THEN RAISE EXCEPTION 'Tur sorusu bulunamadı'; END IF;

    DELETE FROM public.round_choices rc
    WHERE rc.room_id = p_room_id AND rc.round_number = p_round_number;

    INSERT INTO public.round_choices (
        room_id, round_number, choice_index, text, author_id, is_correct
    )
    WITH q AS (
        SELECT questions.correct_answer
        FROM public.questions
        WHERE questions.id = v_question_id
    ), candidates AS (
        SELECT q.correct_answer AS choice_text,
               NULL::UUID AS author_id,
               TRUE AS is_correct,
               0 AS priority
        FROM q
        UNION ALL
        SELECT btrim(f.fake_answer),
               f.player_id,
               FALSE,
               1
        FROM public.round_fake_answers f
        CROSS JOIN q
        WHERE f.room_id = p_room_id
          AND f.round_number = p_round_number
          AND btrim(f.fake_answer) <> ''
          AND lower(btrim(f.fake_answer)) <> lower(btrim(q.correct_answer))
    ), deduplicated AS (
        SELECT DISTINCT ON (lower(btrim(c.choice_text)))
               c.choice_text, c.author_id, c.is_correct
        FROM candidates c
        ORDER BY lower(btrim(c.choice_text)), c.priority
    ), shuffled AS (
        SELECT row_number() OVER (ORDER BY random())::INTEGER - 1 AS choice_index,
               d.choice_text, d.author_id, d.is_correct
        FROM deduplicated d
    )
    SELECT p_room_id, p_round_number, s.choice_index, s.choice_text, s.author_id, s.is_correct
    FROM shuffled s;

    IF NOT EXISTS (
        SELECT 1
        FROM public.round_choices rc
        WHERE rc.room_id = p_room_id
          AND rc.round_number = p_round_number
          AND rc.is_correct
    ) THEN
        RAISE EXCEPTION 'Soru için doğru cevap seçeneği oluşturulamadı';
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public._build_round_choices(UUID, INTEGER) FROM PUBLIC, anon, authenticated;
