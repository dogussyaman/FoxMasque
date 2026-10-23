ALTER TABLE public.room_players
    ADD COLUMN IF NOT EXISTS kicked_at TIMESTAMPTZ;

DROP FUNCTION IF EXISTS public.list_open_rooms_secure();

CREATE FUNCTION public.list_open_rooms_secure()
RETURNS TABLE (
    code VARCHAR(6),
    player_count INTEGER,
    max_players INTEGER,
    phase room_phase,
    selected_categories TEXT[],
    created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT rooms.code,
           count(members.player_id)::INTEGER,
           rooms.max_players,
           rooms.phase,
           rooms.selected_categories,
           rooms.created_at
    FROM public.rooms AS rooms
    JOIN public.room_players AS host
      ON host.room_id = rooms.id
     AND host.player_id = rooms.host_id
     AND host.is_host
     AND host.is_active
    JOIN public.room_players AS members
      ON members.room_id = rooms.id
     AND members.is_active
    WHERE auth.uid() IS NOT NULL
      AND rooms.phase = 'lobby'
      AND NOT EXISTS (
          SELECT 1 FROM public.private_room_credentials AS credentials
          WHERE credentials.room_id = rooms.id
      )
      AND NOT EXISTS (
          SELECT 1
          FROM public.user_blocks AS blocks
          JOIN public.room_players AS blockers
            ON blockers.player_id = blocks.blocker_id
           AND blockers.room_id = rooms.id
           AND blockers.is_active
          WHERE blocks.blocked_id = auth.uid()
      )
    GROUP BY rooms.id
    HAVING count(members.player_id) < rooms.max_players
    ORDER BY rooms.created_at DESC
    LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.list_open_rooms_secure() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_open_rooms_secure() TO authenticated;

CREATE OR REPLACE FUNCTION public.kick_room_player_secure(
    p_room_code VARCHAR(6),
    p_target_id UUID
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms;
    v_target public.room_players;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    SELECT * INTO v_room
    FROM public.rooms
    WHERE code = upper(btrim(p_room_code))
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Oda bulunamadı'; END IF;
    IF v_room.host_id <> v_user_id OR NOT EXISTS (
        SELECT 1 FROM public.room_players
        WHERE room_id = v_room.id
          AND player_id = v_user_id
          AND is_host
          AND is_active
    ) THEN
        RAISE EXCEPTION 'Yalnızca oda sahibi oyuncu çıkarabilir';
    END IF;
    IF v_room.phase <> 'lobby' THEN
        RAISE EXCEPTION 'Oyuncular yalnızca lobide çıkarılabilir';
    END IF;
    IF p_target_id = v_user_id THEN
        RAISE EXCEPTION 'Oda sahibi kendini çıkaramaz';
    END IF;

    SELECT * INTO v_target
    FROM public.room_players
    WHERE room_id = v_room.id
      AND player_id = p_target_id
      AND is_active
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Bu oyuncu artık lobide değil'; END IF;

    UPDATE public.room_players
    SET is_active = FALSE,
        is_online = FALSE,
        is_ready = FALSE,
        kicked_at = now()
    WHERE room_id = v_room.id
      AND player_id = p_target_id;
    UPDATE public.rooms
    SET state_version = state_version + 1,
        updated_at = now()
    WHERE id = v_room.id;
END;
$$;

REVOKE ALL ON FUNCTION public.kick_room_player_secure(VARCHAR, UUID)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kick_room_player_secure(VARCHAR, UUID)
TO authenticated;

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
        IF v_member.kicked_at IS NOT NULL THEN RETURN; END IF;
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
        IF v_member.kicked_at IS NOT NULL THEN RETURN; END IF;
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

    IF v_member AND EXISTS (
        SELECT 1 FROM public.room_players
        WHERE room_id = v_room.id
          AND player_id = v_user_id
          AND kicked_at IS NOT NULL
    ) THEN
        RETURN 'unavailable';
    END IF;

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
