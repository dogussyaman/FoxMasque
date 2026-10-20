-- ==============================================================================
-- ZARTIX — Server-Authoritative Database Schema & Security Definer Functions
-- ==============================================================================
-- Designed for secure, cheat-proof multiplayer party game logic.
-- Client NEVER writes directly to scores or validates zartal/abilities.
-- All actions pass through authenticated database functions with RLS enforcement.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE room_phase AS ENUM (
        'lobby',
        'category_select',
        'ability_select',
        'question',
        'submitting',
        'waiting',
        'reveal',
        'scoreboard',
        'game_over'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ability_type AS ENUM ('block', 'shield', 'penalty', 'counter');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,
    host_id UUID NOT NULL,
    phase room_phase NOT NULL DEFAULT 'lobby',
    current_round INT NOT NULL DEFAULT 1,
    total_rounds INT NOT NULL DEFAULT 5,
    round_seconds INT NOT NULL DEFAULT 15,
    selected_categories TEXT[] NOT NULL DEFAULT ARRAY['genel-kultur', 'hayvanlar-alem', 'film-ve-dizi']::TEXT[],
    current_question_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ROOM PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.room_players (
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL,
    name VARCHAR(32) NOT NULL,
    avatar_key VARCHAR(32) NOT NULL DEFAULT 'fox',
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    score INT NOT NULL DEFAULT 0,
    ability_uses JSONB NOT NULL DEFAULT '{"block": 0, "shield": 0, "penalty": 0, "counter": 0}'::JSONB,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (room_id, player_id)
);

-- 5. ROUND ANSWERS TABLE (Server-Authoritative)
CREATE TABLE IF NOT EXISTS public.round_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    player_id UUID NOT NULL,
    question_id TEXT NOT NULL,
    selected_index INT NOT NULL,
    zartal_target_id UUID,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_id, round_number, player_id)
);

-- 6. ABILITY ACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.ability_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    player_id UUID NOT NULL,
    ability ability_type NOT NULL,
    target_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. ROUND RESULTS LOG
CREATE TABLE IF NOT EXISTS public.round_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    player_id UUID NOT NULL,
    answered_correctly BOOLEAN NOT NULL,
    zartaladın BOOLEAN NOT NULL,
    zartalandın BOOLEAN NOT NULL,
    points_delta INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_id, round_number, player_id)
);

-- 8. NUDGES (Realtime broadcast table)
CREATE TABLE IF NOT EXISTS public.nudges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    from_id UUID NOT NULL,
    to_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ability_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- 10. RLS POLICIES
-- Anyone authenticated can read rooms they participate in
CREATE POLICY "Public read open rooms" ON public.rooms
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Read room players" ON public.room_players
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Player submit own answer" ON public.round_answers
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Read round answers after reveal" ON public.round_answers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Player declare ability" ON public.ability_actions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Read round results" ON public.round_results
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Insert nudge" ON public.nudges
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_id);

CREATE POLICY "Read nudges" ON public.nudges
    FOR SELECT TO authenticated USING (auth.uid() = to_id OR auth.uid() = from_id);

-- 11. SERVER-AUTHORITATIVE RPC: CREATE ROOM
CREATE OR REPLACE FUNCTION public.create_room_secure(
    p_code VARCHAR(6),
    p_name VARCHAR(32),
    p_avatar_key VARCHAR(32),
    p_total_rounds INT,
    p_round_seconds INT,
    p_categories TEXT[]
)
RETURNS TABLE (room_id UUID, room_code VARCHAR(6), host_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    INSERT INTO public.rooms (
        code, host_id, total_rounds, round_seconds, selected_categories, phase
    ) VALUES (
        UPPER(p_code), v_user_id, p_total_rounds, p_round_seconds, p_categories, 'lobby'
    )
    RETURNING id INTO v_room_id;

    INSERT INTO public.room_players (
        room_id, player_id, name, avatar_key, is_host, is_ready, score
    ) VALUES (
        v_room_id, v_user_id, p_name, p_avatar_key, TRUE, TRUE, 0
    );

    RETURN QUERY SELECT v_room_id, UPPER(p_code), v_user_id;
END;
$$;

-- 12. SERVER-AUTHORITATIVE RPC: JOIN ROOM
CREATE OR REPLACE FUNCTION public.join_room_secure(
    p_code VARCHAR(6),
    p_name VARCHAR(32),
    p_avatar_key VARCHAR(32)
)
RETURNS TABLE (room_id UUID, player_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room_id UUID;
    v_phase room_phase;
    v_count INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    SELECT id, phase INTO v_room_id, v_phase
    FROM public.rooms
    WHERE code = UPPER(p_code);

    IF v_room_id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    IF v_phase <> 'lobby' THEN
        RAISE EXCEPTION 'Oyun çoktan başladı';
    END IF;

    SELECT COUNT(*) INTO v_count FROM public.room_players WHERE room_id = v_room_id;
    IF v_count >= 10 THEN
        RAISE EXCEPTION 'Oda dolu (Maksimum 10 oyuncu)';
    END IF;

    INSERT INTO public.room_players (
        room_id, player_id, name, avatar_key, is_host, is_ready, score
    ) VALUES (
        v_room_id, v_user_id, p_name, p_avatar_key, FALSE, FALSE, 0
    )
    ON CONFLICT (room_id, player_id) DO UPDATE
    SET name = EXCLUDED.name, avatar_key = EXCLUDED.avatar_key, is_online = TRUE;

    RETURN QUERY SELECT v_room_id, v_user_id;
END;
$$;

-- 13. SERVER-AUTHORITATIVE RPC: RESOLVE ROUND & COMPUTE SCORES
CREATE OR REPLACE FUNCTION public.resolve_round_secure(
    p_room_id UUID,
    p_round_number INT,
    p_correct_index INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    v_target_ans RECORD;
    v_has_shield BOOLEAN;
    v_is_blocked BOOLEAN;
    v_counter_active BOOLEAN;
    v_delta INT;
    v_zartaladın BOOLEAN;
    v_zartalandın BOOLEAN;
    v_correct BOOLEAN;
BEGIN
    -- Only the room host can trigger round resolution
    IF NOT EXISTS (
        SELECT 1 FROM public.rooms WHERE id = p_room_id AND host_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Yalnızca oda kurucusu tur sonucunu onaylayabilir';
    END IF;

    FOR rec IN
        SELECT
            p.player_id,
            a.selected_index,
            a.zartal_target_id
        FROM public.room_players p
        LEFT JOIN public.round_answers a
            ON a.room_id = p_room_id
           AND a.round_number = p_round_number
           AND a.player_id = p.player_id
        WHERE p.room_id = p_room_id
    LOOP
        v_correct := (rec.selected_index IS NOT NULL AND rec.selected_index = p_correct_index);
        v_zartaladın := FALSE;
        v_zartalandın := FALSE;
        v_delta := 0;

        IF v_correct THEN
            v_delta := v_delta + 100; -- DOĞRU BİLDİN (+100)
        END IF;

        -- Check Zartal attempt by this player
        IF rec.zartal_target_id IS NOT NULL AND v_correct THEN
            -- Check defender's answer & defenses
            SELECT selected_index INTO v_target_ans
            FROM public.round_answers
            WHERE room_id = p_room_id AND round_number = p_round_number AND player_id = rec.zartal_target_id;

            SELECT EXISTS(
                SELECT 1 FROM public.ability_actions
                WHERE room_id = p_room_id AND round_number = p_round_number
                  AND player_id = rec.zartal_target_id AND ability = 'shield'
            ) INTO v_has_shield;

            SELECT EXISTS(
                SELECT 1 FROM public.ability_actions
                WHERE room_id = p_room_id AND round_number = p_round_number
                  AND player_id = rec.zartal_target_id AND ability = 'block'
                  AND target_id = rec.player_id
            ) INTO v_is_blocked;

            -- Target wrong and not protected
            IF (v_target_ans.selected_index IS NULL OR v_target_ans.selected_index <> p_correct_index)
               AND NOT v_has_shield AND NOT v_is_blocked THEN
                v_zartaladın := TRUE;
                v_delta := v_delta + 50; -- ZARTALADIN (+50)
            END IF;
        END IF;

        -- Check if someone successfully zartaled this player
        SELECT EXISTS (
            SELECT 1
            FROM public.round_answers attacker_ans
            JOIN public.ability_actions act ON TRUE
            WHERE attacker_ans.room_id = p_room_id
              AND attacker_ans.round_number = p_round_number
              AND attacker_ans.zartal_target_id = rec.player_id
              AND attacker_ans.selected_index = p_correct_index
              AND NOT v_correct
              AND NOT EXISTS (
                  SELECT 1 FROM public.ability_actions
                  WHERE room_id = p_room_id AND round_number = p_round_number
                    AND player_id = rec.player_id AND ability = 'shield'
              )
              AND NOT EXISTS (
                  SELECT 1 FROM public.ability_actions
                  WHERE room_id = p_room_id AND round_number = p_round_number
                    AND player_id = rec.player_id AND ability = 'block'
                    AND target_id = attacker_ans.player_id
              )
        ) INTO v_zartalandın;

        IF v_zartalandın THEN
            v_delta := v_delta - 40; -- ZARTALANDIN (-40)
        END IF;

        -- Record result
        INSERT INTO public.round_results (
            room_id, round_number, player_id, answered_correctly, zartaladın, zartalandın, points_delta
        ) VALUES (
            p_room_id, p_round_number, rec.player_id, v_correct, v_zartaladın, v_zartalandın, v_delta
        )
        ON CONFLICT (room_id, round_number, player_id) DO UPDATE
        SET points_delta = EXCLUDED.points_delta;

        -- Update cumulative player score (minimum 0)
        UPDATE public.room_players
        SET score = GREATEST(0, score + v_delta)
        WHERE room_id = p_room_id AND player_id = rec.player_id;
    END LOOP;

    -- Update room phase to reveal
    UPDATE public.rooms
    SET phase = 'reveal', updated_at = timezone('utc'::text, now())
    WHERE id = p_room_id;
END;
$$;
