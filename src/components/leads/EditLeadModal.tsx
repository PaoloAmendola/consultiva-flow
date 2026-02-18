import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useUpdateLead } from '@/hooks/useLeads';
import { useNurtureTracks } from '@/hooks/useNurtureTracks';
import { EnrichedLead } from '@/hooks/useLeads';
import { 
  LeadOrigin, 
  LeadPriority,
  ActionType,
  ORIGIN_LABELS,
  ACTION_TYPE_CONFIG,
  PRIORITY_CONFIG,
  ACENDER_STAGES,
} from '@/types/database';

const editLeadSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  company: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  lead_type: z.enum(['PROFISSIONAL', 'DISTRIBUIDOR', 'NAO_QUALIFICADO'] as const),
  origin: z.enum([
    'NUVEMSHOP', 'INSTAGRAM', 'GOOGLE', 'WHATSAPP', 
    'TELEFONE', 'INDICACAO', 'PRESENCIAL_EMPRESA', 'VISITA_SALAO'
  ] as const),
  stage: z.string(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4'] as const),
  status_final: z.enum(['ATIVO', 'CONVERTIDO', 'PERDIDO', 'FORA_PERFIL'] as const),
  nurture_track_id: z.string().optional(),
  next_action_type: z.enum([
    'WHATSAPP', 'LIGACAO', 'EMAIL', 'VISITA', 'REUNIAO',
    'ENVIAR_MATERIAL', 'ENVIAR_PROPOSTA', 'FOLLOW_UP', 'DEMONSTRACAO'
  ] as const),
  next_action_at: z.string().min(1, 'Data da próxima ação é obrigatória'),
  next_action_note: z.string().optional(),
  observations: z.string().optional(),
});

type EditLeadFormData = z.infer<typeof editLeadSchema>;

interface EditLeadModalProps {
  lead: EnrichedLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_FINAL_OPTIONS = [
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'CONVERTIDO', label: 'Convertido' },
  { value: 'PERDIDO', label: 'Perdido' },
  { value: 'FORA_PERFIL', label: 'Fora do Perfil' },
];

export function EditLeadModal({ lead, open, onOpenChange }: EditLeadModalProps) {
  const updateLead = useUpdateLead();
  const { data: nurtureTracks } = useNurtureTracks();

  const form = useForm<EditLeadFormData>({
    resolver: zodResolver(editLeadSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      company: '',
      city: '',
      state: '',
      lead_type: 'PROFISSIONAL',
      origin: 'INSTAGRAM',
      stage: 'ATRACAO',
      priority: 'P3',
      status_final: 'ATIVO',
      nurture_track_id: '',
      next_action_type: 'WHATSAPP',
      next_action_at: '',
      next_action_note: '',
      observations: '',
    },
  });

  // Update form when lead changes
  useEffect(() => {
    if (lead) {
      form.reset({
        name: lead.name,
        phone: lead.phone,
        email: lead.email || '',
        company: lead.company || '',
        city: lead.city || '',
        state: lead.state || '',
        lead_type: lead.lead_type,
        origin: lead.origin,
        stage: lead.stage,
        priority: lead.priority,
        status_final: lead.status_final,
        nurture_track_id: lead.nurture_track_id || '',
        next_action_type: lead.next_action_type,
        next_action_at: new Date(lead.next_action_at).toISOString().slice(0, 16),
        next_action_note: lead.next_action_note || '',
        observations: lead.observations || '',
      });
    }
  }, [lead, form]);

  const stages = ACENDER_STAGES;
  const filteredTracks = nurtureTracks || [];

  const onSubmit = async (data: EditLeadFormData) => {
    if (!lead) return;

    try {
      await updateLead.mutateAsync({
        id: lead.id,
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          company: data.company || null,
          city: data.city || null,
          state: data.state || null,
          lead_type: data.lead_type,
          origin: data.origin,
          stage: data.stage,
          priority: data.priority,
          status_final: data.status_final,
          nurture_track_id: data.nurture_track_id === 'none' ? null : (data.nurture_track_id || null),
          nurture_step: data.nurture_track_id !== lead.nurture_track_id ? 0 : undefined,
          next_action_type: data.next_action_type,
          next_action_at: new Date(data.next_action_at).toISOString(),
          next_action_note: data.next_action_note || null,
          observations: data.observations || null,
        },
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do lead" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input placeholder="11999999999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="UF" maxLength={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Classification */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lead_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PROFISSIONAL">Profissional</SelectItem>
                        <SelectItem value="DISTRIBUIDOR">Distribuidor</SelectItem>
                        <SelectItem value="NAO_QUALIFICADO">Não Qualificado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.entries(ORIGIN_LABELS) as [LeadOrigin, string][]).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.entries(PRIORITY_CONFIG) as [LeadPriority, { label: string }][]).map(([value, config]) => (
                          <SelectItem key={value} value={value}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status_final"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_FINAL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nurture_track_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trilha de Nutrição</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma trilha" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {filteredTracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Next Action */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-3">Próxima Ação</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="next_action_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Ação *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(Object.entries(ACTION_TYPE_CONFIG) as [ActionType, { label: string }][]).map(([value, config]) => (
                            <SelectItem key={value} value={value}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_action_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data/Hora *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="next_action_note"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>O que fazer?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva a ação a ser realizada..."
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notas gerais sobre o lead..."
                      className="resize-none"
                      {...field} 
                    />
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
                disabled={updateLead.isPending}
              >
                {updateLead.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}