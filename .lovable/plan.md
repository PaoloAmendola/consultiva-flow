# Sales CRM - Estado Atual e Próximos Passos

## Arquitetura

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase) - Auth, Database, Edge Functions
- **IA**: Lovable AI Gateway (google/gemini-3-flash-preview) via Edge Function `sales-coach`
- **Estado**: TanStack Query para cache e sincronização
- **Roteamento**: React Router DOM v6

## Módulos Implementados

| Módulo | Status | Arquivos principais |
|--------|--------|---------------------|
| Autenticação | ✅ Completo | `AuthContext.tsx`, `Auth.tsx`, `ProtectedRoute.tsx` |
| Dashboard (Agora) | ✅ Completo | `Index.tsx`, `MetricsCards.tsx` |
| Pipeline Leads | ✅ Completo | `Leads.tsx`, `LeadProfile.tsx` |
| Próximos 7 dias | ✅ Completo | `Proximos.tsx` |
| Trilhas de Nutrição | ✅ Completo | `Trilhas.tsx`, `useNurtureTracks.ts` |
| Biblioteca de Assets | ✅ Completo | `Assets.tsx`, `useAssets.ts` |
| Gestão de Tarefas | ✅ Completo | `TaskList.tsx`, `CreateTaskModal.tsx` |
| Motor NBA | ✅ Completo | `nba-engine.ts` |
| Assistente IA | ✅ Completo | `SalesCoachCard.tsx`, `QuickCoachTip.tsx`, `useSalesCoach.ts` |
| Perfil 360° do Lead | ✅ Completo | `LeadProfile.tsx` (stepper, delete, histórico) |

## Banco de Dados

### Tabelas
- `leads` - Leads com pipeline, prioridade, próxima ação
- `interactions` - Histórico de comunicações
- `tasks` - Tarefas vinculadas a leads
- `nurture_tracks` - Trilhas de nutrição com steps JSON
- `assets` - Materiais de venda (PDFs, vídeos, links)
- `profiles` - Dados extras do usuário
- `user_roles` - Controle de acesso (admin/user)

### Triggers
- `update_lead_last_touch` - Atualiza `last_touch_at` ao registrar interação

### RLS
- Todas as tabelas com RLS ativo, isolamento por `user_id`

## Pipelines

### Profissional (DIRETO)
Novo Lead → Contato Iniciado → Qualificado → Diagnóstico → Demonstração/Prova → Proposta/Condição → Fechado → Ativação → Recorrência

### Distribuidor (CANAL)
Prospect → Pré-Qualificação → Reunião Estratégica → Proposta Comercial → Negociação → Aprovado → Cadastro/Contrato → Onboarding → Ativação → Expansão

## Regras NBA (Next Best Action)

- Ação vencida → P1
- Novo lead sem contato 1h → WhatsApp boas-vindas
- Proposta sem resposta 48h → Follow-up + Asset A2
- Diagnóstico parado 48h → Enviar material A1
- Demonstração sem retorno 24h → WhatsApp
- Distribuidor aprovado sem pedido 7d → Ligação + B2
- Lead sumido 72h → Reativação

## Próximos Passos

- Integração WhatsApp Business API
- Relatórios de performance e conversão
- Importação/exportação de leads (CSV)
- Notificações push (PWA)
- Multi-usuário com visão de equipe
