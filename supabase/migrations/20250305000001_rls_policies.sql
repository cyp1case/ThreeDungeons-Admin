-- ThreeDungeons Residency RPG - Row Level Security
-- Enables RLS and creates policies for multi-program isolation

-- Enable RLS on all tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's profile (use in public schema)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE(role TEXT, program_id UUID) AS $$
  SELECT p.role, p.program_id
  FROM public.profiles p
  WHERE p.id = (SELECT auth.uid())
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is current user super_admin?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: current user's program_id (for leaders)
CREATE OR REPLACE FUNCTION public.get_my_program_id()
RETURNS UUID AS $$
  SELECT program_id FROM public.get_my_profile() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========== PROGRAMS ==========
-- Super-admin: full CRUD
CREATE POLICY "super_admin_programs_all"
  ON programs FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Leaders: read their own program only
CREATE POLICY "leader_programs_read"
  ON programs FOR SELECT
  TO authenticated
  USING (
    id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

-- ========== PROFILES ==========
-- Users can read their own profile
CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

-- Super-admin can read all profiles
CREATE POLICY "super_admin_profiles_read_all"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Allow insert for new signups (trigger creates profile; or dashboard for invite flow)
CREATE POLICY "profiles_insert_authenticated"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- Users can update own profile (limited - e.g. display_name; role/program_id via dashboard)
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- ========== INVITE_CODES ==========
-- Super-admin only (leaders cannot access)
CREATE POLICY "super_admin_invite_codes_all"
  ON invite_codes FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ========== RESIDENTS ==========
-- Leaders: CRUD for their program only
CREATE POLICY "leader_residents_select"
  ON residents FOR SELECT
  TO authenticated
  USING (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

CREATE POLICY "leader_residents_insert"
  ON residents FOR INSERT
  TO authenticated
  WITH CHECK (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

CREATE POLICY "leader_residents_update"
  ON residents FOR UPDATE
  TO authenticated
  USING (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  )
  WITH CHECK (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

CREATE POLICY "leader_residents_delete"
  ON residents FOR DELETE
  TO authenticated
  USING (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

-- ========== COHORTS ==========
-- Leaders: CRUD for their program only
CREATE POLICY "leader_cohorts_select"
  ON cohorts FOR SELECT
  TO authenticated
  USING (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

CREATE POLICY "leader_cohorts_insert"
  ON cohorts FOR INSERT
  TO authenticated
  WITH CHECK (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

CREATE POLICY "leader_cohorts_update"
  ON cohorts FOR UPDATE
  TO authenticated
  USING (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  )
  WITH CHECK (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

CREATE POLICY "leader_cohorts_delete"
  ON cohorts FOR DELETE
  TO authenticated
  USING (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

-- ========== RESIDENT_COHORTS ==========
-- Leaders: CRUD for residents/cohorts in their program
CREATE POLICY "leader_resident_cohorts_select"
  ON resident_cohorts FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM public.get_my_profile()) = 'leader'
    AND (
      resident_id IN (SELECT id FROM residents WHERE program_id = public.get_my_program_id())
      AND cohort_id IN (SELECT id FROM cohorts WHERE program_id = public.get_my_program_id())
    )
  );

CREATE POLICY "leader_resident_cohorts_insert"
  ON resident_cohorts FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.get_my_profile()) = 'leader'
    AND resident_id IN (SELECT id FROM residents WHERE program_id = public.get_my_program_id())
    AND cohort_id IN (SELECT id FROM cohorts WHERE program_id = public.get_my_program_id())
  );

CREATE POLICY "leader_resident_cohorts_delete"
  ON resident_cohorts FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.get_my_profile()) = 'leader'
    AND resident_id IN (SELECT id FROM residents WHERE program_id = public.get_my_program_id())
  );

-- ========== ATTEMPTS ==========
-- Leaders: SELECT for their program only
CREATE POLICY "leader_attempts_select"
  ON attempts FOR SELECT
  TO authenticated
  USING (
    program_id = public.get_my_program_id()
    AND (SELECT role FROM public.get_my_profile()) = 'leader'
  );

-- Residents: INSERT via Supabase Auth (when resident uses auth - Section 6)
-- For custom auth (Edge Function with service role), RLS is bypassed.
-- Policy for resident insert: resident can only insert for their own resident_id.
-- This requires residents to be in auth.users with profile.role='resident'.
-- We need to link resident_id to auth.uid(). The residents table doesn't have auth_user_id.
-- For Phase 1: use Edge Function with service role for attempt insert (Section 6).
-- No direct INSERT policy for anon/authenticated - the API handles it.
-- If we add auth_user_id to residents later, we could add:
--   CREATE POLICY "resident_attempts_insert" ON attempts FOR INSERT TO authenticated
--   WITH CHECK (resident_id IN (SELECT id FROM residents WHERE auth_user_id = auth.uid()));
