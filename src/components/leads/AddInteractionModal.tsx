import { useState } from 'react';
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
import { InteractionType, InteractionDirection } from '@/types/database';

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
        asset_sent: data.asset_sent || null,
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
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        <SelectItem value="A1">A1 - Catálogo Completo</SelectItem>
                        <SelectItem value="A2">A2 - Tabela de Preços</SelectItem>
                        <SelectItem value="A3">A3 - Guia Colorimetria</SelectItem>
                        <SelectItem value="A4">A4 - Vídeo Demo</SelectItem>
                        <SelectItem value="A5">A5 - Cases Sucesso</SelectItem>
                        <SelectItem value="A6">A6 - Lançamentos</SelectItem>
                        <SelectItem value="B1">B1 - Proposta Distribuidor</SelectItem>
                        <SelectItem value="B2">B2 - Manual Distribuidor</SelectItem>
                        <SelectItem value="B3">B3 - Análise Mercado</SelectItem>
                      </SelectContent>
                    </Select>
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