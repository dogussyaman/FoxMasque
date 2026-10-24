CREATE OR REPLACE FUNCTION public.get_round_reveal_secure(p_room_code VARCHAR(6))
RETURNS TABLE(choice_index INT, choice_text TEXT, author_id UUID, is_correct BOOLEAN, picked_by UUID[])
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE v_user_id UUID := auth.uid(); v_room RECORD;
BEGIN
 IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
 SELECT r.id,r.current_round,r.phase INTO v_room FROM public.rooms r WHERE r.code=upper(p_room_code);
 IF v_room.id IS NULL THEN RAISE EXCEPTION 'Oda bulunamadı'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.room_players rp WHERE rp.room_id=v_room.id AND rp.player_id=v_user_id) THEN RAISE EXCEPTION 'Oda üyesi değilsiniz'; END IF;
 IF v_room.phase NOT IN ('reveal','scoreboard','game_over') THEN RAISE EXCEPTION 'Tur cevapları henüz açıklanmadı'; END IF;
 RETURN QUERY SELECT rc.choice_index,rc.text,rc.author_id,rc.is_correct,
   COALESCE(array_agg(rp.player_id) FILTER(WHERE rp.player_id IS NOT NULL),ARRAY[]::UUID[])
 FROM public.round_choices rc LEFT JOIN public.round_picks rp ON rp.room_id=rc.room_id AND rp.round_number=rc.round_number AND rp.choice_index=rc.choice_index
 WHERE rc.room_id=v_room.id AND rc.round_number=v_room.current_round
 GROUP BY rc.choice_index,rc.text,rc.author_id,rc.is_correct ORDER BY rc.choice_index;
END; $$;
REVOKE ALL ON FUNCTION public.get_round_reveal_secure(VARCHAR) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_round_reveal_secure(VARCHAR) TO authenticated;
