# Relatório de Code Smells - remasters-rpg

**Escopo**
Sem mudanças de código. Análise estática em `src/`, `templates/` e `scss/` (105 arquivos, 13.526 LoC).  
Skills do AGENTS: nenhuma aplicável (as disponíveis são de criação/instalação de skills, não de code review).

## A) Inventário e Métricas

Métricas gerais:
- Arquivos por tipo: `ts` 60, `hbs` 17, `scss` 28.
- "Arquivo grande" (>500 LoC): 5 arquivos.
- "Função grande" (>80 LoC): 12 funções.
- `switch` extensos: não encontrei `switch` no código-fonte.

Top 30 arquivos por LoC (com motivo provável):

| # | Arquivo | LoC | Tipo | Motivo provável |
|---|---|---:|---|---|
| 1 | `scss/components/chat/_index.scss` | 1162 | scss | 6 variações de chat card no mesmo arquivo |
| 2 | `src/sheets/player/rolls/damage.ts` | 871 | ts | pipeline completo de dano (UI + regra + chat + aplicação) |
| 3 | `src/abilities/rules.ts` | 694 | ts | tabela de regras + normalização + custo + opções |
| 4 | `scss/components/item-sheet/_ability.scss` | 550 | scss | estilos de abas/details/additional-settings juntos |
| 5 | `src/sheets/player/abilities/chat.ts` | 536 | ts | cast chat + ataque/secundário/dano + hooks |
| 6 | `src/sheets/item/context.ts` | 489 | ts | contexto de múltiplos tipos de item + regras de habilidade |
| 7 | `src/sheets/item/ability/listeners.ts` | 450 | ts | 13+ ações de UI com persistência e validação |
| 8 | `templates/items/partials/ability.hbs` | 397 | hbs | template extenso com muitas seções e controles |
| 9 | `scss/components/inventory/_index.scss` | 382 | scss | tabela, linhas expansíveis, estado e barra de carga |
| 10 | `scss/components/sheet-base/_status.scss` | 326 | scss | todos os cards de status/derived no mesmo mixin |
| 11 | `src/sheets/player/rolls/check.ts` | 285 | ts | cálculo de resultado + render de chat card |
| 12 | `scss/components/dialogs/_index.scss` | 276 | scss | estilos gerais + diálogo de dano detalhado |
| 13 | `src/sheets/item/tags.ts` | 267 | ts | editor de tags completo (CRUD + sugestões + UX) |
| 14 | `src/documents/actor.ts` | 243 | ts | derived data + custo de habilidades + rolagens |
| 15 | `src/sheets/item/sheet.ts` | 240 | ts | ciclo de update sanitizando múltiplas estruturas |
| 16 | `src/sheets/player/actions/listeners.ts` | 235 | ts | listeners de ataque/dano/criação de ação |
| 17 | `scss/components/advantages-feats/_index.scss` | 215 | scss | lista de feats com expansão e ações |
| 18 | `scss/components/sheet-base/_actions.scss` | 214 | scss | estilos de ações gerais + ataque |
| 19 | `templates/actors/partials/tabs/actions.hbs` | 214 | hbs | 3 listas de ações com muitos botões/estados |
| 20 | `src/sheets/actor/dialogs.ts` | 211 | ts | múltiplos dialogs com HTML inline |
| 21 | `scss/components/item-sheet/_weapon.scss` | 194 | scss | formulário de arma + blocos de bônus |
| 22 | `scss/components/abilities/_index.scss` | 186 | scss | cards de PC + tabela de habilidades |
| 23 | `src/sheets/actor/listeners.ts` | 176 | ts | listeners gerais + reorder/drag + delegação por tipo |
| 24 | `templates/actors/partials/left-column.hbs` | 166 | hbs | coluna com muitos cards/ações inline |
| 25 | `scss/components/item-sheet/_tags.scss` | 164 | scss | sistema de tags com editor e autosuggest |
| 26 | `scss/components/item-sheet/_base.scss` | 162 | scss | base visual de item sheet e tabs |
| 27 | `src/sheets/player/rolls/dialog.ts` | 156 | ts | diálogo dinâmico de modificadores |
| 28 | `templates/items/partials/weapon.hbs` | 149 | hbs | formulário de arma completo |
| 29 | `templates/actors/partials/tabs/inventory.hbs` | 149 | hbs | tabela de inventário com detalhes por linha |
| 30 | `scss/components/skills/_index.scss` | 148 | scss | grid de skills e controles de rolagem |

Hotspots de complexidade (funções >80 linhas):
- `buildItemContext` em `src/sheets/item/context.ts:66` (424)
- `setupAbilityListeners` em `src/sheets/item/ability/listeners.ts:142` (309)
- `setupTagSystem` em `src/sheets/item/tags.ts:46` (222)
- `bindPlayerActionListeners` em `src/sheets/player/actions/listeners.ts:27` (209)
- `openDamageRollDialog` em `src/sheets/player/rolls/damage.ts:400` (167)
- `activateActorListeners` em `src/sheets/actor/listeners.ts:16` (161)
- `openRollDialog` em `src/sheets/player/rolls/dialog.ts:4` (153)
- `bindPlayerSkillListeners` em `src/sheets/player/skills/listeners.ts:9` (107)
- `buildDamageEntriesFromItem` em `src/sheets/player/rolls/damage.ts:166` (101)
- `prepareDerivedData` em `src/documents/actor.ts:12` (89)
- `sanitizeAbilityData` em `src/abilities/rules.ts:468` (87)
- `buildActorContext` em `src/sheets/actor/context.ts:8` (84)

Hotspots por branching (`if` alto):
- `src/sheets/player/rolls/damage.ts` 44 `if`
- `src/sheets/item/ability/listeners.ts` 42 `if`
- `src/sheets/player/abilities/chat.ts` 36 `if`
- `src/sheets/item/tags.ts` 28 `if`
- `src/sheets/item/context.ts` 24 `if`
- `src/abilities/rules.ts` 23 `if`
- `src/sheets/item/sheet.ts` 21 `if`
- `src/sheets/player/actions/listeners.ts` 21 `if`

Arquivos com imports/exports altos e responsabilidades misturadas:
- `src/abilities/rules.ts` (2 imports, 36 exports): dados + regras + normalização + custo + descrição.
- `src/sheets/player/abilities/chat.ts` (8 imports): render card + lógica de combate + hook.
- `src/documents/actor.ts` (6 imports, 4 exports): derived data + cálculo de custo + roll methods.
- `src/sheets/item/sheet.ts` (8 imports): ciclo de form/update + saneamento + tags automáticas.
- `src/system.ts` (8 imports): bootstrapping, settings e hooks globais.

## B) Duplicação e Abstração (JS/TS/HBS)

### 1) Fluxo de rolagem/check/dano/chat card
Ocorrências: `src/sheets/player/actions/listeners.ts:27`, `src/sheets/player/skills/listeners.ts:9`, `src/sheets/player/abilities/chat.ts:261`, `src/sheets/player/rolls/check.ts:234`, `src/sheets/player/rolls/damage.ts:808`, `src/sheets/player/rolls/reiki.ts:40`.  
Intenção comum: montar modificadores, abrir diálogo, executar rolagem, gerar card de chat, executar efeito pós-roll.  
Diferenças: origem dos modificadores, DC alvo, tipo de card, ações secundárias (dano/reiki).  
API genérica proposta:  
`runCheckFlow(input: { actor, label, modifiers: RollModifier[], dc?: number|null, targetInfoLabel?: string, breakdownTags?: string[], damageButton?: {...}, afterRoll?: (result)=>Promise<void> }): Promise<CheckResult>` em `src/sheets/player/rolls/flow.ts`.  
Plano de migração incremental:
1. Extrair `resolveTargetDc` e `buildBreakdownTags` (`src/sheets/player/rolls/helpers.ts`).
2. Migrar `skills/listeners.ts` e `actions/listeners.ts`.
3. Migrar `abilities/chat.ts`.
Risco e teste Foundry: risco baixo-médio; validar rolagem com/sem alvo, botão de dano no chat, reiki surge opcional.

### 2) Construção de dialogs/forms
Ocorrências: `src/sheets/player/rolls/dialog.ts:4`, `src/sheets/player/rolls/damage.ts:400`, `src/sheets/actor/dialog-utils.ts:3`, `src/sheets/actor/dialogs.ts:5`, `src/sheets/player/skills/dialogs.ts:5`.  
Intenção comum: abrir Dialog, capturar inputs, validar, confirmar/cancelar, retornar payload.  
Diferenças: formulários estáticos vs dinâmicos (linhas adicionáveis).  
API genérica proposta:  
`openFormDialog<T>(config: { title, template?, content, initialState, validate?, onSave }): Promise<T|null>` em `src/ui/dialogs/form-dialog.ts`.  
Plano de migração incremental:
1. Consolidar `showDialog` e `Dialog.prompt` num wrapper único.
2. Migrar `openRollDialog`.
3. Migrar `openDamageRollDialog`.
Risco e teste Foundry: risco médio (UX modal); testar cancel/save, campos inválidos, persistência de checkboxes.

### 3) Validação/parsing de dados (fórmulas, tags, ability config)
Ocorrências: `src/sheets/item/sheet.ts:64`, `src/sheets/item/context.ts:34`, `src/sheets/player/abilities/chat.ts:96` (normalizeAbilityConfig); `src/sheets/player/rolls/damage.ts:102` e `src/sheets/player/abilities/chat.ts:87` (normalizeDamageType); `src/sheets/item/sheet.ts:19`, `src/sheets/item/ability/listeners.ts:18`, `src/abilities/category-effects.ts:12`, `src/sheets/item/tags.ts:6`, `src/sheets/player/item-summary.ts:25` (tags).  
Intenção comum: normalizar estruturas heterogêneas vindas de formData/documento e deduplicar dados.  
Diferenças: default values e formato de retorno (array, set, objeto forte).  
API genérica proposta:  
`normalizeAbilityConfig(raw): AbilityConfigData`, `normalizeDamageType(raw): DamageType`, `normalizeTags(raw, opts): TagEntry[]` em `src/abilities/normalizers.ts` e `src/utils/tags.ts`.  
Plano de migração incremental:
1. Extrair funções puras e adicionar testes unitários.
2. Usar no `item/sheet.ts` e `abilities/chat.ts`.
3. Migrar `item/context.ts`, `item/ability/listeners.ts`, `category-effects.ts`.
Risco e teste Foundry: risco médio (dados salvos); testar criação/edição de habilidade, tags manuais + automáticas, cálculo de custo pós-save.

### 4) Renderização/templating repetido (HBS + HTML string em TS)
Ocorrências: `templates/actors/partials/tabs/inventory.hbs:55`, `templates/actors/partials/tabs/abilities.hbs:65`, `templates/actors/partials/tabs/main.hbs:85` (linhas expansíveis com ícone/nome/ações/detalhes); `src/sheets/player/rolls/check.ts:112`, `src/sheets/player/rolls/reiki.ts:4`, `src/sheets/player/abilities/chat.ts:307`, `src/sheets/player/rolls/damage.ts:662`, `src/sheets/player/feats/chat.ts:3` (cards de chat).  
Intenção comum: mesmo esqueleto visual de card/row com variação de conteúdo.  
Diferenças: campos específicos e ações de cada card.  
API genérica proposta:  
`renderTemplate("systems/remasters-rpg/templates/chat/cards/<type>.hbs", data)` e partials de row em `templates/actors/partials/components/`.  
Plano de migração incremental:
1. Criar partial `section-header.hbs` e `item-row-actions.hbs`.
2. Migrar inventory/abilities/feats rows.
3. Migrar cards TS para HBS.
Risco e teste Foundry: risco médio (quebra visual); testar render em PT/EN, escape de conteúdo, botões no chat.

### 5) Helpers repetidos (formatadores/i18n/labels)
Ocorrências: `src/sheets/player/rolls/check.ts:52` (escapeHtml local), `src/sheets/player/item-summary.ts:52` (escapeHtml util), `src/sheets/player/rolls/check.ts:60` (formatSigned local) e `src/sheets/global-functions/utils.ts:19` (formatSigned), `src/sheets/player/actions/listeners.ts:28` e `src/sheets/player/abilities/chat.ts:183` (resolveTargetDc).  
Intenção comum: utilidades transversais de apresentação e regras leves.  
Diferenças: pequenas diferenças de assinatura/local de uso.  
API genérica proposta:  
`src/utils/text.ts` (`escapeHtml`, `toPlainText`), `src/sheets/player/rolls/helpers.ts` (`formatSigned`, `resolveTargetDc`, `buildBreakdownTags`).  
Plano de migração incremental:
1. Consolidar `escapeHtml` e `formatSigned`.
2. Substituir duplicados em check/actions/abilities/damage.
3. Remover versões locais.
Risco e teste Foundry: baixo; validar conteúdo em chat, sinais `+/-`, target DC em ataque e cast.

## C) Componentes e Arquitetura UI

Componentes candidatos a base/reuso:
- Base card: status cards + seção inventory/skills/abilities + chat cards (`scss/components/sheet-base/_placeholders.scss:9`, `scss/components/chat/_index.scss:18`).
- Row component: `equipment-row`, `ability-row`, `feat-row`, `action-item-row` (`templates/actors/partials/tabs/inventory.hbs:55`, `templates/actors/partials/tabs/abilities.hbs:65`, `templates/actors/partials/tabs/main.hbs:85`, `templates/actors/partials/tabs/actions.hbs:20`).
- Section header component: repetido em tabs (`templates/actors/partials/tabs/main.hbs:30`, `templates/actors/partials/tabs/actions.hbs:4`, `templates/actors/partials/tabs/inventory.hbs:11`).
- Data-action behavior: bind manual repetido (`src/sheets/actor/listeners.ts:16`, `src/sheets/item/ability/listeners.ts:142`, `src/sheets/player/actions/listeners.ts:27`).

Antes (atual):

```text
src/sheets/player/*/listeners.ts (cada arquivo fazendo binding manual)
src/sheets/player/*/chat.ts (cards em string template)
templates/actors/partials/tabs/*.hbs (blocos repetidos de header/row/actions)
scss/components/* (componentes visuais repetidos sem base comum suficiente)
```

Depois (sugestão arquitetural):

```text
src/ui/events/data-actions.ts
src/ui/dialogs/form-dialog.ts
src/sheets/player/rolls/flow.ts
src/sheets/player/rolls/helpers.ts
src/utils/text.ts
src/utils/tags.ts
templates/actors/partials/components/section-header.hbs
templates/actors/partials/components/item-row.hbs
templates/chat/cards/base.hbs
templates/chat/cards/check.hbs
templates/chat/cards/damage.hbs
templates/chat/cards/reiki.hbs
templates/chat/cards/cast.hbs
templates/chat/cards/feat.hbs
scss/components/core/_tokens.scss
scss/components/core/_mixins.scss
scss/components/core/_components.scss
```

## D) CSS/SCSS: Genéricos e Design System Leve

Mapa de seletores/blocos repetidos:
- Chat card shell repetido 6x em `scss/components/chat/_index.scss:18`, `scss/components/chat/_index.scss:369`, `scss/components/chat/_index.scss:512`, `scss/components/chat/_index.scss:685`, `scss/components/chat/_index.scss:976`, `scss/components/chat/_index.scss:1022`.
- Avatar/nome/usuário repetidos >=5x em `scss/components/chat/_index.scss:36`, `scss/components/chat/_index.scss:49`, `scss/components/chat/_index.scss:59` e equivalentes `reiki/cast/damage/feat`.
- Tags pill de chat repetidas >=3x em `scss/components/chat/_index.scss:89`, `scss/components/chat/_index.scss:582`, `scss/components/chat/_index.scss:756`.
- Botões de remoção "danger icon" repetidos >=8 classes: `scss/components/inventory/_index.scss:293`, `scss/components/advantages-feats/_index.scss:132`, `scss/components/item-sheet/_weapon.scss:182`, `scss/components/item-sheet/_ability.scss:482`, `scss/components/advancements/_index.scss:43`, `scss/components/skills/_index.scss:133`, `scss/components/sheet-base/_actions.scss:172`.
- Surface cards repetidos em várias áreas: `scss/components/skills/_index.scss:7`, `scss/components/advantages-feats/_index.scss:7`, `scss/components/inventory/_index.scss:38`, `scss/components/abilities/_index.scss:16`, `scss/components/personal/_index.scss:10`, `scss/components/item-sheet/_weapon.scss:14`.

Tokens sugeridos (expandir os já existentes):
- Cores semânticas: `--rmrpg-color-danger`, `--rmrpg-color-info`, `--rmrpg-color-muted-bg`, `--rmrpg-color-muted-border`.
- Espaçamento: `--rmrpg-space-1..6`.
- Radius: `--rmrpg-radius-sm/md/lg/pill`.
- Sombra: `--rmrpg-shadow-card`, `--rmrpg-shadow-focus`.
- Tipografia: `--rmrpg-font-xs/sm/md/lg`, `--rmrpg-font-weight-semibold/bold`.

Utilitários sugeridos:
- `.rmrpg-u-flex`, `.rmrpg-u-grid`, `.rmrpg-u-gap-sm`, `.rmrpg-u-surface`, `.rmrpg-u-muted`, `.rmrpg-u-pill`.

Componentes base sugeridos:
- `.rmrpg-card`, `.rmrpg-chat-card`, `.rmrpg-row`, `.rmrpg-icon-btn`, `.rmrpg-btn`, `.rmrpg-badge`, `.rmrpg-section-header`.

Nomenclatura:
- Híbrido recomendado: BEM para componentes (`.rmrpg-card__header`) + utilitários leves (`.rmrpg-u-*`), preservando classes atuais para compatibilidade.

Compatibilidade (sem quebrar sheets existentes):
1. Introduzir classes base novas em paralelo (sem remover classes antigas).
2. Usar seletores combinados antigo+novo durante 1-2 releases.
3. Migrar templates gradualmente por aba.
4. Só remover aliases após validação completa em player/npc/item sheets.

## E) Relatório Final

Resumo executivo (<=15 linhas):
1. O sistema está funcional, mas com concentração alta de responsabilidade em poucos arquivos-chave.
2. Há 5 arquivos >500 LoC e 12 funções >80 linhas, principalmente em contexto/listeners/roll/chat.
3. A duplicação mais cara hoje está em fluxo de rolagem/chat e normalização de dados de habilidade/tags.
4. A camada de chat repete muito CSS e HTML estrutural em 5-6 cards diferentes.
5. Em TS, há duplicação clara de `normalizeAbilityConfig`, `normalizeDamageType`, parsing de tags e montagem de modificadores.
6. Em HBS, linhas de item e cabeçalhos de seção estão repetidos entre inventory/abilities/feats/actions.
7. Não há `switch` extensos; a complexidade vem de muitos `if` e handlers de `data-action` concentrados.
8. O melhor ROI imediato: extrair utilitários puros (config/tags/roll helpers) e dividir 3 funções monolíticas.
9. O maior refactor estrutural: pipeline único de rolagem/chat e templates HBS para cards de chat.
10. No CSS, um mini design system com componentes base reduziria duplicação sem quebra visual.

Top 10 refactors priorizados (Impacto x Esforço x Risco):

| # | Refactor | Impacto | Esforço | Risco |
|---|---|---:|---:|---:|
| 1 | Extrair `normalizeAbilityConfig`/`normalizeDamageType`/`normalizeTags` para utilitários únicos | 5 | 2 | 2 |
| 2 | Extrair `resolveTargetDc` + `buildBreakdownTags` para helpers de rolagem | 4 | 1 | 1 |
| 3 | Quebrar `buildItemContext` (`src/sheets/item/context.ts:66`) por tipo de item | 5 | 4 | 3 |
| 4 | Quebrar `setupAbilityListeners` (`src/sheets/item/ability/listeners.ts:142`) por domínio (category/characteristic/enhancement/bonus) | 5 | 4 | 3 |
| 5 | Unificar fluxo check/attack em `runCheckFlow` | 5 | 3 | 2 |
| 6 | Extrair `openFormDialog` base para reuso em roll/damage/actor dialogs | 4 | 3 | 2 |
| 7 | Migrar cards de chat para templates HBS (`renderTemplate`) | 4 | 4 | 3 |
| 8 | Criar dispatcher de `data-action` para listeners de sheet | 4 | 3 | 2 |
| 9 | Criar partials HBS reutilizáveis para section header e item rows | 4 | 3 | 2 |
| 10 | Introduzir base SCSS `.rmrpg-card/.rmrpg-icon-btn/.rmrpg-badge` e aliases | 5 | 3 | 2 |

Ações curtas (quick wins):
1. Centralizar `escapeHtml` e `formatSigned` (remover duplicatas locais em `check.ts`).
2. Reusar `resolveTargetDc` entre `actions/listeners.ts` e `abilities/chat.ts`.
3. Criar helper `withSubmitAndRenderSafe(event, sheet)` para reduzir repetição de `_onSubmit`.
4. Padronizar botões de remover com um mixin SCSS (`danger-icon-button`).
5. Extrair `buildActorChatMeta` (nome/avatar/user) para cards de chat.

Ações estruturais (refactors maiores):
1. Modularizar `src/sheets/player/rolls/damage.ts` em `damage-dialog.ts`, `damage-eval.ts`, `damage-chat.ts`, `damage-apply.ts`.
2. Reorganizar listeners de habilidade de item em submódulos.
3. Introduzir camada de templates de chat em `templates/chat/cards/`.
4. Criar biblioteca de componentes HBS em `templates/actors/partials/components/`.
5. Evoluir design system SCSS para tokens + mixins + componentes reutilizáveis.

Checklist de validação no Foundry:
1. Abrir sheets de `player`, `npc`, `summon` e validar render sem erro de template.
2. Testar criação/edição de `weapon`, `ability`, `category-effect`, `feat`.
3. Testar ataque e dano por aba de ações (com e sem alvo selecionado).
4. Testar cast de habilidade (ataque/secundário/dano) via card de chat.
5. Testar rolagem de skill + derived + reiki surge.
6. Testar drag/drop reorder em feats, habilidades, inventário e ações.
7. Testar add/remove de bônus em weapon e ability.
8. Testar sistema de tags (add/edit/remove/sugestões/locks automáticos).
9. Testar setting `gmSecretTargetInfo` e visualização por GM/jogador.
10. Testar tema `punkCityTheme` e re-render de janelas.
