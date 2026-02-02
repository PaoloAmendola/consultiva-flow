-- Create trigger to automatically update last_touch_at when interactions are created
CREATE TRIGGER on_interaction_created
AFTER INSERT ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION update_lead_last_touch();