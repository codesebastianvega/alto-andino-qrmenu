-- Create the initial public profile from the database side.
-- This avoids client-side INSERTs into public.profiles during signup.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;

CREATE OR REPLACE FUNCTION private.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'owner',
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'restaurant_name', ''),
      NEW.email
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.handle_new_user_profile();
