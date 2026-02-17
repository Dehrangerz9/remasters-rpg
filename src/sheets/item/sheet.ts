import { SYSTEM_ID } from "../../constants.js";
import { normalizeBonusArray } from "../global-functions/utils.js";
import { calculateAbilityCost, sanitizeAbilityData } from "../../abilities/rules.js";
import { syncAbilitiesForCategoryEffect } from "../../abilities/category-effects.js";
import { resolveAbilityCategories } from "../../abilities/category-links.js";
import { applyItemThemeClass } from "./theme.js";
import { buildItemContext } from "./context.js";
import { activateItemListeners } from "./listeners.js";

export class RMRPGItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rmrpg", "sheet", "item"],
      width: 620,
      height: 620,
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

  render(force = false, options = {}) {
    applyItemThemeClass(this);
    return super.render(force, options);
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html);
    applyItemThemeClass(this);
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
      const currentAbility = this.item.system?.ability ?? {};
      const mergedAbility = foundry.utils.mergeObject(currentAbility, expanded.system?.ability ?? {}, {
        inplace: false,
        overwrite: true
      });
      const ability = sanitizeAbilityData(mergedAbility);
      const resolvedCategories = resolveAbilityCategories(this.item, ability);
      const resolvedAbility = sanitizeAbilityData({ ...ability, categories: resolvedCategories });
      expanded.system.ability = resolvedAbility;
      expanded.system.cost = calculateAbilityCost(resolvedAbility).totalCost;
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
