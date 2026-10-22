ALTER TABLE public.rooms
    ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.prevent_paused_room_mutations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_paused_at TIMESTAMPTZ;
BEGIN
    IF TG_TABLE_NAME = 'rooms' THEN
        IF OLD.paused_at IS NOT NULL AND NEW.paused_at IS NOT NULL
           AND NEW.phase IS DISTINCT FROM OLD.phase THEN
            RAISE EXCEPTION 'Oyun duraklatıldı; devam etmeden aşama değiştirilemez';
        END IF;
        RETURN NEW;
    END IF;

    SELECT paused_at INTO v_paused_at
    FROM public.rooms
    WHERE id = NEW.room_id;
    IF v_paused_at IS NOT NULL THEN
        RAISE EXCEPTION 'Oyun duraklatıldı; devam etmeden işlem yapılamaz';
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_paused_room_mutations()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_paused_room_phase_change ON public.rooms;
CREATE TRIGGER prevent_paused_room_phase_change
BEFORE UPDATE OF phase ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.prevent_paused_room_mutations();

DROP TRIGGER IF EXISTS prevent_paused_ability_readiness ON public.room_players;
CREATE TRIGGER prevent_paused_ability_readiness
BEFORE UPDATE OF ability_ready_round ON public.room_players
FOR EACH ROW EXECUTE FUNCTION public.prevent_paused_room_mutations();

DROP TRIGGER IF EXISTS prevent_paused_ability_actions ON public.ability_actions;
CREATE TRIGGER prevent_paused_ability_actions
BEFORE INSERT OR UPDATE ON public.ability_actions
FOR EACH ROW EXECUTE FUNCTION public.prevent_paused_room_mutations();

DROP TRIGGER IF EXISTS prevent_paused_fake_answers ON public.round_fake_answers;
CREATE TRIGGER prevent_paused_fake_answers
BEFORE INSERT OR UPDATE ON public.round_fake_answers
FOR EACH ROW EXECUTE FUNCTION public.prevent_paused_room_mutations();

DROP TRIGGER IF EXISTS prevent_paused_picks ON public.round_picks;
CREATE TRIGGER prevent_paused_picks
BEFORE INSERT OR UPDATE ON public.round_picks
FOR EACH ROW EXECUTE FUNCTION public.prevent_paused_room_mutations();

CREATE OR REPLACE FUNCTION public.set_room_paused_secure(
    p_room_code VARCHAR(6),
    p_paused BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_room public.rooms;
    v_now TIMESTAMPTZ := now();
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Oturum açılması gerekiyor'; END IF;
    SELECT * INTO v_room FROM public.rooms
    WHERE code = upper(p_room_code)
    FOR UPDATE;
    IF NOT FOUND OR NOT public.is_room_member(v_room.id) THEN
        RAISE EXCEPTION 'Oda bulunamadı veya erişim izniniz yok';
    END IF;
    IF v_room.host_id <> auth.uid() THEN
        RAISE EXCEPTION 'Oyunu yalnızca oda sahibi duraklatabilir veya devam ettirebilir';
    END IF;
    IF v_room.phase NOT IN ('ability_select', 'fake_answer', 'guess') THEN
        RAISE EXCEPTION 'Oyun bu aşamada duraklatılamaz';
    END IF;
    IF p_paused AND v_room.phase_deadline_at IS NOT NULL
       AND v_room.phase_deadline_at <= v_now THEN
        RAISE EXCEPTION 'Süre dolduğu için oyun duraklatılamaz';
    END IF;
    IF p_paused AND v_room.paused_at IS NULL THEN
        UPDATE public.rooms
        SET paused_at = v_now, state_version = state_version + 1, updated_at = v_now
        WHERE id = v_room.id;
    ELSIF NOT p_paused AND v_room.paused_at IS NOT NULL THEN
        UPDATE public.rooms
        SET phase_started_at = phase_started_at + (v_now - v_room.paused_at),
            phase_deadline_at = CASE
                WHEN phase_deadline_at IS NULL THEN NULL
                ELSE phase_deadline_at + (v_now - v_room.paused_at)
            END,
            paused_at = NULL,
            state_version = state_version + 1,
            updated_at = v_now
        WHERE id = v_room.id;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_room_paused_secure(VARCHAR, BOOLEAN)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_room_paused_secure(VARCHAR, BOOLEAN)
TO authenticated;

DO $$
DECLARE
    v_definition TEXT := pg_get_functiondef(
        'public.get_room_state_secure(character varying)'::REGPROCEDURE
    );
    v_old TEXT := '''phaseDeadlineAt'', v_room.phase_deadline_at,';
    v_new TEXT := '''phaseDeadlineAt'', v_room.phase_deadline_at,' ||
        E'\n        ''pausedAt'', v_room.paused_at,';
BEGIN
    IF position(v_new IN v_definition) > 0 THEN
        RETURN;
    END IF;
    IF position(v_old IN v_definition) = 0 THEN
        RAISE EXCEPTION 'get_room_state_secure output shape did not match the expected version; add pausedAt manually';
    END IF;
    v_definition := replace(v_definition, v_old, v_new);
    EXECUTE v_definition;
END;
$$;

DO $$
DECLARE
    v_definition TEXT := pg_get_functiondef(
        'public.advance_expired_room_phase_secure(character varying)'::REGPROCEDURE
    );
    v_old TEXT := 'IF v_room.phase_deadline_at IS NULL OR v_room.phase_deadline_at > now() THEN';
    v_new TEXT := 'IF v_room.paused_at IS NOT NULL' ||
        E'\n       OR v_room.phase_deadline_at IS NULL' ||
        E'\n       OR v_room.phase_deadline_at > now() THEN';
BEGIN
    IF position(v_new IN v_definition) > 0 THEN
        RETURN;
    END IF;
    IF position(v_old IN v_definition) = 0 THEN
        RAISE EXCEPTION 'advance_expired_room_phase_secure did not match the expected version; add a paused_at guard manually';
    END IF;
    v_definition := replace(v_definition, v_old, v_new);
    EXECUTE v_definition;
END;
$$;
