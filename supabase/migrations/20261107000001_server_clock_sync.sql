-- Calibrate clients against the database clock so devices with skewed local clocks
-- render the same shared room deadline. This RPC reveals no room/player data.
CREATE OR REPLACE FUNCTION public.get_server_time_secure()
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;
    RETURN clock_timestamp();
END;
$$;

REVOKE ALL ON FUNCTION public.get_server_time_secure() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_server_time_secure() TO authenticated;
