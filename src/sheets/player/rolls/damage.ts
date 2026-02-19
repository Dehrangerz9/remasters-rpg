import { RollModifier } from "../../actor/config.js";
import { getAttributeLabel } from "../../actor/helpers.js";
import { formatSigned, localize, normalizeBonusArray } from "../../global-functions/utils.js";
import { escapeHtml } from "../item-summary.js";
import { rollReikiSurge } from "./reiki.js";

type DamageTypeId = "physical" | "elemental" | "mental" | "deteriorating" | "none";

type DamageEntry = {
  key?: string;
  label: string;
  formula: string;
  damageType: DamageTypeId;
  checked: boolean;
};

type DamageModifierEntry = RollModifier & {
  damageType: DamageTypeId;
};

type DamageDialogData = {
  entries: DamageEntry[];
  modifiers: DamageModifierEntry[];
  criticalMultiplier: number;
};

type DamageDialogResult = {
  entries: DamageEntry[];
  modifiers: DamageModifierEntry[];
  criticalMultiplier: number;
} | null;

type DamageTermRoll = {
  entry: DamageEntry;
  total: number;
};

type DamageRollResult = {
  actor: any;
  item: any;
  sourceLabel: string;
  tags: string[];
  terms: DamageTermRoll[];
  modifiers: DamageModifierEntry[];
  criticalMultiplier: number;
  subtotal: number;
  total: number;
  breakdownValues: number[];
};

export type DamageRollRequest = {
  actor: any;
  item?: any;
  fallbackFormula?: string;
  itemName?: string;
  sourceLabel?: string;
  criticalMultiplier?: number;
};

const DAMAGE_TYPE_META: Record<
  DamageTypeId,
  { labelKey: string; icon: string; css: string }
> = {
  physical: {
    labelKey: "RMRPG.Item.Weapon.DamageType.Physical",
    icon: "fas fa-fist-raised",
    css: "physical"
  },
  elemental: {
    labelKey: "RMRPG.Item.Weapon.DamageType.Elemental",
    icon: "fas fa-fire",
    css: "elemental"
  },
  mental: {
    labelKey: "RMRPG.Item.Weapon.DamageType.Mental",
    icon: "fas fa-brain",
    css: "mental"
  },
  deteriorating: {
    labelKey: "RMRPG.Item.Weapon.DamageType.Deteriorating",
    icon: "fas fa-flask",
    css: "deteriorating"
  },
  none: {
    labelKey: "RMRPG.Item.Weapon.DamageType.None",
    icon: "",
    css: "none"
  }
};

const escapeAttr = (value: unknown) => escapeHtml(value).replace(/`/g, "&#96;");

const normalizeDamageType = (value: unknown): DamageTypeId => {
  const key = String(value ?? "none").trim().toLowerCase();
  if (key === "physical") return "physical";
  if (key === "elemental") return "elemental";
  if (key === "mental") return "mental";
  if (key === "deteriorating") return "deteriorating";
  return "none";
};

const toSafeInteger = (value: unknown, fallback = 0) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.floor(parsed);
};

const sanitizeFormula = (value: unknown) => String(value ?? "").trim();

const toEvaluableFormula = (value: string) => {
  const trimmed = sanitizeFormula(value);
  if (!trimmed) return "0";
  if (trimmed.startsWith("+")) return trimmed.slice(1).trim() || "0";
  return trimmed;
};

const getDamageTypeLabel = (damageType: DamageTypeId) => localize(DAMAGE_TYPE_META[damageType].labelKey);

const getDamageTypeBadge = (damageType: DamageTypeId) => {
  const meta = DAMAGE_TYPE_META[damageType];
  const iconMarkup = meta.icon ? `<i class="${meta.icon}" aria-hidden="true"></i>` : "";
  return `
    <span class="rmrpg-damage-type-badge rmrpg-damage-type-${meta.css}">
      ${iconMarkup}
      <span>${escapeHtml(localize(meta.labelKey))}</span>
    </span>
  `;
};

const getModifierTypeOptions = () => [
  localize("RMRPG.Dialogs.Roll.Types.Attribute"),
  localize("RMRPG.Dialogs.Roll.Types.State"),
  localize("RMRPG.Dialogs.Roll.Types.Skill"),
  localize("RMRPG.Dialogs.Roll.Types.Situational"),
  localize("RMRPG.Dialogs.Roll.Types.Untyped")
];

const getDamageTypeOptions = () =>
  (Object.keys(DAMAGE_TYPE_META) as DamageTypeId[]).map((key) => ({
    value: key,
    label: localize(DAMAGE_TYPE_META[key].labelKey)
  }));

const formatBreakdown = (values: number[]) => {
  if (!values.length) return "(0)";
  let label = "";
  values.forEach((value, index) => {
    if (index === 0) {
      label = `${value}`;
      return;
    }
    label += value >= 0 ? ` + ${value}` : ` - ${Math.abs(value)}`;
  });
  return `(${label})`;
};

const buildDamageEntriesFromItem = (actor: any, item: any) => {
  const entries: DamageEntry[] = [];
  const modifiers: DamageModifierEntry[] = [];

  if (!item || item.type !== "weapon") {
    return { entries, modifiers };
  }

  const rawDamage = item.system?.weapon?.damage ?? {};
  const baseDice = toSafeInteger(rawDamage.base?.dice, 0);
  const baseDie = String(rawDamage.base?.die ?? "d6").trim() || "d6";
  const baseType = normalizeDamageType(rawDamage.base?.type);

  if (baseDice > 0) {
    entries.push({
      key: "base",
      label: localize("RMRPG.Dialogs.Damage.BaseDamage"),
      formula: `${baseDice}${baseDie}`,
      damageType: baseType,
      checked: true
    });
  }

  const bonusEntries = normalizeBonusArray(rawDamage.bonuses);
  bonusEntries.forEach((bonus: any, index: number) => {
    const formula = sanitizeFormula(bonus?.formula);
    if (!formula) return;
    entries.push({
      key: `bonus-${index}`,
      label: localize("RMRPG.Dialogs.Damage.BonusDamage", { index: index + 1 }),
      formula,
      damageType: normalizeDamageType(bonus?.type),
      checked: true
    });
  });

  const attributeKey = String(rawDamage.attribute ?? "none");
  if (attributeKey !== "none") {
    const attributeValue = toSafeInteger(actor?.system?.attributes?.[attributeKey]?.value, 0);
    modifiers.push({
      key: "damage-attribute",
      name: getAttributeLabel(attributeKey),
      type: localize("RMRPG.Dialogs.Roll.Types.Attribute"),
      value: attributeValue,
      checked: true,
      damageType: baseType
    });
  }

  return { entries, modifiers };
};

const buildFallbackDamageEntries = (formula: string) => {
  const trimmed = sanitizeFormula(formula);
  if (!trimmed) return [];
  return [
    {
      key: "fallback",
      label: localize("RMRPG.Dialogs.Damage.BaseDamage"),
      formula: trimmed,
      damageType: "none" as DamageTypeId,
      checked: true
    }
  ];
};

const collectCardTags = (item: any) => {
  const tags: string[] = [];
  const seen = new Set<string>();
  const push = (value: unknown) => {
    const label = String(value ?? "").trim();
    if (!label) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tags.push(label);
  };

  if (item) {
    push(localize("RMRPG.Dialogs.Damage.TagAttack"));
  }

  const rawTags = Array.isArray(item?.system?.tags) ? item.system.tags : [];
  rawTags.forEach((entry: any) => {
    if (typeof entry === "string") {
      push(entry);
      return;
    }
    push(entry?.name);
  });

  return tags.map((entry) => entry.toUpperCase());
};

const renderDamageRows = (entries: DamageEntry[]) =>
  entries
    .map(
      (entry, index) => `
      <div class="rmrpg-damage-dialog-row">
        <div class="rmrpg-damage-dialog-cell rmrpg-damage-dialog-label">${escapeHtml(entry.label)}</div>
        <div class="rmrpg-damage-dialog-cell rmrpg-damage-dialog-formula">${escapeHtml(entry.formula)}</div>
        <div class="rmrpg-damage-dialog-cell rmrpg-damage-dialog-type">${getDamageTypeBadge(entry.damageType)}</div>
        <div class="rmrpg-damage-dialog-cell rmrpg-damage-dialog-toggle">
          <label class="rmrpg-damage-switch">
            <input type="checkbox" data-role="damage-toggle" data-index="${index}" ${entry.checked ? "checked" : ""} />
            <span></span>
          </label>
        </div>
      </div>
    `
    )
    .join("");

const renderModifierRows = (modifiers: DamageModifierEntry[]) =>
  modifiers
    .map(
      (modifier, index) => `
      <div class="rmrpg-damage-dialog-row">
        <div class="rmrpg-damage-dialog-cell rmrpg-damage-dialog-label">${escapeHtml(modifier.name)}</div>
        <div class="rmrpg-damage-dialog-cell rmrpg-damage-dialog-formula">${escapeHtml(modifier.type)} ${escapeHtml(
          formatSigned(toSafeInteger(modifier.value, 0))
        )}</div>
        <div class="rmrpg-damage-dialog-cell rmrpg-damage-dialog-type">${getDamageTypeBadge(modifier.damageType)}</div>
        <div class="rmrpg-damage-dialog-cell rmrpg-damage-dialog-toggle">
          <label class="rmrpg-damage-switch">
            <input type="checkbox" data-role="modifier-toggle" data-index="${index}" ${modifier.checked ? "checked" : ""} />
            <span></span>
          </label>
        </div>
      </div>
    `
    )
    .join("");

const buildPreviewMarkup = (
  entries: DamageEntry[],
  modifiers: DamageModifierEntry[],
  criticalMultiplier: number
) => {
  const selectedEntries = entries.filter((entry) => entry.checked);
  const selectedModifiers = modifiers.filter((modifier) => modifier.checked);
  const pieces: Array<{ html: string; negative: boolean }> = [];

  selectedEntries.forEach((entry) => {
    const meta = DAMAGE_TYPE_META[entry.damageType];
    const iconMarkup = meta.icon ? ` <i class="${meta.icon}" aria-hidden="true"></i>` : "";
    pieces.push({
      html: `<span class="rmrpg-damage-preview-term rmrpg-damage-preview-${meta.css}">${escapeHtml(entry.formula)}${iconMarkup}</span>`,
      negative: false
    });
  });

  selectedModifiers.forEach((modifier) => {
    const value = toSafeInteger(modifier.value, 0);
    const meta = DAMAGE_TYPE_META[modifier.damageType];
    const iconMarkup = meta.icon ? ` <i class="${meta.icon}" aria-hidden="true"></i>` : "";
    pieces.push({
      html: `<span class="rmrpg-damage-preview-term rmrpg-damage-preview-${meta.css}">${escapeHtml(
        `${Math.abs(value)}`
      )}${iconMarkup}</span>`,
      negative: value < 0
    });
  });

  if (!pieces.length) {
    return `<span class="rmrpg-damage-preview-empty">${escapeHtml(localize("RMRPG.Dialogs.Damage.NoSelection"))}</span>`;
  }

  const multiplierLabel =
    Number.isFinite(criticalMultiplier) && Math.abs(criticalMultiplier - 1) > 0.0001
      ? `<span class="rmrpg-damage-preview-mult">x${criticalMultiplier}</span>`
      : "";
  let markup = "";
  pieces.forEach((piece, index) => {
    if (index > 0) {
      markup += `<span class="rmrpg-damage-preview-sep">${piece.negative ? "-" : "+"}</span>`;
    } else if (piece.negative) {
      markup += `<span class="rmrpg-damage-preview-sep">-</span>`;
    }
    markup += piece.html;
  });
  return `${markup}${multiplierLabel}`;
};

const openDamageRollDialog = async (title: string, initialData: DamageDialogData): Promise<DamageDialogResult> => {
  const entries = initialData.entries.map((entry) => ({ ...entry }));
  const modifiers = initialData.modifiers.map((modifier) => ({ ...modifier }));
  const typeOptions = getModifierTypeOptions();
  const damageTypeOptions = getDamageTypeOptions();

  const typeOptionsHtml = typeOptions.map((option) => `<option value="${escapeAttr(option)}">${escapeHtml(option)}</option>`).join("");
  const damageTypeOptionsHtml = damageTypeOptions
    .map((option) => `<option value="${option.value}">${escapeHtml(option.label)}</option>`)
    .join("");

  const content = `
    <div class="rmrpg-damage-dialog">
      <section class="rmrpg-damage-dialog-section">
        <h3>${escapeHtml(localize("RMRPG.Dialogs.Damage.Dice"))}</h3>
        <div class="rmrpg-damage-dialog-head">
          <span>${escapeHtml(localize("RMRPG.Dialogs.Damage.Label"))}</span>
          <span>${escapeHtml(localize("RMRPG.Dialogs.Damage.Formula"))}</span>
          <span>${escapeHtml(localize("RMRPG.Dialogs.Roll.Type"))}</span>
          <span>${escapeHtml(localize("RMRPG.Dialogs.Roll.Include"))}</span>
        </div>
        <div data-role="damage-rows">${renderDamageRows(entries)}</div>
        <div class="rmrpg-damage-dialog-add">
          <input type="text" data-role="add-damage-label" placeholder="${escapeAttr(localize("RMRPG.Dialogs.Damage.Label"))}" />
          <input type="text" data-role="add-damage-formula" placeholder="1d6" />
          <select data-role="add-damage-type">${damageTypeOptionsHtml}</select>
          <button type="button" data-role="add-damage">${escapeHtml(localize("RMRPG.Dialogs.Roll.Add"))}</button>
        </div>
      </section>
      <section class="rmrpg-damage-dialog-section">
        <h3>${escapeHtml(localize("RMRPG.Dialogs.Damage.Modifiers"))}</h3>
        <div class="rmrpg-damage-dialog-head">
          <span>${escapeHtml(localize("RMRPG.Dialogs.Roll.Modifier"))}</span>
          <span>${escapeHtml(localize("RMRPG.Dialogs.Damage.TypeValue"))}</span>
          <span>${escapeHtml(localize("RMRPG.Item.Weapon.DamageTypeLabel"))}</span>
          <span>${escapeHtml(localize("RMRPG.Dialogs.Roll.Include"))}</span>
        </div>
        <div data-role="modifier-rows">${renderModifierRows(modifiers)}</div>
        <div class="rmrpg-damage-dialog-add rmrpg-damage-dialog-add-mod">
          <input type="text" data-role="add-modifier-name" placeholder="${escapeAttr(localize("RMRPG.Dialogs.Roll.Modifier"))}" />
          <input type="number" data-role="add-modifier-value" placeholder="1" />
          <select data-role="add-modifier-type">${typeOptionsHtml}</select>
          <select data-role="add-modifier-damage-type">${damageTypeOptionsHtml}</select>
          <button type="button" data-role="add-modifier">${escapeHtml(localize("RMRPG.Dialogs.Roll.Add"))}</button>
        </div>
      </section>
      <div class="rmrpg-damage-dialog-preview" data-role="damage-preview"></div>
    </div>
  `;

  return new Promise<DamageDialogResult>((resolve) => {
    let resolved = false;

    const sync = (html: JQuery) => {
      html.find("[data-role='damage-rows']").html(renderDamageRows(entries));
      html.find("[data-role='modifier-rows']").html(renderModifierRows(modifiers));
      html.find("[data-role='damage-preview']").html(buildPreviewMarkup(entries, modifiers, initialData.criticalMultiplier));

      html.find("[data-role='damage-toggle']").on("change", (event: any) => {
        const index = Number(event.currentTarget.dataset.index ?? -1);
        if (!Number.isFinite(index) || index < 0 || index >= entries.length) return;
        entries[index].checked = Boolean(event.currentTarget.checked);
        html.find("[data-role='damage-preview']").html(buildPreviewMarkup(entries, modifiers, initialData.criticalMultiplier));
      });

      html.find("[data-role='modifier-toggle']").on("change", (event: any) => {
        const index = Number(event.currentTarget.dataset.index ?? -1);
        if (!Number.isFinite(index) || index < 0 || index >= modifiers.length) return;
        modifiers[index].checked = Boolean(event.currentTarget.checked);
        html.find("[data-role='damage-preview']").html(buildPreviewMarkup(entries, modifiers, initialData.criticalMultiplier));
      });
    };

    new Dialog({
      title,
      content,
      buttons: {
        cancel: {
          icon: "<i class='fas fa-times'></i>",
          label: game.i18n.localize("Cancel"),
          callback: () => {
            resolved = true;
            resolve(null);
          }
        },
        roll: {
          icon: "<i class='fas fa-dice-d20'></i>",
          label: localize("RMRPG.Dialogs.Damage.Roll"),
          callback: () => {
            resolved = true;
            resolve({
              entries: entries.map((entry) => ({ ...entry })),
              modifiers: modifiers.map((modifier) => ({ ...modifier })),
              criticalMultiplier: initialData.criticalMultiplier
            });
          }
        }
      },
      default: "roll",
      render: (html: JQuery) => {
        const addDamageLabel = html.find("[data-role='add-damage-label']");
        const addDamageFormula = html.find("[data-role='add-damage-formula']");
        const addDamageType = html.find("[data-role='add-damage-type']");
        const addModifierName = html.find("[data-role='add-modifier-name']");
        const addModifierValue = html.find("[data-role='add-modifier-value']");
        const addModifierType = html.find("[data-role='add-modifier-type']");
        const addModifierDamageType = html.find("[data-role='add-modifier-damage-type']");

        sync(html);

        html.find("[data-role='add-damage']").on("click", () => {
          const label = sanitizeFormula(addDamageLabel.val());
          const formula = sanitizeFormula(addDamageFormula.val());
          const damageType = normalizeDamageType(addDamageType.val());

          if (!label || !formula) {
            ui.notifications.error(localize("RMRPG.Dialogs.Damage.InvalidDamagePart"));
            return;
          }

          entries.push({
            key: `custom-damage-${entries.length + 1}`,
            label,
            formula,
            damageType,
            checked: true
          });

          addDamageLabel.val("");
          addDamageFormula.val("");
          addDamageType.val("none");
          sync(html);
        });

        html.find("[data-role='add-modifier']").on("click", () => {
          const name = sanitizeFormula(addModifierName.val());
          const rawValue = Number(addModifierValue.val());
          const type = sanitizeFormula(addModifierType.val()) || typeOptions[typeOptions.length - 1];
          const damageType = normalizeDamageType(addModifierDamageType.val());

          if (!name || !Number.isFinite(rawValue)) {
            ui.notifications.error(localize("RMRPG.Dialogs.Roll.InvalidModifier"));
            return;
          }

          modifiers.push({
            key: `custom-modifier-${modifiers.length + 1}`,
            name,
            type,
            value: Math.floor(rawValue),
            checked: true,
            damageType
          });

          addModifierName.val("");
          addModifierValue.val("");
          addModifierType.val(typeOptions[typeOptions.length - 1] ?? typeOptions[0] ?? "");
          addModifierDamageType.val("none");
          sync(html);
        });
      },
      close: () => {
        if (!resolved) resolve(null);
      }
    }).render(true);
  });
};

const evaluateDamageTerms = async (entries: DamageEntry[]) => {
  const selectedEntries = entries.filter((entry) => entry.checked);
  const terms: DamageTermRoll[] = [];
  for (const entry of selectedEntries) {
    const roll = await new Roll(toEvaluableFormula(entry.formula)).evaluate();
    terms.push({
      entry,
      total: toSafeInteger(roll.total, 0)
    });
  }
  return terms;
};

const buildFormulaMarkup = (terms: DamageTermRoll[], modifiers: DamageModifierEntry[], criticalMultiplier: number) => {
  const formulaChunks: Array<{ html: string; negative: boolean }> = [];

  terms.forEach((term) => {
    const meta = DAMAGE_TYPE_META[term.entry.damageType];
    const iconMarkup = meta.icon ? `<i class="${meta.icon}" aria-hidden="true"></i>` : "";
    formulaChunks.push({
      html: `
        <span class="rmrpg-damage-formula-term rmrpg-damage-preview-${meta.css}">
          ${escapeHtml(term.entry.formula)}
          ${iconMarkup}
        </span>
      `,
      negative: false
    });
  });

  modifiers
    .filter((modifier) => modifier.checked)
    .forEach((modifier) => {
      const value = toSafeInteger(modifier.value, 0);
      const meta = DAMAGE_TYPE_META[modifier.damageType];
      const iconMarkup = meta.icon ? `<i class="${meta.icon}" aria-hidden="true"></i>` : "";
      formulaChunks.push({
        html: `
          <span class="rmrpg-damage-formula-term rmrpg-damage-preview-${meta.css}">
            ${escapeHtml(`${Math.abs(value)}`)}
            ${iconMarkup}
          </span>
        `,
        negative: value < 0
      });
    });

  if (!formulaChunks.length) {
    return `<span class="rmrpg-damage-preview-empty">${escapeHtml(localize("RMRPG.Dialogs.Damage.NoSelection"))}</span>`;
  }

  const criticalBadge =
    Number.isFinite(criticalMultiplier) && Math.abs(criticalMultiplier - 1) > 0.0001
      ? `<span class="rmrpg-damage-critical-badge">x${criticalMultiplier}</span>`
      : "";
  let markup = "";
  formulaChunks.forEach((chunk, index) => {
    if (index > 0) {
      markup += `<span class="rmrpg-damage-formula-plus">${chunk.negative ? "-" : "+"}</span>`;
    } else if (chunk.negative) {
      markup += `<span class="rmrpg-damage-formula-plus">-</span>`;
    }
    markup += chunk.html;
  });
  return `${markup}${criticalBadge}`;
};

const buildDetailsMarkup = (result: DamageRollResult) => {
  const detailTags: string[] = [];
  result.terms.forEach((term) => {
    detailTags.push(
      `<span class="rmrpg-damage-detail">${escapeHtml(term.entry.label)} ${escapeHtml(
        formatSigned(term.total)
      )} ${escapeHtml(getDamageTypeLabel(term.entry.damageType))}</span>`
    );
  });

  result.modifiers
    .filter((modifier) => modifier.checked)
    .forEach((modifier) => {
      detailTags.push(
        `<span class="rmrpg-damage-detail">${escapeHtml(modifier.name)} ${escapeHtml(
          formatSigned(toSafeInteger(modifier.value, 0))
        )}</span>`
      );
    });

  if (!detailTags.length) {
    return `<span class="rmrpg-damage-detail rmrpg-damage-detail-empty">${escapeHtml(localize("RMRPG.Dialogs.Damage.NoSelection"))}</span>`;
  }

  return detailTags.join("");
};

const buildDamageChatContent = (result: DamageRollResult) => {
  const actorName = String(result.actor?.name ?? "-");
  const actorImg = String(result.actor?.img ?? "icons/svg/mystery-man.svg");
  const createdBy = String(game.user?.name ?? "-");
  const tagsMarkup = result.tags.length
    ? result.tags.map((tag) => `<span class="rmrpg-damage-tag">${escapeHtml(tag)}</span>`).join("")
    : `<span class="rmrpg-damage-tag rmrpg-damage-tag-muted">${escapeHtml(localize("RMRPG.Actor.Actions.Damage"))}</span>`;
  const title = localize("RMRPG.Dialogs.Damage.ChatTitle", { label: result.sourceLabel });
  const detailsMarkup = buildDetailsMarkup(result);
  const formulaMarkup = buildFormulaMarkup(result.terms, result.modifiers, result.criticalMultiplier);
  const breakdown = formatBreakdown(result.breakdownValues);

  return `
    <article class="rmrpg-damage-card" data-total="${result.total}">
      <header class="rmrpg-damage-header">
        <img class="rmrpg-damage-avatar" src="${escapeAttr(actorImg)}" alt="${escapeAttr(actorName)}" />
        <div class="rmrpg-damage-meta">
          <div class="rmrpg-damage-name">${escapeHtml(actorName)}</div>
          <div class="rmrpg-damage-user">${escapeHtml(createdBy)}</div>
        </div>
      </header>
      <h3 class="rmrpg-damage-title">${escapeHtml(title)}</h3>
      <div class="rmrpg-damage-divider"></div>
      <div class="rmrpg-damage-tags">${tagsMarkup}</div>
      <details class="rmrpg-damage-breakdown-panel">
        <summary class="rmrpg-damage-formula">${formulaMarkup}</summary>
        <div class="rmrpg-damage-roll-results">
          <div class="rmrpg-damage-details">${detailsMarkup}</div>
          <div class="rmrpg-damage-breakdown">${escapeHtml(breakdown)}</div>
        </div>
      </details>
      <div class="rmrpg-damage-total">${result.total}</div>
      <div class="rmrpg-damage-actions">
        <button type="button" data-action="damage-apply" data-mult="1">
          <i class="fas fa-heart-broken" aria-hidden="true"></i>
          <span>${escapeHtml(localize("RMRPG.Actor.Actions.Damage"))}</span>
        </button>
        <button type="button" data-action="damage-apply" data-mult="0.5">
          <i class="fas fa-divide" aria-hidden="true"></i>
          <span>${escapeHtml(localize("RMRPG.Actor.Damage.Half"))}</span>
        </button>
        <button type="button" data-action="damage-apply" data-mult="2">
          <i class="fas fa-times" aria-hidden="true"></i>
          <span>${escapeHtml(localize("RMRPG.Actor.Damage.Double"))}</span>
        </button>
        <button type="button" data-action="damage-soak-toggle" data-active="false">
          <i class="fas fa-shield-alt" aria-hidden="true"></i>
          <span>${escapeHtml(localize("RMRPG.Actor.Damage.Soak"))}</span>
        </button>
      </div>
    </article>
  `;
};

const applyDamageToTarget = async (sourceActor: any, baseDamage: number, multiplier: number, useBlock: boolean) => {
  const targets = Array.from(game.user?.targets ?? []);
  const controlled = canvas?.tokens?.controlled ?? [];
  const token = targets.length === 1 ? targets[0] : controlled.length === 1 ? controlled[0] : null;

  if (!token?.actor) {
    ui.notifications.error(localize("RMRPG.Errors.SelectSingleTarget"));
    return;
  }

  const safeBase = Number.isFinite(baseDamage) ? baseDamage : 0;
  const safeMultiplier = Number.isFinite(multiplier) ? multiplier : 1;
  const scaledDamage = Math.max(0, Math.floor(safeBase * safeMultiplier));
  const soakValue = useBlock ? Math.max(0, toSafeInteger(token.actor.system?.rank?.bonus, 0) * 2) : 0;
  const finalDamage = Math.max(0, scaledDamage - soakValue);

  const currentHp = Math.max(0, toSafeInteger(token.actor.system?.hp?.value, 0));
  const nextHp = Math.max(0, currentHp - finalDamage);
  await token.actor.update({ "system.hp.value": nextHp });

  const messageKey = useBlock ? "RMRPG.Chat.DamageAbsorbed" : "RMRPG.Chat.DamageApplied";
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: sourceActor ?? null }),
    content: localize(messageKey, {
      name: token.actor.name,
      damage: finalDamage,
      soak: soakValue
    })
  });

  if (useBlock) {
    await rollReikiSurge({ actor: token.actor });
  }
};

const bindDamageCardControls = (messageId: string, sourceActor: any) => {
  const hook = Hooks.on("renderChatMessage", (chatItem: any, html: JQuery) => {
    if (chatItem.id !== messageId) return;
    Hooks.off("renderChatMessage", hook);

    const root = html.find(".rmrpg-damage-card");
    if (!root.length) return;

    let soakActive = false;
    const baseDamage = Number(root.data("total") ?? 0);
    const soakButton = root.find("[data-action='damage-soak-toggle']");

    soakButton.on("click", (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      soakActive = !soakActive;
      soakButton.toggleClass("is-active", soakActive);
      soakButton.attr("data-active", soakActive ? "true" : "false");
    });

    root.find("[data-action='damage-apply']").on("click", async (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      const button = event.currentTarget as HTMLElement;
      const multiplier = Number(button.dataset.mult ?? 1);
      await applyDamageToTarget(sourceActor, baseDamage, multiplier, soakActive);
    });
  });
};

export const rollDamageWithDialog = async ({
  actor,
  item = null,
  fallbackFormula = "",
  itemName = "",
  sourceLabel = "",
  criticalMultiplier = 1
}: DamageRollRequest) => {
  if (!actor) return null;

  const fromItem = buildDamageEntriesFromItem(actor, item);
  const fallbackEntries = fromItem.entries.length ? [] : buildFallbackDamageEntries(fallbackFormula);
  const entries = [...fromItem.entries, ...fallbackEntries];
  const modifiers = [...fromItem.modifiers];

  if (!entries.length && !modifiers.length) {
    ui.notifications.error(localize("RMRPG.Dialogs.Damage.InvalidDamagePart"));
    return null;
  }

  const safeMultiplier = Number.isFinite(Number(criticalMultiplier)) ? Number(criticalMultiplier) : 1;
  const dialogTitle = localize("RMRPG.Dialogs.Damage.Title", {
    label: sourceLabel || itemName || localize("RMRPG.Actor.Actions.Damage")
  });
  const dialogResult = await openDamageRollDialog(dialogTitle, {
    entries,
    modifiers,
    criticalMultiplier: safeMultiplier
  });
  if (!dialogResult) return null;

  const rolledTerms = await evaluateDamageTerms(dialogResult.entries);
  const selectedModifiers = dialogResult.modifiers.filter((modifier) => modifier.checked).map((entry) => ({ ...entry }));
  const modifierTotal = selectedModifiers.reduce((sum, modifier) => sum + toSafeInteger(modifier.value, 0), 0);
  const subtotal = rolledTerms.reduce((sum, term) => sum + term.total, 0) + modifierTotal;
  const total = Math.max(0, Math.floor(subtotal * safeMultiplier));
  const breakdownValues = [...rolledTerms.map((term) => term.total), ...selectedModifiers.map((modifier) => toSafeInteger(modifier.value, 0))];

  const result: DamageRollResult = {
    actor,
    item,
    sourceLabel: sourceLabel || itemName || localize("RMRPG.Actor.Actions.Damage"),
    tags: collectCardTags(item),
    terms: rolledTerms,
    modifiers: selectedModifiers,
    criticalMultiplier: safeMultiplier,
    subtotal,
    total,
    breakdownValues
  };

  const content = buildDamageChatContent(result);
  const message = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });

  const messageId = String((message as any)?.id ?? "");
  if (messageId) {
    bindDamageCardControls(messageId, actor);
  }

  return result;
};
