import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { ACENDER_STAGES } from '@/types/database';
import type { Playbook } from '@/hooks/usePlaybooks';
import { useCreatePlaybook, useUpdatePlaybook, type PlaybookInput } from '@/hooks/usePlaybookMutations';

interface Props {
  open: boolean;
  onClose: () => void;
  playbook?: Playbook | null;
}

const empty: PlaybookInput = {
  stage: 'ATRACAO',
  lead_type: 'PROFISSIONAL',
  title: '',
  description: '',
  objectives: [],
  key_questions: [],
  scripts: [],
  objection_handlers: [],
  success_criteria: [],
  next_stage_trigger: '',
  sort_order: 0,
};

export function PlaybookFormModal({ open, onClose, playbook }: Props) {
  const [form, setForm] = useState<PlaybookInput>(empty);
  const create = useCreatePlaybook();
  const update = useUpdatePlaybook();

  useEffect(() => {
    if (playbook) {
      setForm({
        stage: playbook.stage,
        lead_type: playbook.lead_type,
        title: playbook.title,
        description: playbook.description ?? '',
        objectives: playbook.objectives ?? [],
        key_questions: playbook.key_questions ?? [],
        scripts: playbook.scripts ?? [],
        objection_handlers: playbook.objection_handlers ?? [],
        success_criteria: playbook.success_criteria ?? [],
        next_stage_trigger: playbook.next_stage_trigger ?? '',
        sort_order: playbook.sort_order ?? 0,
      });
    } else {
      setForm(empty);
    }
  }, [playbook, open]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (playbook) {
      await update.mutateAsync({ id: playbook.id, ...form });
    } else {
      await create.mutateAsync(form);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{playbook ? 'Editar Playbook' : 'Novo Playbook'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Etapa</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACENDER_STAGES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Lead</Label>
              <Select value={form.lead_type} onValueChange={(v) => setForm({ ...form, lead_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROFISSIONAL">Profissional</SelectItem>
                  <SelectItem value="DISTRIBUIDOR">Distribuidor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={120}
              placeholder="Ex: Atração - Profissional"
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              rows={2}
            />
          </div>

          <ListEditor
            label="Objetivos"
            placeholder="Ex: Confirmar perfil B2B"
            items={form.objectives ?? []}
            onChange={(items) => setForm({ ...form, objectives: items })}
          />

          <ListEditor
            label="Perguntas-chave"
            placeholder="Ex: Você atende em salão próprio?"
            items={form.key_questions ?? []}
            onChange={(items) => setForm({ ...form, key_questions: items })}
          />

          <ScriptsEditor
            scripts={form.scripts ?? []}
            onChange={(scripts) => setForm({ ...form, scripts })}
          />

          <ObjectionsEditor
            handlers={form.objection_handlers ?? []}
            onChange={(handlers) => setForm({ ...form, objection_handlers: handlers })}
          />

          <ListEditor
            label="Critérios de sucesso"
            placeholder="Ex: Lead confirmou perfil"
            items={form.success_criteria ?? []}
            onChange={(items) => setForm({ ...form, success_criteria: items })}
          />

          <div>
            <Label>Trigger para próxima etapa</Label>
            <Input
              value={form.next_stage_trigger ?? ''}
              onChange={(e) => setForm({ ...form, next_stage_trigger: e.target.value })}
              maxLength={200}
              placeholder="Ex: Lead respondeu confirmando interesse"
            />
          </div>

          <div>
            <Label>Ordem</Label>
            <Input
              type="number"
              value={form.sort_order ?? 0}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              className="w-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={!form.title.trim() || create.isPending || update.isPending}
          >
            {playbook ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListEditor({
  label, placeholder, items, onChange,
}: { label: string; placeholder: string; items: string[]; onChange: (items: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    if (!input.trim()) return;
    onChange([...items, input.trim()]);
    setInput('');
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <Button type="button" size="icon" variant="outline" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {items.map((item, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              <span className="max-w-[200px] truncate">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ScriptsEditor({
  scripts, onChange,
}: { scripts: { label: string; content: string }[]; onChange: (s: { label: string; content: string }[]) => void }) {
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const add = () => {
    if (!content.trim()) return;
    onChange([...scripts, { label: label.trim() || 'Script', content: content.trim() }]);
    setLabel(''); setContent('');
  };
  return (
    <div>
      <Label>Scripts</Label>
      <div className="space-y-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rótulo (ex: Abertura)" maxLength={50} />
        <div className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Conteúdo do script (use {nome} para personalizar)"
            rows={2}
            maxLength={500}
          />
          <Button type="button" size="icon" variant="outline" onClick={add}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {scripts.length > 0 && (
        <div className="space-y-2 mt-2">
          {scripts.map((s, i) => (
            <div key={i} className="bg-muted/50 rounded p-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className="text-sm">{s.content}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange(scripts.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ObjectionsEditor({
  handlers, onChange,
}: { handlers: { objection: string; response: string }[]; onChange: (h: { objection: string; response: string }[]) => void }) {
  const [objection, setObjection] = useState('');
  const [response, setResponse] = useState('');
  const add = () => {
    if (!objection.trim() || !response.trim()) return;
    onChange([...handlers, { objection: objection.trim(), response: response.trim() }]);
    setObjection(''); setResponse('');
  };
  return (
    <div>
      <Label>Objeções e Respostas</Label>
      <div className="space-y-2">
        <Input value={objection} onChange={(e) => setObjection(e.target.value)} placeholder="Objeção do cliente" maxLength={200} />
        <div className="flex gap-2">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Como responder"
            rows={2}
            maxLength={500}
          />
          <Button type="button" size="icon" variant="outline" onClick={add}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {handlers.length > 0 && (
        <div className="space-y-2 mt-2">
          {handlers.map((h, i) => (
            <div key={i} className="bg-muted/50 rounded p-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-destructive/80">"{h.objection}"</p>
                <p className="text-sm text-muted-foreground">→ {h.response}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange(handlers.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
