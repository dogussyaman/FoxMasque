ALTER TABLE public.room_players
    ALTER COLUMN avatar_key TYPE TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read player avatars" ON storage.objects;
CREATE POLICY "Public read player avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Upload own player avatar" ON storage.objects;
CREATE POLICY "Upload own player avatar"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

DROP POLICY IF EXISTS "Update own player avatar" ON storage.objects;
CREATE POLICY "Update own player avatar"
    ON storage.objects FOR UPDATE TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    )
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::TEXT
    );

CREATE OR REPLACE FUNCTION public.update_player_profile_secure(
    p_name VARCHAR(32),
    p_avatar_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Oturum açılması gerekiyor';
    END IF;

    UPDATE public.room_players
    SET name = COALESCE(NULLIF(BTRIM(p_name), ''), 'Oyuncu'),
        avatar_key = p_avatar_key
    WHERE player_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_player_profile_secure(VARCHAR, TEXT)
    TO authenticated;
