
-- Create ENUMs for the CRM
CREATE TYPE public.lead_type AS ENUM ('PROFISSIONAL', 'DISTRIBUIDOR', 'NAO_QUALIFICADO');
CREATE TYPE public.lead_origin AS ENUM ('NUVEMSHOP', 'INSTAGRAM', 'GOOGLE', 'WHATSAPP', 'TELEFONE', 'INDICACAO', 'PRESENCIAL_EMPRESA', 'VISITA_SALAO');
CREATE TYPE public.lead_priority AS ENUM ('P1', 'P2', 'P3', 'P4');
CREATE TYPE public.lead_status_final AS ENUM ('ATIVO', 'CONVERTIDO', 'PERDIDO', 'FORA_PERFIL');
CREATE TYPE public.action_type AS ENUM ('WHATSAPP', 'LIGACAO', 'EMAIL', 'VISITA', 'REUNIAO', 'ENVIAR_MATERIAL', 'ENVIAR_PROPOSTA', 'FOLLOW_UP', 'DEMONSTRACAO');
CREATE TYPE public.interaction_type AS ENUM ('WHATSAPP_IN', 'WHATSAPP_OUT', 'LIGACAO_IN', 'LIGACAO_OUT', 'EMAIL_IN', 'EMAIL_OUT', 'VISITA', 'REUNIAO', 'MUDANCA_ETAPA', 'NOTA');
CREATE TYPE public.interaction_direction AS ENUM ('IN', 'OUT');
CREATE TYPE public.task_status AS ENUM ('OPEN', 'DONE', 'CANCELED');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Assets table (biblioteca de materiais)
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_page_id TEXT,
  code TEXT NOT NULL, -- A1, A2, B1, etc.
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- PDF, VIDEO, IMAGEM, LINK, AUDIO
  url TEXT NOT NULL,
  description TEXT,
  for_lead_type public.lead_type[],
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nurture tracks table (trilhas de nutrição)
CREATE TABLE public.nurture_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notion_page_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  lead_type public.lead_type NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]', -- Array of {day, message, asset_id, action_type}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads table (main CRM table)
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notion_page_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  city TEXT,
  state TEXT,
  lead_type public.lead_type NOT NULL DEFAULT 'PROFISSIONAL',
  origin public.lead_origin NOT NULL,
  stage TEXT NOT NULL DEFAULT 'NOVO_LEAD',
  substatus TEXT,
  priority public.lead_priority NOT NULL DEFAULT 'P3',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  tags TEXT[],
  nurture_track_id UUID REFERENCES public.nurture_tracks(id) ON DELETE SET NULL,
  nurture_step INTEGER DEFAULT 0,
  next_action_type public.action_type NOT NULL,
  next_action_at TIMESTAMPTZ NOT NULL,
  next_action_note TEXT,
  last_touch_at TIMESTAMPTZ,
  status_final public.lead_status_final NOT NULL DEFAULT 'ATIVO',
  observations TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Interactions table (timeline)
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  notion_page_id TEXT,
  type public.interaction_type NOT NULL,
  direction public.interaction_direction NOT NULL,
  content TEXT,
  asset_sent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks table (execução)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  notion_page_id TEXT,
  title TEXT NOT NULL,
  action_type public.action_type NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status public.task_status NOT NULL DEFAULT 'OPEN',
  priority public.lead_priority NOT NULL DEFAULT 'P2',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_status_final ON public.leads(status_final);
CREATE INDEX idx_leads_next_action_at ON public.leads(next_action_at);
CREATE INDEX idx_leads_lead_type ON public.leads(lead_type);
CREATE INDEX idx_interactions_lead_id ON public.interactions(lead_id);
CREATE INDEX idx_interactions_created_at ON public.interactions(created_at);
CREATE INDEX idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX idx_tasks_due_at ON public.tasks(due_at);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurture_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles (only admins can manage)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for assets (public read, admin write)
CREATE POLICY "Anyone authenticated can view assets"
ON public.assets FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for nurture_tracks (public read)
CREATE POLICY "Anyone authenticated can view nurture tracks"
ON public.nurture_tracks FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for leads (user-scoped)
CREATE POLICY "Users can view their own leads"
ON public.leads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
ON public.leads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
ON public.leads FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
ON public.leads FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for interactions (user-scoped)
CREATE POLICY "Users can view their own interactions"
ON public.interactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
ON public.interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
ON public.interactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
ON public.interactions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for tasks (user-scoped)
CREATE POLICY "Users can view their own tasks"
ON public.tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.tasks FOR DELETE
USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nurture_tracks_updated_at
BEFORE UPDATE ON public.nurture_tracks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update last_touch_at when interaction is created
CREATE OR REPLACE FUNCTION public.update_lead_last_touch()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.leads
  SET last_touch_at = NEW.created_at
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_lead_last_touch_on_interaction
AFTER INSERT ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.update_lead_last_touch();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for leads and tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
