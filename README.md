# Sales CRM - Máquina de Vendas

<div align="center">
  <img src="public/icon-512.png" alt="Sales CRM Logo" width="120" height="120">
  
  **CRM Mobile-First para Vendas Consultivas B2B com Assistente de IA**
  
  [![Made with Lovable](https://img.shields.io/badge/Made%20with-Lovable-ff6b6b?style=flat-square)](https://lovable.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square)](https://react.dev/)
  [![AI Powered](https://img.shields.io/badge/AI-Powered-purple?style=flat-square)](https://lovable.dev)
</div>

---

## 📋 Sobre o Projeto

Sales CRM é uma aplicação de gerenciamento de relacionamento com clientes focada em vendas consultivas B2B. Desenvolvido com foco em **produtividade** e **acompanhamento de pipeline**, o sistema guia vendedores através de cada etapa do processo de vendas com suporte de **inteligência artificial**.

### Principais Funcionalidades

- **🤖 Assistente de Vendas com IA**: Sugestões personalizadas de ações, scripts e materiais
- **📱 Interface Mobile-First**: Otimizada para uso em campo
- **🎯 Gestão de Pipeline**: Acompanhamento visual de leads por etapa
- **⏰ Ações Programadas**: Sistema NBA (Next Best Action) para nunca perder follow-ups
- **🔄 Trilhas de Nutrição**: Sequências automatizadas de mensagens
- **📊 Dashboard Inteligente**: Métricas e visão consolidada de performance
- **📝 Histórico Completo**: Timeline de todas as interações com cada lead
- **✅ Gestão de Tarefas**: Controle de atividades por lead

---

## 🤖 Assistente de Vendas com IA

O Sales Coach é um assistente inteligente que analisa o contexto de cada lead e fornece:

### O que você recebe

| Funcionalidade | Descrição |
|----------------|-----------|
| **Ação Recomendada** | Qual tipo de abordagem usar (WhatsApp, ligação, email, visita) |
| **Script Personalizado** | Mensagem de abertura, pontos-chave e fechamento prontos para copiar |
| **Material Sugerido** | Qual asset (catálogo, vídeo, apresentação) enviar neste momento |
| **Dicas Estratégicas** | Insights sobre objeções prováveis e como contorná-las |
| **Próximos Passos** | O que fazer após a interação atual |

### Onde usar

- **Perfil do Lead**: Card completo com análise detalhada
- **Página Próximos**: Dicas rápidas em cada card de ação
- **Cards de Lead**: Botão "Sugestão IA" para recomendações instantâneas

### Como funciona

O assistente considera:
- Tipo de lead (Profissional ou Distribuidor)
- Etapa atual do pipeline
- Tempo sem contato
- Materiais disponíveis para o tipo de lead
- Observações e histórico

---

## 🚀 Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS, shadcn/ui
- **Estado**: TanStack Query (React Query)
- **Backend**: Lovable Cloud (Supabase)
- **IA**: Lovable AI Gateway (Gemini 3 Flash)
- **Autenticação**: Supabase Auth
- **Roteamento**: React Router DOM

---

## 🛠️ Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou bun

### Configuração

1. Clone o repositório:
```bash
git clone <URL_DO_REPOSITORIO>
cd sales-crm
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

---

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── leads/          # Componentes relacionados a leads
│   │   ├── SalesCoachCard.tsx    # Assistente IA completo
│   │   ├── QuickCoachTip.tsx     # Sugestões rápidas
│   │   └── ...
│   ├── tasks/          # Componentes de tarefas
│   ├── layout/         # Componentes de layout
│   └── dashboard/      # Componentes do dashboard
├── hooks/              # Custom hooks
│   ├── useSalesCoach.ts   # Hook do assistente IA
│   └── ...
├── pages/              # Páginas da aplicação
├── lib/                # Utilitários e helpers
│   └── nba-engine.ts   # Motor de Next Best Action
├── types/              # Definições de tipos TypeScript
├── contexts/           # React Contexts
└── integrations/       # Integrações com serviços externos

supabase/
├── functions/          # Edge Functions
│   └── sales-coach/    # Função do assistente IA
└── config.toml         # Configuração do Supabase
```

---

## 🔐 Modelo de Dados

### Principais Entidades

| Entidade | Descrição |
|----------|-----------|
| **Leads** | Contatos comerciais com dados de qualificação |
| **Interactions** | Histórico de comunicações (WhatsApp, ligações, emails) |
| **Tasks** | Tarefas e ações programadas |
| **Nurture Tracks** | Trilhas de nutrição automatizadas |
| **Assets** | Materiais de venda (PDFs, vídeos, catálogos) |

### Tipos de Lead

| Tipo | Pipeline | Assets |
|------|----------|--------|
| **Profissional** | DIRETO (salões, profissionais) | A1-A6 |
| **Distribuidor** | CANAL (revendedores) | B1-B3 |

### Status do Pipeline

**Profissional (DIRETO):**
```
Novo Lead → Contato Iniciado → Qualificado → Diagnóstico → 
Demonstração/Prova → Proposta → Fechado → Ativação → Recorrência
```

**Distribuidor (CANAL):**
```
Prospect → Pré-Qualificação → Reunião Estratégica → 
Proposta Comercial → Negociação → Aprovado → Onboarding → Ativação → Expansão
```

---

## 🎯 Motor de Regras (NBA Engine)

O sistema possui regras automáticas para priorização:

| Regra | Prioridade | Ação |
|-------|------------|------|
| Ação vencida | P1 | Follow-up imediato |
| Proposta sem resposta 48h | P1 | Enviar asset A2 |
| Diagnóstico parado 48h | P2 | Enviar material A1/A3 |
| Lead sem contato 72h | P2 | Sugerir trilha de reativação |
| Distribuidor aprovado sem pedido 7 dias | P1 | Ligação + B2 |

---

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev           # Inicia servidor de desenvolvimento

# Build
npm run build         # Gera build de produção
npm run preview       # Preview do build

# Qualidade
npm run lint          # Executa ESLint
npm run type-check    # Verificação de tipos
```

---

## 🚢 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

> **Nota**: A `LOVABLE_API_KEY` é configurada automaticamente pelo Lovable Cloud.

---

## 📱 Funcionalidades por Tela

| Tela | Funcionalidades |
|------|-----------------|
| **Dashboard** | Métricas, ações do dia, tarefas pendentes |
| **Próximos** | Ações dos próximos 7 dias com sugestões IA |
| **Leads** | Lista completa com filtros avançados |
| **Lead Profile** | Visão 360°, histórico, tarefas, assistente IA |
| **Trilhas** | Gerenciamento de trilhas de nutrição |
| **Assets** | Biblioteca de materiais de venda |

---

## 🤝 Contribuindo

Consulte nosso [Guia de Contribuição](CONTRIBUTING.md) para detalhes sobre como contribuir com o projeto.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>Desenvolvido com ❤️ e 🤖 usando <a href="https://lovable.dev">Lovable</a></p>
</div>
