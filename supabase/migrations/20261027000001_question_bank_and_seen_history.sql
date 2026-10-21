ALTER TABLE public.questions
    ADD COLUMN IF NOT EXISTS difficulty TEXT,
    ADD COLUMN IF NOT EXISTS subcategory TEXT,
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.questions
SET status = CASE WHEN is_active IS DISTINCT FROM FALSE THEN 'approved' ELSE 'archived' END
WHERE status IS NULL;

UPDATE public.questions
SET difficulty = 'medium'
WHERE difficulty IS NULL;

ALTER TABLE public.questions
    ALTER COLUMN difficulty SET DEFAULT 'medium',
    ALTER COLUMN difficulty SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'draft',
    ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.questions'::regclass
          AND conname = 'questions_difficulty_check'
    ) THEN
        ALTER TABLE public.questions
            ADD CONSTRAINT questions_difficulty_check
            CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.questions'::regclass
          AND conname = 'questions_status_check'
    ) THEN
        ALTER TABLE public.questions
            ADD CONSTRAINT questions_status_check
            CHECK (status IN ('draft', 'approved', 'archived')) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.questions'::regclass
          AND conname = 'questions_source_url_check'
    ) THEN
        ALTER TABLE public.questions
            ADD CONSTRAINT questions_source_url_check
            CHECK (source_url IS NULL OR source_url ~* '^https?://') NOT VALID;
    END IF;
END;
$$;

ALTER TABLE public.questions
    VALIDATE CONSTRAINT questions_difficulty_check,
    VALIDATE CONSTRAINT questions_status_check,
    VALIDATE CONSTRAINT questions_source_url_check;

CREATE TABLE IF NOT EXISTS public.question_legacy_decoys (
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
    position INTEGER NOT NULL,
    choice_text TEXT NOT NULL,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (question_id, position)
);

ALTER TABLE public.question_legacy_decoys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.question_legacy_decoys FROM anon, authenticated;

INSERT INTO public.question_legacy_decoys (question_id, position, choice_text)
SELECT q.id, legacy.position::INTEGER, legacy.choice_text
FROM public.questions q
CROSS JOIN LATERAL unnest(q.default_decoys) WITH ORDINALITY AS legacy(choice_text, position)
WHERE nullif(btrim(legacy.choice_text), '') IS NOT NULL
ON CONFLICT (question_id, position) DO NOTHING;

UPDATE public.questions
SET default_decoys = ARRAY[]::TEXT[]
WHERE default_decoys IS DISTINCT FROM ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS public.question_seen_history (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    first_seen_room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    first_seen_game_number INTEGER NOT NULL,
    first_seen_round_number INTEGER NOT NULL,
    PRIMARY KEY (user_id, category_id, question_id)
);

CREATE INDEX IF NOT EXISTS question_seen_history_user_category_idx
    ON public.question_seen_history (user_id, category_id, first_seen_at DESC);

ALTER TABLE public.question_seen_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS question_seen_history_owner_read ON public.question_seen_history;
CREATE POLICY question_seen_history_owner_read
    ON public.question_seen_history FOR SELECT TO authenticated
    USING (user_id = auth.uid());
REVOKE ALL ON public.question_seen_history FROM anon, authenticated;
GRANT SELECT ON public.question_seen_history TO authenticated;

CREATE TABLE IF NOT EXISTS public.question_reservations (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    game_number INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, category_id, question_id)
);

CREATE INDEX IF NOT EXISTS question_reservations_expiry_idx
    ON public.question_reservations (expires_at);

ALTER TABLE public.question_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.question_reservations FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public._reserve_unseen_question_for_round()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_room public.rooms;
    v_player_id UUID;
    v_question_id TEXT;
    v_available_count INTEGER;
    v_rounds_remaining INTEGER;
BEGIN
    SELECT * INTO v_room
    FROM public.rooms
    WHERE id = NEW.room_id
    FOR UPDATE;
    IF NOT FOUND OR NEW.game_number <> v_room.game_number
       OR NEW.round_number < 1 OR NEW.round_number > v_room.total_rounds THEN
        RAISE EXCEPTION 'Soru için geçerli oyun turu bulunamadı';
    END IF;

    FOR v_player_id IN
        SELECT rp.player_id
        FROM public.room_players rp
        WHERE rp.room_id = v_room.id AND rp.is_active
        ORDER BY rp.player_id
    LOOP
        PERFORM pg_advisory_xact_lock(
            hashtextextended('foxmasque-question-history:' || v_player_id::TEXT, 0)
        );
        DELETE FROM public.question_reservations qr
        WHERE qr.user_id = v_player_id AND qr.expires_at <= now();
    END LOOP;

    IF NOT EXISTS (
        SELECT 1
        FROM public.room_players rp
        WHERE rp.room_id = v_room.id AND rp.is_active
    ) THEN
        RAISE EXCEPTION 'Aktif oyuncu olmadığı için soru seçilemedi';
    END IF;

    v_rounds_remaining := v_room.total_rounds - NEW.round_number + 1;
    SELECT count(*)::INTEGER INTO v_available_count
    FROM public.questions q
    WHERE q.category_id = ANY(v_room.selected_categories)
      AND q.is_active
      AND q.status = 'approved'
      AND NOT EXISTS (
          SELECT 1
          FROM public.room_players rp
          JOIN public.question_seen_history sh
            ON sh.user_id = rp.player_id
           AND sh.category_id = q.category_id
           AND sh.question_id = q.id
          WHERE rp.room_id = v_room.id AND rp.is_active
      )
      AND NOT EXISTS (
          SELECT 1
          FROM public.room_players rp
          JOIN public.question_reservations qr
            ON qr.user_id = rp.player_id
           AND qr.category_id = q.category_id
           AND qr.question_id = q.id
          WHERE rp.room_id = v_room.id
            AND rp.is_active
            AND qr.expires_at > now()
      )
      AND NOT EXISTS (
          SELECT 1
          FROM public.room_round_questions rrq
          WHERE rrq.room_id = v_room.id
            AND rrq.game_number = NEW.game_number
            AND rrq.question_id = q.id
      );

    IF v_available_count < v_rounds_remaining THEN
        RAISE EXCEPTION 'Seçilen kategorilerde oyuncuların görmediği % tur için yeterli soru yok',
            v_rounds_remaining;
    END IF;

    SELECT q.id INTO v_question_id
    FROM public.questions q
    WHERE q.category_id = ANY(v_room.selected_categories)
      AND q.is_active
      AND q.status = 'approved'
      AND NOT EXISTS (
          SELECT 1
          FROM public.room_players rp
          JOIN public.question_seen_history sh
            ON sh.user_id = rp.player_id
           AND sh.category_id = q.category_id
           AND sh.question_id = q.id
          WHERE rp.room_id = v_room.id AND rp.is_active
      )
      AND NOT EXISTS (
          SELECT 1
          FROM public.room_players rp
          JOIN public.question_reservations qr
            ON qr.user_id = rp.player_id
           AND qr.category_id = q.category_id
           AND qr.question_id = q.id
          WHERE rp.room_id = v_room.id
            AND rp.is_active
            AND qr.expires_at > now()
      )
      AND NOT EXISTS (
          SELECT 1
          FROM public.room_round_questions rrq
          WHERE rrq.room_id = v_room.id
            AND rrq.game_number = NEW.game_number
            AND rrq.question_id = q.id
      )
    ORDER BY random()
    LIMIT 1;

    IF v_question_id IS NULL THEN
        RAISE EXCEPTION 'Oyuncuların görmediği uygun soru bulunamadı';
    END IF;

    NEW.question_id := v_question_id;

    INSERT INTO public.question_reservations (
        user_id, category_id, question_id, room_id, game_number, round_number, expires_at
    )
    SELECT rp.player_id, q.category_id, q.id, v_room.id, NEW.game_number,
           NEW.round_number, now() + interval '10 minutes'
    FROM public.room_players rp
    JOIN public.questions q ON q.id = v_question_id
    WHERE rp.room_id = v_room.id AND rp.is_active;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public._sync_assigned_room_question()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_question_id TEXT;
BEGIN
    IF NEW.current_question_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT rrq.question_id INTO v_question_id
    FROM public.room_round_questions rrq
    WHERE rrq.room_id = NEW.id
      AND rrq.game_number = NEW.game_number
      AND rrq.round_number = NEW.current_round;

    IF v_question_id IS NOT NULL THEN
        NEW.current_question_id := v_question_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS room_round_questions_reserve_unseen ON public.room_round_questions;
CREATE TRIGGER room_round_questions_reserve_unseen
    BEFORE INSERT ON public.room_round_questions
    FOR EACH ROW EXECUTE FUNCTION public._reserve_unseen_question_for_round();

DROP TRIGGER IF EXISTS rooms_sync_assigned_question ON public.rooms;
CREATE TRIGGER rooms_sync_assigned_question
    BEFORE UPDATE OF current_question_id, current_round, game_number ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION public._sync_assigned_room_question();

CREATE OR REPLACE FUNCTION public.mark_current_question_seen_secure(p_room_code VARCHAR(6))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms;
    v_category_id TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    SELECT r.* INTO v_room
    FROM public.rooms r
    JOIN public.room_players rp
      ON rp.room_id = r.id AND rp.player_id = v_user_id AND rp.is_active
    WHERE r.code = upper(p_room_code)
      AND r.phase IN ('ability_select', 'fake_answer', 'guess')
    FOR UPDATE OF r;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Aktif oyun sorusu bulunamadı veya erişim izniniz yok';
    END IF;

    SELECT q.category_id INTO v_category_id
    FROM public.room_round_questions rrq
    JOIN public.questions q ON q.id = rrq.question_id
    WHERE rrq.room_id = v_room.id
      AND rrq.game_number = v_room.game_number
      AND rrq.round_number = v_room.current_round
      AND rrq.question_id = v_room.current_question_id;
    IF v_category_id IS NULL THEN
        RAISE EXCEPTION 'Görüntülenen tur sorusu bulunamadı';
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtextextended('foxmasque-question-history:' || v_user_id::TEXT, 0)
    );

    INSERT INTO public.question_seen_history (
        user_id, category_id, question_id, first_seen_room_id,
        first_seen_game_number, first_seen_round_number
    )
    VALUES (
        v_user_id, v_category_id, v_room.current_question_id, v_room.id,
        v_room.game_number, v_room.current_round
    )
    ON CONFLICT (user_id, category_id, question_id) DO NOTHING;

    DELETE FROM public.question_reservations
    WHERE user_id = v_user_id
      AND room_id = v_room.id
      AND game_number = v_room.game_number
      AND round_number = v_room.current_round
      AND question_id = v_room.current_question_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_question_secure(p_room_code VARCHAR(6))
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_question JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    SELECT jsonb_build_object(
        'id', q.id,
        'categoryId', q.category_id,
        'prompt', q.prompt,
        'correctAnswer', CASE
            WHEN r.phase IN ('reveal', 'scoreboard', 'game_over') THEN q.correct_answer
            ELSE NULL
        END,
        'difficulty', q.difficulty,
        'subcategory', q.subcategory,
        'explanation', CASE
            WHEN r.phase IN ('reveal', 'scoreboard', 'game_over') THEN q.explanation
            ELSE NULL
        END,
        'sourceUrl', CASE
            WHEN r.phase IN ('reveal', 'scoreboard', 'game_over') THEN q.source_url
            ELSE NULL
        END,
        'status', q.status
    )
    INTO v_question
    FROM public.rooms r
    JOIN public.room_players rp
      ON rp.room_id = r.id AND rp.player_id = v_user_id AND rp.is_active
    JOIN public.room_round_questions rrq
      ON rrq.room_id = r.id
     AND rrq.game_number = r.game_number
     AND rrq.round_number = r.current_round
     AND rrq.question_id = r.current_question_id
    JOIN public.questions q ON q.id = rrq.question_id
    WHERE r.code = upper(p_room_code)
      AND r.phase IN ('ability_select', 'fake_answer', 'guess', 'reveal', 'scoreboard', 'game_over');

    IF v_question IS NULL THEN
        RAISE EXCEPTION 'Aktif soru bulunamadı veya erişim izniniz yok';
    END IF;
    RETURN v_question;
END;
$$;

REVOKE ALL ON FUNCTION public._reserve_unseen_question_for_round() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._sync_assigned_room_question() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_current_question_seen_secure(VARCHAR) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_current_question_seen_secure(VARCHAR) TO authenticated;
REVOKE ALL ON FUNCTION public.get_current_question_secure(VARCHAR) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_question_secure(VARCHAR) TO authenticated;
