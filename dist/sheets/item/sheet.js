import { SYSTEM_ID } from "../../constants.js";
import { normalizeBonusArray } from "../global-functions/utils.js";
import { calculateAbilityCost, sanitizeAbilityData } from "../../abilities/rules.js";
import { syncAbilitiesForCategoryEffect } from "../../abilities/category-effects.js";
import { resolveAbilityCategories } from "../../abilities/category-links.js";
import { applyItemThemeClass } from "./theme.js";
import { buildItemContext } from "./context.js";
import { activateItemListeners } from "./listeners.js";
const coerceIndexedCollection = (value) => {
    if (Array.isArray(value))
        return value;
    if (!value || typeof value !== "object")
        return null;
    return Object.entries(value)
        .filter(([key]) => /^\d+$/.test(key))
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([, entry]) => entry);
};
export class RMRPGItemSheet extends ItemSheet {
    _pendingScrollPositions = {};
    static SCROLL_SELECTORS = [
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
    _captureScrollPositions(html) {
        const root = html?.[0] ?? this.element?.[0];
        if (!root)
            return;
        const nextPositions = {};
        for (const selector of RMRPGItemSheet.SCROLL_SELECTORS) {
            const element = root.querySelector(selector);
            if (!element)
                continue;
            nextPositions[selector] = Number(element.scrollTop ?? 0);
        }
        this._pendingScrollPositions = nextPositions;
    }
    _restoreScrollPositions(html) {
        const root = html?.[0];
        if (!root)
            return;
        for (const [selector, top] of Object.entries(this._pendingScrollPositions)) {
            const element = root.querySelector(selector);
            if (!element)
                continue;
            element.scrollTop = Number(top ?? 0);
        }
    }
    render(force = false, options = {}) {
        this._captureScrollPositions(this.element);
        applyItemThemeClass(this);
        return super.render(force, options);
    }
    activateListeners(html) {
        super.activateListeners(html);
        applyItemThemeClass(this);
        this._restoreScrollPositions(html);
        activateItemListeners(this, html);
    }
    async _updateObject(event, formData) {
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
                const submittedCategories = coerceIndexedCollection(submittedAbility.categories);
                const submittedCharacteristics = coerceIndexedCollection(submittedAbility.characteristics);
                const submittedEnhancements = coerceIndexedCollection(submittedAbility.enhancements);
                if (submittedCategories) {
                    submittedAbility.categories = submittedCategories;
                }
                if (submittedCharacteristics) {
                    submittedAbility.characteristics = submittedCharacteristics;
                }
                if (submittedEnhancements) {
                    submittedAbility.enhancements = submittedEnhancements;
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
