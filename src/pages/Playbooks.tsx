import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePlaybooks, type Playbook } from '@/hooks/usePlaybooks';
import { useDeletePlaybook } from '@/hooks/usePlaybookMutations';
import { useIsAdmin } from '@/hooks/useUserRole';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { BookOpen, Target, HelpCircle, MessageSquare, Shield, CheckCircle, ArrowRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { ACENDER_STAGES, STAGE_GUIDANCE } from '@/types/database';
import { cn } from '@/lib/utils';
import { PlaybookFormModal } from '@/components/playbooks/PlaybookFormModal';

const Playbooks = () => {
  const [selectedType, setSelectedType] = useState('PROFISSIONAL');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Playbook | null>(null);
  const { data: playbooks, isLoading } = usePlaybooks(undefined, selectedType);
  const isAdmin = useIsAdmin();
  const deletePb = useDeletePlaybook();

  const stages = ACENDER_STAGES;

  const openNew = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (pb: Playbook) => { setEditing(pb); setEditorOpen(true); };

  return (
    <DashboardLayout title="Playbooks" subtitle="Roteiros comerciais por etapa">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList>
            <TabsTrigger value="PROFISSIONAL">Profissional</TabsTrigger>
            <TabsTrigger value="DISTRIBUIDOR">Distribuidor</TabsTrigger>
          </TabsList>
        </Tabs>

        {isAdmin && (
          <Button onClick={openNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Playbook
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : !playbooks || playbooks.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={BookOpen}
            title="Nenhum playbook cadastrado"
            description={isAdmin
              ? 'Crie um playbook customizado ou use os roteiros padrão ACENDER® abaixo.'
              : 'Os playbooks são roteiros consultivos para cada etapa do pipeline. Use os roteiros padrão do ACENDER® abaixo.'}
            action={isAdmin ? (
              <Button onClick={openNew} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Criar Playbook
              </Button>
            ) : undefined}
          />
          <DefaultPlaybooks />
        </div>
      ) : (
        <div className="space-y-4">
          {stages.map(stage => {
            const stagePlaybooks = playbooks.filter(p => p.stage === stage.value);
            if (stagePlaybooks.length === 0) return null;

            return (
              <Card key={stage.value}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', stage.color)} />
                    {stage.label}
                    <Badge variant="secondary" className="text-[10px]">{stagePlaybooks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {stagePlaybooks.map(pb => (
                      <PlaybookItem
                        key={pb.id}
                        playbook={pb}
                        isAdmin={isAdmin}
                        onEdit={() => openEdit(pb)}
                        onDelete={() => deletePb.mutate(pb.id)}
                      />
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PlaybookFormModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        playbook={editing}
      />
    </DashboardLayout>
  );
};

function PlaybookItem({
  playbook, isAdmin, onEdit, onDelete,
}: { playbook: Playbook; isAdmin: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <AccordionItem value={playbook.id}>
      <AccordionTrigger className="text-sm font-medium hover:no-underline">
        <div className="flex items-center gap-2 flex-1 text-left">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <span className="flex-1">{playbook.title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        {isAdmin && (
          <div className="flex items-center gap-2 -mt-1 mb-1">
            <Button size="sm" variant="outline" className="h-7 gap-1.5" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir playbook?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{playbook.title}" será removido permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {playbook.description && (
          <p className="text-sm text-muted-foreground">{playbook.description}</p>
        )}

        {playbook.objectives?.length > 0 && (
          <Section icon={<Target className="h-4 w-4" />} title="Objetivos">
            <ul className="space-y-1">
              {playbook.objectives.map((o, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                  {o}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {playbook.key_questions?.length > 0 && (
          <Section icon={<HelpCircle className="h-4 w-4" />} title="Perguntas-Chave">
            <ul className="space-y-1">
              {playbook.key_questions.map((q, i) => (
                <li key={i} className="text-sm text-muted-foreground">• {q}</li>
              ))}
            </ul>
          </Section>
        )}

        {playbook.scripts?.length > 0 && (
          <Section icon={<MessageSquare className="h-4 w-4" />} title="Scripts">
            {playbook.scripts.map((s, i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3 mb-2">
                {s.label && <p className="text-xs font-medium text-muted-foreground mb-1">{s.label}</p>}
                <p className="text-sm">{s.content}</p>
              </div>
            ))}
          </Section>
        )}

        {playbook.objection_handlers?.length > 0 && (
          <Section icon={<Shield className="h-4 w-4" />} title="Objeções">
            {playbook.objection_handlers.map((o, i) => (
              <div key={i} className="mb-2">
                <p className="text-sm font-medium text-destructive/80">"{o.objection}"</p>
                <p className="text-sm text-muted-foreground ml-3">→ {o.response}</p>
              </div>
            ))}
          </Section>
        )}

        {playbook.next_stage_trigger && (
          <div className="flex items-center gap-2 pt-2 border-t text-sm">
            <ArrowRight className="h-4 w-4 text-primary" />
            <span className="font-medium">Trigger para avançar:</span>
            <span className="text-muted-foreground">{playbook.next_stage_trigger}</span>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium mb-2">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function DefaultPlaybooks() {
  return (
    <div className="space-y-4">
      {ACENDER_STAGES.map(stage => {
        const guidance = STAGE_GUIDANCE[stage.value];
        if (!guidance) return null;

        return (
          <Card key={stage.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', stage.color)} />
                {stage.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Objetivo</p>
                <p className="text-sm">{guidance.goal}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Instrução</p>
                <p className="text-sm text-muted-foreground">{guidance.instruction}</p>
              </div>
              {guidance.scripts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Scripts</p>
                  {guidance.scripts.map((s, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-2.5 mb-1.5 text-sm">{s}</div>
                  ))}
                </div>
              )}
              {guidance.objections.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Objeções Comuns</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guidance.objections.map((o, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{o}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default Playbooks;
