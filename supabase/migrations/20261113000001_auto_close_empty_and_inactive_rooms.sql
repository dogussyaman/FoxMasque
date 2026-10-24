-- Migration: Auto-close empty and inactive rooms
-- 1. When all players leave, the room is immediately deleted.
-- 2. Inactive rooms with no online players (>1 min) or abandoned rooms (>3 min) are automatically cleaned up.

CREATE OR REPLACE FUNCTION public.cleanup_inactive_rooms()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
BEGIN
    -- 1. Odada hiç üye kalmamış odaları sil
    WITH deleted_empty AS (
        DELETE FROM public.rooms r
        WHERE NOT EXISTS (
            SELECT 1 FROM public.room_players rp WHERE rp.room_id = r.id
        )
        RETURNING r.id
    )
    SELECT count(*) INTO v_deleted_count FROM deleted_empty;

    -- 2. Odada online oyuncu kalmamış ve son güncellemesi 1 dakikadan eski olan odaları sil
    WITH deleted_offline AS (
        DELETE FROM public.rooms r
        WHERE r.updated_at < (now() - INTERVAL '1 minute')
          AND NOT EXISTS (
              SELECT 1 FROM public.room_players rp 
              WHERE rp.room_id = r.id 
                AND rp.is_online = TRUE
          )
        RETURNING r.id
    )
    SELECT v_deleted_count + count(*) INTO v_deleted_count FROM deleted_offline;

    -- 3. 3 dakikadır hiçbir aktivite olmayan terk edilmiş veya lobi aşamasındaki odaları sil
    WITH deleted_stale AS (
        DELETE FROM public.rooms r
        WHERE r.updated_at < (now() - INTERVAL '3 minutes')
          AND r.phase IN ('lobby', 'game_over')
        RETURNING r.id
    )
    SELECT v_deleted_count + count(*) INTO v_deleted_count FROM deleted_stale;

    RETURN v_deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_inactive_rooms() TO authenticated, anon;


-- Odadan ayrılma fonksiyonunu güncelle: son oyuncu çıkınca oda otomatik kapanır
CREATE OR REPLACE FUNCTION public.leave_room_secure(p_room_code character varying)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms;
    v_new_host UUID;
    v_remaining_count INT;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    SELECT * INTO v_room FROM public.rooms WHERE code = upper(p_room_code) FOR UPDATE;
    IF NOT FOUND THEN RETURN; END IF;

    -- Oyuncuyu odadan sil
    DELETE FROM public.room_players
    WHERE room_id = v_room.id AND player_id = v_user_id;

    -- Kalan aktif/online oyuncu sayısını kontrol et
    SELECT count(*) INTO v_remaining_count
    FROM public.room_players
    WHERE room_id = v_room.id AND is_online = TRUE;

    -- Eğer odada kimse kalmadıysa odayı anında kapat/sil
    IF v_remaining_count = 0 THEN
        DELETE FROM public.rooms WHERE id = v_room.id;
        RETURN;
    END IF;

    -- Ayrılan oyuncu host ise ve odada kalan varsa, hostluğu bir sonraki oyuncuya aktar
    IF v_room.host_id = v_user_id THEN
        SELECT player_id INTO v_new_host
        FROM public.room_players
        WHERE room_id = v_room.id AND is_online = TRUE
        ORDER BY joined_at, player_id LIMIT 1;

        IF v_new_host IS NOT NULL THEN
            UPDATE public.rooms SET host_id = v_new_host,
                state_version = state_version + 1, updated_at = now()
            WHERE id = v_room.id;
            UPDATE public.room_players SET is_host = (player_id = v_new_host)
            WHERE room_id = v_room.id;
        ELSE
            DELETE FROM public.rooms WHERE id = v_room.id;
        END IF;
    ELSE
        UPDATE public.rooms SET state_version = state_version + 1, updated_at = now()
        WHERE id = v_room.id;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_room_secure(character varying) TO authenticated, anon;
