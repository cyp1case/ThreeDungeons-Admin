-- ThreeDungeons Residency RPG - Auth Trigger
-- Creates profile for new Supabase Auth users (Leaders sign up; Super-admin bootstrap via SQL)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, program_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    'leader',  -- default; super-admin updated via bootstrap SQL
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: when a new user signs up via Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
