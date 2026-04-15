import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Target, HelpCircle, MessageSquare, FileText, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { ACENDER_STAGES, getStageLabel } from '@/types/database';
import { cn } from '@/lib/utils';

const Playbooks = () => {
  const [selectedType, setSelectedType] = useState('PROFISSIONAL');
  const { data: playbooks, isLoading } = usePlaybooks(undefined, selectedType);

  const stages = ACENDER_STAGES;

  return (
    <DashboardLayout title="Playbooks" subtitle="Roteiros comerciais por etapa">
      <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-4">
        <TabsList>
          <TabsTrigger value="PROFISSIONAL">Profissional</TabsTrigger>
          <TabsTrigger value="DISTRIBUIDOR">Distribuidor</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : !playbooks || playbooks.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={BookOpen}
            title="Nenhum playbook cadastrado"
            description="Os playbooks são roteiros consultivos para cada etapa do pipeline. Use os roteiros padrão do ACENDER® abaixo."
          />
          {/* Show default ACENDER guidance as fallback playbooks */}
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
                      <PlaybookItem key={pb.id} playbook={pb} />
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

function PlaybookItem({ playbook }: { playbook: any }) {
  return (
    <AccordionItem value={playbook.id}>
      <AccordionTrigger className="text-sm font-medium hover:no-underline">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          {playbook.title}
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        {playbook.description && (
          <p className="text-sm text-muted-foreground">{playbook.description}</p>
        )}

        {playbook.objectives?.length > 0 && (
          <Section icon={<Target className="h-4 w-4" />} title="Objetivos">
            <ul className="space-y-1">
              {playbook.objectives.map((o: string, i: number) => (
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
              {playbook.key_questions.map((q: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground">• {q}</li>
              ))}
            </ul>
          </Section>
        )}

        {playbook.scripts?.length > 0 && (
          <Section icon={<MessageSquare className="h-4 w-4" />} title="Scripts">
            {playbook.scripts.map((s: any, i: number) => (
              <div key={i} className="bg-muted/50 rounded-lg p-3 mb-2">
                {s.label && <p className="text-xs font-medium text-muted-foreground mb-1">{s.label}</p>}
                <p className="text-sm">{s.content}</p>
              </div>
            ))}
          </Section>
        )}

        {playbook.objection_handlers?.length > 0 && (
          <Section icon={<Shield className="h-4 w-4" />} title="Objeções">
            {playbook.objection_handlers.map((o: any, i: number) => (
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
  const STAGE_GUIDANCE_IMPORT = require('@/types/database').STAGE_GUIDANCE;

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
                  {guidance.scripts.map((s: string, i: number) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-2.5 mb-1.5 text-sm">{s}</div>
                  ))}
                </div>
              )}
              {guidance.objections.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Objeções Comuns</p>
                  <div className="flex flex-wrap gap-1.5">
                    {guidance.objections.map((o: string, i: number) => (
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
