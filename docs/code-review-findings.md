# Revisão da base: problemas encontrados e tarefas sugeridas

## 1) Erro de digitação / instrução incorreta (docs)
**Problema encontrado**
- O `README.md` orienta clonar e entrar na pasta `sales-crm`, mas o repositório atual é `consultiva-flow`. Isso tende a quebrar o onboarding local por diretório inexistente.

**Tarefa sugerida**
- Corrigir a instrução de setup para usar o nome de pasta real do projeto (ou tornar o passo genérico com `cd <nome-do-repo-clonado>`).

**Critério de aceite**
- Um dev consegue executar os passos de instalação do README sem ajustar manualmente o diretório.

---

## 2) Bug funcional
**Problema encontrado**
- Na página `Próximos`, o filtro diário usa `isAfter(...) && isBefore(...)`. Isso exclui itens exatamente nos limites (ex.: `00:00:00` e `23:59:59.999`), podendo ocultar ações/tarefas no dia correto.

**Tarefa sugerida**
- Tornar o filtro inclusivo para o início/fim do dia (por comparação numérica de timestamp ou combinações com `isEqual`).

**Critério de aceite**
- Itens marcados exatamente no início e no fim do dia aparecem no agrupamento diário esperado.

---

## 3) Comentário de código / discrepância de documentação
**Problema encontrado**
- O README lista `npm run type-check` como script disponível, mas `package.json` não define esse script.

**Tarefa sugerida**
- Alinhar documentação e código: adicionar script `type-check` em `package.json` (ex.: `tsc --noEmit`) **ou** remover/ajustar a seção do README.

**Critério de aceite**
- O comando documentado para checagem de tipos existe e executa sem erro de script inexistente.

---

## 4) Melhoria de teste
**Problema encontrado**
- A suíte atual contém apenas um teste placeholder (`expect(true).toBe(true)`), sem validar regras de negócio relevantes.

**Tarefa sugerida**
- Criar testes reais para `calculateNBA` em `src/lib/nba-engine.ts` cobrindo ao menos:
  - lead com ação vencida (`P1` + `overdueReason`)
  - regra por etapa (`NUTRICAO` sugerindo `ENVIAR_MATERIAL`)
  - ordenação por actionability em `sortLeadsByActionability`

**Critério de aceite**
- Testes falham quando regras são quebradas e passam no estado correto da engine.
