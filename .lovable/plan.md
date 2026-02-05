
# Plano de Correção: Bugs de SelectItem com Valor Vazio

## Problema Identificado
Durante o teste end-to-end, foram encontrados 2 bugs críticos que impedem o funcionamento dos modais de edição de lead e registro de interação. O erro ocorre porque o Radix UI Select não permite `<SelectItem value="">` com valor vazio.

**Erro exibido:**
```
A <Select.Item /> must have a value prop that is not an empty string.
```

---

## Arquivos Afetados

### 1. `src/components/leads/AddInteractionModal.tsx`
**Linha 167:** O SelectItem para "Nenhum" asset usa valor vazio.

```tsx
// ANTES (com bug):
<SelectItem value="">Nenhum</SelectItem>

// DEPOIS (corrigido):
<SelectItem value="none">Nenhum</SelectItem>
```

**Ajuste no submit (linhas 84-92):** Converter "none" para null antes de salvar.

### 2. `src/components/leads/EditLeadModal.tsx`  
**Linha 404:** O SelectItem para "Nenhuma" trilha usa valor vazio.

```tsx
// ANTES (com bug):
<SelectItem value="">Nenhuma</SelectItem>

// DEPOIS (corrigido):
<SelectItem value="none">Nenhuma</SelectItem>
```

**Ajuste no submit (linha 157):** Converter "none" para null antes de salvar.

---

## Implementação

### Arquivo 1: AddInteractionModal.tsx

**Mudanças:**
1. Linha 167: Alterar `value=""` para `value="none"`
2. Linha 91: Converter "none" para null no submit

### Arquivo 2: EditLeadModal.tsx

**Mudanças:**
1. Linha 404: Alterar `value=""` para `value="none"`
2. Linha 157: Converter "none" para null no submit

---

## Resultado Esperado

Após a correção:
- O modal de "Registrar Interação" abrirá sem erros
- O modal de "Editar Lead" abrirá sem erros
- Será possível selecionar "Nenhum" asset ou "Nenhuma" trilha
- Os valores serão salvos corretamente como null no banco de dados
