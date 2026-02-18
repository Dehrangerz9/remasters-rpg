import { SYSTEM_ID } from "../../constants.js";
import { normalizeBonusArray } from "../global-functions/utils.js";
import { calculateAbilityCost, sanitizeAbilityData } from "../../abilities/rules.js";
import { syncAbilitiesForCategoryEffect } from "../../abilities/category-effects.js";
import { resolveAbilityCategories } from "../../abilities/category-links.js";
import { applyItemThemeClass } from "./theme.js";
import { buildItemContext } from "./context.js";
import { activateItemListeners } from "./listeners.js";

const coerceIndexedCollection = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return null;
  return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => /^\d+$/.test(key))
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, entry]) => entry);
};

export class RMRPGItemSheet extends ItemSheet {
  private _pendingScrollPositions: Record<string, number> = {};

  private static readonly SCROLL_SELECTORS = [
    ".sheet-body",
    ".weapon-tab-content > .tab[data-tab='details']",
    ".ability-tab-content > .tab[data-tab='details']"
  ];

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rmrpg", "sheet", "item"],
      width: 620,
      height: 620,
      scrollY: RMRPGItemSheet.SCROLL_SELECTORS,
      tabs: [
        {
          navSelector: ".weapon-tabs",
          contentSelector: ".weapon-tab-content",
          initial: "description"
        },
        {
          navSelector: ".ability-tabs",
          contentSelector: ".ability-tab-content",
          initial: "description"
        }
      ]
    });
  }

  private _captureScrollPositions(html?: JQuery) {
    const root = (html?.[0] as HTMLElement | undefined) ?? (this.element?.[0] as HTMLElement | undefined);
    if (!root) return;

    const nextPositions: Record<string, number> = {};
    for (const selector of RMRPGItemSheet.SCROLL_SELECTORS) {
      const element = root.querySelector(selector) as HTMLElement | null;
      if (!element) continue;
      nextPositions[selector] = Number(element.scrollTop ?? 0);
    }
    this._pendingScrollPositions = nextPositions;
  }

  private _restoreScrollPositions(html: JQuery) {
    const root = html?.[0] as HTMLElement | undefined;
    if (!root) return;

    for (const [selector, top] of Object.entries(this._pendingScrollPositions)) {
      const element = root.querySelector(selector) as HTMLElement | null;
      if (!element) continue;
      element.scrollTop = Number(top ?? 0);
    }
  }

  render(force = false, options = {}) {
    this._captureScrollPositions(this.element);
    applyItemThemeClass(this);
    return super.render(force, options);
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html);
    applyItemThemeClass(this);
    this._restoreScrollPositions(html);
    activateItemListeners(this, html);
  }

  protected async _updateObject(event: Event, formData: Record<string, any>) {
    const expanded = foundry.utils.expandObject(formData);
    const weapon = expanded?.system?.weapon;
    if (weapon?.hit?.bonuses && !Array.isArray(weapon.hit.bonuses)) {
      weapon.hit.bonuses = normalizeBonusArray(weapon.hit.bonuses);
    }
    if (weapon?.damage?.bonuses && !Array.isArray(weapon.damage.bonuses)) {
      weapon.damage.bonuses = normalizeBonusArray(weapon.damage.bonuses);
    }
    if (this.item.type === "ability") {
      expanded.system = expanded.system ?? {};
      const submittedAbility = expanded.system?.ability;
      if (submittedAbility && typeof submittedAbility === "object") {
        const submittedCategories = coerceIndexedCollection((submittedAbility as any).categories);
        const submittedCharacteristics = coerceIndexedCollection((submittedAbility as any).characteristics);
        const submittedEnhancements = coerceIndexedCollection((submittedAbility as any).enhancements);
        if (submittedCategories) {
          (submittedAbility as any).categories = submittedCategories;
        }
        if (submittedCharacteristics) {
          (submittedAbility as any).characteristics = submittedCharacteristics;
        }
        if (submittedEnhancements) {
          (submittedAbility as any).enhancements = submittedEnhancements;
        }
      }
      const currentAbility = this.item.system?.ability ?? {};
      const mergedAbility = foundry.utils.mergeObject(currentAbility, expanded.system?.ability ?? {}, {
        inplace: false,
        overwrite: true
      });
      const actorRank = this.item.parent?.documentName === "Actor" ? String(this.item.parent.system?.rank?.value ?? "") : null;
      const ability = sanitizeAbilityData(mergedAbility, { actorRank });
      const resolvedCategories = resolveAbilityCategories(this.item, ability);
      const resolvedAbility = sanitizeAbilityData({ ...ability, categories: resolvedCategories }, { actorRank });
      expanded.system.ability = resolvedAbility;
      expanded.system.cost = calculateAbilityCost(resolvedAbility, { actorRank }).totalCost;
    }
    const result = await super._updateObject(event, expanded);
    if (this.item.type === "category-effect") {
      await syncAbilitiesForCategoryEffect(this.item);
    }
    return result;
  }

  get template() {
    return `systems/${SYSTEM_ID}/templates/items/item-sheet.hbs`;
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    return buildItemContext(this, context);
  }
}
