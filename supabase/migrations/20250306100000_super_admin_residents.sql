-- Super-admin: read residents (for Programs page resident counts)
CREATE POLICY "super_admin_residents_select"
  ON residents FOR SELECT
  TO authenticated
  USING (public.is_super_admin());
