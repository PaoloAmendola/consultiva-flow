
-- Allow admin users to manage assets
CREATE POLICY "Admins can insert assets"
ON public.assets FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update assets"
ON public.assets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete assets"
ON public.assets FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin users to manage nurture tracks
CREATE POLICY "Admins can insert nurture tracks"
ON public.nurture_tracks FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update nurture tracks"
ON public.nurture_tracks FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete nurture tracks"
ON public.nurture_tracks FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
