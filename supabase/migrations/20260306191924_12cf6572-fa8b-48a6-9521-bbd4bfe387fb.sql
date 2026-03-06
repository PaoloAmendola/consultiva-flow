
CREATE TABLE public.client_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  items TEXT NOT NULL DEFAULT '',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON public.client_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON public.client_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON public.client_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own orders" ON public.client_orders FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_client_orders_updated_at BEFORE UPDATE ON public.client_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
