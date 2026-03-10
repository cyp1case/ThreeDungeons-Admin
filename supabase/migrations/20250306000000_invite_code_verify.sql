-- RPC for signup flow: verify invite code (anon can call) and complete signup (authenticated)

CREATE OR REPLACE FUNCTION public.verify_invite_code(given_code TEXT)
RETURNS TABLE(program_id UUID, invite_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ic.program_id, ic.id
  FROM invite_codes ic
  WHERE ic.code = given_code AND ic.used_at IS NULL
  LIMIT 1;
END;
$$;

-- Complete signup: link profile to program and mark invite used (must be called after signUp)
CREATE OR REPLACE FUNCTION public.complete_leader_signup(invite_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prog_id UUID;
BEGIN
  SELECT program_id INTO prog_id FROM invite_codes
  WHERE id = invite_id_param AND used_at IS NULL LIMIT 1;
  IF prog_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or already used invite code';
  END IF;
  UPDATE profiles SET program_id = prog_id WHERE id = auth.uid();
  UPDATE invite_codes SET used_at = now() WHERE id = invite_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_invite_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_invite_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_leader_signup(UUID) TO authenticated;
