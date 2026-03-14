import { useState } from 'react';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Plus } from 'lucide-react';
import { useCreateLead } from '@/hooks/useLeads';
import { 
  LeadType, 
  LeadOrigin, 
  ActionType,
  ORIGIN_LABELS,
  ACTION_TYPE_CONFIG,
  ACENDER_STAGES,
} from '@/types/database';

const leadSchema = z.object({
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
  stage: z.string().optional(),
  next_action_type: z.enum([
    'WHATSAPP', 'LIGACAO', 'EMAIL', 'VISITA', 'REUNIAO',
    'ENVIAR_MATERIAL', 'ENVIAR_PROPOSTA', 'FOLLOW_UP', 'DEMONSTRACAO'
  ] as const),
  next_action_at: z.string().min(1, 'Data da próxima ação é obrigatória'),
  next_action_note: z.string().optional(),
  observations: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface CreateLeadFormProps {
  trigger?: React.ReactNode;
}

export function CreateLeadForm({ trigger }: CreateLeadFormProps) {
  const [open, setOpen] = useState(false);
  const createLead = useCreateLead();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
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
      next_action_type: 'WHATSAPP',
      next_action_at: new Date().toISOString().slice(0, 16),
      next_action_note: '',
      observations: '',
    },
  });

  const stages = ACENDER_STAGES;

  const onSubmit = async (data: LeadFormData) => {
    try {
      await createLead.mutateAsync({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        company: data.company || null,
        city: data.city || null,
        state: data.state || null,
        lead_type: data.lead_type,
        origin: data.origin,
        stage: data.stage || 'ATRACAO',
        next_action_type: data.next_action_type,
        next_action_at: new Date(data.next_action_at).toISOString(),
        next_action_note: data.next_action_note || null,
        observations: data.observations || null,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Novo Lead</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do lead" className="h-11" {...field} />
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
                      <Input placeholder="11999999999" className="h-11" inputMode="tel" {...field} />
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
                      <Input placeholder="email@exemplo.com" type="email" className="h-11" inputMode="email" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Next Action - Required */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-3">Próxima Ação (Obrigatório)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="next_action_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Ação *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createLead.isPending}
              >
                {createLead.isPending ? 'Criando...' : 'Criar Lead'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
