# Guia de Contribuição

Obrigado por considerar contribuir para o Sales CRM! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Padrões de Código](#padrões-de-código)
- [Trabalhando com IA](#trabalhando-com-ia)
- [Processo de Pull Request](#processo-de-pull-request)
- [Estrutura do Projeto](#estrutura-do-projeto)

## Código de Conduta

Este projeto adota um código de conduta que esperamos que todos os participantes sigam. Por favor, seja respeitoso e inclusivo em todas as interações.

## Como Contribuir

### Reportando Bugs

1. Verifique se o bug já foi reportado nas Issues
2. Crie uma nova issue com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots (se aplicável)
   - Ambiente (navegador, dispositivo)

### Sugerindo Melhorias

1. Abra uma issue descrevendo a melhoria
2. Explique o problema que a melhoria resolve
3. Descreva a solução proposta
4. Aguarde feedback antes de implementar

### Enviando Código

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
3. Faça commits atômicos e descritivos
4. Escreva/atualize testes quando necessário
5. Certifique-se que o build passa (`npm run build`)
6. Abra um Pull Request

## Padrões de Código

### TypeScript

- Use tipos explícitos sempre que possível
- Evite `any` - use tipos genéricos ou `unknown`
- Prefira interfaces para objetos, types para unions

```typescript
// ✅ Bom
interface Lead {
  id: string;
  name: string;
  status: LeadStatus;
}

// ❌ Evite
const lead: any = { ... };
```

### React

- Use componentes funcionais com hooks
- Extraia lógica complexa para custom hooks
- Mantenha componentes focados e pequenos

```typescript
// ✅ Bom - componente focado
function LeadCard({ lead, onAction }: LeadCardProps) {
  return (
    <Card>
      <CardHeader>{lead.name}</CardHeader>
      <CardContent>...</CardContent>
    </Card>
  );
}

// ❌ Evite - componente com múltiplas responsabilidades
function LeadCard({ lead }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  // 200+ linhas de código...
}
```

### Tailwind CSS

- Use classes semânticas do design system
- Evite valores arbitrários quando possível
- Siga a ordem: layout → spacing → sizing → typography → colors

```typescript
// ✅ Bom - usa tokens do design system
<div className="flex items-center gap-4 p-4 bg-card text-foreground">

// ❌ Evite - valores hardcoded
<div className="flex items-center gap-[18px] p-[15px] bg-[#1a1a1a] text-[#ffffff]">
```

### Nomes de Arquivos

- Componentes: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilitários: `camelCase.ts`
- Tipos: `camelCase.ts` ou no próprio arquivo

### Commits

Use o formato [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona filtro por prioridade na listagem
fix: corrige cálculo de leads atrasados
docs: atualiza README com instruções de deploy
style: formata código com prettier
refactor: extrai lógica de validação para hook
```

## Trabalhando com IA

### Assistente de Vendas (Sales Coach)

O assistente de IA usa a Lovable AI Gateway. Ao modificar:

#### Edge Function (`supabase/functions/sales-coach/`)

```typescript
// Estrutura do contexto enviado para a IA
interface LeadContext {
  name: string;
  lead_type: string;
  stage: string;
  origin: string;
  priority: string;
  days_since_contact: number;
  next_action_type: string;
  observations?: string;
  available_assets: { code: string; name: string; type: string }[];
}
```

**Dicas para modificar o prompt:**
- O system prompt está na edge function, não no frontend
- Adicione exemplos específicos para novos tipos de lead
- Mantenha a estrutura JSON de resposta consistente

#### Hook (`src/hooks/useSalesCoach.ts`)

- Use `useMutation` para chamadas à IA
- Trate erros de rate limit (429) e créditos (402)
- O hook já filtra assets disponíveis por tipo de lead

#### Componentes

| Componente | Uso | Localização |
|------------|-----|-------------|
| `SalesCoachCard` | Análise completa | Perfil do Lead |
| `QuickCoachTip` | Sugestão compacta | Cards de Lead |

### Adicionando Novas Funcionalidades de IA

1. Crie uma nova edge function em `supabase/functions/`
2. Configure em `supabase/config.toml`
3. Crie um hook dedicado em `src/hooks/`
4. Trate erros 429 (rate limit) e 402 (créditos)

```typescript
// Exemplo de tratamento de erros
if (response.status === 429) {
  return new Response(JSON.stringify({ 
    error: "Limite de requisições excedido. Tente novamente em alguns segundos." 
  }), { status: 429, headers: corsHeaders });
}
```

## Processo de Pull Request

1. **Título**: Use o formato conventional commits
2. **Descrição**: Explique o que foi feito e por quê
3. **Screenshots**: Inclua para mudanças visuais
4. **Testes**: Descreva como testar as mudanças
5. **Checklist**:
   - [ ] Build passa
   - [ ] Código segue os padrões
   - [ ] Documentação atualizada (se necessário)
   - [ ] Testado em mobile e desktop
   - [ ] Funcionalidades de IA testadas (se aplicável)

## Estrutura do Projeto

```
src/
├── components/       # Componentes React
│   ├── ui/          # Componentes base (shadcn)
│   ├── leads/       # Componentes de leads
│   │   ├── SalesCoachCard.tsx    # Assistente IA completo
│   │   ├── QuickCoachTip.tsx     # Sugestão IA compacta
│   │   ├── LeadCard.tsx          # Card de lead
│   │   └── ...
│   ├── tasks/       # Componentes de tarefas
│   ├── dashboard/   # Dashboard e métricas
│   └── layout/      # Layout components
├── hooks/           # Custom hooks
│   ├── useLeads.ts          # CRUD de leads
│   ├── useSalesCoach.ts     # Assistente IA
│   └── ...
├── pages/           # Páginas da aplicação
├── lib/             # Utilitários e helpers
│   └── nba-engine.ts   # Motor de regras
├── types/           # Definições de tipos
├── contexts/        # React contexts
└── integrations/    # Integrações externas

supabase/
├── functions/       # Edge Functions
│   └── sales-coach/ # Assistente de vendas IA
└── config.toml      # Configuração
```

## Dúvidas?

Abra uma issue com a tag `question` ou entre em contato com a equipe.

Obrigado por contribuir! 🎉
