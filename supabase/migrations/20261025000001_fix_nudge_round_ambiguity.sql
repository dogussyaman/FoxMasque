-- Qualify round_number and phase references because they are also output
-- variables in this function's RETURNS TABLE declaration.
CREATE OR REPLACE FUNCTION public.nudge_player_secure(
    p_room_code VARCHAR(6),
    p_target_id UUID
)
RETURNS TABLE (from_id UUID, to_id UUID, created_at TIMESTAMPTZ, round_number INTEGER, phase TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_room public.rooms;
    v_user_id UUID := auth.uid();
    v_target public.room_players;
    v_target_done BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    SELECT * INTO v_room
    FROM public.rooms r
    WHERE r.code = upper(p_room_code)
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Oda bulunamadı'; END IF;
    IF NOT public.is_room_member(v_room.id) THEN RAISE EXCEPTION 'Odaya erişim izniniz yok'; END IF;
    IF v_user_id = p_target_id THEN RAISE EXCEPTION 'Kendini dürtemezsin'; END IF;

    SELECT * INTO v_target
    FROM public.room_players rp
    WHERE rp.room_id = v_room.id
      AND rp.player_id = p_target_id
      AND rp.is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'Hedef aynı odada değil'; END IF;

    IF v_room.phase = 'lobby' THEN
        v_target_done := v_target.is_ready;
    ELSIF v_room.phase = 'fake_answer' THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.round_fake_answers rfa
            WHERE rfa.room_id = v_room.id
              AND rfa.round_number = v_room.current_round
              AND rfa.player_id = p_target_id
        ) INTO v_target_done;
    ELSIF v_room.phase = 'guess' THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.round_picks rp
            WHERE rp.room_id = v_room.id
              AND rp.round_number = v_room.current_round
              AND rp.player_id = p_target_id
        ) INTO v_target_done;
    ELSE
        RAISE EXCEPTION 'Bu aşamada dürtme gönderilemez';
    END IF;
    IF v_target_done OR v_target.is_blocked_current_round THEN
        RAISE EXCEPTION 'Bu oyuncu aşamayı zaten tamamladı';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.user_blocks ub
        WHERE (ub.blocker_id = v_user_id AND ub.blocked_id = p_target_id)
           OR (ub.blocker_id = p_target_id AND ub.blocked_id = v_user_id)
    ) THEN RAISE EXCEPTION 'Engellenen kullanıcılar birbirini dürtemez'; END IF;
    IF EXISTS (
        SELECT 1
        FROM public.nudges n
        WHERE n.room_id = v_room.id
          AND n.round_number = v_room.current_round
          AND n.phase = v_room.phase::TEXT
          AND n.from_id = v_user_id
          AND n.to_id = p_target_id
    ) THEN RAISE EXCEPTION 'Bu oyuncuyu bu aşamada zaten dürttün'; END IF;

    INSERT INTO public.nudges (room_id, from_id, to_id, round_number, phase)
    VALUES (v_room.id, v_user_id, p_target_id, v_room.current_round, v_room.phase::TEXT);

    RETURN QUERY
    SELECT n.from_id, n.to_id, n.created_at, n.round_number, n.phase
    FROM public.nudges n
    WHERE n.room_id = v_room.id
      AND n.round_number = v_room.current_round
      AND n.phase = v_room.phase::TEXT
      AND n.from_id = v_user_id
      AND n.to_id = p_target_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.nudge_player_secure(VARCHAR, UUID) TO authenticated;
