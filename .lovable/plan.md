# Plano: Filtros do Coach na Agora, Batch de Scripts em Leads, Cache Reativa e Auditoria de Segurança

## 1. Filtro "Playbook customizado vs Roteiro padrão" na tela Agora (`Próximos`)

**Problema**: `playbook_source` só existe na resposta da edge `sales-coach` por lead, não está armazenado. Para filtrar a lista, precisamos saber a origem do roteiro de cada lead sem chamar a IA por todos.

**Decisão**: como `playbook_source` deriva da existência de um `playbooks` row para `(stage, lead_type)`, podemos calculá-lo no client a partir do hook `usePlaybooks` (já existente) — sem custos de IA, sem coluna nova no banco.

**Implementação**:
- Novo helper `src/domain/playbook-source.ts`:
  - `getPlaybookSource(lead, playbooks): 'custom' | 'default'`
  - Procura playbook com `stage === mapLegacyStage(lead.stage)` e `lead_type === lead.lead_type`. Se achar → `custom`, senão → `default`.
- Em `src/pages/Proximos.tsx`:
  - Carregar `usePlaybooks()` uma vez.
  - Adicionar estado `coachFilter: 'all' | 'custom' | 'default'`.
  - Renderizar `<ToggleGroup>` (3 botões) acima das Tabs: "Todos · Playbook · Padrão" com contagens.
  - Aplicar filtro em `groupedByDay` antes do agrupamento.
  - Mostrar badge sutil em cada `LeadCard` da Agora indicando a fonte (passar `playbookSource` como prop opcional ao `LeadCard`).
- Atualizar `src/components/leads/LeadCard.tsx` para aceitar prop opcional `playbookSource` e renderizar badge pequeno ao lado do nome quando presente.

## 2. Batch prefetch de scripts em `/leads`

**Implementação**:
- Em `src/pages/Leads.tsx`: chamar `useScriptsByStages(stagesInView)` com `stagesInView = unique(leads.map(l => mapLegacyStage(l.stage)))` (mesmo padrão de `Proximos.tsx`).
- Garantir o mesmo prefetch em `LeadListView.tsx` (caso seja usado isolado em outro contexto futuro — só invocar `useScriptsByStages` lá também por simetria).
- `KanbanBoard.tsx` já tem; conferir e padronizar.

## 3. `useScriptsByStages` reativo a mudanças

**Problema atual**: `useScripts*` mutations invalidam `['scripts']` parcialmente (chave exata), mas a chave do batch é `['scripts', 'by-stages', [...]]`. Se admin edita script ou Notion sincroniza, a cache do batch fica obsoleta.

**Implementação**:
- Em `src/hooks/useScripts.ts`: trocar `invalidateQueries({ queryKey: ['scripts'] })` por `invalidateQueries({ queryKey: ['scripts'], exact: false })` (já é o default, mas garantir) — isso invalida tanto `['scripts', stage]` quanto `['scripts', 'by-stages', ...]`.
- Em `src/hooks/useScriptsByStages.ts`:
  - Adicionar `staleTime: 5 * 60_000` (5min) e `refetchOnWindowFocus: true` para auto-revalidar quando o usuário volta à aba.
  - Adicionar Realtime subscription opcional via `supabase.channel('scripts-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'scripts' }, () => queryClient.invalidateQueries({ queryKey: ['scripts'] }))`. Cleanup no unmount.
  - Migration SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE public.scripts;` (idempotente via `DO $$ ... EXCEPTION WHEN duplicate_object`).

## 4. Auditoria de segurança e ajustes

**Achados do linter** (25 warnings):
- **W1–20**: tabelas visíveis no schema GraphQL para `anon`/`authenticated` (informativo — todas as tabelas têm RLS, então é exposição de schema, não de dados). **Aceitar** e documentar no `security-memory`.
- **W21–24**: `SECURITY DEFINER` funções executáveis — `has_role`, `update_updated_at_column`, `update_lead_last_touch`, `handle_new_user`. Estas precisam ser `SECURITY DEFINER` por design (RLS bypass, trigger execution). **Aceitar** e documentar.
- **W25 (acionável)**: **Leaked Password Protection desabilitado** → ativar via `configure_auth({ password_hibp_enabled: true })`.

**RLS — revisão tabela por tabela**:
- `leads`, `interactions`, `tasks`, `client_orders`, `profiles`: ✅ owner-scoped (`auth.uid() = user_id`). OK.
- `user_roles`: ✅ SELECT própria; sem INSERT/UPDATE/DELETE público. **Risco**: usuários novos ficam sem role; o trigger `handle_new_user` insere `'user'` automaticamente — OK.
- `assets`, `nurture_tracks`, `playbooks`, `scripts`: SELECT para `authenticated`, mutações só `admin` via `has_role`. ✅ correto.
- **Gap pequeno**: políticas em `assets/playbooks/nurture_tracks` usam `roles: {public}` em vez de `{authenticated}` para INSERT/UPDATE/DELETE. `has_role` já bloqueia anônimos, mas para defense-in-depth recriar como `TO authenticated`. Migration:
  ```sql
  DROP POLICY "Admins can insert assets" ON public.assets;
  CREATE POLICY "Admins can insert assets" ON public.assets
    FOR INSERT TO authenticated
    WITH CHECK (has_role(auth.uid(), 'admin'));
  -- repetir para update/delete em assets, playbooks, nurture_tracks
  ```

**Edge Function `sales-coach`**:
- Atualmente sem bloco em `supabase/config.toml` → deploy padrão com `verify_jwt = true` (default Lovable é `false` mas para esta função de IA chamando dados de lead, JWT garante auth). Verificar no `config.toml` e adicionar bloco `[functions.sales-coach] verify_jwt = true` se não estiver garantido.
- Confirmar que a função usa o token do usuário ao consultar `playbooks` (RLS), e não service role indiscriminado.

**Buckets de Storage**: nenhum bucket existe — nada a auditar.

**Auth providers**: revisar e garantir Google habilitado (padrão Lovable). Email/password ✅.

**Atualizar `security-memory`** explicando:
- App é multi-tenant por `user_id`; conteúdo (playbooks/scripts/assets/tracks) é compartilhado entre usuários autenticados, editável só por admin.
- W1–24 do linter são aceitáveis (RLS protege; SECURITY DEFINER funções são intencionais).

---

## Detalhes técnicos por arquivo

**Criar:**
- `src/domain/playbook-source.ts`
- `src/domain/__tests__/playbook-source.test.ts`
- Migration SQL: realtime para `scripts` + recriar policies admin com `TO authenticated`.

**Modificar:**
- `src/pages/Proximos.tsx` — filtro Coach + ToggleGroup
- `src/pages/Leads.tsx` — `useScriptsByStages` prefetch
- `src/components/leads/LeadCard.tsx` — prop opcional `playbookSource` + badge
- `src/hooks/useScriptsByStages.ts` — `staleTime`, `refetchOnWindowFocus`, Realtime subscription
- `supabase/config.toml` — bloco para `sales-coach` se necessário

**Tooling:**
- `configure_auth({ password_hibp_enabled: true })`
- `supabase--linter` re-run para confirmar redução
- `update_memory` no security-memory

## Critérios de aceite
- Tela Agora mostra 3 chips (Todos/Playbook/Padrão) com contagens corretas e filtra a lista.
- LeadCard mostra badge da fonte do playbook na Agora.
- `/leads` faz 1 query `scripts` ao carregar, independente do nº de leads (verificável no Network).
- Editar um script no `/playbooks` reflete imediatamente no Coach do próximo lead aberto, sem reload.
- Linter Supabase: leaked password ativo; demais warnings documentados como aceitos.
- Sem alterações destrutivas em RLS; políticas de admin agora `TO authenticated` (defense-in-depth).
