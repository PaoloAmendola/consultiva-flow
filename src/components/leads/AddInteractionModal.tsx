import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateInteraction } from '@/hooks/useInteractions';
import { useAssets } from '@/hooks/useAssets';
import { InteractionType, InteractionDirection } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

const interactionSchema = z.object({
  type: z.enum([
    'WHATSAPP_IN', 'WHATSAPP_OUT', 'LIGACAO_IN', 'LIGACAO_OUT',
    'EMAIL_IN', 'EMAIL_OUT', 'VISITA', 'REUNIAO', 'MUDANCA_ETAPA', 'NOTA'
  ] as const),
  direction: z.enum(['IN', 'OUT'] as const),
  content: z.string().optional(),
  asset_sent: z.string().optional(),
});

type InteractionFormData = z.infer<typeof interactionSchema>;

interface AddInteractionModalProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INTERACTION_OPTIONS = [
  { value: 'WHATSAPP_OUT', label: 'WhatsApp enviado', direction: 'OUT' },
  { value: 'WHATSAPP_IN', label: 'WhatsApp recebido', direction: 'IN' },
  { value: 'LIGACAO_OUT', label: 'Ligação feita', direction: 'OUT' },
  { value: 'LIGACAO_IN', label: 'Ligação recebida', direction: 'IN' },
  { value: 'EMAIL_OUT', label: 'Email enviado', direction: 'OUT' },
  { value: 'EMAIL_IN', label: 'Email recebido', direction: 'IN' },
  { value: 'VISITA', label: 'Visita realizada', direction: 'OUT' },
  { value: 'REUNIAO', label: 'Reunião', direction: 'OUT' },
  { value: 'NOTA', label: 'Nota interna', direction: 'OUT' },
] as const;

export function AddInteractionModal({ leadId, open, onOpenChange }: AddInteractionModalProps) {
  const createInteraction = useCreateInteraction();
  const { data: assets, isLoading: assetsLoading } = useAssets();

  const form = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: 'WHATSAPP_OUT',
      direction: 'OUT',
      content: '',
      asset_sent: '',
    },
  });

  const handleTypeChange = (type: string) => {
    const option = INTERACTION_OPTIONS.find(o => o.value === type);
    if (option) {
      form.setValue('type', type as InteractionType);
      form.setValue('direction', option.direction as InteractionDirection);
    }
  };

  const onSubmit = async (data: InteractionFormData) => {
    try {
      await createInteraction.mutateAsync({
        lead_id: leadId,
        type: data.type,
        direction: data.direction,
        content: data.content || null,
        asset_sent: data.asset_sent === 'none' ? null : (data.asset_sent || null),
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Interação</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Interação</FormLabel>
                  <Select onValueChange={handleTypeChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INTERACTION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo / Resumo</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="O que foi conversado ou observado..."
                      className="resize-none min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="asset_sent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Enviado (opcional)</FormLabel>
                  <FormControl>
                    {assetsLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {assets?.map((asset) => (
                            <SelectItem key={asset.id} value={asset.code}>
                              {asset.code} - {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createInteraction.isPending}
              >
                {createInteraction.isPending ? 'Salvando...' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}