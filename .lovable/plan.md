

# Refatoração Arquitetural e Refinamento de UX

## Diagnóstico

A análise confirma os pontos levantados:

1. **Lógica de domínio já parcialmente centralizada** em `src/lib/nba-engine.ts` e `src/types/database.ts` (STAGE_GUIDANCE, ACENDER_STAGES, mapLegacyStage). Porém, regras de decisão ainda vazam para componentes (ex: `handleMarkDone` em `Index.tsx` hardcoda "amanhã 9h" como próxima ação).

2. **NBA imperativo via switch/case** -- funciona, mas dificulta testes e extensão.

3. **Zero testes reais** -- `example.test.ts` contém apenas um stub `expect(true).toBe(true)`.

4. **Cards com `border-l-4` pesado** -- `action-card-urgent`, `action-card-warning`, `action-card-normal` criam ruído visual.

5. **Sem loading/empty/error states padronizados** -- cada página implementa ad-hoc.

---

## Plano de Implementação

### 1. Criar camada de domínio `src/domain/`

Mover regras puras para funções testáveis:

- **`src/domain/nba-rules.ts`** -- Transformar o switch/case em array declarativo de regras:
```text
interface NBARule {
  stage: string | '*';
  condition: (ctx: LeadContext) => boolean;
  priority: LeadPriority;
  action: ActionType;
  messageTemplate: string;
  assetCode?: string;
  overdueReason: string;
}
```
Cada regra é um objeto puro. O engine itera, aplica a primeira que "match" (ou todas com merge de prioridade). Facilita adicionar regras sem tocar em lógica.

- **`src/domain/nba-engine.ts`** -- Refatorar `calculateNBA` para consumir a matriz de regras.

- **`src/domain/stage-transitions.ts`** -- Extrair lógica de avanço de etapa, conversão lead-para-cliente, e a regra de "próxima ação padrão ao concluir" (hoje hardcoded em Index.tsx).

- **`src/domain/lead-scoring.ts`** -- Criar score operacional composto: `urgência` (overdue hours), `potencial` (stage proximity to close), `atraso` (days without touch), `proximaAcao` (hours until next action). Retorna um objeto `LeadScore` numérico.

- Manter `src/types/database.ts` como está (tipos + constantes de config).
- Deprecar `src/lib/nba-engine.ts` (redirecionar imports).

### 2. Testes unitários para o motor NBA

- **`src/domain/__tests__/nba-rules.test.ts`** -- Testar cada regra individualmente com leads mock.
- **`src/domain/__tests__/nba-engine.test.ts`** -- Testar `calculateNBA` end-to-end: lead novo sem contato = P1, lead com ação vencida = P1, lead em nutrição sem toque 48h = P2, etc.
- **`src/domain/__tests__/stage-transitions.test.ts`** -- Testar conversão, avanço, e geração de próxima ação padrão.

### 3. Redesenhar cards visuais (menos ruído)

Substituir `border-l-4` por sistema mais sutil:

- **Remover** classes `action-card-urgent/warning/normal` com borda lateral.
- **Adicionar** um "status dot" (bolinha 8px) + badge de prioridade discreta no canto.
- Cards P1 ganham apenas um sutil `ring-1 ring-destructive/30` ao invés de borda pesada.
- Manter hierarquia tipográfica: nome em `font-semibold`, motivo em `text-xs text-muted`, ação em destaque.
- Resultado: visual mais limpo, premium, sem perder a informação de urgência.

### 4. Componentes de estado padrão

Criar 3 componentes reutilizáveis em `src/components/ui/`:

- **`EmptyState.tsx`** -- Ícone + título + subtítulo + CTA opcional. Usado quando lista retorna vazia.
- **`ErrorState.tsx`** -- Ícone de erro + mensagem + botão "Tentar novamente".
- **`LoadingSkeleton.tsx`** -- Composição de skeletons para cards, listas e grids. Parametrizável por `variant: 'card' | 'list' | 'grid'`.

Aplicar em todas as páginas (Index, Proximos, Leads, Clientes, Assets, Trilhas) substituindo implementações ad-hoc.

### 5. Extrair lógica de negócio dos componentes

- `Index.tsx` `handleMarkDone`: mover regra de "próxima ação padrão" para `domain/stage-transitions.ts`.
- `LeadCard.tsx`: remover lógica de resolução de stage/guidance -- receber já resolvido via props ou hook.
- `useLeads.ts`: manter como orquestrador (fetch + enrich), mas o enrich vem do domain.

### 6. Score operacional visível no card

Adicionar ao `LeadCard` um indicador compacto mostrando o score composto (0-100) como mini-barra ou número. Permite ao vendedor priorizar "de relance" sem ler todos os detalhes.

---

## Arquivos afetados

| Ação | Arquivo |
|------|---------|
| Criar | `src/domain/nba-rules.ts` |
| Criar | `src/domain/nba-engine.ts` |
| Criar | `src/domain/stage-transitions.ts` |
| Criar | `src/domain/lead-scoring.ts` |
| Criar | `src/domain/__tests__/nba-rules.test.ts` |
| Criar | `src/domain/__tests__/nba-engine.test.ts` |
| Criar | `src/domain/__tests__/stage-transitions.test.ts` |
| Criar | `src/components/ui/EmptyState.tsx` |
| Criar | `src/components/ui/ErrorState.tsx` |
| Criar | `src/components/ui/LoadingSkeleton.tsx` |
| Modificar | `src/index.css` (remover border-l-4, adicionar dot/ring) |
| Modificar | `src/components/leads/LeadCard.tsx` (novo visual + score) |
| Modificar | `src/pages/Index.tsx` (extrair lógica, usar estados padrão) |
| Modificar | `src/pages/Proximos.tsx` (usar estados padrão) |
| Modificar | `src/pages/Leads.tsx` (usar estados padrão) |
| Modificar | `src/pages/Clientes.tsx` (usar estados padrão) |
| Modificar | `src/pages/Assets.tsx` (usar estados padrão) |
| Modificar | `src/pages/Trilhas.tsx` (usar estados padrão) |
| Modificar | `src/hooks/useLeads.ts` (apontar para novo domain) |
| Deprecar | `src/lib/nba-engine.ts` (re-export do domain) |

---

## O que NÃO está neste escopo

- Instrumentação de analytics da IA (próximo passo separado)
- Playbooks comerciais por perfil (feature futura)
- Dashboard gerencial com gargalos (feature futura)
- Mudanças no banco de dados (nenhuma necessária)

