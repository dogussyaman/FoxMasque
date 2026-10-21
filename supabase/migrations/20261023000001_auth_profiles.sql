-- Extend the existing auth.users -> profiles trigger for Google claims.
-- Profiles are inserted once; later OAuth sign-ins never overwrite user edits.
CREATE OR REPLACE FUNCTION public.create_profile_for_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_name TEXT;
    v_avatar_url TEXT;
BEGIN
    v_name := coalesce(
        nullif(btrim(NEW.raw_user_meta_data ->> 'name'), ''),
        nullif(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
        nullif(btrim(NEW.raw_user_meta_data ->> 'preferred_username'), ''),
        'Oyuncu'
    );
    v_avatar_url := coalesce(
        nullif(NEW.raw_user_meta_data ->> 'avatar_url', ''),
        nullif(NEW.raw_user_meta_data ->> 'picture', '')
    );
    INSERT INTO public.profiles (id, display_name, avatar_key, avatar_url)
    VALUES (
        NEW.id,
        left(v_name, 32),
        left(coalesce(NEW.raw_user_meta_data ->> 'avatarKey', 'fox'), 128),
        CASE WHEN v_avatar_url LIKE 'https://%' THEN v_avatar_url ELSE NULL END
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_auth_user();

-- Backfill only accounts which do not yet have their one-to-one app profile.
INSERT INTO public.profiles (id, display_name, avatar_key, avatar_url)
SELECT u.id,
       left(coalesce(
           nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
           nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
           nullif(btrim(u.raw_user_meta_data ->> 'preferred_username'), ''),
           'Oyuncu'
       ), 32),
       left(coalesce(nullif(u.raw_user_meta_data ->> 'avatarKey', ''), 'fox'), 128),
       CASE
           WHEN coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture') LIKE 'https://%'
           THEN coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
           ELSE NULL
       END
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
