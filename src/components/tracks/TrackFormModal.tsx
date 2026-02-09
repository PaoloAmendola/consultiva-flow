import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DbNurtureTrack, LeadType, NurtureStep, ActionType, ACTION_TYPE_CONFIG } from '@/types/database';
import { TrackInput } from '@/hooks/useNurtureTrackMutations';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: DbNurtureTrack | null;
  onSubmit: (data: TrackInput) => void;
  isPending: boolean;
}

const ACTION_TYPES = Object.keys(ACTION_TYPE_CONFIG) as ActionType[];

const emptyStep = (): NurtureStep => ({ day: 0, message: '', action_type: 'WHATSAPP' });

export function TrackFormModal({ open, onOpenChange, track, onSubmit, isPending }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadType, setLeadType] = useState<LeadType>('PROFISSIONAL');
  const [steps, setSteps] = useState<NurtureStep[]>([emptyStep()]);

  useEffect(() => {
    if (track) {
      setName(track.name);
      setDescription(track.description || '');
      setLeadType(track.lead_type);
      setSteps(track.steps.length > 0 ? track.steps : [emptyStep()]);
    } else {
      setName(''); setDescription(''); setLeadType('PROFISSIONAL');
      setSteps([emptyStep()]);
    }
  }, [track, open]);

  const updateStep = (idx: number, patch: Partial<NurtureStep>) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const addStep = () => {
    const lastDay = steps.length > 0 ? steps[steps.length - 1].day : 0;
    setSteps(prev => [...prev, { ...emptyStep(), day: lastDay + 2 }]);
  };

  const removeStep = (idx: number) => {
    if (steps.length <= 1) return;
    setSteps(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      lead_type: leadType,
      steps: steps.filter(s => s.message.trim()),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{track ? 'Editar Trilha' : 'Nova Trilha'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Trilha de Nutrição..." />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Tipo de Lead *</Label>
            <Select value={leadType} onValueChange={v => setLeadType(v as LeadType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PROFISSIONAL">👤 Profissional</SelectItem>
                <SelectItem value="DISTRIBUIDOR">🏢 Distribuidor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Passos da Trilha</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Passo
              </Button>
            </div>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2 bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">Passo {idx + 1}</span>
                    <div className="flex-1" />
                    {steps.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(idx)} className="h-7 w-7 p-0">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Dia</Label>
                      <Input
                        type="number"
                        min={0}
                        value={step.day}
                        onChange={e => updateStep(idx, { day: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Ação</Label>
                      <Select value={step.action_type} onValueChange={v => updateStep(idx, { action_type: v as ActionType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map(at => (
                            <SelectItem key={at} value={at}>{ACTION_TYPE_CONFIG[at].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Mensagem</Label>
                    <Textarea
                      value={step.message}
                      onChange={e => updateStep(idx, { message: e.target.value })}
                      rows={2}
                      placeholder="Texto da mensagem..."
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Asset ID (opcional)</Label>
                    <Input
                      value={step.asset_id || ''}
                      onChange={e => updateStep(idx, { asset_id: e.target.value || undefined })}
                      placeholder="Código do asset (ex: A1)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? 'Salvando...' : track ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
