-- ==============================================================================
-- ZARTO — Server-Authoritative Bluff & Party Game Migration
-- ==============================================================================

-- 1. Extend room_phase enum if needed
DO $$ BEGIN
    ALTER TYPE room_phase ADD VALUE IF NOT EXISTS 'fake_answer';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE room_phase ADD VALUE IF NOT EXISTS 'guess';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. QUESTIONS TABLE (Authoritative question & correct answer repository)
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    default_decoys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    explanation TEXT NOT NULL DEFAULT ''
);

-- Seed authoritative questions
INSERT INTO public.questions (id, category_id, prompt, correct_answer, default_decoys, explanation)
VALUES
    ('gk-1', 'genel-kultur', 'Türkiye Cumhuriyeti hangi yıl ilan edildi?', '1923', ARRAY['1920', '1925', '1930'], '29 Ekim 1923’te Cumhuriyet ilan edildi.'),
    ('gk-2', 'genel-kultur', 'Dünya’nın en büyük okyanusu hangisidir?', 'Büyük Okyanus', ARRAY['Atlas Okyanusu', 'Hint Okyanusu', 'Arktik Okyanus'], 'Büyük (Pasifik) Okyanusu en büyük okyanustur.'),
    ('gk-3', 'genel-kultur', 'İnsan vücudunda kaç kemik bulunur?', '206', ARRAY['196', '216', '226'], 'Yetişkin bir insanda 206 kemik vardır.'),
    ('gk-4', 'genel-kultur', '“Suç ve Ceza” romanının yazarı kimdir?', 'Dostoyevski', ARRAY['Tolstoy', 'Çehov', 'Gogol'], 'Fyodor Dostoyevski tarafından yazılmıştır.'),
    ('gk-5', 'genel-kultur', 'Işık hızı yaklaşık olarak nedir?', '300.000 km/s', ARRAY['150.000 km/s', '30.000 km/s', '1.000.000 km/s'], 'Işık boşlukta ~300.000 km/s hızla yayılır.'),

    ('hy-1', 'hayvanlar-alem', 'Bir grup flamingoya ne denir?', 'Flamboyans', ARRAY['Sürü', 'Koloni', 'Yığın'], 'Flamingo topluluklarına “flamboyans” denir.'),
    ('hy-2', 'hayvanlar-alem', 'Pandaların dil rengi nedir?', 'Pembe', ARRAY['Mavi', 'Mor', 'Yeşil'], 'Pandanın dili pembemsi kırmızıdır.'),
    ('hy-3', 'hayvanlar-alem', 'Bir salyangoz kaç dişe sahip olabilir?', 'Yaklaşık 25.000', ARRAY['Hiç dişi yoktur', 'Yaklaşık 100', 'Yaklaşık 10.000'], 'Bazı salyangoz türlerinde ~25.000 diş bulunur.'),
    ('hy-4', 'hayvanlar-alem', 'Hangi hayvan parmak izine sahiptir?', 'Koala', ARRAY['Maymun', 'Kanguru', 'Timsah'], 'Koalaların parmak izi insanlarınkine çok benzer.'),
    ('hy-5', 'hayvanlar-alem', 'Balina hangi canlı sınıfına aittir?', 'Memeli', ARRAY['Balık', 'Sürüngen', 'Amfibi'], 'Balinalar memeli hayvanlardır.'),

    ('md-1', 'moda-ve-stil', '“Louboutin” markasının ikonik özelliği nedir?', 'Kırmızı taban', ARRAY['Mavi logo', 'Altın çıt', 'Yeşil kurdele'], 'Christian Louboutin ayakkabıları kırmızı tabanıyla tanınır.'),
    ('md-2', 'moda-ve-stil', '“Bikini” adını hangisinden alır?', 'Bir ada', ARRAY['Bir çiçek', 'Bir şarkıcı', 'Bir İtalyan şehri'], 'Bikini Atolü’ndeki nükleer testlere atıfla adlandırılmıştır.'),
    ('md-3', 'moda-ve-stil', 'Hangisi klasik bir düğün elbisesi kesimidir?', 'A-line', ARRAY['Sahara', 'Bolero', 'Trench'], 'A-line, klasik gelinlik kesimlerinden biridir.'),
    ('md-4', 'moda-ve-stil', '“Haute Couture” ne demektir?', 'El yapımı yüksek terzilik', ARRAY['Hazır giyim', 'Sokak modası', 'İkinci el'], 'Fransızcada “yüksek terzilik” anlamına gelir.'),
    ('md-5', 'moda-ve-stil', 'Gucci hangi ülkede kuruldu?', 'İtalya', ARRAY['Fransa', 'ABD', 'İngiltere'], 'Gucci, 1921’de Floransa’da kuruldu.'),

    ('fm-1', 'film-ve-dizi', '“Parazit” (Parasite) hangi ülkenin filmidir?', 'Güney Kore', ARRAY['Japonya', 'Çin', 'Tayvan'], 'Bong Joon-ho’nun Güney Kore filmidir.'),
    ('fm-2', 'film-ve-dizi', '“Breaking Bad” hangi karakterin etrafında döner?', 'Walter White', ARRAY['Don Draper', 'Rick Grimes', 'Marty Byrde'], 'Walter White’ın dönüşümünü anlatır.'),
    ('fm-3', 'film-ve-dizi', '“Yüzüklerin Efendisi” hangi yazardan uyarlanmıştır?', 'J.R.R. Tolkien', ARRAY['C.S. Lewis', 'George R.R. Martin', 'Brandon Sanderson'], 'J.R.R. Tolkien’in eserinden uyarlanmıştır.'),
    ('fm-4', 'film-ve-dizi', '“La La Land” müzikalinde başrol kadın oyuncu kimdir?', 'Emma Stone', ARRAY['Natalie Portman', 'Anne Hathaway', 'Scarlett Johansson'], 'Emma Stone Mia rolünü oynamıştır.'),
    ('fm-5', 'film-ve-dizi', '“Dark” dizisi hangi ülkede geçer?', 'Almanya', ARRAY['Avusturya', 'Danimarka', 'İsveç'], 'Alman yapımı bir bilim kurgu dizisidir.'),

    ('mz-1', 'muzik', 'Tarkan’ın “Şımarık” şarkısı hangi yılda büyük hit oldu?', '1997', ARRAY['1995', '2001', '2003'], '1997’de dünya çapında popüler oldu.'),
    ('mz-2', 'muzik', 'Beatles’ın kaç üyesi vardı?', '4', ARRAY['3', '5', '6'], 'John, Paul, George ve Ringo olmak üzere 4 üye.'),
    ('mz-3', 'muzik', 'Standart bir piyanoda kaç tuş vardır?', '88', ARRAY['76', '96', '100'], 'Standart piyanoda 88 tuş bulunur.'),
    ('mz-4', 'muzik', '“Billie Jean” hangi sanatçıya aittir?', 'Michael Jackson', ARRAY['Prince', 'Madonna', 'David Bowie'], 'Michael Jackson’ın ikonik şarkısıdır.'),
    ('mz-5', 'muzik', 'Eurovision 2003’ü kim kazandı?', 'Sertab Erener', ARRAY['Marina', 'Helena Paparizou', 'Loreen'], 'Sertab Erener “Everyway That I Can” ile kazandı.'),

    ('yk-1', 'yemek-ve-lezzet', '“Mantı” hangi mutfağın özgün yemeği kabul edilir?', 'Türk', ARRAY['Çin', 'Meksika', 'Fransız'], 'Mantı Türk mutfağının sevilen yemeklerinden biridir.'),
    ('yk-2', 'yemek-ve-lezzet', 'İtalyan “risotto” hangi pirinçle yapılır?', 'Arborio', ARRAY['Basmati', 'Jasmine', 'Kırık'], 'Arborio pirinci kremamsı dokusuyla bilinir.'),
    ('yk-3', 'yemek-ve-lezzet', '“Sushi” temelde hangi ana malzeme bazında hazırlanır?', 'Pirinç', ARRAY['Noodle', 'Lavaş', 'Peynir'], 'Sushi sirke aromalı pirinç temelinde yapılır.'),
    ('yk-4', 'yemek-ve-lezzet', 'Türk kahvesinin UNESCO listesine alınma yılı?', '2013', ARRAY['2010', '2015', '2018'], '2013’te UNESCO kültürel miras listesine alındı.'),
    ('yk-5', 'yemek-ve-lezzet', 'Klasik baklava hamuru kaç kat açılır?', '40-50', ARRAY['10-20', '20-30', '60-70'], 'Klasik baklavada 40-50 kat yufka bulunur.')
ON CONFLICT (id) DO UPDATE SET
    prompt = EXCLUDED.prompt,
    correct_answer = EXCLUDED.correct_answer,
    default_decoys = EXCLUDED.default_decoys,
    explanation = EXCLUDED.explanation;

-- 3. EXTEND ROOM PLAYERS FOR ZARTO ABILITY COUNTERS
ALTER TABLE public.room_players
    ADD COLUMN IF NOT EXISTS consecutive_correct INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS shields_available INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS blocks_available INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_blocked_current_round BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_blocked_next_round BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_blocked_player_id UUID DEFAULT NULL;

-- 4. ROUND FAKE ANSWERS (Players submit convincing fake answers)
CREATE TABLE IF NOT EXISTS public.round_fake_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    player_id UUID NOT NULL,
    fake_answer TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_id, round_number, player_id)
);

-- 5. ROUND CHOICES (The blended options: true answer + all fake answers)
CREATE TABLE IF NOT EXISTS public.round_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    choice_index INT NOT NULL,
    text TEXT NOT NULL,
    author_id UUID DEFAULT NULL, -- NULL if real answer or system decoy
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_id, round_number, choice_index)
);

-- 6. ROUND PICKS (Players pick which choice they think is the real answer)
CREATE TABLE IF NOT EXISTS public.round_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    player_id UUID NOT NULL,
    choice_index INT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(room_id, round_number, player_id)
);

-- 7. EXTEND ROUND RESULTS FOR BLUFF BREAKDOWN
ALTER TABLE public.round_results
    ADD COLUMN IF NOT EXISTS victims_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deceived_by_author_id UUID DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS picked_text TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS own_fake_text TEXT DEFAULT NULL;

-- 8. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_fake_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_picks ENABLE ROW LEVEL SECURITY;

-- Questions can be read by authenticated users, but never updated by clients
DROP POLICY IF EXISTS "Public read questions" ON public.questions;
CREATE POLICY "Public read questions" ON public.questions
    FOR SELECT TO authenticated USING (true);

-- SECURE FAKE ANSWERS: Player can only read and write their OWN fake answer until reveal!
DROP POLICY IF EXISTS "Player submit own fake answer" ON public.round_fake_answers;
CREATE POLICY "Player submit own fake answer" ON public.round_fake_answers
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

DROP POLICY IF EXISTS "Player read own fake answer before reveal" ON public.round_fake_answers;
CREATE POLICY "Player read own fake answer before reveal" ON public.round_fake_answers
    FOR SELECT TO authenticated USING (
        auth.uid() = player_id OR
        EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = round_fake_answers.room_id
              AND r.phase IN ('reveal', 'scoreboard', 'game_over')
        )
    );

-- SECURE ROUND CHOICES: Can only select via RPC or after reveal
DROP POLICY IF EXISTS "Read round choices" ON public.round_choices;
CREATE POLICY "Read round choices" ON public.round_choices
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = round_choices.room_id
              AND r.phase IN ('reveal', 'scoreboard', 'game_over')
        )
    );

-- SECURE PICKS: Player can insert and read their own pick
DROP POLICY IF EXISTS "Player submit own pick" ON public.round_picks;
CREATE POLICY "Player submit own pick" ON public.round_picks
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

DROP POLICY IF EXISTS "Player read picks after reveal" ON public.round_picks;
CREATE POLICY "Player read picks after reveal" ON public.round_picks
    FOR SELECT TO authenticated USING (
        auth.uid() = player_id OR
        EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = round_picks.room_id
              AND r.phase IN ('reveal', 'scoreboard', 'game_over')
        )
    );

-- Fix old round_answers RLS leak
DROP POLICY IF EXISTS "Read round answers after reveal" ON public.round_answers;
CREATE POLICY "Read round answers after reveal" ON public.round_answers
    FOR SELECT TO authenticated USING (
        auth.uid() = player_id OR
        EXISTS (
            SELECT 1 FROM public.rooms r
            WHERE r.id = round_answers.room_id
              AND r.phase IN ('reveal', 'scoreboard', 'game_over')
        )
    );

-- 9. REALTIME PUBLICATION
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.round_results;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.nudges;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 10. SERVER-AUTHORITATIVE RPC FUNCTIONS
-- ==============================================================================

-- RPC: Set player ready status
CREATE OR REPLACE FUNCTION public.set_player_ready_secure(
    p_room_code VARCHAR(6),
    p_ready BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    SELECT id INTO v_room_id FROM public.rooms WHERE code = UPPER(p_room_code);
    IF v_room_id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    UPDATE public.room_players
    SET is_ready = p_ready
    WHERE room_id = v_room_id AND player_id = v_user_id;
END;
$$;

-- RPC: Start game (Host only)
CREATE OR REPLACE FUNCTION public.start_game_secure(
    p_room_code VARCHAR(6)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_ready_count INT;
    v_first_q_id TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE code = UPPER(p_room_code);
    IF v_room.id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    IF v_room.host_id <> v_user_id THEN
        RAISE EXCEPTION 'Yalnızca oda kurucusu oyunu başlatabilir';
    END IF;

    SELECT COUNT(*) INTO v_ready_count
    FROM public.room_players
    WHERE room_id = v_room.id AND is_ready = TRUE;

    IF v_ready_count < 2 THEN
        RAISE EXCEPTION 'Oyunu başlatmak için en az 2 oyuncu hazır olmalıdır';
    END IF;

    -- Pick first question from selected categories
    SELECT id INTO v_first_q_id
    FROM public.questions
    WHERE category_id = ANY(v_room.selected_categories)
    ORDER BY random()
    LIMIT 1;

    -- Reset round states and set phase to ability_select
    UPDATE public.room_players
    SET score = 0,
        consecutive_correct = 0,
        shields_available = 0,
        blocks_available = 0,
        is_blocked_current_round = FALSE,
        is_blocked_next_round = FALSE,
        last_blocked_player_id = NULL
    WHERE room_id = v_room.id;

    UPDATE public.rooms
    SET phase = 'ability_select',
        current_round = 1,
        current_question_id = v_first_q_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_room.id;
END;
$$;

-- RPC: Use Ability
CREATE OR REPLACE FUNCTION public.use_ability_secure(
    p_room_code VARCHAR(6),
    p_ability ability_type,
    p_target_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_player RECORD;
    v_target RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE code = UPPER(p_room_code);
    IF v_room.id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    SELECT * INTO v_player FROM public.room_players WHERE room_id = v_room.id AND player_id = v_user_id;
    IF v_player.player_id IS NULL THEN
        RAISE EXCEPTION 'Oda üyesi değilsiniz';
    END IF;

    IF v_player.is_blocked_current_round THEN
        RAISE EXCEPTION 'Bu tur bloklandığınız için yetenek kullanamazsınız';
    END IF;

    IF p_ability = 'block' THEN
        IF p_target_id IS NULL OR p_target_id = v_user_id THEN
            RAISE EXCEPTION 'Bloklamak için geçerli bir rakip seçmelisiniz';
        END IF;
        IF v_player.blocks_available <= 0 THEN
            RAISE EXCEPTION 'Bloklama hakkınız bulunmuyor';
        END IF;
        IF v_player.last_blocked_player_id = p_target_id THEN
            RAISE EXCEPTION 'Aynı oyuncuyu art arda iki tur bloklayamazsınız';
        END IF;

        -- Record action
        INSERT INTO public.ability_actions (room_id, round_number, player_id, ability, target_id)
        VALUES (v_room.id, v_room.current_round, v_user_id, p_ability, p_target_id);

        UPDATE public.room_players
        SET blocks_available = blocks_available - 1,
            last_blocked_player_id = p_target_id
        WHERE room_id = v_room.id AND player_id = v_user_id;

    ELSIF p_ability = 'shield' THEN
        IF v_player.shields_available <= 0 THEN
            RAISE EXCEPTION 'Kalkan hakkınız bulunmuyor';
        END IF;

        INSERT INTO public.ability_actions (room_id, round_number, player_id, ability, target_id)
        VALUES (v_room.id, v_room.current_round, v_user_id, p_ability, NULL);

        UPDATE public.room_players
        SET shields_available = shields_available - 1
        WHERE room_id = v_room.id AND player_id = v_user_id;

    ELSE
        -- Other ability types (penalty / counter)
        INSERT INTO public.ability_actions (room_id, round_number, player_id, ability, target_id)
        VALUES (v_room.id, v_room.current_round, v_user_id, p_ability, p_target_id);
    END IF;
END;
$$;

-- RPC: Submit Fake Answer
CREATE OR REPLACE FUNCTION public.submit_fake_answer_secure(
    p_room_code VARCHAR(6),
    p_fake_answer TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_player RECORD;
    v_trimmed TEXT := TRIM(p_fake_answer);
    v_active_players_count INT;
    v_submitted_count INT;
    v_q RECORD;
    v_rec RECORD;
    v_idx INT := 0;
    v_opt_arr TEXT[] := ARRAY[]::TEXT[];
    v_authors_arr UUID[] := ARRAY[]::UUID[];
    v_correct_arr BOOLEAN[] := ARRAY[]::BOOLEAN[];
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    IF LENGTH(v_trimmed) < 1 THEN
        RAISE EXCEPTION 'Sahte cevap boş olamaz';
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE code = UPPER(p_room_code);
    IF v_room.id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    SELECT * INTO v_player FROM public.room_players WHERE room_id = v_room.id AND player_id = v_user_id;
    IF v_player.player_id IS NULL THEN
        RAISE EXCEPTION 'Oda üyesi değilsiniz';
    END IF;

    IF v_player.is_blocked_current_round THEN
        RAISE EXCEPTION 'Bu tur bloklandınız, cevap veremezsiniz';
    END IF;

    -- Insert or update fake answer
    INSERT INTO public.round_fake_answers (room_id, round_number, player_id, fake_answer)
    VALUES (v_room.id, v_room.current_round, v_user_id, v_trimmed)
    ON CONFLICT (room_id, round_number, player_id)
    DO UPDATE SET fake_answer = EXCLUDED.fake_answer;

    -- Count active unblocked players
    SELECT COUNT(*) INTO v_active_players_count
    FROM public.room_players
    WHERE room_id = v_room.id AND is_online = TRUE AND is_blocked_current_round = FALSE;

    SELECT COUNT(*) INTO v_submitted_count
    FROM public.round_fake_answers
    WHERE room_id = v_room.id AND round_number = v_room.current_round;

    -- If all active unblocked players submitted, generate choices and transition to 'guess'
    IF v_submitted_count >= v_active_players_count THEN
        SELECT * INTO v_q FROM public.questions WHERE id = v_room.current_question_id;

        -- Clear existing choices for this round if any
        DELETE FROM public.round_choices WHERE room_id = v_room.id AND round_number = v_room.current_round;

        -- Collect real answer + fake answers
        CREATE TEMP TABLE temp_blended_choices (
            choice_text TEXT,
            author_id UUID,
            is_correct BOOLEAN
        ) ON COMMIT DROP;

        INSERT INTO temp_blended_choices (choice_text, author_id, is_correct)
        VALUES (v_q.correct_answer, NULL, TRUE);

        FOR v_rec IN
            SELECT fake_answer, player_id FROM public.round_fake_answers
            WHERE room_id = v_room.id AND round_number = v_room.current_round
        LOOP
            INSERT INTO temp_blended_choices (choice_text, author_id, is_correct)
            VALUES (v_rec.fake_answer, v_rec.player_id, FALSE);
        END LOOP;

        -- If fewer than 4 choices, supplement with default decoys from the question
        IF (SELECT COUNT(*) FROM temp_blended_choices) < 4 AND v_q.default_decoys IS NOT NULL THEN
            FOR i IN 1..array_length(v_q.default_decoys, 1) LOOP
                IF (SELECT COUNT(*) FROM temp_blended_choices) < 4 THEN
                    INSERT INTO temp_blended_choices (choice_text, author_id, is_correct)
                    VALUES (v_q.default_decoys[i], NULL, FALSE);
                END IF;
            END LOOP;
        END IF;

        -- Insert in random order into round_choices
        v_idx := 0;
        FOR v_rec IN
            SELECT * FROM temp_blended_choices ORDER BY random()
        LOOP
            INSERT INTO public.round_choices (room_id, round_number, choice_index, text, author_id, is_correct)
            VALUES (v_room.id, v_room.current_round, v_idx, v_rec.choice_text, v_rec.author_id, v_rec.is_correct);
            v_idx := v_idx + 1;
        END LOOP;

        -- Transition phase to 'guess'
        UPDATE public.rooms
        SET phase = 'guess', updated_at = timezone('utc'::text, now())
        WHERE id = v_room.id;
    END IF;
END;
$$;

-- RPC: Get choices safely for the calling player
-- (Hides which is real, hides authors, flags whether it's caller's own fake so client can disable it)
CREATE OR REPLACE FUNCTION public.get_round_choices_secure(
    p_room_code VARCHAR(6)
)
RETURNS TABLE (
    choice_index INT,
    choice_text TEXT,
    is_own_fake BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE code = UPPER(p_room_code);
    IF v_room.id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    RETURN QUERY
    SELECT
        c.choice_index,
        c.text,
        (c.author_id IS NOT NULL AND c.author_id = v_user_id) AS is_own_fake
    FROM public.round_choices c
    WHERE c.room_id = v_room.id AND c.round_number = v_room.current_round
    ORDER BY c.choice_index ASC;
END;
$$;

-- RPC: Submit Choice / Guess
CREATE OR REPLACE FUNCTION public.submit_pick_secure(
    p_room_code VARCHAR(6),
    p_choice_index INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_player RECORD;
    v_choice RECORD;
    v_active_players_count INT;
    v_picks_count INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE code = UPPER(p_room_code);
    IF v_room.id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    SELECT * INTO v_player FROM public.room_players WHERE room_id = v_room.id AND player_id = v_user_id;
    IF v_player.player_id IS NULL THEN
        RAISE EXCEPTION 'Oda üyesi değilsiniz';
    END IF;

    IF v_player.is_blocked_current_round THEN
        RAISE EXCEPTION 'Bu tur bloklandınız, tahmin yapamazsınız';
    END IF;

    -- Verify choice exists
    SELECT * INTO v_choice
    FROM public.round_choices
    WHERE room_id = v_room.id AND round_number = v_room.current_round AND choice_index = p_choice_index;

    IF v_choice.id IS NULL THEN
        RAISE EXCEPTION 'Geçersiz seçenek';
    END IF;

    -- Enforce rule: CANNOT pick your own fake answer!
    IF v_choice.author_id IS NOT NULL AND v_choice.author_id = v_user_id THEN
        RAISE EXCEPTION 'Kendi yazdığınız sahte cevabı seçemezsiniz!';
    END IF;

    -- Save pick
    INSERT INTO public.round_picks (room_id, round_number, player_id, choice_index)
    VALUES (v_room.id, v_room.current_round, v_user_id, p_choice_index)
    ON CONFLICT (room_id, round_number, player_id)
    DO UPDATE SET choice_index = EXCLUDED.choice_index;

    -- Check if all active players submitted picks
    SELECT COUNT(*) INTO v_active_players_count
    FROM public.room_players
    WHERE room_id = v_room.id AND is_online = TRUE AND is_blocked_current_round = FALSE;

    SELECT COUNT(*) INTO v_picks_count
    FROM public.round_picks
    WHERE room_id = v_room.id AND round_number = v_room.current_round;

    IF v_picks_count >= v_active_players_count THEN
        -- Auto-resolve round
        PERFORM public.resolve_round_authoritative(v_room.id, v_room.current_round);
    END IF;
END;
$$;

-- RPC: Authoritative Round Resolution & Scoring
CREATE OR REPLACE FUNCTION public.resolve_round_authoritative(
    p_room_id UUID,
    p_round_number INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_room RECORD;
    v_player RECORD;
    v_pick RECORD;
    v_chosen_choice RECORD;
    v_own_fake RECORD;
    v_correct BOOLEAN;
    v_victims_count INT;
    v_deceived BOOLEAN;
    v_deceived_author_id UUID;
    v_delta INT;
    v_total_rivals INT;
    v_has_shield BOOLEAN;
    v_has_block_action BOOLEAN;
    v_target_blocked BOOLEAN;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
    IF v_room.id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    -- Active opponents count (for 50% trick threshold)
    SELECT COUNT(*) - 1 INTO v_total_rivals
    FROM public.room_players
    WHERE room_id = p_room_id AND is_online = TRUE;
    IF v_total_rivals < 1 THEN v_total_rivals := 1; END IF;

    FOR v_player IN
        SELECT * FROM public.room_players WHERE room_id = p_room_id
    LOOP
        v_delta := 0;
        v_correct := FALSE;
        v_deceived := FALSE;
        v_deceived_author_id := NULL;
        v_victims_count := 0;

        -- If player was blocked this round, they score 0 and reset block
        IF v_player.is_blocked_current_round THEN
            INSERT INTO public.round_results (
                room_id, round_number, player_id, answered_correctly,
                zartaladın, zartalandın, points_delta, victims_count,
                deceived_by_author_id, picked_text, own_fake_text
            ) VALUES (
                p_room_id, p_round_number, v_player.player_id, FALSE,
                FALSE, FALSE, 0, 0, NULL, 'BLOKLANDI', NULL
            )
            ON CONFLICT (room_id, round_number, player_id) DO NOTHING;
            CONTINUE;
        END IF;

        -- 1. Check player's pick
        SELECT c.* INTO v_chosen_choice
        FROM public.round_picks p
        JOIN public.round_choices c
            ON c.room_id = p.room_id AND c.round_number = p.round_number AND c.choice_index = p.choice_index
        WHERE p.room_id = p_room_id AND p.round_number = p_round_number AND p.player_id = v_player.player_id;

        IF v_chosen_choice.id IS NOT NULL THEN
            IF v_chosen_choice.is_correct THEN
                v_correct := TRUE;
                v_delta := v_delta + 100; -- DOĞRU BİLDİN (+100)
            ELSIF v_chosen_choice.author_id IS NOT NULL AND v_chosen_choice.author_id <> v_player.player_id THEN
                -- Player picked a rival's fake answer -> ZARTALANDIN (-40)
                v_deceived := TRUE;
                v_deceived_author_id := v_chosen_choice.author_id;
                v_delta := v_delta - 40;
            END IF;
        END IF;

        -- 2. Count how many rivals picked this player's fake answer -> ZARTALADIN (+50 per victim)
        SELECT COUNT(*) INTO v_victims_count
        FROM public.round_picks p
        JOIN public.round_choices c
            ON c.room_id = p.room_id AND c.round_number = p.round_number AND c.choice_index = p.choice_index
        WHERE p.room_id = p_room_id
          AND p.round_number = p_round_number
          AND c.author_id = v_player.player_id
          AND p.player_id <> v_player.player_id;

        IF v_victims_count > 0 THEN
            v_delta := v_delta + (v_victims_count * 50);
        END IF;

        -- 3. Check Ability Unlocks & Stat Progression
        -- Consecutive correct: 3 in a row unlocks a Shield
        IF v_correct THEN
            UPDATE public.room_players
            SET consecutive_correct = consecutive_correct + 1
            WHERE room_id = p_room_id AND player_id = v_player.player_id;

            IF (v_player.consecutive_correct + 1) >= 3 THEN
                UPDATE public.room_players
                SET shields_available = shields_available + 1,
                    consecutive_correct = 0
                WHERE room_id = p_room_id AND player_id = v_player.player_id;
            END IF;
        ELSE
            UPDATE public.room_players
            SET consecutive_correct = 0
            WHERE room_id = p_room_id AND player_id = v_player.player_id;
        END IF;

        -- Tricking rivals: At least 3 rivals OR > 50% of active opponents unlocks a Block
        IF v_victims_count >= 3 OR (v_victims_count::FLOAT / v_total_rivals::FLOAT > 0.5) THEN
            UPDATE public.room_players
            SET blocks_available = blocks_available + 1
            WHERE room_id = p_room_id AND player_id = v_player.player_id;
        END IF;

        -- Get player's fake answer text for review
        SELECT fake_answer INTO v_own_fake
        FROM public.round_fake_answers
        WHERE room_id = p_room_id AND round_number = p_round_number AND player_id = v_player.player_id;

        -- Record round results log
        INSERT INTO public.round_results (
            room_id, round_number, player_id, answered_correctly,
            zartaladın, zartalandın, points_delta, victims_count,
            deceived_by_author_id, picked_text, own_fake_text
        ) VALUES (
            p_room_id, p_round_number, v_player.player_id, v_correct,
            (v_victims_count > 0), v_deceived, v_delta, v_victims_count,
            v_deceived_author_id, v_chosen_choice.text, v_own_fake.fake_answer
        )
        ON CONFLICT (room_id, round_number, player_id) DO UPDATE SET
            answered_correctly = EXCLUDED.answered_correctly,
            zartaladın = EXCLUDED.zartaladın,
            zartalandın = EXCLUDED.zartalandın,
            points_delta = EXCLUDED.points_delta,
            victims_count = EXCLUDED.victims_count;

        -- Update cumulative score (minimum 0)
        UPDATE public.room_players
        SET score = GREATEST(0, score + v_delta)
        WHERE room_id = p_room_id AND player_id = v_player.player_id;
    END LOOP;

    -- 4. Apply Block & Shield Interactions for Next Round
    FOR v_player IN
        SELECT * FROM public.room_players WHERE room_id = p_room_id
    LOOP
        -- Check if someone used 'block' on this player during this round
        SELECT EXISTS (
            SELECT 1 FROM public.ability_actions
            WHERE room_id = p_room_id AND round_number = p_round_number
              AND ability = 'block' AND target_id = v_player.player_id
        ) INTO v_has_block_action;

        -- Check if player used 'shield' to protect themselves
        SELECT EXISTS (
            SELECT 1 FROM public.ability_actions
            WHERE room_id = p_room_id AND round_number = p_round_number
              AND ability = 'shield' AND player_id = v_player.player_id
        ) INTO v_has_shield;

        IF v_has_block_action AND NOT v_has_shield THEN
            -- Target is blocked for the next round
            UPDATE public.room_players
            SET is_blocked_next_round = TRUE
            WHERE room_id = p_room_id AND player_id = v_player.player_id;
        END IF;
    END LOOP;

    -- Update room phase to 'reveal'
    UPDATE public.rooms
    SET phase = 'reveal', updated_at = timezone('utc'::text, now())
    WHERE id = p_room_id;
END;
$$;

-- RPC: Advance Phase / Next Round (Host only or auto)
CREATE OR REPLACE FUNCTION public.advance_round_secure(
    p_room_code VARCHAR(6)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_next_q_id TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE code = UPPER(p_room_code);
    IF v_room.id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    IF v_room.host_id <> v_user_id THEN
        RAISE EXCEPTION 'Yalnızca oda kurucusu turu ilerletebilir';
    END IF;

    IF v_room.phase = 'ability_select' THEN
        UPDATE public.rooms SET phase = 'fake_answer', updated_at = timezone('utc'::text, now()) WHERE id = v_room.id;

    ELSIF v_room.phase = 'reveal' THEN
        UPDATE public.rooms SET phase = 'scoreboard', updated_at = timezone('utc'::text, now()) WHERE id = v_room.id;

    ELSIF v_room.phase = 'scoreboard' THEN
        IF v_room.current_round >= v_room.total_rounds THEN
            UPDATE public.rooms SET phase = 'game_over', updated_at = timezone('utc'::text, now()) WHERE id = v_room.id;
        ELSE
            -- Next round
            SELECT id INTO v_next_q_id
            FROM public.questions
            WHERE category_id = ANY(v_room.selected_categories)
            ORDER BY random()
            LIMIT 1;

            -- Shift next-round block to current-round block
            UPDATE public.room_players
            SET is_blocked_current_round = is_blocked_next_round,
                is_blocked_next_round = FALSE
            WHERE room_id = v_room.id;

            UPDATE public.rooms
            SET current_round = current_round + 1,
                current_question_id = v_next_q_id,
                phase = 'ability_select',
                updated_at = timezone('utc'::text, now())
            WHERE id = v_room.id;
        END IF;
    END IF;
END;
$$;

-- RPC: Leave Room
CREATE OR REPLACE FUNCTION public.leave_room_secure(
    p_room_code VARCHAR(6)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_next_host RECORD;
BEGIN
    IF v_user_id IS NULL THEN RETURN; END IF;

    SELECT * INTO v_room FROM public.rooms WHERE code = UPPER(p_room_code);
    IF v_room.id IS NULL THEN RETURN; END IF;

    DELETE FROM public.room_players
    WHERE room_id = v_room.id AND player_id = v_user_id;

    -- If room is now empty, delete room
    IF NOT EXISTS (SELECT 1 FROM public.room_players WHERE room_id = v_room.id) THEN
        DELETE FROM public.rooms WHERE id = v_room.id;
    ELSIF v_room.host_id = v_user_id THEN
        -- Transfer host to another player
        SELECT player_id INTO v_next_host FROM public.room_players WHERE room_id = v_room.id LIMIT 1;
        UPDATE public.rooms SET host_id = v_next_host.player_id WHERE id = v_room.id;
        UPDATE public.room_players SET is_host = TRUE WHERE room_id = v_room.id AND player_id = v_next_host.player_id;
    END IF;
END;
$$;

-- RPC: Rematch Room (Reset for new party)
CREATE OR REPLACE FUNCTION public.rematch_room_secure(
    p_room_code VARCHAR(6)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_first_q_id TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE code = UPPER(p_room_code);
    IF v_room.id IS NULL THEN
        RAISE EXCEPTION 'Oda bulunamadı';
    END IF;

    IF v_room.host_id <> v_user_id THEN
        RAISE EXCEPTION 'Yalnızca oda kurucusu yeniden başlatabilir';
    END IF;

    SELECT id INTO v_first_q_id
    FROM public.questions
    WHERE category_id = ANY(v_room.selected_categories)
    ORDER BY random()
    LIMIT 1;

    -- Reset scores and abilities
    UPDATE public.room_players
    SET score = 0,
        consecutive_correct = 0,
        shields_available = 0,
        blocks_available = 0,
        is_blocked_current_round = FALSE,
        is_blocked_next_round = FALSE,
        last_blocked_player_id = NULL,
        is_ready = FALSE
    WHERE room_id = v_room.id;

    UPDATE public.rooms
    SET phase = 'lobby',
        current_round = 1,
        current_question_id = v_first_q_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_room.id;
END;
$$;
