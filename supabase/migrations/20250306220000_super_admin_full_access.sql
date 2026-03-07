-- Super-admin: full CRUD on residents, cohorts, resident_cohorts; SELECT on attempts
-- Enables super admins to act as leaders for any program (program selection is done in the UI)

CREATE POLICY "super_admin_residents_insert"
  ON residents FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_residents_update"
  ON residents FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_residents_delete"
  ON residents FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_cohorts_select"
  ON cohorts FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_cohorts_insert"
  ON cohorts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_cohorts_update"
  ON cohorts FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_cohorts_delete"
  ON cohorts FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_resident_cohorts_select"
  ON resident_cohorts FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_resident_cohorts_insert"
  ON resident_cohorts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "super_admin_resident_cohorts_delete"
  ON resident_cohorts FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "super_admin_attempts_select"
  ON attempts FOR SELECT
  TO authenticated
  USING (public.is_super_admin());
