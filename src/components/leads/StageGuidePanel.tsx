import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ScrollText, Copy, MessageCircle, FileText, AlertTriangle, 
  ArrowRight, ChevronDown, ChevronUp, Target, Edit2, Check, X 
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  STAGE_GUIDANCE, StageGuidanceItem, ACENDER_STAGES, mapLegacyStage 
} from '@/types/database';
import { useScripts, useUpdateScript, useCreateScript, useDeleteScript, DbScript } from '@/hooks/useScripts';
import { EnrichedLead } from '@/hooks/useLeads';

interface StageGuidePanelProps {
  lead: EnrichedLead;
}

export function StageGuidePanel({ lead }: StageGuidePanelProps) {
  const resolvedStage = mapLegacyStage(lead.stage);
  const guidance = STAGE_GUIDANCE[resolvedStage];
  const currentStage = ACENDER_STAGES.find(s => s.value === resolvedStage);
  const { data: scripts } = useScripts(resolvedStage);
  const updateScript = useUpdateScript();
  const createScript = useCreateScript();
  const deleteScript = useDeleteScript();

  const [showScripts, setShowScripts] = useState(true);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showObjections, setShowObjections] = useState(false);
  const [editingScript, setEditingScript] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [addingScript, setAddingScript] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  if (!guidance) return null;

  const firstName = lead.name.split(' ')[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text.replace('{nome}', firstName));
    toast.success('Copiado!');
  };

  const handleWhatsApp = (text: string) => {
    const phone = lead.phone.replace(/\D/g, '');
    const msg = encodeURIComponent(text.replace('{nome}', firstName));
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
  };

  const startEdit = (script: DbScript) => {
    setEditingScript(script.id);
    setEditTitle(script.title);
    setEditContent(script.content);
  };

  const saveEdit = async (id: string) => {
    await updateScript.mutateAsync({ id, data: { title: editTitle, content: editContent } });
    setEditingScript(null);
  };

  const handleAddScript = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    await createScript.mutateAsync({
      stage: resolvedStage,
      title: newTitle,
      content: newContent,
      sort_order: (scripts?.length || 0) + 1,
    });
    setAddingScript(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold', currentStage?.color)}>
            {currentStage?.letter}
          </div>
          <div>
            <CardTitle className="text-sm">Guia: {currentStage?.label}</CardTitle>
            <p className="text-xs text-muted-foreground">{guidance.goal}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Instruction */}
        <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">O que fazer agora</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{guidance.instruction}</p>
        </div>

        {/* Scripts section */}
        <div>
          <button onClick={() => setShowScripts(!showScripts)} className="flex items-center gap-1.5 w-full text-left mb-2">
            <ScrollText className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold flex-1">Scripts prontos</span>
            <Badge variant="secondary" className="text-[10px]">{(scripts?.length || 0) + (guidance.scripts?.length || 0)}</Badge>
            {showScripts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showScripts && (
            <div className="space-y-2">
              {/* DB scripts (editable) */}
              {scripts?.map(script => (
                <div key={script.id} className="bg-secondary/50 rounded-lg p-2.5 border border-border">
                  {editingScript === script.id ? (
                    <div className="space-y-2">
                      <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-7 text-xs" />
                      <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="text-xs min-h-[60px]" />
                      <div className="flex gap-1">
                        <Button size="sm" className="h-6 text-xs" onClick={() => saveEdit(script.id)} disabled={updateScript.isPending}>
                          <Check className="h-3 w-3 mr-1" />Salvar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingScript(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive ml-auto" onClick={() => { deleteScript.mutate(script.id); setEditingScript(null); }}>
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">{script.title}</span>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(script)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(script.content)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600" onClick={() => handleWhatsApp(script.content)}>
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed">{script.content.replace('{nome}', firstName)}</p>
                    </>
                  )}
                </div>
              ))}
              {/* Built-in scripts */}
              {guidance.scripts?.map((script, i) => (
                <div key={`builtin-${i}`} className="bg-muted/50 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Script padrão</span>
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(script)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600" onClick={() => handleWhatsApp(script)}>
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed">{script.replace('{nome}', firstName)}</p>
                </div>
              ))}
              {/* Add new script */}
              {addingScript ? (
                <div className="bg-secondary/50 rounded-lg p-2.5 space-y-2 border border-primary/20">
                  <Input placeholder="Título do script" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-7 text-xs" />
                  <Textarea placeholder="Conteúdo do script (use {nome} para o nome do lead)" value={newContent} onChange={e => setNewContent(e.target.value)} className="text-xs min-h-[60px]" />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-6 text-xs" onClick={handleAddScript} disabled={createScript.isPending}>Salvar</Button>
                    <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setAddingScript(false)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => setAddingScript(true)}>
                  + Novo script
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Materials */}
        <div>
          <button onClick={() => setShowMaterials(!showMaterials)} className="flex items-center gap-1.5 w-full text-left mb-1">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold flex-1">Materiais a enviar</span>
            <Badge variant="secondary" className="text-[10px]">{guidance.whatToSend?.length || 0}</Badge>
            {showMaterials ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showMaterials && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {guidance.whatToSend?.map((item, i) => (
                <Badge key={i} variant="outline" className="text-[10px] font-normal">{item}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Objections */}
        <div>
          <button onClick={() => setShowObjections(!showObjections)} className="flex items-center gap-1.5 w-full text-left mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs font-semibold flex-1">Objeções comuns</span>
            <Badge variant="secondary" className="text-[10px]">{guidance.objections?.length || 0}</Badge>
            {showObjections ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showObjections && (
            <div className="space-y-1 mt-1">
              {guidance.objections?.map((obj, i) => (
                <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-warning">⚠️</span>{obj}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next step */}
        {guidance.nextStage && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
            <span>Próximo passo: <strong className="text-foreground">{guidance.nextStepAction}</strong></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
