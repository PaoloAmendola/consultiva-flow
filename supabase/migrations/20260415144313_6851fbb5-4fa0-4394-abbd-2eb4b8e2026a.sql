
CREATE TABLE public.playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage TEXT NOT NULL,
  lead_type TEXT NOT NULL DEFAULT 'PROFISSIONAL',
  title TEXT NOT NULL,
  description TEXT,
  objectives TEXT[] DEFAULT '{}',
  key_questions TEXT[] DEFAULT '{}',
  scripts JSONB DEFAULT '[]'::jsonb,
  recommended_assets TEXT[] DEFAULT '{}',
  objection_handlers JSONB DEFAULT '[]'::jsonb,
  success_criteria TEXT[] DEFAULT '{}',
  next_stage_trigger TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view playbooks" ON public.playbooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert playbooks" ON public.playbooks FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update playbooks" ON public.playbooks FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete playbooks" ON public.playbooks FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_playbooks_stage ON public.playbooks(stage);
CREATE INDEX idx_playbooks_lead_type ON public.playbooks(lead_type);
