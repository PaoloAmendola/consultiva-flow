-- Realtime para scripts
ALTER TABLE public.scripts REPLICA IDENTITY FULL;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.scripts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Defense-in-depth: exigir authenticated nas policies de admin
-- assets
DROP POLICY IF EXISTS "Admins can insert assets" ON public.assets;
CREATE POLICY "Admins can insert assets" ON public.assets
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update assets" ON public.assets;
CREATE POLICY "Admins can update assets" ON public.assets
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete assets" ON public.assets;
CREATE POLICY "Admins can delete assets" ON public.assets
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- playbooks
DROP POLICY IF EXISTS "Admins can insert playbooks" ON public.playbooks;
CREATE POLICY "Admins can insert playbooks" ON public.playbooks
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update playbooks" ON public.playbooks;
CREATE POLICY "Admins can update playbooks" ON public.playbooks
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete playbooks" ON public.playbooks;
CREATE POLICY "Admins can delete playbooks" ON public.playbooks
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- nurture_tracks
DROP POLICY IF EXISTS "Admins can insert nurture tracks" ON public.nurture_tracks;
CREATE POLICY "Admins can insert nurture tracks" ON public.nurture_tracks
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can update nurture tracks" ON public.nurture_tracks;
CREATE POLICY "Admins can update nurture tracks" ON public.nurture_tracks
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can delete nurture tracks" ON public.nurture_tracks;
CREATE POLICY "Admins can delete nurture tracks" ON public.nurture_tracks
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));