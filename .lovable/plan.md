

## Plano: Kanban Visual no Leads + Novo Módulo "Clientes"

### Contexto

Atualmente a página Leads exibe uma lista linear de cards. O pedido envolve duas grandes mudanças:

1. **Visão Kanban** no módulo Leads com as 6 primeiras etapas ACENDER (A-C-E-N-D-E), permitindo arrastar leads entre colunas
2. **Novo módulo "Clientes"** para leads que chegam à etapa RECORRÊNCIA, com funil de pós-venda (D+2, D+7, D+15, D+30, D+60, D+90)

### Arquitetura

```text
Leads (Kanban)                    Clientes (Pós-venda)
┌───┬───┬───┬───┬───┬───┐        ┌────────────────────────┐
│ A │ C │ E │ N │ D │ E │  ──►   │ RECORRÊNCIA sub-stages │
│   │   │   │   │   │   │        │ D+2 │ D+7 │ D+15 │... │
└───┴───┴───┴───┴───┴───┘        └────────────────────────┘
     drag & drop                      status_final=CONVERTIDO
```

### Mudanças Detalhadas

#### 1. Página Leads — Visão Kanban (mobile-first)

- **Substituir a lista atual** por um Kanban horizontal com scroll (sem dependência de lib de drag-and-drop — usaremos botões "Avançar/Voltar etapa" para mobile, já que drag-and-drop nativo é ruim em toque)
- **Desktop**: colunas lado a lado com scroll horizontal. **Mobile**: tabs/pills horizontais por etapa (A, C, E, N, D, E) que filtram os leads daquela etapa; dentro de cada tab, cards compactos com botão de avançar etapa
- Cada coluna/tab mostra: contador de leads, cor da etapa, letra
- Ao clicar num lead, navega para LeadProfile como hoje
- Botão "Avançar ▸" em cada card move o lead para a próxima etapa via `useUpdateLead`
- Quando um lead em ENCERRAMENTO é avançado, ele muda `stage` para `RECORRENCIA` e `status_final` para `CONVERTIDO`, e passa a aparecer apenas na página Clientes

#### 2. Nova Página "Clientes" (`/clientes`)

- Exibe leads com `stage = RECORRENCIA` (ou `status_final = CONVERTIDO`)
- Sub-etapas de pós-venda exibidas como timeline/stepper: D+2 (Suporte), D+7 (Resultado), D+15 (Satisfação), D+30 (Reposição), D+45 (Comunidade), D+60 (Depoimento), D+90 (Cross-sell)
- Cada cliente mostra: nome, data da compra, sub-etapa atual, próxima ação
- Rota: `/clientes` e `/clientes/:id` (reutiliza LeadProfile com contexto de pós-venda)

#### 3. Navegação

- Adicionar "Clientes" ao `BottomNav` (ícone `UserCheck`) e ao `DashboardSidebar`
- Adicionar rota `/clientes` ao `App.tsx`

#### 4. Lógica de Transição Encerramento → Recorrência

- Ao avançar de ENCERRAMENTO: atualizar `stage = RECORRENCIA`, `status_final = CONVERTIDO`
- O lead desaparece do Kanban de Leads e aparece em Clientes
- Registrar interação `MUDANCA_ETAPA` no histórico

#### 5. Filtros do Leads Kanban

- Manter os filtros existentes (prioridade, busca) funcionando dentro da visão Kanban
- Excluir leads com `stage = RECORRENCIA` da listagem de Leads (já que estarão em Clientes)

### Arquivos a Criar

- `src/pages/Clientes.tsx` — página de clientes com timeline pós-venda
- `src/components/leads/KanbanBoard.tsx` — componente Kanban com tabs mobile / colunas desktop

### Arquivos a Modificar

- `src/App.tsx` — adicionar rota `/clientes`
- `src/components/layout/BottomNav.tsx` — adicionar item Clientes
- `src/components/layout/DashboardSidebar.tsx` — adicionar item Clientes
- `src/pages/Leads.tsx` — substituir lista por KanbanBoard, filtrar `RECORRENCIA` fora
- `src/hooks/useLeads.ts` — adicionar hook `useClientLeads` (stage=RECORRENCIA)
- `src/types/database.ts` — adicionar constante `RECORRENCIA_SUBSTAGES` com as sub-etapas D+2..D+90

### Sem Migrações de Banco

Não são necessárias mudanças no schema — usaremos o campo `substatus` existente na tabela `leads` para rastrear a sub-etapa de pós-venda (D+2, D+7, etc.).

