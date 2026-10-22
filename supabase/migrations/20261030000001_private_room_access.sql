CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.private_room_credentials (
    room_id UUID PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.private_room_credentials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.private_room_credentials FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.room_join_rate_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    blocked_until TIMESTAMPTZ
);

ALTER TABLE public.room_join_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.room_join_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._record_room_join_failure(p_user_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    INSERT INTO public.room_join_rate_limits AS limits (
        user_id, failed_attempts, window_started_at, blocked_until
    )
    VALUES (p_user_id, 1, now(), NULL)
    ON CONFLICT (user_id) DO UPDATE
    SET failed_attempts = CASE
        WHEN limits.window_started_at < now() - INTERVAL '15 minutes'
                THEN 1
        ELSE limits.failed_attempts + 1
        END,
        window_started_at = CASE
        WHEN limits.window_started_at < now() - INTERVAL '15 minutes'
                THEN now()
        ELSE limits.window_started_at
        END,
        blocked_until = CASE
            WHEN CASE
                WHEN limits.window_started_at < now() - INTERVAL '15 minutes'
                        THEN 1
                ELSE limits.failed_attempts + 1
                END >= 10
                THEN now() + INTERVAL '15 minutes'
            ELSE NULL
        END;
$$;

CREATE OR REPLACE FUNCTION public._join_room_secure_internal(
    p_code VARCHAR(6),
    p_name VARCHAR(32),
    p_avatar_key VARCHAR(32),
    p_password TEXT
)
RETURNS TABLE (room_id UUID, player_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms;
    v_member public.room_players;
    v_password_hash TEXT;
    v_locked_until TIMESTAMPTZ;
    v_count INTEGER;
    v_name TEXT;
    v_avatar TEXT;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::TEXT, 0));
    SELECT blocked_until INTO v_locked_until
    FROM public.room_join_rate_limits
    WHERE user_id = v_user_id
    FOR UPDATE;
    IF v_locked_until > now() THEN RETURN; END IF;

    SELECT * INTO v_room
    FROM public.rooms
    WHERE code = upper(btrim(p_code))
    FOR UPDATE;
    IF NOT FOUND THEN
        PERFORM public._record_room_join_failure(v_user_id);
        RETURN;
    END IF;

    SELECT * INTO v_member
    FROM public.room_players
    WHERE public.room_players.room_id = v_room.id
      AND public.room_players.player_id = v_user_id
    FOR UPDATE;
    IF FOUND THEN
        IF NOT v_member.is_active AND v_room.phase <> 'lobby' THEN
            RAISE EXCEPTION 'Oyun çoktan başladı';
        END IF;
        UPDATE public.room_players
        SET name = left(coalesce(nullif(btrim(p_name), ''), public.room_players.name), 32),
            avatar_key = left(coalesce(nullif(btrim(p_avatar_key), ''), public.room_players.avatar_key), 128),
            is_online = TRUE,
            is_active = TRUE
        WHERE public.room_players.room_id = v_room.id
          AND public.room_players.player_id = v_user_id;
        DELETE FROM public.room_join_rate_limits WHERE user_id = v_user_id;
        UPDATE public.rooms
        SET state_version = state_version + 1, updated_at = now()
        WHERE public.rooms.id = v_room.id;
        RETURN QUERY SELECT v_room.id, v_user_id;
        RETURN;
    END IF;

    SELECT credentials.password_hash INTO v_password_hash
    FROM public.private_room_credentials AS credentials
    WHERE credentials.room_id = v_room.id;
    IF FOUND AND (
        p_password IS NULL
        OR octet_length(p_password) < 8
        OR octet_length(p_password) > 72
        OR extensions.crypt(p_password, v_password_hash) <> v_password_hash
    ) THEN
        PERFORM public._record_room_join_failure(v_user_id);
        RETURN;
    END IF;

    IF v_room.phase <> 'lobby' THEN RAISE EXCEPTION 'Oyun çoktan başladı'; END IF;
    IF EXISTS (
        SELECT 1 FROM public.user_blocks AS blocks
        JOIN public.room_players AS members ON members.player_id = blocks.blocker_id
        WHERE members.room_id = v_room.id AND blocks.blocked_id = v_user_id
    ) THEN RAISE EXCEPTION 'Bu odaya katılamazsın'; END IF;

    SELECT count(*)::INTEGER INTO v_count
    FROM public.room_players AS members
    WHERE members.room_id = v_room.id AND members.is_active;
    IF v_count >= v_room.max_players THEN RAISE EXCEPTION 'Oda dolu'; END IF;

    v_name := left(coalesce(nullif(btrim(p_name), ''), 'Oyuncu'), 32);
    v_avatar := left(coalesce(nullif(btrim(p_avatar_key), ''), 'fox'), 128);
    INSERT INTO public.room_players (
        room_id, player_id, name, avatar_key, is_host, is_ready, is_online, is_active
    ) VALUES (
        v_room.id, v_user_id, v_name, v_avatar, v_user_id = v_room.host_id, FALSE, TRUE, TRUE
    );
    INSERT INTO public.profiles (id, display_name, avatar_key)
    VALUES (v_user_id, v_name, v_avatar)
    ON CONFLICT (id) DO NOTHING;
    DELETE FROM public.room_join_rate_limits WHERE user_id = v_user_id;
    UPDATE public.rooms
    SET state_version = state_version + 1, updated_at = now()
    WHERE public.rooms.id = v_room.id;
    RETURN QUERY SELECT v_room.id, v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_room_secure(
    p_code VARCHAR(6),
    p_name VARCHAR(32),
    p_avatar_key VARCHAR(32)
)
RETURNS TABLE (room_id UUID, player_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public._join_room_secure_internal(
        p_code, p_name, p_avatar_key, NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.join_room_secure(
    p_code VARCHAR(6),
    p_name VARCHAR(32),
    p_avatar_key VARCHAR(32),
    p_password TEXT
)
RETURNS TABLE (room_id UUID, player_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public._join_room_secure_internal(
        p_code, p_name, p_avatar_key, p_password
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_room_secure(
    p_code VARCHAR(6),
    p_name VARCHAR(32),
    p_avatar_key VARCHAR(32),
    p_total_rounds INTEGER,
    p_round_seconds INTEGER,
    p_categories TEXT[],
    p_is_private BOOLEAN,
    p_password TEXT
)
RETURNS TABLE (room_id UUID, room_code VARCHAR(6), host_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room_id UUID;
    v_clean_code VARCHAR(6) := upper(btrim(p_code));
    v_name TEXT := left(coalesce(nullif(btrim(p_name), ''), 'Oyuncu'), 32);
    v_avatar TEXT := left(coalesce(nullif(btrim(p_avatar_key), ''), 'fox'), 128);
    v_categories TEXT[];
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    IF v_clean_code !~ '^[A-Z0-9]{5,6}$' THEN RAISE EXCEPTION 'Oda kodu geçersiz'; END IF;
    IF p_total_rounds NOT BETWEEN 1 AND 20 THEN RAISE EXCEPTION 'Tur sayısı 1-20 arasında olmalıdır'; END IF;
    IF p_round_seconds NOT BETWEEN 10 AND 180 THEN RAISE EXCEPTION 'Tur süresi 10-180 saniye arasında olmalıdır'; END IF;
    IF p_is_private IS NULL THEN RAISE EXCEPTION 'Oda erişim türü belirtilmelidir'; END IF;
    IF p_is_private AND (
        p_password IS NULL
        OR octet_length(p_password) < 8
        OR octet_length(p_password) > 72
    ) THEN
        RAISE EXCEPTION 'Oda şifresi 8-72 bayt arasında olmalıdır';
    END IF;
    IF NOT p_is_private AND p_password IS NOT NULL THEN
        RAISE EXCEPTION 'Açık oda şifre kabul etmez';
    END IF;

    SELECT coalesce(array_agg(DISTINCT requested.category_id), ARRAY[]::TEXT[])
    INTO v_categories
    FROM unnest(coalesce(p_categories, ARRAY[]::TEXT[])) AS requested(category_id)
    WHERE EXISTS (
        SELECT 1 FROM public.questions AS questions
        WHERE questions.category_id = requested.category_id
          AND questions.is_active IS DISTINCT FROM FALSE
    );
    IF cardinality(v_categories) = 0 THEN
        RAISE EXCEPTION 'Seçilen kategorilerde kullanılabilir soru yok';
    END IF;
    IF (
        SELECT count(*) FROM public.questions AS questions
        WHERE questions.category_id = ANY(v_categories)
          AND questions.is_active IS DISTINCT FROM FALSE
    ) < p_total_rounds THEN
        RAISE EXCEPTION 'Seçilen kategorilerde tur sayısı kadar farklı soru yok';
    END IF;

    INSERT INTO public.rooms (
        code, host_id, phase, current_round, total_rounds, round_seconds,
        selected_categories, min_players, max_players
    ) VALUES (
        v_clean_code, v_user_id, 'lobby', 1, p_total_rounds, p_round_seconds,
        v_categories, 2, 10
    ) RETURNING id INTO v_room_id;

    IF p_is_private THEN
        INSERT INTO public.private_room_credentials (room_id, password_hash)
        VALUES (v_room_id, extensions.crypt(p_password, extensions.gen_salt('bf', 12)));
    END IF;

    INSERT INTO public.room_players (
        room_id, player_id, name, avatar_key, is_host, is_ready, is_online, is_active
    ) VALUES (v_room_id, v_user_id, v_name, v_avatar, TRUE, TRUE, TRUE, TRUE);
    INSERT INTO public.profiles (id, display_name, avatar_key)
    VALUES (v_user_id, v_name, v_avatar)
    ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name, avatar_key = EXCLUDED.avatar_key;
    RETURN QUERY SELECT v_room_id, v_clean_code, v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_open_rooms_secure()
RETURNS TABLE (
    code VARCHAR(6),
    host_name TEXT,
    player_count INTEGER,
    phase room_phase,
    created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT rooms.code, coalesce(profiles.display_name, host.name)::TEXT,
           count(host.player_id)::INTEGER, rooms.phase, rooms.created_at
    FROM public.rooms AS rooms
    JOIN public.room_players AS host
      ON host.room_id = rooms.id AND host.is_host
    LEFT JOIN public.profiles AS profiles ON profiles.id = host.player_id
    WHERE auth.uid() IS NOT NULL
      AND rooms.phase = 'lobby'
      AND NOT EXISTS (
          SELECT 1 FROM public.private_room_credentials AS credentials
          WHERE credentials.room_id = rooms.id
      )
      AND (SELECT count(*) FROM public.room_players AS members
           WHERE members.room_id = rooms.id AND members.is_active) < rooms.max_players
    GROUP BY rooms.id, profiles.display_name, host.name
    ORDER BY rooms.created_at DESC
    LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public._record_room_join_failure(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._join_room_secure_internal(VARCHAR, VARCHAR, VARCHAR, TEXT)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.join_room_secure(VARCHAR, VARCHAR, VARCHAR) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_room_secure(VARCHAR, VARCHAR, VARCHAR, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_room_secure(
    VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER, TEXT[], BOOLEAN, TEXT
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_open_rooms_secure() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_room_secure(VARCHAR, VARCHAR, VARCHAR)
    TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_room_secure(VARCHAR, VARCHAR, VARCHAR, TEXT)
    TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_room_secure(
    VARCHAR, VARCHAR, VARCHAR, INTEGER, INTEGER, TEXT[], BOOLEAN, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_open_rooms_secure() TO authenticated;
