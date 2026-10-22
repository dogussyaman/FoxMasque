CREATE TABLE IF NOT EXISTS public.room_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 10 CHECK (max_uses BETWEEN 1 AND 10),
    use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS room_invites_room_active_idx
    ON public.room_invites (room_id, expires_at)
    WHERE revoked_at IS NULL;

ALTER TABLE public.room_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.room_invites FROM PUBLIC, anon, authenticated;
COMMENT ON TABLE public.room_invites IS
    'Hashed, room-scoped invites expire after 24 hours and allow at most 10 successful new memberships.';

CREATE OR REPLACE FUNCTION public.create_room_invite_secure(p_room_code VARCHAR(6))
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms;
    v_token TEXT;
    v_active_invites INTEGER;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    SELECT * INTO v_room
    FROM public.rooms
    WHERE code = upper(btrim(p_room_code))
    FOR UPDATE;
    IF NOT FOUND OR v_room.phase <> 'lobby' OR NOT EXISTS (
        SELECT 1 FROM public.room_players
        WHERE room_id = v_room.id AND player_id = v_user_id AND is_active
    ) THEN
        RAISE EXCEPTION 'Bu oda için davet oluşturulamıyor';
    END IF;

    DELETE FROM public.room_invites
    WHERE room_id = v_room.id
      AND (revoked_at IS NOT NULL OR expires_at <= now() OR use_count >= max_uses);
    SELECT count(*)::INTEGER INTO v_active_invites
    FROM public.room_invites
    WHERE room_id = v_room.id
      AND revoked_at IS NULL
      AND expires_at > now()
      AND use_count < max_uses;
    IF v_active_invites >= 20 THEN
        RAISE EXCEPTION 'Bu oda için etkin davet sınırına ulaşıldı';
    END IF;

    v_token := rtrim(
        translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'),
        '='
    );
    INSERT INTO public.room_invites (
        room_id, created_by, token_hash, expires_at, max_uses
    ) VALUES (
        v_room.id,
        v_user_id,
        extensions.digest(v_token, 'sha256'),
        now() + INTERVAL '24 hours',
        10
    );
    RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_room_invite_secure(
    p_code VARCHAR(6),
    p_name VARCHAR(32),
    p_avatar_key VARCHAR(32),
    p_invite_token TEXT
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
    v_invite public.room_invites;
    v_locked_until TIMESTAMPTZ;
    v_count INTEGER;
    v_name TEXT;
    v_avatar TEXT;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    IF p_invite_token IS NULL OR p_invite_token !~ '^[A-Za-z0-9_-]{43}$' THEN RETURN; END IF;

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
        IF NOT v_member.is_active AND v_room.phase <> 'lobby' THEN RETURN; END IF;
        UPDATE public.room_players
        SET name = left(coalesce(nullif(btrim(p_name), ''), public.room_players.name), 32),
            avatar_key = left(coalesce(nullif(btrim(p_avatar_key), ''), public.room_players.avatar_key), 128),
            is_online = TRUE,
            is_active = TRUE
        WHERE public.room_players.room_id = v_room.id
          AND public.room_players.player_id = v_user_id;
        UPDATE public.rooms SET state_version = state_version + 1, updated_at = now()
        WHERE public.rooms.id = v_room.id;
        RETURN QUERY SELECT v_room.id, v_user_id;
        RETURN;
    END IF;

    SELECT * INTO v_invite
    FROM public.room_invites
    WHERE room_invites.room_id = v_room.id
      AND room_invites.token_hash = extensions.digest(p_invite_token, 'sha256')
    FOR UPDATE;
    IF NOT FOUND
       OR v_invite.revoked_at IS NOT NULL
       OR v_invite.expires_at <= now()
       OR v_invite.use_count >= v_invite.max_uses THEN
        PERFORM public._record_room_join_failure(v_user_id);
        RETURN;
    END IF;
    IF v_room.phase <> 'lobby' THEN RAISE EXCEPTION 'Oyun çoktan başladı'; END IF;

    IF EXISTS (
        SELECT 1 FROM public.user_blocks AS blocks
        JOIN public.room_players AS members ON members.player_id = blocks.blocker_id
        WHERE members.room_id = v_room.id AND blocks.blocked_id = v_user_id
    ) THEN RETURN; END IF;

    SELECT count(*)::INTEGER INTO v_count
    FROM public.room_players
    WHERE room_players.room_id = v_room.id AND room_players.is_active;
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
    UPDATE public.room_invites
    SET use_count = use_count + 1
    WHERE room_invites.id = v_invite.id;
    DELETE FROM public.room_join_rate_limits WHERE user_id = v_user_id;
    UPDATE public.rooms SET state_version = state_version + 1, updated_at = now()
    WHERE public.rooms.id = v_room.id;
    RETURN QUERY SELECT v_room.id, v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_room_invite_secure(VARCHAR) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_room_invite_secure(VARCHAR, VARCHAR, VARCHAR, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_room_invite_secure(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_room_invite_secure(VARCHAR, VARCHAR, VARCHAR, TEXT) TO authenticated;
