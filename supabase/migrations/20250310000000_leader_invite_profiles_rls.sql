-- Leaders can manage invite_codes and view/remove leaders in their program

CREATE POLICY "leader_invite_codes_select"
  ON invite_codes FOR SELECT
  TO authenticated
  USING (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

CREATE POLICY "leader_invite_codes_insert"
  ON invite_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

CREATE POLICY "leader_profiles_read_program_leaders"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    role = 'leader'
    AND program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

CREATE OR REPLACE FUNCTION public.remove_leader_from_program(target_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
  caller_program UUID;
  target_program UUID;
  target_role TEXT;
BEGIN
  SELECT role, program_id INTO caller_role, caller_program
    FROM profiles WHERE id = auth.uid();

  IF caller_role = 'super_admin' THEN
    UPDATE profiles SET program_id = NULL WHERE id = target_profile_id AND role = 'leader';
    RETURN;
  END IF;

  IF caller_role <> 'leader' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF target_profile_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself';
  END IF;

  SELECT role, program_id INTO target_role, target_program
    FROM profiles WHERE id = target_profile_id;

  IF target_role <> 'leader' OR target_program IS DISTINCT FROM caller_program THEN
    RAISE EXCEPTION 'Target is not a leader in your program';
  END IF;

  UPDATE profiles SET program_id = NULL WHERE id = target_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_leader_from_program(UUID) TO authenticated;
