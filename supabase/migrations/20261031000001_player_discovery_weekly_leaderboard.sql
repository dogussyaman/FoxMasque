ALTER TABLE public.room_game_stats
    ADD COLUMN IF NOT EXISTS played_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.set_room_game_stats_played_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
    IF NEW.played_at IS NULL THEN
        NEW.played_at := now();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS room_game_stats_set_played_at ON public.room_game_stats;
CREATE TRIGGER room_game_stats_set_played_at
    BEFORE INSERT ON public.room_game_stats
    FOR EACH ROW EXECUTE FUNCTION public.set_room_game_stats_played_at();

CREATE INDEX IF NOT EXISTS room_game_stats_played_at_user_idx
    ON public.room_game_stats (played_at DESC, user_id)
    WHERE played_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_leaderboard_scoped_secure(p_scope TEXT)
RETURNS TABLE (
    player_id UUID,
    name TEXT,
    avatar_key TEXT,
    avatar_url TEXT,
    score BIGINT,
    games_played INTEGER,
    games_won INTEGER,
    correct_answers INTEGER,
    successful_traps INTEGER,
    times_trapped INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;
    IF p_scope IS NULL OR p_scope NOT IN ('all', 'weekly', 'friends') THEN
        RAISE EXCEPTION 'Sıralama filtresi geçersiz';
    END IF;

    IF p_scope = 'weekly' THEN
        RETURN QUERY
        WITH weekly AS (
            SELECT stats.user_id,
                   sum(stats.score)::BIGINT AS score,
                   count(*)::INTEGER AS games_played,
                   count(*) FILTER (WHERE stats.rank = 1)::INTEGER AS games_won
            FROM public.room_game_stats AS stats
            WHERE stats.played_at >= now() - INTERVAL '7 days'
            GROUP BY stats.user_id
        )
        SELECT profiles.id,
               profiles.display_name::TEXT,
               profiles.avatar_key,
               profiles.avatar_url,
               weekly.score,
               weekly.games_played,
               weekly.games_won,
               NULL::INTEGER,
               NULL::INTEGER,
               NULL::INTEGER
        FROM weekly
        JOIN public.profiles AS profiles ON profiles.id = weekly.user_id
        ORDER BY weekly.score DESC, profiles.display_name ASC
        LIMIT 50;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT profiles.id,
           profiles.display_name::TEXT,
           profiles.avatar_key,
           profiles.avatar_url,
           coalesce(stats.total_score, 0),
           coalesce(stats.games_played, 0),
           coalesce(stats.games_won, 0),
           coalesce(stats.correct_answers, 0),
           coalesce(stats.successful_traps, 0),
           coalesce(stats.times_trapped, 0)
    FROM public.profiles AS profiles
    JOIN public.user_stats AS stats ON stats.user_id = profiles.id
    WHERE stats.games_played > 0
      AND (
          p_scope = 'all'
          OR EXISTS (
              SELECT 1
              FROM public.friendships AS friendships
              WHERE (friendships.user_low = auth.uid() AND friendships.user_high = profiles.id)
                 OR (friendships.user_high = auth.uid() AND friendships.user_low = profiles.id)
          )
      )
    ORDER BY stats.total_score DESC, profiles.display_name ASC
    LIMIT 50;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_players_secure(p_query TEXT)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    avatar_key TEXT,
    avatar_url TEXT,
    relationship_status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_query TEXT := btrim(coalesce(p_query, ''));
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;
    IF char_length(v_query) < 2 OR char_length(v_query) > 32 THEN
        RAISE EXCEPTION 'Oyuncu araması 2-32 karakter arasında olmalıdır';
    END IF;

    RETURN QUERY
    SELECT profiles.id,
           profiles.display_name::TEXT,
           profiles.avatar_key,
           profiles.avatar_url,
           CASE
               WHEN EXISTS (
                   SELECT 1 FROM public.user_blocks AS blocks
                   WHERE (blocks.blocker_id = auth.uid() AND blocks.blocked_id = profiles.id)
                      OR (blocks.blocker_id = profiles.id AND blocks.blocked_id = auth.uid())
               ) THEN 'blocked'
               WHEN EXISTS (
                   SELECT 1 FROM public.friendships AS friendships
                   WHERE (friendships.user_low = auth.uid() AND friendships.user_high = profiles.id)
                      OR (friendships.user_high = auth.uid() AND friendships.user_low = profiles.id)
               ) THEN 'friends'
               WHEN EXISTS (
                   SELECT 1 FROM public.friend_requests AS requests
                   WHERE requests.sender_id = auth.uid()
                     AND requests.recipient_id = profiles.id
                     AND requests.status = 'pending'
               ) THEN 'outgoing_pending'
               WHEN EXISTS (
                   SELECT 1 FROM public.friend_requests AS requests
                   WHERE requests.sender_id = profiles.id
                     AND requests.recipient_id = auth.uid()
                     AND requests.status = 'pending'
               ) THEN 'incoming_pending'
               ELSE 'none'
           END
    FROM public.profiles AS profiles
    WHERE profiles.id <> auth.uid()
      AND position(lower(v_query) IN lower(profiles.display_name)) > 0
      AND NOT EXISTS (
          SELECT 1 FROM public.user_blocks AS blocks
          WHERE (blocks.blocker_id = auth.uid() AND blocks.blocked_id = profiles.id)
             OR (blocks.blocker_id = profiles.id AND blocks.blocked_id = auth.uid())
      )
    ORDER BY profiles.display_name ASC
    LIMIT 20;
END;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard_scoped_secure(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_scoped_secure(TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.search_players_secure(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_players_secure(TEXT) TO authenticated;
