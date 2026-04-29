# Estado Atual do App — Auditoria & Roadmap

_Última atualização: 2026-04-29_

---

## 🎯 Visão Geral

**Sales CRM B2B mobile-first** baseado na metodologia **ACENDER®** (Atração → Conexão → Enquadramento → Nutrição → Demonstração → Encerramento → Recorrência), com assistente de vendas via Lovable AI Gateway, playbooks por etapa/perfil, trilhas de nutrição automatizadas e dashboard gerencial.

- Stack: React 18 + Vite + TS + Tailwind + shadcn + TanStack Query + Lovable Cloud (Supabase) + Lovable AI (Gemini).
- Arquitetura: camada de domínio centralizada em `src/domain/` (NBA engine declarativo, scoring, transições de estágio) com 25 testes passando.
- Deploy: Vercel.

---

## ✅ Funcionalidades Operacionais

### Autenticação & Acesso
- ✅ Login/cadastro com email + senha (`/auth`)
- ✅ Rotas protegidas (`ProtectedRoute`)
- ✅ Tabela `user_roles` separada (admin/user) com `has_role()` security definer
- ✅ RLS em todas tabelas (multi-tenant por `user_id` ou somente-leitura para catálogos)

### Pipeline de Leads
- ✅ CRUD completo de leads (criar, editar, listar, deletar)
- ✅ Kanban (desktop) + Tabs/Pills (mobile) por etapa ACENDER
- ✅ Filtros por origem, canal, prioridade, tipo
- ✅ Score operacional 0–100 (urgência + potencial + delay) com mini-barra no card
- ✅ Importação/Exportação CSV (UTF-8 BOM)
- ✅ Triagem obrigatória (origem + canal) e desqualificação automática B2C
- ✅ Histórico automático de mudanças de etapa na timeline

### Próxima Melhor Ação (NBA)
- ✅ Engine declarativo (`src/domain/nba-rules.ts`) — 9 regras (7 stage-specific + 2 cross-stage)
- ✅ Cada lead sempre tem `next_action_type` + `next_action_at`
- ✅ Reordenação dinâmica do Inbox por overdue/today
- ✅ Quick action "Adiar 2h"

### Assistente de IA (Sales Coach)
- ✅ Edge function `sales-coach` com Gemini-1.5-flash via Lovable AI Gateway
- ✅ Grounding em playbooks da etapa+perfil do lead
- ✅ Card no perfil do lead + dica rápida na lista
- ✅ Tracking analytics: `displayed`, `accepted`, `ignored`, canal sugerido vs usado (`ai_analytics`)

### Playbooks Comerciais
- ✅ Tabela `playbooks` populada com **14 entradas** (7 etapas × 2 perfis: PROFISSIONAL/DISTRIBUIDOR)
- ✅ Editor admin em `/playbooks` (CRUD com objetivos, scripts, perguntas, objeções, critérios)
- ✅ Acessível a todos para leitura; somente admins editam

### Trilhas de Nutrição
- ✅ Tabela `nurture_tracks` populada com **7 trilhas** (T1–T7)
- ✅ Editor admin em `/trilhas` (passos com dia, ação, mensagem, asset)
- ✅ Atribuição automática a leads conforme etapa

### Assets / Materiais
- ✅ Tabela `assets` populada com **9 itens** (A1–A6 profissional, B1–B3 distribuidor)
- ✅ Página `/assets` com filtro por tipo de lead
- ✅ Códigos vinculados em scripts e trilhas

### Scripts ACENDER
- ✅ **40 scripts** populados, mapeados por etapa, com variável `{nome}`

### Pós-Venda / LTV
- ✅ Etapa Recorrência com substages D+2 → D+90
- ✅ Conversão automática Encerramento → Recorrência
- ✅ Tabela `client_orders` para registro de pedidos e cálculo de LTV
- ✅ Página `/clientes` com dashboard, alertas de churn (>14 dias), evolução de pedidos, funil de substages

### Dashboard Gerencial (`/gerencial`)
- ✅ Gargalos por etapa, taxa de resposta por canal, aging por lead, performance por segmento
- ✅ Métricas de IA: aceitação vs ignorados

### UX / Design System
- ✅ Tokens semânticos HSL em `index.css`
- ✅ Componentes padrão `EmptyState`, `ErrorState`, `LoadingSkeleton` aplicados em todas páginas
- ✅ `refetch()` do TanStack Query (sem `window.location.reload`)
- ✅ Cards com status dot + ring sutil para P1 (sem bordas pesadas)
- ✅ Mobile-first com BottomNav; layout adaptativo
- ✅ Dark theme premium minimal
- ✅ Acessibilidade: 48px touch targets, aria-labels

### Offline & Sync
- ✅ Estratégia offline-first com IndexedDB (sync queue)
- ✅ Mapeamento `notion_page_id` para sincronização externa

---

## ⚠️ Erros & Pontos de Atenção Conhecidos

| # | Item | Severidade | Observação |
|---|------|-----------|------------|
| 1 | Console logs do preview vazios no momento da auditoria | ✅ OK | Sem erros runtime detectados |
| 2 | `LeadCard` ainda chama `useScripts(stage)` por card (potencial N+1) | 🟡 Médio | Mitigado pelo cache do TanStack Query, mas ideal extrair para `useScriptsByStages` no nível do container |
| 3 | `useLeadEnrichment` planejado mas não criado | 🟡 Baixo | Lógica `mapLegacyStage`/`STAGE_GUIDANCE`/`buildLeadContext` ainda no render do `LeadCard` |
| 4 | `client_orders` está vazia (0 registros) | 🟢 Esperado | Aguardando primeiros pedidos reais |
| 5 | Nenhum teste de componente (apenas domain) | 🟡 Baixo | 25 testes de domínio passam; falta smoke test de UI |
| 6 | Filtro `priority` em `useLeads` sem índice dedicado | 🟢 Baixo | Sem impacto no volume atual |
| 7 | `useSalesCoach` não exibe label visual quando playbook custom é usado vs fallback ACENDER | 🟡 Baixo | Funciona, mas usuário não sabe a fonte |

**Nenhum bug bloqueante identificado.** O app está operável end-to-end.

---

## 🗄️ Banco vs Interface — Recomendação

**Pergunta:** popular banco com trilhas/assets/playbooks ou manter na interface?

**Resposta: já está populado no banco e essa é a abordagem correta. Manter assim.**

| Critério | Banco (atual) | Interface hardcoded |
|----------|---------------|---------------------|
| Edição sem deploy | ✅ Admin pode editar via `/playbooks`, `/trilhas`, `/assets` | ❌ Requer code change |
| RLS / multi-tenant | ✅ Controlado por role | ❌ N/A |
| Versionamento de conteúdo | ✅ `updated_at` automático | 🟡 Via git |
| Backup automatizado | ✅ Lovable Cloud | ❌ Manual |
| Personalização por usuário admin | ✅ Sim | ❌ Não |
| Ground truth para IA | ✅ Edge function consulta direto | 🟡 Bundled na função |

**Estado atual confirmado por query:**
- `playbooks`: **14** (cobertura 100% — 7 etapas × 2 perfis)
- `nurture_tracks`: **7** (T1–T7)
- `assets`: **9** (A1–A6 + B1–B3)
- `scripts`: **40**

**Ação recomendada:** **nenhuma migração nova**. Apenas garantir que novos admins saibam usar os editores `/playbooks` e `/trilhas`. Se desejar, criar onboarding admin documentando como customizar.

---

## 🚀 Melhorias Sugeridas (Próximas Ondas)

### Curto prazo (1–2 dias)
1. **Extrair `useLeadEnrichment` hook** — desacoplar lógica do `LeadCard`, deixá-lo apresentacional puro
2. **`useScriptsByStages` (batch)** — eliminar N+1 em listas grandes
3. **Badge no SalesCoachCard** — indicar "Playbook customizado" vs "Roteiro padrão ACENDER"
4. **Smoke tests de UI** — `LeadCard`, `EmptyState`, `BottomNav` (Vitest + Testing Library)
5. **Onboarding admin** — modal guiado na primeira vez que admin acessa `/playbooks`

### Médio prazo (1 semana)
6. **A/B testing de playbooks** — versionar variações e medir conversão
7. **Notificações push (PWA)** — alertar overdue/SLAs via service worker
8. **Sugestão de próximo asset baseada em comportamento** — IA aprende com `ai_analytics`
9. **Importação em massa de playbooks via JSON/CSV**
10. **Histórico completo de versões de playbook** (audit log)

### Longo prazo (visão produto)
11. **Integração WhatsApp Business API** — enviar mensagens diretamente do CRM
12. **Análise de sentimento das interações** via Lovable AI
13. **Forecast de vendas com ML** baseado em `client_orders` + estágio
14. **Multi-tenant org-level** (hoje é por user_id; permitir times)
15. **Marketplace de playbooks** — admins compartilham templates entre tenants
16. **Mobile app nativo** (Capacitor wrapper sobre o PWA atual)
17. **Webhooks de entrada** — capturar leads de Meta Ads, Google Forms etc. direto no pipeline
18. **Relatórios PDF exportáveis** do `/gerencial`

---

## 📁 Arquitetura — Mapa Rápido

```
src/
  domain/             # Regras de negócio puras (testadas)
    nba-rules.ts      # 9 regras declarativas ACENDER
    nba-engine.ts     # Avaliador + enriquecimento
    lead-scoring.ts   # Score 0–100
    stage-transitions.ts
    __tests__/        # 25 testes ✅
  hooks/              # TanStack Query + Supabase
  components/
    ui/               # shadcn + EmptyState/ErrorState/LoadingSkeleton
    leads/            # LeadCard, SalesCoachCard, KanbanBoard...
    playbooks/        # PlaybookFormModal
  pages/              # Index (Agora), Leads, Clientes, Gerencial, Playbooks, Trilhas, Assets
  lib/
    nba-engine.ts     # DEPRECATED — re-export do domain
supabase/
  functions/sales-coach/  # Edge function com playbook grounding
  migrations/             # Histórico SQL
```

---

## 🧪 Saúde Técnica

- ✅ Build: passa
- ✅ Testes: 25/25 passando
- ✅ Console preview: sem erros
- ✅ RLS: ativo em todas as tabelas
- ✅ Domain layer isolado e testado
- 🟡 Dívida técnica: hooks de enrichment não extraídos
