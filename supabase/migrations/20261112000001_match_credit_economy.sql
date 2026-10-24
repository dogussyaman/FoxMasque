-- Match-scoped credits and revised non-penalty scoring for Kizilkuyruk.
ALTER TABLE public.room_players
  ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  ADD COLUMN IF NOT EXISTS credit_milestones_awarded INTEGER NOT NULL DEFAULT 0
    CHECK (credit_milestones_awarded BETWEEN 0 AND 3);

COMMENT ON COLUMN public.room_players.credits IS
  'Spendable ability credits for the current match only.';
COMMENT ON COLUMN public.room_players.credit_milestones_awarded IS
  'Number of the 5/10/15 score milestones already rewarded during this match.';

CREATE OR REPLACE FUNCTION public.resolve_round_authoritative(p_room_id uuid, p_round_number integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_room public.rooms;
    v_player public.room_players;
    v_pick public.round_picks;
    v_choice public.round_choices;
    v_correct BOOLEAN;
    v_deceived BOOLEAN;
    v_deceived_author UUID;
    v_victims INTEGER;
    v_delta INTEGER;
    v_penalty INTEGER;
    v_blocked BOOLEAN;
    v_result_created BOOLEAN;
    v_insert_count INTEGER;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
    IF NOT FOUND OR v_room.current_round <> p_round_number THEN
        RAISE EXCEPTION 'Tur artık aktif değil';
    END IF;
    IF NOT public.is_room_member(p_room_id) THEN RAISE EXCEPTION 'Odaya erişim izniniz yok'; END IF;
    IF v_room.phase IN ('reveal', 'scoreboard', 'game_over') THEN RETURN; END IF;
    IF v_room.phase <> 'guess' THEN RAISE EXCEPTION 'Tahmin aşaması tamamlanmadı'; END IF;

    

    FOR v_player IN
        SELECT * FROM public.room_players
        WHERE room_id = p_room_id AND is_active
        ORDER BY player_id
    LOOP
        v_correct := FALSE;
        v_deceived := FALSE;
        v_deceived_author := NULL;
        v_victims := 0;
        v_delta := 0;
        v_penalty := 0;
        v_blocked := v_player.is_blocked_current_round;
        SELECT * INTO v_pick FROM public.round_picks
        WHERE room_id = p_room_id AND round_number = p_round_number
          AND player_id = v_player.player_id;
        IF FOUND THEN
            SELECT * INTO v_choice FROM public.round_choices
            WHERE room_id = p_room_id AND round_number = p_round_number
              AND choice_index = v_pick.choice_index;
            v_correct := coalesce(v_choice.is_correct, FALSE);
            v_deceived := v_choice.author_id IS NOT NULL
                AND v_choice.author_id <> v_player.player_id AND NOT v_correct;
            v_deceived_author := CASE WHEN v_deceived THEN v_choice.author_id ELSE NULL END;
            IF v_correct THEN v_delta := v_delta + 2; END IF;
            -- A wrong guess never subtracts score; the fake-answer author earns a trap point.
        END IF;

        SELECT count(*)::INTEGER INTO v_victims
        FROM public.round_picks p
        JOIN public.round_choices c
          ON c.room_id = p.room_id AND c.round_number = p.round_number
         AND c.choice_index = p.choice_index
        JOIN public.room_players victim
          ON victim.room_id = p.room_id AND victim.player_id = p.player_id
        WHERE p.room_id = p_room_id AND p.round_number = p_round_number
          AND c.author_id = v_player.player_id AND p.player_id <> v_player.player_id
          AND victim.is_active;
        IF v_blocked THEN v_victims := 0; END IF;
        v_delta := v_delta + v_victims;

        -- Point deductions are disabled in the current match economy.
        -- Legacy penalty/counter actions are inert and cannot reduce either score.
        v_penalty := 0;
        v_blocked := v_player.is_blocked_current_round;

        INSERT INTO public.round_results (
            room_id, round_number, player_id, answered_correctly,
            "zartaladın", "zartalandın", points_delta, victims_count,
            deceived_by_author_id, picked_text, own_fake_text, is_blocked, penalty_delta
        )
        SELECT p_room_id, p_round_number, v_player.player_id, v_correct,
               v_victims > 0, v_deceived, v_delta, v_victims,
               v_deceived_author, c.text, fa.fake_answer, v_blocked, v_penalty
        FROM (SELECT 1) seed
        LEFT JOIN public.round_choices c
          ON c.room_id = p_room_id AND c.round_number = p_round_number
         AND c.choice_index = v_pick.choice_index
        LEFT JOIN public.round_fake_answers fa
          ON fa.room_id = p_room_id AND fa.round_number = p_round_number
         AND fa.player_id = v_player.player_id
        ON CONFLICT (room_id, round_number, player_id) DO NOTHING;
        GET DIAGNOSTICS v_insert_count = ROW_COUNT;
        v_result_created := v_insert_count > 0;

        IF v_result_created THEN
            UPDATE public.room_players
            SET score = greatest(0, score + v_delta),
                credits = credits + greatest(0,
                    (CASE
                        WHEN greatest(0, score + v_delta) >= 15 THEN 3
                        WHEN greatest(0, score + v_delta) >= 10 THEN 2
                        WHEN greatest(0, score + v_delta) >= 5 THEN 1
                        ELSE 0
                    END) - credit_milestones_awarded),
                credit_milestones_awarded = greatest(credit_milestones_awarded,
                    CASE
                        WHEN greatest(0, score + v_delta) >= 15 THEN 3
                        WHEN greatest(0, score + v_delta) >= 10 THEN 2
                        WHEN greatest(0, score + v_delta) >= 5 THEN 1
                        ELSE 0
                    END),
                consecutive_correct = CASE
                    WHEN NOT v_correct THEN 0
                    ELSE consecutive_correct + 1
                END
            WHERE room_id = p_room_id AND player_id = v_player.player_id;
        END IF;
    END LOOP;

    PERFORM public._set_room_phase(p_room_id, 'reveal', NULL);
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_room_state_secure(p_room_code character varying)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_room public.rooms;
    v_user_id UUID := auth.uid();
    v_total INTEGER := 0;
    v_submitted INTEGER := 0;
    v_state JSONB;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    SELECT * INTO v_room FROM public.rooms WHERE code = upper(p_room_code);
    IF NOT FOUND OR NOT public.is_room_member(v_room.id) THEN
        RAISE EXCEPTION 'Oda bulunamadı veya erişim izniniz yok';
    END IF;

    SELECT count(*)::INTEGER INTO v_total
    FROM public.room_players rp
    WHERE rp.room_id = v_room.id AND rp.is_active
      AND (v_room.phase <> 'fake_answer' OR NOT rp.is_blocked_current_round);

    IF v_room.phase = 'lobby' THEN
        SELECT count(*)::INTEGER INTO v_submitted FROM public.room_players rp
        WHERE rp.room_id = v_room.id AND rp.is_active AND rp.is_ready;
    ELSIF v_room.phase = 'fake_answer' THEN
        SELECT count(*)::INTEGER INTO v_submitted FROM public.round_fake_answers fa
        JOIN public.room_players rp ON rp.room_id = fa.room_id AND rp.player_id = fa.player_id
        WHERE fa.room_id = v_room.id AND fa.round_number = v_room.current_round
          AND rp.is_active AND NOT rp.is_blocked_current_round;
    ELSIF v_room.phase = 'guess' THEN
        SELECT count(*)::INTEGER INTO v_submitted FROM public.round_picks p
        JOIN public.room_players rp ON rp.room_id = p.room_id AND rp.player_id = p.player_id
        WHERE p.room_id = v_room.id AND p.round_number = v_room.current_round
          AND rp.is_active;
    END IF;

    SELECT jsonb_build_object(
        'config', jsonb_build_object(
            'code', v_room.code,
            'hostId', v_room.host_id,
            'maxPlayers', v_room.max_players,
            'minPlayers', v_room.min_players,
            'totalRounds', v_room.total_rounds,
            'roundSeconds', v_room.round_seconds,
            'selectedCategoryIds', v_room.selected_categories
        ),
        'players', coalesce((
            SELECT jsonb_object_agg(rp.player_id::TEXT, jsonb_build_object(
                'id', rp.player_id,
                'name', coalesce(profile.display_name, rp.name),
                'avatarKey', coalesce(profile.avatar_key, rp.avatar_key),
                'avatarUrl', profile.avatar_url,
                'isHost', rp.is_host,
                'isReady', rp.is_ready,
                'isOnline', rp.is_online,
                'score', rp.score,
                'credits', rp.credits,
                'creditMilestonesAwarded', rp.credit_milestones_awarded,
                'abilityUsedCounts', rp.ability_uses,
                'consecutiveCorrect', rp.consecutive_correct,
                'shieldsAvailable', rp.shields_available,
                'blocksAvailable', rp.blocks_available,
                'isBlockedCurrentRound', rp.is_blocked_current_round,
                                'isBlockedNextRound', rp.is_blocked_next_round,
                'blockedByPlayerId', CASE WHEN rp.is_blocked_current_round THEN (
                    SELECT block_action.player_id
                    FROM public.ability_actions block_action
                    WHERE block_action.room_id = v_room.id
                      AND block_action.round_number = v_room.current_round
                      AND block_action.ability = 'block'
                      AND block_action.target_id = rp.player_id
                      AND NOT EXISTS (
                          SELECT 1 FROM public.ability_actions shield_action
                          WHERE shield_action.room_id = v_room.id
                            AND shield_action.round_number = block_action.round_number
                            AND shield_action.player_id = rp.player_id
                            AND shield_action.ability = 'shield'
                      )
                    ORDER BY block_action.player_id
                    LIMIT 1
                ) ELSE NULL END,
                'lastBlockedPlayerId', rp.last_blocked_player_id
            ))
            FROM public.room_players rp
            LEFT JOIN public.profiles profile ON profile.id = rp.player_id
            WHERE rp.room_id = v_room.id
        ), '{}'::JSONB),
        'phase', v_room.phase,
        'currentRound', v_room.current_round,
        'currentQuestionId', v_room.current_question_id,
        'phaseStartedAt', v_room.phase_started_at,
        'phaseDeadlineAt', v_room.phase_deadline_at,
        'pausedAt', v_room.paused_at,
        'stateVersion', v_room.state_version,
        'progress', jsonb_build_object(
            'submittedCount', v_submitted,
            'totalCount', v_total,
            'completed', v_total > 0 AND v_submitted >= v_total,
            'submissionStatus', coalesce((
                SELECT jsonb_object_agg(rp.player_id::TEXT,
                    CASE
                        WHEN v_room.phase = 'lobby' THEN rp.is_ready
                        WHEN v_room.phase = 'fake_answer'
                          AND rp.is_blocked_current_round THEN TRUE
                        WHEN v_room.phase = 'fake_answer' THEN EXISTS (
                            SELECT 1 FROM public.round_fake_answers fa
                            WHERE fa.room_id = v_room.id AND fa.round_number = v_room.current_round
                              AND fa.player_id = rp.player_id
                        )
                        WHEN v_room.phase = 'guess' THEN EXISTS (
                            SELECT 1 FROM public.round_picks p
                            WHERE p.room_id = v_room.id AND p.round_number = v_room.current_round
                              AND p.player_id = rp.player_id
                        )
                        ELSE EXISTS (
                            SELECT 1 FROM public.round_results rr
                            WHERE rr.room_id = v_room.id AND rr.round_number = v_room.current_round
                              AND rr.player_id = rp.player_id
                        )
                    END
                )
                FROM public.room_players rp
                WHERE rp.room_id = v_room.id AND rp.is_active
            ), '{}'::JSONB)
        ),
        'fakeAnswers', CASE WHEN v_room.phase IN ('reveal', 'scoreboard', 'game_over') THEN coalesce((
            SELECT jsonb_object_agg(fa.player_id::TEXT, fa.fake_answer)
            FROM public.round_fake_answers fa
            WHERE fa.room_id = v_room.id AND fa.round_number = v_room.current_round
        ), '{}'::JSONB) ELSE '{}'::JSONB END,
        'choices', CASE WHEN v_room.phase IN ('reveal', 'scoreboard', 'game_over') THEN coalesce((
            SELECT jsonb_agg(jsonb_build_object(
                'choiceIndex', c.choice_index, 'text', c.text,
                'authorId', c.author_id, 'isCorrect', c.is_correct,
                'isOwnFake', c.author_id = v_user_id
            ) ORDER BY c.choice_index)
            FROM public.round_choices c
            WHERE c.room_id = v_room.id AND c.round_number = v_room.current_round
        ), '[]'::JSONB) ELSE '[]'::JSONB END,
        'picks', CASE WHEN v_room.phase IN ('reveal', 'scoreboard', 'game_over') THEN coalesce((
            SELECT jsonb_object_agg(p.player_id::TEXT, p.choice_index)
            FROM public.round_picks p
            WHERE p.room_id = v_room.id AND p.round_number = v_room.current_round
        ), '{}'::JSONB) ELSE '{}'::JSONB END,
        'answers', '{}'::JSONB,
        'abilityActions', CASE WHEN v_room.phase IN ('reveal', 'scoreboard', 'game_over') THEN coalesce((
            SELECT jsonb_agg(jsonb_build_object(
                'playerId', a.player_id, 'abilityId', a.ability, 'targetId', a.target_id
            ))
            FROM public.ability_actions a
            WHERE a.room_id = v_room.id AND a.round_number = v_room.current_round
        ), '[]'::JSONB) ELSE '[]'::JSONB END,
        'roundResults', CASE WHEN v_room.phase IN ('reveal', 'scoreboard', 'game_over') THEN coalesce((
            SELECT jsonb_object_agg(rr.player_id::TEXT, jsonb_build_object(
                'playerId', rr.player_id,
                'outcome', jsonb_build_object(
                    'correct', rr.answered_correctly,
                    'zartaladın', rr."zartaladın",
                    'zartalandın', rr."zartalandın",
                    'victimsCount', rr.victims_count,
                    'pointsEarned', rr.points_delta,
                    'labels', '[]'::JSONB
                ),
                'labels', '[]'::JSONB,
                'pointsDelta', rr.points_delta,
                'victimsCount', rr.victims_count,
                'penaltyDelta', rr.penalty_delta,
                'deceivedByAuthorId', rr.deceived_by_author_id,
                'pickedText', rr.picked_text,
                'ownFakeText', rr.own_fake_text,
                'isBlocked', rr.is_blocked
            ))
            FROM public.round_results rr
            WHERE rr.room_id = v_room.id AND rr.round_number = v_room.current_round
        ), '{}'::JSONB) ELSE '{}'::JSONB END,
        'history', '[]'::JSONB
    ) INTO v_state;
    RETURN v_state;
END;
$function$;


CREATE OR REPLACE FUNCTION public.start_game_secure(p_room_code character varying)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms;
    v_ready_count INTEGER;
    v_question_id TEXT;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    SELECT * INTO v_room FROM public.rooms WHERE code = upper(p_room_code) FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Oda bulunamadı'; END IF;
    IF v_room.host_id <> v_user_id THEN RAISE EXCEPTION 'Yalnızca oda kurucusu oyunu başlatabilir'; END IF;
    IF v_room.phase <> 'lobby' THEN RAISE EXCEPTION 'Oyun zaten başlatılmış'; END IF;

    SELECT count(*)::INTEGER INTO v_ready_count
    FROM public.room_players
    WHERE room_id = v_room.id AND is_ready AND is_online;
    IF v_ready_count < v_room.min_players THEN
        RAISE EXCEPTION 'Oyunu başlatmak için en az % oyuncu hazır olmalıdır', v_room.min_players;
    END IF;

    SELECT q.id INTO v_question_id
    FROM public.questions q
    WHERE q.category_id = ANY(v_room.selected_categories)
      AND q.is_active IS DISTINCT FROM FALSE
    ORDER BY random()
    LIMIT 1;
    IF v_question_id IS NULL THEN
        RAISE EXCEPTION 'Seçilen kategorilerde kullanılabilir soru bulunamadı';
    END IF;

    UPDATE public.room_players
    SET is_active = is_ready AND is_online,
        score = 0,
        credits = 0,
        credit_milestones_awarded = 0,
        consecutive_correct = 0,
        shields_available = 0,
        blocks_available = 0,
        is_blocked_current_round = FALSE,
        is_blocked_next_round = FALSE,
        last_blocked_player_id = NULL,
        ability_ready_round = 0,
        ability_uses = '{"block":0,"shield":0,"penalty":0,"counter":0}'::JSONB
    WHERE room_id = v_room.id;
    INSERT INTO public.room_round_questions (room_id, game_number, round_number, question_id)
    VALUES (v_room.id, v_room.game_number, 1, v_question_id);
    UPDATE public.rooms
    SET current_round = 1, current_question_id = v_question_id,
        finished_at = NULL, updated_at = now()
    WHERE id = v_room.id;
    PERFORM public._set_room_phase(v_room.id, 'ability_select', v_room.round_seconds);
END;
$function$;


CREATE OR REPLACE FUNCTION public.advance_round_secure(p_room_code character varying)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms;
    v_question_id TEXT;
    v_rank INTEGER;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    SELECT * INTO v_room FROM public.rooms WHERE code = upper(p_room_code) FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Oda bulunamadı'; END IF;
    IF v_room.host_id <> v_user_id THEN RAISE EXCEPTION 'Yalnızca oda kurucusu aşamayı ilerletebilir'; END IF;

    IF v_room.phase = 'ability_select' THEN
        PERFORM public._apply_round_block_effects(v_room.id, v_room.current_round);
        PERFORM public._set_room_phase(v_room.id, 'fake_answer', v_room.round_seconds);
    ELSIF v_room.phase = 'reveal' THEN
        PERFORM public._set_room_phase(v_room.id, 'scoreboard', NULL);
    ELSIF v_room.phase = 'scoreboard' THEN
        IF v_room.current_round >= v_room.total_rounds THEN
            WITH ranked AS (
                SELECT rp.player_id,
                       row_number() OVER (ORDER BY rp.score DESC, rp.joined_at ASC)::INTEGER AS rank,
                       rp.score
                FROM public.room_players rp
                WHERE rp.room_id = v_room.id AND rp.is_active
            ), recorded AS (
                INSERT INTO public.room_game_stats (room_id, game_number, user_id, score, rank)
                SELECT v_room.id, v_room.game_number, ranked.player_id, ranked.score, ranked.rank
                FROM ranked
                ON CONFLICT (room_id, game_number, user_id) DO NOTHING
                RETURNING user_id, score, rank
            ), totals AS (
                SELECT player_id, sum(answered_correctly::INTEGER) AS correct_count,
                       sum(victims_count) AS trap_count,
                       sum("zartalandın"::INTEGER) AS trapped_count
                FROM public.round_results
                WHERE room_id = v_room.id
                GROUP BY player_id
            )
            INSERT INTO public.user_stats (
                user_id, games_played, games_won, correct_answers,
                successful_traps, times_trapped, total_score, updated_at
            )
            SELECT recorded.user_id, 1, (recorded.rank = 1)::INTEGER,
                   coalesce(totals.correct_count, 0),
                   coalesce(totals.trap_count, 0),
                   coalesce(totals.trapped_count, 0),
                   recorded.score, now()
            FROM recorded
            LEFT JOIN totals ON totals.player_id = recorded.user_id
            ON CONFLICT (user_id) DO UPDATE
            SET games_played = public.user_stats.games_played + EXCLUDED.games_played,
                games_won = public.user_stats.games_won + EXCLUDED.games_won,
                correct_answers = public.user_stats.correct_answers + EXCLUDED.correct_answers,
                successful_traps = public.user_stats.successful_traps + EXCLUDED.successful_traps,
                times_trapped = public.user_stats.times_trapped + EXCLUDED.times_trapped,
                total_score = public.user_stats.total_score + EXCLUDED.total_score,
                updated_at = now();
            UPDATE public.rooms SET finished_at = now() WHERE id = v_room.id;
            PERFORM public._set_room_phase(v_room.id, 'game_over', NULL);
        ELSE
            SELECT q.id INTO v_question_id
            FROM public.questions q
            WHERE q.category_id = ANY(v_room.selected_categories)
              AND q.is_active IS DISTINCT FROM FALSE
              AND NOT EXISTS (
                  SELECT 1 FROM public.room_round_questions history
                  WHERE history.room_id = v_room.id
                    AND history.game_number = v_room.game_number
                    AND history.question_id = q.id
              )
            ORDER BY random()
            LIMIT 1;
            IF v_question_id IS NULL THEN
                RAISE EXCEPTION 'Seçilen kategorilerde tekrar etmeden oynanacak yeterli soru yok';
            END IF;
            INSERT INTO public.room_round_questions (room_id, game_number, round_number, question_id)
            VALUES (v_room.id, v_room.game_number, v_room.current_round + 1, v_question_id);
            UPDATE public.room_players
            SET is_blocked_current_round = FALSE,
                is_blocked_next_round = FALSE,
                ability_ready_round = 0
            WHERE room_id = v_room.id;
            UPDATE public.rooms SET current_round = current_round + 1,
                current_question_id = v_question_id WHERE id = v_room.id;
            PERFORM public._set_room_phase(v_room.id, 'ability_select', v_room.round_seconds);
        END IF;
    ELSE
        RAISE EXCEPTION 'Bu aşama elle ilerletilemez';
    END IF;
END;
$function$;


CREATE OR REPLACE FUNCTION public.use_ability_secure(p_room_code character varying, p_ability ability_type, p_target_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms;
    v_player public.room_players;
    v_target public.room_players;
    v_uses INTEGER;
    v_ability_cost INTEGER;
    v_existing_action public.ability_actions;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    SELECT * INTO v_room FROM public.rooms WHERE code = upper(p_room_code) FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Oda bulunamadı'; END IF;
    IF v_room.phase <> 'ability_select' THEN RAISE EXCEPTION 'Yetenek seçimi aşaması sona erdi'; END IF;
    SELECT * INTO v_player FROM public.room_players
    WHERE room_id = v_room.id AND player_id = v_user_id AND is_active FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Aktif oda üyesi değilsiniz'; END IF;
    IF v_room.phase_deadline_at IS NOT NULL AND v_room.phase_deadline_at <= now() THEN
        PERFORM public.advance_expired_room_phase_secure(p_room_code);
        RETURN;
    END IF;
    
    IF p_ability::TEXT NOT IN ('block', 'shield') THEN
        RAISE EXCEPTION 'Bu yetenek kredi mağazasında kullanılamıyor';
    END IF;
    SELECT * INTO v_existing_action
    FROM public.ability_actions
    WHERE room_id = v_room.id AND round_number = v_room.current_round
      AND player_id = v_user_id
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing_action.ability = p_ability
           AND v_existing_action.target_id IS NOT DISTINCT FROM p_target_id THEN
            RETURN; -- Idempotent retry; the original request already charged credits.
        END IF;
        RAISE EXCEPTION 'Bu tur yalnızca bir yetenek satın alıp kullanabilirsin';
    END IF;

    v_ability_cost := 1;
    IF v_player.credits < v_ability_cost THEN
        RAISE EXCEPTION 'Yetersiz kredi. Bu yetenek % kredi gerektiriyor', v_ability_cost;
    END IF;

    IF p_ability = 'block' THEN
        IF p_target_id IS NULL OR p_target_id = v_user_id THEN
            RAISE EXCEPTION 'Geçerli bir rakip seçmelisiniz';
        END IF;
        SELECT * INTO v_target FROM public.room_players
        WHERE room_id = v_room.id AND player_id = p_target_id AND is_active;
        IF NOT FOUND THEN RAISE EXCEPTION 'Hedef bu oyunda aktif değil'; END IF;
    ELSIF p_target_id IS NOT NULL THEN
        RAISE EXCEPTION 'Bu yetenek hedef kabul etmez';
    END IF;

    v_uses := coalesce((v_player.ability_uses ->> p_ability::TEXT)::INTEGER, 0);
    IF p_ability = 'block' THEN
        IF v_player.last_blocked_player_id = p_target_id THEN
            RAISE EXCEPTION 'Aynı oyuncuyu art arda iki tur bloklayamazsınız';
        END IF;
        UPDATE public.room_players
        SET credits = credits - v_ability_cost,
            last_blocked_player_id = p_target_id,
            ability_uses = jsonb_set(ability_uses, '{block}', to_jsonb(v_uses + 1))
        WHERE room_id = v_room.id AND player_id = v_user_id;
    ELSIF p_ability = 'shield' THEN
        UPDATE public.room_players
        SET credits = credits - v_ability_cost,
            ability_uses = jsonb_set(ability_uses, '{shield}', to_jsonb(v_uses + 1))
        WHERE room_id = v_room.id AND player_id = v_user_id;
    ELSIF p_ability IN ('penalty', 'counter') THEN
        IF v_uses >= 1 THEN RAISE EXCEPTION 'Bu yeteneği oyun başına en fazla bir kez kullanabilirsiniz'; END IF;
        UPDATE public.room_players
        SET ability_uses = jsonb_set(ability_uses, ARRAY[p_ability::TEXT], to_jsonb(v_uses + 1))
        WHERE room_id = v_room.id AND player_id = v_user_id;
    END IF;

    INSERT INTO public.ability_actions (room_id, round_number, player_id, ability, target_id)
    VALUES (v_room.id, v_room.current_round, v_user_id, p_ability, p_target_id);
    UPDATE public.rooms SET state_version = state_version + 1, updated_at = now()
    WHERE id = v_room.id;
END;
$function$;

