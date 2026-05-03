# Plano de Correções de Curto Prazo

Foco: resolver os 5 itens "Curto prazo" da auditoria sem mudanças de banco de dados.

## 1. Extrair `useLeadEnrichment`

**Novo:** `src/hooks/useLeadEnrichment.ts`

Centraliza o cálculo derivado por lead (hoje espalhado dentro de `LeadCard`):
- `resolvedStage = mapLegacyStage(lead.stage)`
- `currentStage` (de `ACENDER_STAGES`)
- `guidance` (de `STAGE_GUIDANCE`)
- `score` (via `buildLeadContext` + `calculateLeadScore`)
- `nextStageLabel`

Retorna um objeto memoizado por `lead.id + lead.updated_at`.

**Modificar:** `src/components/leads/LeadCard.tsx` para consumir o hook e ficar puramente apresentacional (sem importar `nba-engine`, `lead-scoring` ou `mapLegacyStage` direto).

## 2. `useScriptsByStages` (batch)

**Novo:** `src/hooks/useScriptsByStages.ts`

- Recebe `stages: AcenderStage[]` (deduplicados) e faz **uma única query** `scripts.select().in('stage', stages)`.
- Retorna `Map<stage, Script[]>` via TanStack Query (cache compartilhado).
- Mantém `useScripts(stage)` existente como wrapper fino que lê do mesmo cache key, para retrocompatibilidade.

**Modificar:** containers que renderizam listas de `LeadCard` (`Proximos.tsx`, `Leads.tsx`, `KanbanBoard.tsx`, `LeadListView.tsx`) — pré-carregam `useScriptsByStages` com os stages distintos da lista.

**Modificar:** `LeadCard.tsx` — opcionalmente aceita `scripts?: Script[]` via prop; se vier, pula o `useScripts` interno (elimina N+1 de fato; sem prop, mantém comportamento atual).

## 3. Badge "Playbook customizado" vs "Roteiro padrão ACENDER" no SalesCoachCard

**Modificar:** `supabase/functions/sales-coach/index.ts` — incluir no JSON de resposta o campo `playbook_source: 'custom' | 'default'` (já temos a info da query de playbooks na função).

**Modificar:** `src/hooks/useSalesCoach.ts` — tipar `SalesCoachRecommendation` com `playbook_source`.

**Modificar:** `src/components/leads/SalesCoachCard.tsx` — renderizar `<Badge>` discreto ao lado do título:
- `custom` → "Playbook customizado" (variant `default`)
- `default` → "Roteiro ACENDER padrão" (variant `outline`)

## 4. Smoke tests de UI

**Novo:**
- `src/components/leads/__tests__/LeadCard.test.tsx` — renderiza com lead mock, verifica nome, badge da etapa, score visível, botão WhatsApp presente.
- `src/components/ui/__tests__/EmptyState.test.tsx` — renderiza título/descrição/CTA opcional.
- `src/components/layout/__tests__/BottomNav.test.tsx` — renderiza links de navegação principais (envolto em `MemoryRouter`).

Usa stack já configurada (Vitest + Testing Library + jsdom). Mocks mínimos para hooks de dados (TanStack Query wrapper + `vi.mock` de `useScripts`).

## 5. Onboarding admin em /playbooks

**Modificar:** `src/pages/Playbooks.tsx`

- Detecta primeiro acesso via `localStorage.getItem('playbooks_onboarding_seen')`.
- Se admin (já temos `useUserRole`) e não visto → abre `<Dialog>` com 3 passos:
  1. "O que é um Playbook" (descrição + exemplo)
  2. "Como a IA usa" (explica grounding no Coach)
  3. "Criar seu primeiro" (CTA que abre `PlaybookFormModal`)
- Marca `localStorage` ao fechar.

Não-admins não veem o modal.

---

## Arquivos

**Criar (5):**
- `src/hooks/useLeadEnrichment.ts`
- `src/hooks/useScriptsByStages.ts`
- `src/components/leads/__tests__/LeadCard.test.tsx`
- `src/components/ui/__tests__/EmptyState.test.tsx`
- `src/components/layout/__tests__/BottomNav.test.tsx`

**Modificar (7):**
- `src/components/leads/LeadCard.tsx` (consome hook + aceita scripts via prop)
- `src/hooks/useScripts.ts` (compatível com cache batch)
- `src/pages/Proximos.tsx`, `src/pages/Leads.tsx`, `src/components/leads/KanbanBoard.tsx`, `src/components/leads/LeadListView.tsx` (pré-fetch batch)
- `supabase/functions/sales-coach/index.ts` (retorna `playbook_source`)
- `src/hooks/useSalesCoach.ts` (tipo)
- `src/components/leads/SalesCoachCard.tsx` (badge)
- `src/pages/Playbooks.tsx` (modal de onboarding)

**Banco de dados:** sem alterações.

## Critérios de aceite

- `LeadCard` não importa mais `@/domain/*` nem `mapLegacyStage` diretamente.
- Lista com N leads dispara **1** query a `scripts` (verificável no Network).
- Coach mostra badge da fonte do roteiro.
- `vitest run` passa todos os testes (25 domain + 3 UI novos).
- Admin vê modal de onboarding na 1ª visita a `/playbooks`; não reabre depois.

Aprovar para eu implementar?
