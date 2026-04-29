
# Auditoria + Plano de Correção e Melhorias

## ✅ O que JÁ foi feito (do plano original)

| Item | Status | Evidência |
|------|--------|-----------|
| Camada de domínio `src/domain/` | ✅ Completo | `nba-rules.ts`, `nba-engine.ts`, `stage-transitions.ts`, `lead-scoring.ts` |
| Regras NBA declarativas | ✅ Completo | Array `NBA_RULES` em `nba-rules.ts` |
| Testes unitários do domain | ✅ Completo | 3 arquivos em `src/domain/__tests__/` |
| `EmptyState` / `ErrorState` / `LoadingSkeleton` | ✅ Criados | `src/components/ui/` |
| `useLeads` aponta para domain | ✅ Completo | importa de `@/domain/nba-engine` |
| `Index.handleMarkDone` extraído | ✅ Completo | usa `getDefaultNextAction()` |
| `lib/nba-engine.ts` deprecado | ✅ Re-export apenas |
| Score operacional no card | ✅ Mini-barra + número visíveis |
| Features extras (fora do escopo original) | ✅ Dashboard `/gerencial`, `/playbooks`, AI analytics, sales-coach com playbooks |

## ⚠️ Pendências e inconsistências encontradas

### 1. Visual dos cards — plano cumprido pela METADE
- `index.css` ainda mantém classes `action-card-urgent/warning/normal` (linhas 132-142).
- `LeadCard.tsx` (linhas 38-40, 65) **ainda aplica essas classes** via `priorityClass`.
- O dot de prioridade já existe (linhas 71-77), mas a "remoção da borda lateral pesada" do plano nunca foi feita — apenas trocada por `ring`. O resultado é OK, mas há **redundância visual**: dot + ring + badge P1 + barra de score, tudo competindo. Plano pedia algo mais sutil.

### 2. Testes — base existe mas há lacunas
- `src/test/example.test.ts` ainda é o stub `expect(true).toBe(true)` — deve ser removido.
- Não há testes para `lead-scoring.ts` apesar do arquivo de domínio existir.
- Nenhum teste de componente (LeadCard, EmptyState, etc).

### 3. Páginas usando Skeleton bruto em vez de `LoadingSkeleton`
- `Clientes.tsx` (linhas 292-293): usa `<Skeleton>` direto.
- `Proximos.tsx` (linhas 184, 218): blocos manuais de Skeleton.
- `LeadProfile.tsx` (linhas 79-80, 320): Skeletons soltos.
- Todos deveriam usar `LoadingSkeleton variant="..."`.

### 4. ErrorState com `window.location.reload()` em vez de `refetch`
- `Trilhas.tsx`, `Assets.tsx`, `Clientes.tsx`, `Leads.tsx`, `Proximos.tsx` recarregam a página inteira em erro. Apenas `Index.tsx` e `Gerencial.tsx` usam `refetch()`. Recarregar perde estado/UX.

### 5. `useLeads.ts` aceita filtro `priority` mas a query Supabase aplica em coluna que pode não ter índice — risco de scan sequencial em volumes altos. Não é bug, é nota.

### 6. EmptyState não usado em todas as páginas
- `Leads.tsx`, `Clientes.tsx`, `Trilhas.tsx`, `Assets.tsx`, `Proximos.tsx` provavelmente têm renderização ad-hoc para "lista vazia" — preciso confirmar e padronizar.

### 7. Lógica de negócio ainda dispersa
- `LeadCard.tsx` faz `mapLegacyStage`, `STAGE_GUIDANCE[...]`, `buildLeadContext` e `calculateLeadScore` no próprio render — deveria receber pronto via `EnrichedLead` ou um hook `useLeadEnrichment`. O plano pediu "remover lógica de resolução de stage/guidance — receber já resolvido via props ou hook" e isso **não foi feito**.

### 8. `useScripts(resolvedStage)` chamado dentro de cada `LeadCard` — N+1 de queries em listas grandes. Deve ser movido para o nível da lista (hook único) e passado para baixo.

### 9. Acessibilidade do BottomNav
- `nav-item` está em CSS mas o `<Link>` deveria ter `aria-label` mais descritivo em alguns ícones; OK parcial.

### 10. Edge function `sales-coach` consulta playbook, mas não há fallback claro em UI quando playbook não existe — `useSalesCoach` precisa ser verificado.

---

## 🔧 Plano de Correção

### Fase 1 — Limpar visual dos cards (alinhar com plano original)
- Em `src/index.css`: remover `.action-card-warning` e `.action-card-normal` (manter só `.action-card` e `.action-card-urgent` com `ring` sutil).
- Em `LeadCard.tsx`: 
  - Remover variável `priorityClass`; aplicar `ring-1 ring-destructive/30` apenas para P1.
  - Remover badge "P1/P2/P3" redundante (o dot + ring já comunicam) — manter só o dot e a mini-barra de score.
  - Compactar header: dot + nome + stage badge em uma linha; score discreto à direita.

### Fase 2 — Padronizar estados em todas as páginas
- Substituir Skeletons soltos por `<LoadingSkeleton variant="..." />` em:
  - `Clientes.tsx`, `Proximos.tsx`, `LeadProfile.tsx`.
- Trocar `window.location.reload()` por `refetch()` (e expor `refetch` do hook quando faltar) em:
  - `Trilhas.tsx`, `Assets.tsx`, `Clientes.tsx`, `Leads.tsx`, `Proximos.tsx`.
- Adicionar `<EmptyState>` consistente onde houver "nenhum X encontrado" ad-hoc nas mesmas páginas.

### Fase 3 — Extrair lógica do LeadCard
- Criar `src/hooks/useLeadEnrichment.ts` que recebe lead e retorna `{ stage, guidance, score, scripts }`. 
- Mover N+1 de `useScripts` para nível superior: novo hook `useScriptsByStages(stages: string[])` chamado uma vez no container (Index/Proximos/Leads), distribuindo via prop.
- `LeadCard` passa a ser apresentacional puro.

### Fase 4 — Limpar testes
- Deletar `src/test/example.test.ts`.
- Criar `src/domain/__tests__/lead-scoring.test.ts` cobrindo: urgência 0 quando não overdue, potencial cresce com stage, delay capa em 168h, total ponderado.
- Adicionar 1 teste de smoke para `LeadCard` (renderiza nome + score).

### Fase 5 — Pequenas melhorias operacionais
- `useSalesCoach`: garantir mensagem clara quando playbook não existe ("Usando roteiro padrão ACENDER").
- BottomNav: 5 itens hoje (Agora, Leads, Clientes, Gerencial, Playbooks) — verificar se cabe bem em 360px; se apertado, agrupar Gerencial+Playbooks em "Mais" com sheet.
- Garantir `refetch` exposto em todos os hooks de listagem (já vem do React Query, só usar nas páginas).

### Fase 6 — QA manual no preview
- Login → percorrer Agora, Leads, Clientes, Gerencial, Playbooks no viewport mobile.
- Validar: estados vazio/erro/loading consistentes, cards menos ruidosos, sem reload em erro.

---

## Arquivos afetados

| Ação | Arquivo |
|------|---------|
| Modificar | `src/index.css` (remover classes warning/normal) |
| Modificar | `src/components/leads/LeadCard.tsx` (visual + extrair lógica) |
| Criar | `src/hooks/useLeadEnrichment.ts` |
| Criar | `src/hooks/useScriptsByStages.ts` (ou estender `useScripts`) |
| Modificar | `src/pages/Clientes.tsx` (LoadingSkeleton + refetch + EmptyState) |
| Modificar | `src/pages/Proximos.tsx` (idem) |
| Modificar | `src/pages/Leads.tsx` (refetch + EmptyState) |
| Modificar | `src/pages/Trilhas.tsx` (refetch) |
| Modificar | `src/pages/Assets.tsx` (refetch) |
| Modificar | `src/pages/LeadProfile.tsx` (LoadingSkeleton) |
| Deletar | `src/test/example.test.ts` |
| Criar | `src/domain/__tests__/lead-scoring.test.ts` |
| Modificar | `src/components/leads/SalesCoachCard.tsx` (label fallback playbook) |

---

## Fora de escopo
- Mudanças no schema do banco.
- Novas features (nenhuma); apenas consolidação/correção.
- Refatoração de KanbanBoard / LeadListView (próxima onda).
