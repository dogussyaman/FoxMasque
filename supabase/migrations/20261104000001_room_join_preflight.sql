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

CREATE OR REPLACE FUNCTION public.room_join_preflight_secure(p_code VARCHAR(6))
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms;
    v_locked_until TIMESTAMPTZ;
    v_member BOOLEAN;
    v_member_active BOOLEAN;
    v_count INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    IF upper(btrim(p_code)) !~ '^[A-Z0-9]{5,6}$' THEN
        RETURN 'unavailable';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(v_user_id::TEXT, 0));
    SELECT blocked_until INTO v_locked_until
    FROM public.room_join_rate_limits
    WHERE user_id = v_user_id
    FOR UPDATE;
    IF v_locked_until > now() THEN
        RETURN 'unavailable';
    END IF;

    SELECT * INTO v_room
    FROM public.rooms
    WHERE code = upper(btrim(p_code));
    IF NOT FOUND THEN
        PERFORM public._record_room_join_failure(v_user_id);
        RETURN 'unavailable';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.room_players
        WHERE room_id = v_room.id
          AND player_id = v_user_id
    ) INTO v_member;
    SELECT EXISTS (
        SELECT 1 FROM public.room_players
        WHERE room_id = v_room.id
          AND player_id = v_user_id
          AND is_active
    ) INTO v_member_active;

    IF v_member THEN
        IF NOT v_member_active AND v_room.phase <> 'lobby' THEN RETURN 'closed'; END IF;
    ELSE
        IF v_room.phase <> 'lobby' THEN
            RETURN 'closed';
        END IF;
        IF EXISTS (
            SELECT 1
            FROM public.user_blocks AS blocks
            JOIN public.room_players AS members ON members.player_id = blocks.blocker_id
            WHERE members.room_id = v_room.id
              AND blocks.blocked_id = v_user_id
        ) THEN
            RETURN 'unavailable';
        END IF;

        SELECT count(*)::INTEGER INTO v_count
        FROM public.room_players
        WHERE room_id = v_room.id AND is_active;
        IF v_count >= v_room.max_players THEN
            RETURN 'full';
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.private_room_credentials
        WHERE room_id = v_room.id
    ) AND NOT v_member THEN
        RETURN 'password_required';
    END IF;

    RETURN 'open';
END;
$$;

REVOKE ALL ON FUNCTION public._record_room_join_failure(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.room_join_preflight_secure(VARCHAR) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.room_join_preflight_secure(VARCHAR) TO authenticated;
