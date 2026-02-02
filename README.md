# Sales CRM - Máquina de Vendas

<div align="center">
  <img src="public/icon-512.png" alt="Sales CRM Logo" width="120" height="120">
  
  **CRM Mobile-First para Vendas Consultivas B2B**
  
  [![Made with Lovable](https://img.shields.io/badge/Made%20with-Lovable-ff6b6b?style=flat-square)](https://lovable.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square)](https://react.dev/)
</div>

---

## 📋 Sobre o Projeto

Sales CRM é uma aplicação de gerenciamento de relacionamento com clientes focada em vendas consultivas B2B. Desenvolvido com foco em **produtividade** e **acompanhamento de pipeline**, o sistema guia vendedores através de cada etapa do processo de vendas.

### Principais Funcionalidades

- **📱 Interface Mobile-First**: Otimizada para uso em campo
- **🎯 Gestão de Pipeline**: Acompanhamento visual de leads por etapa
- **⏰ Ações Programadas**: Sistema NBA (Next Best Action) para nunca perder follow-ups
- **🔄 Trilhas de Nutrição**: Sequências automatizadas de mensagens
- **📊 Dashboard Inteligente**: Métricas e visão consolidada de performance
- **📝 Histórico Completo**: Timeline de todas as interações com cada lead

## 🚀 Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS, shadcn/ui
- **Estado**: TanStack Query (React Query)
- **Backend**: Lovable Cloud (Supabase)
- **Autenticação**: Supabase Auth
- **Roteamento**: React Router DOM

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

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── leads/          # Componentes relacionados a leads
│   ├── tasks/          # Componentes de tarefas
│   ├── layout/         # Componentes de layout
│   └── dashboard/      # Componentes do dashboard
├── hooks/              # Custom hooks
├── pages/              # Páginas da aplicação
├── lib/                # Utilitários e helpers
├── types/              # Definições de tipos TypeScript
├── contexts/           # React Contexts
└── integrations/       # Integrações com serviços externos
```

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

- **Profissional**: Clientes diretos (salões, profissionais)
- **Distribuidor**: Parceiros de canal (revendedores)

### Status do Pipeline

Pipeline dinâmico baseado no tipo de lead, com etapas como:
- Novo Lead → Contato Inicial → Qualificado → Demonstração → Proposta → Fechado

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

## 🚢 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon
```

## 📱 Screenshots

| Dashboard | Lead Profile | Leads List |
|-----------|--------------|------------|
| Métricas e ações pendentes | Visão 360° do lead | Lista filtrada de leads |

## 🤝 Contribuindo

Consulte nosso [Guia de Contribuição](CONTRIBUTING.md) para detalhes sobre como contribuir com o projeto.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <p>Desenvolvido com ❤️ usando <a href="https://lovable.dev">Lovable</a></p>
</div>
