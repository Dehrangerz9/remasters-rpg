Abaixo estão as tarefas estruturadas no papel de Scrum Master, derivadas diretamente do relatório .

As tarefas estão organizadas como **User Stories técnicas**, com:

* Objetivo claro
* Arquivos a serem lidos
* Arquivos a serem criados
* Arquivos a serem modificados
* Critérios de aceite
* Ordem recomendada de execução
* Dependências explícitas

A estrutura foi escrita para consumo direto por outra IA executora.

---

# EPIC 1 — Normalização e Utilitários Centrais

Baseado nas duplicações identificadas em:

* `normalizeAbilityConfig`
* `normalizeDamageType`
* `escapeHtml`
* `formatSigned`
* `resolveTargetDc`
* parsing de tags
  (Referência: )

---

## TASK 1.1 — Centralizar Normalizadores de Ability e Damage

### Objetivo

Eliminar duplicação de normalização espalhada entre sheets, chat e rules.

### Arquivos a serem LIDOS

* `src/sheets/player/abilities/chat.ts`
* `src/sheets/player/rolls/damage.ts`
* `src/sheets/item/sheet.ts`
* `src/sheets/item/context.ts`
* `src/abilities/rules.ts`

### Arquivos a serem CRIADOS

* `src/abilities/normalizers.ts`

Deve exportar:

```ts
normalizeAbilityConfig(raw): AbilityConfigData
normalizeDamageType(raw): DamageType
```

### Arquivos a serem MODIFICADOS

* `src/sheets/player/abilities/chat.ts`
* `src/sheets/player/rolls/damage.ts`
* `src/sheets/item/sheet.ts`
* `src/sheets/item/context.ts`

### Critérios de Aceite

* Nenhuma função de normalização duplicada restante.
* Tipagem consistente.
* Criação e edição de habilidade continuam funcionando.
* Dano continua sendo aplicado corretamente.

### Prioridade

Alta (Quick Win estrutural)

---

## TASK 1.2 — Centralizar Utilities de Texto

### Objetivo

Eliminar duplicações de `escapeHtml` e `formatSigned`.

### Arquivos a serem LIDOS

* `src/sheets/player/rolls/check.ts`
* `src/sheets/player/item-summary.ts`
* `src/sheets/global-functions/utils.ts`

### Arquivos a serem CRIADOS

* `src/utils/text.ts`

Exportar:

```ts
escapeHtml(str: string): string
formatSigned(n: number): string
```

### Arquivos a serem MODIFICADOS

* `src/sheets/player/rolls/check.ts`
* `src/sheets/player/item-summary.ts`
* `src/sheets/global-functions/utils.ts`

### Critérios de Aceite

* Nenhuma implementação duplicada.
* Chat continua renderizando corretamente.
* Sinais positivos e negativos exibidos corretamente.

### Prioridade

Muito Alta (baixo risco)

---

# EPIC 2 — Unificação do Fluxo de Rolagem

Referência direta ao agrupamento identificado no relatório .

---

## TASK 2.1 — Criar Pipeline Genérico de Rolagem

### Objetivo

Unificar fluxo de:

* skill roll
* attack
* ability cast
* check
* reiki

### Arquivos a serem LIDOS

* `src/sheets/player/actions/listeners.ts`
* `src/sheets/player/skills/listeners.ts`
* `src/sheets/player/abilities/chat.ts`
* `src/sheets/player/rolls/check.ts`
* `src/sheets/player/rolls/reiki.ts`

### Arquivos a serem CRIADOS

* `src/sheets/player/rolls/flow.ts`
* `src/sheets/player/rolls/helpers.ts`

`flow.ts` deve exportar:

```ts
runCheckFlow(input: RunCheckFlowInput): Promise<CheckResult>
```

`helpers.ts` deve exportar:

```ts
resolveTargetDc(...)
buildBreakdownTags(...)
```

### Arquivos a serem MODIFICADOS

* `src/sheets/player/actions/listeners.ts`
* `src/sheets/player/skills/listeners.ts`
* `src/sheets/player/abilities/chat.ts`
* `src/sheets/player/rolls/check.ts`

### Critérios de Aceite

* Todas as rolagens continuam funcionando.
* Dano pode ser acionado a partir do card.
* Reiki continua funcional.
* Nenhum comportamento regressivo em GM secret target.

### Prioridade

Alta

---

# EPIC 3 — Modularização de Arquivos Monolíticos

Referência: arquivos >500 LoC no relatório .

---

## TASK 3.1 — Modularizar damage.ts (871 LoC)

### Objetivo

Dividir responsabilidades.

### Arquivos a serem LIDOS

* `src/sheets/player/rolls/damage.ts`

### Arquivos a serem CRIADOS

* `src/sheets/player/rolls/damage-dialog.ts`
* `src/sheets/player/rolls/damage-eval.ts`
* `src/sheets/player/rolls/damage-chat.ts`
* `src/sheets/player/rolls/damage-apply.ts`

### Arquivos a serem MODIFICADOS

* `src/sheets/player/rolls/damage.ts` (virar facade)

### Critérios de Aceite

* Nenhuma perda funcional.
* openDamageRollDialog continua abrindo corretamente.
* Aplicação de dano não regressa.

### Prioridade

Alta (estrutural)

---

## TASK 3.2 — Modularizar setupAbilityListeners

### Objetivo

Dividir 309 linhas em módulos por domínio.

### Arquivos a serem LIDOS

* `src/sheets/item/ability/listeners.ts`

### Arquivos a serem CRIADOS

* `src/sheets/item/ability/category-listeners.ts`
* `src/sheets/item/ability/characteristic-listeners.ts`
* `src/sheets/item/ability/enhancement-listeners.ts`
* `src/sheets/item/ability/bonus-listeners.ts`

### Arquivos a serem MODIFICADOS

* `src/sheets/item/ability/listeners.ts`

### Critérios de Aceite

* Todos os botões continuam funcionando.
* Persistência intacta.
* Nenhum erro de binding de evento.

### Prioridade

Alta

---

# EPIC 4 — Abstração de Dialogs

---

## TASK 4.1 — Criar Form Dialog Genérico

### Objetivo

Eliminar duplicação de criação manual de Dialog.

### Arquivos a serem LIDOS

* `src/sheets/player/rolls/dialog.ts`
* `src/sheets/player/rolls/damage.ts`
* `src/sheets/actor/dialog-utils.ts`
* `src/sheets/actor/dialogs.ts`

### Arquivos a serem CRIADOS

* `src/ui/dialogs/form-dialog.ts`

Exportar:

```ts
openFormDialog<T>(config): Promise<T | null>
```

### Arquivos a serem MODIFICADOS

* `src/sheets/player/rolls/dialog.ts`
* `src/sheets/player/rolls/damage.ts`
* `src/sheets/actor/dialogs.ts`

### Critérios de Aceite

* Cancel/Save funcionando.
* Inputs validados.
* Nenhum diálogo quebrado.

---

# EPIC 5 — Refatoração de Templates HBS

---

## TASK 5.1 — Criar Componentes HBS Reutilizáveis

### Objetivo

Eliminar duplicação em:

* section header
* item rows
* actions area

### Arquivos a serem LIDOS

* `templates/actors/partials/tabs/inventory.hbs`
* `templates/actors/partials/tabs/abilities.hbs`
* `templates/actors/partials/tabs/actions.hbs`
* `templates/actors/partials/tabs/main.hbs`

### Arquivos a serem CRIADOS

* `templates/actors/partials/components/section-header.hbs`
* `templates/actors/partials/components/item-row.hbs`
* `templates/actors/partials/components/item-row-actions.hbs`

### Arquivos a serem MODIFICADOS

* Todos os arquivos acima

### Critérios de Aceite

* Render idêntico visualmente.
* Nenhum erro de template.
* Drag/drop intacto.

---

# EPIC 6 — Design System SCSS

Referência à duplicação massiva em `_index.scss` de chat .

---

## TASK 6.1 — Introduzir Tokens Base

### Arquivos a serem LIDOS

* `scss/components/chat/_index.scss`
* `scss/components/sheet-base/_placeholders.scss`
* `scss/components/inventory/_index.scss`

### Arquivos a serem CRIADOS

* `scss/components/core/_tokens.scss`
* `scss/components/core/_mixins.scss`
* `scss/components/core/_components.scss`

### Arquivos a serem MODIFICADOS

* `scss/components/chat/_index.scss`
* `scss/components/inventory/_index.scss`
* `scss/components/skills/_index.scss`
* `scss/components/advantages-feats/_index.scss`

### Critérios de Aceite

* Visual não muda.
* Nenhuma classe removida ainda.
* Introdução paralela segura.

---

# Ordem Recomendada de Execução

1. TASK 1.2 (text utils)
2. TASK 1.1 (normalizers)
3. TASK 2.1 (roll helpers + flow)
4. TASK 4.1 (dialog abstraction)
5. TASK 3.1 (damage modularização)
6. TASK 3.2 (ability listeners split)
7. TASK 5.1 (HBS components)
8. TASK 6.1 (SCSS base system)

---

Se desejar, posso agora:

* Transformar isso em backlog Jira-style
* Converter em checklist para IA autônoma
* Gerar plano de PR incremental
* Criar roadmap de 3 sprints detalhado
