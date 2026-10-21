-- Avoid PL/pgSQL output-variable ambiguity for room_id/player_id, including
-- the ON CONFLICT target, in join_room_secure.
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
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms;
    v_count INTEGER;
    v_name TEXT;
    v_avatar TEXT;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    v_name := left(coalesce(nullif(btrim(p_name), ''), 'Oyuncu'), 32);
    v_avatar := left(coalesce(nullif(btrim(p_avatar_key), ''), 'fox'), 128);
    SELECT * INTO v_room
    FROM public.rooms
    WHERE code = upper(p_code)
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Oda bulunamadı'; END IF;
    IF v_room.phase <> 'lobby' THEN RAISE EXCEPTION 'Oyun çoktan başladı'; END IF;

    IF EXISTS (
        SELECT 1
        FROM public.user_blocks b
        JOIN public.room_players rp ON rp.player_id = b.blocker_id
        WHERE rp.room_id = v_room.id AND b.blocked_id = v_user_id
    ) THEN RAISE EXCEPTION 'Bu odaya katılamazsın'; END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.room_players rp
        WHERE rp.room_id = v_room.id AND rp.player_id = v_user_id
    ) THEN
        SELECT count(*)::INTEGER INTO v_count
        FROM public.room_players rp
        WHERE rp.room_id = v_room.id AND rp.is_active;
        IF v_count >= v_room.max_players THEN RAISE EXCEPTION 'Oda dolu'; END IF;
    END IF;

    INSERT INTO public.room_players (
        room_id, player_id, name, avatar_key, is_host, is_ready, is_online, is_active
    ) VALUES (
        v_room.id, v_user_id, v_name, v_avatar, v_user_id = v_room.host_id, FALSE, TRUE, TRUE
    )
    ON CONFLICT ON CONSTRAINT room_players_pkey DO UPDATE
    SET name = EXCLUDED.name,
        avatar_key = EXCLUDED.avatar_key,
        is_online = TRUE,
        is_active = TRUE;

    INSERT INTO public.profiles (id, display_name, avatar_key)
    VALUES (v_user_id, v_name, v_avatar)
    ON CONFLICT (id) DO NOTHING;

    UPDATE public.rooms
    SET state_version = state_version + 1, updated_at = now()
    WHERE id = v_room.id;

    RETURN QUERY SELECT v_room.id, v_user_id;
END;
$$;
