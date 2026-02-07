
# Plano de Melhoria Global do Sales CRM

## 1. Atualizar Documentacao

### 1.1 `.lovable/plan.md` - Substituir conteudo obsoleto
O arquivo ainda contem o plano de correcao dos SelectItem (ja implementado). Substituir por um documento de estado atual do projeto: arquitetura, modulos implementados, status de cada feature, e proximos passos.

### 1.2 `README.md` - Atualizar com estado real
- Adicionar secao sobre Lovable AI Gateway (modelo gemini-3-flash-preview)
- Atualizar a secao de tecnologias para incluir Lovable AI
- Corrigir estrutura de arquivos para refletir os componentes reais (QuickCoachTip, SalesCoachCard, DashboardLayout, etc.)

### 1.3 `CONTRIBUTING.md` - Sincronizar
- Atualizar arvore de diretórios com arquivos atuais
- Adicionar secao sobre o hook `useSalesCoach` e como funciona

---

## 2. Melhorias no Dashboard (Index.tsx)

### 2.1 Metricas mais ricas
O `MetricsCards` atualmente mostra apenas leads acionaveis (proximas 4 horas). Melhorar para incluir:
- **Total de leads ativos** (query separada, nao apenas acionaveis)
- **Taxa de conversao** (convertidos / total)
- Indicadores com setas de tendencia (comparacao visual)

### 2.2 Secao de leads por etapa do pipeline
Adicionar um resumo visual compacto mostrando quantos leads existem em cada etapa do pipeline, como uma barra horizontal segmentada.

---

## 3. Melhorias na Pagina de Leads (Leads.tsx)

### 3.1 Filtros avancados
A pagina de Leads atualmente so tem busca por texto. Adicionar:
- Filtro por **tipo de lead** (Profissional/Distribuidor)
- Filtro por **prioridade** (P1-P4)
- Filtro por **etapa do pipeline**
- Filtro por **status** (Ativo/Convertido/Perdido)

### 3.2 Contador por filtro
Mostrar quantidade de leads por cada filtro ativo.

---

## 4. Melhorias no LeadProfile.tsx

### 4.1 Indicador visual de pipeline
Adicionar uma barra de progresso horizontal mostrando todas as etapas do pipeline com a etapa atual destacada (stepper visual).

### 4.2 Botao de deletar lead
Adicionar opcao para deletar/arquivar lead (ja existe `useDeleteLead` mas nao esta na UI).

### 4.3 Contador de interacoes
Mostrar total de interacoes no header do historico.

---

## 5. Melhorias no NBA Engine (nba-engine.ts)

### 5.1 Regras para novos leads
Adicionar regra: lead NOVO_LEAD sem contato ha 1 hora -> sugerir primeiro WhatsApp com script de boas-vindas.

### 5.2 Mensagens sugeridas por etapa
Adicionar mensagens sugeridas para mais etapas do pipeline (atualmente so cobre Demonstracao e leads sumidos). Incluir:
- QUALIFICADO: script de diagnostico
- PROPOSTA_CONDICAO: script de follow-up
- ATIVACAO: script de boas-vindas pos-venda
- RECORRENCIA: script de recompra

---

## 6. Melhorias no Sales Coach (Edge Function)

### 6.1 Enviar contagem de interacoes
O hook `useSalesCoach` atualmente nao envia `interactions_count` nem `last_interaction_type` (campos que a edge function espera). Corrigir para buscar e enviar esses dados.

### 6.2 Enviar nome da trilha de nutricao
O hook tambem nao envia `nurture_track_name`. Adicionar essa informacao ao contexto.

---

## 7. Melhorias no TaskList.tsx

### 7.1 Mostrar nome do lead nas tarefas do dashboard
Atualmente o TaskList no dashboard nao mostra o nome do lead associado. Criar uma query que faca join ou lookup do nome do lead.

---

## 8. Melhorias na pagina de Assets

### 8.1 Indicador de audiencia
Mostrar badges "Profissional" / "Distribuidor" nos cards de assets indicando para qual tipo de lead o material serve.

---

## Detalhes Tecnicos da Implementacao

### Arquivos a criar:
- Nenhum arquivo novo necessario

### Arquivos a modificar:

| Arquivo | Mudancas |
|---------|----------|
| `.lovable/plan.md` | Reescrever com estado atual do projeto |
| `README.md` | Atualizar tecnologias, estrutura, status |
| `CONTRIBUTING.md` | Sincronizar arvore de arquivos |
| `src/pages/Index.tsx` | Adicionar resumo de pipeline |
| `src/pages/Leads.tsx` | Adicionar filtros avancados por tipo, prioridade, etapa, status |
| `src/pages/LeadProfile.tsx` | Adicionar stepper de pipeline, botao deletar, contador de interacoes |
| `src/components/dashboard/MetricsCards.tsx` | Usar `useActiveLeads` para total real de leads ativos |
| `src/lib/nba-engine.ts` | Adicionar regras e mensagens para NOVO_LEAD, QUALIFICADO, ATIVACAO, RECORRENCIA |
| `src/hooks/useSalesCoach.ts` | Enviar interactions_count, last_interaction_type, nurture_track_name |
| `src/pages/Assets.tsx` | Mostrar badges de audiencia (for_lead_type) |
| `src/components/tasks/TaskList.tsx` | Preparar para mostrar lead name quando disponivel |

### Ordem de implementacao:
1. Documentacao (plan.md, README.md, CONTRIBUTING.md)
2. NBA Engine (novas regras e mensagens)
3. Sales Coach hook (dados de contexto completos)
4. MetricsCards (metricas mais ricas)
5. Leads.tsx (filtros avancados)
6. LeadProfile.tsx (stepper, deletar, contador)
7. Assets.tsx (badges de audiencia)
8. Index.tsx (resumo pipeline)

