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
const normalizeTagEntries = (raw) => {
    const source = Array.isArray(raw) ? raw : [];
    return source
        .map((entry) => typeof entry === "string"
        ? { name: String(entry ?? "").trim(), tooltip: "" }
        : { name: String(entry?.name ?? "").trim(), tooltip: String(entry?.tooltip ?? "").trim() })
        .filter((entry) => entry.name);
};
const dedupeTagEntries = (entries) => {
    const seen = new Set();
    return entries.filter((entry) => {
        const key = entry.name.toLowerCase();
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
};
const syncAbilityAutoTags = (rawTags, ability) => {
    const tags = normalizeTagEntries(rawTags);
    const managedNames = new Set(["ataque", "area", "condicao", "destruicao"]);
    const preserved = tags.filter((tag) => !managedNames.has(tag.name.toLowerCase()));
    const characteristics = Array.isArray(ability?.characteristics) ? ability.characteristics : [];
    const hasDestruction = characteristics.some((entry) => String(entry?.id ?? "") === "destruicao");
    const hasArea = characteristics.some((entry) => String(entry?.id ?? "") === "area");
    const hasCondition = characteristics.some((entry) => String(entry?.id ?? "") === "condicao");
    const autoTags = [];
    if (hasDestruction) {
        autoTags.push({ name: "destruicao", tooltip: "" }, { name: "ataque", tooltip: "" });
    }
    if (hasArea) {
        autoTags.push({ name: "area", tooltip: "" });
    }
    if (hasCondition) {
        autoTags.push({ name: "condicao", tooltip: "" });
    }
    return dedupeTagEntries([...preserved, ...autoTags]);
};
const normalizeAbilityConfig = (raw) => {
    const source = raw && typeof raw === "object" ? raw : {};
    const attackSource = source.attack && typeof source.attack === "object" ? source.attack : {};
    const secondarySource = source.secondary && typeof source.secondary === "object" ? source.secondary : {};
    const damageSource = source.damage && typeof source.damage === "object" ? source.damage : {};
    const attackBonuses = normalizeBonusArray(attackSource.bonuses).map((entry) => ({
        label: String(entry?.label ?? "").trim(),
        value: Number.isFinite(Number(entry?.value)) ? Math.floor(Number(entry.value)) : 0
    }));
    const damageBonuses = normalizeBonusArray(damageSource.bonuses).map((entry) => ({
        formula: String(entry?.formula ?? "").trim(),
        type: String(entry?.type ?? "physical") || "physical"
    }));
    return {
        attack: {
            useOverride: Boolean(attackSource.useOverride),
            attribute: String(attackSource.attribute ?? "default") || "default",
            manualBonus: Number.isFinite(Number(attackSource.manualBonus)) ? Math.floor(Number(attackSource.manualBonus)) : 0,
            bonuses: attackBonuses
        },
        secondary: {
            attribute: String(secondarySource.attribute ?? "vigor") || "vigor",
            manualDcEnabled: Boolean(secondarySource.manualDcEnabled),
            manualDc: Number.isFinite(Number(secondarySource.manualDc)) ? Math.floor(Number(secondarySource.manualDc)) : 10
        },
        damage: {
            useOverride: Boolean(damageSource.useOverride),
            formula: String(damageSource.formula ?? "").trim(),
            type: String(damageSource.type ?? "physical") || "physical",
            bonuses: damageBonuses
        }
    };
};
export class RMRPGItemSheet extends ItemSheet {
    _pendingScrollPositions = {};
    static SCROLL_SELECTORS = [
        ".sheet-body",
        ".weapon-tab-content > .tab[data-tab='details']",
        ".ability-tab-content > .tab[data-tab='details']",
        ".ability-tab-content > .tab[data-tab='additional-settings']"
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
            const submittedAbilityConfig = expanded.system?.abilityConfig;
            if (submittedAbilityConfig && typeof submittedAbilityConfig === "object") {
                const submittedAttackBonuses = coerceIndexedCollection(submittedAbilityConfig.attack?.bonuses);
                const submittedDamageBonuses = coerceIndexedCollection(submittedAbilityConfig.damage?.bonuses);
                if (submittedAttackBonuses) {
                    submittedAbilityConfig.attack.bonuses = submittedAttackBonuses;
                }
                if (submittedDamageBonuses) {
                    submittedAbilityConfig.damage.bonuses = submittedDamageBonuses;
                }
            }
            const currentAbilityConfig = this.item.system?.abilityConfig ?? {};
            const mergedAbilityConfig = foundry.utils.mergeObject(currentAbilityConfig, submittedAbilityConfig ?? {}, {
                inplace: false,
                overwrite: true
            });
            expanded.system.abilityConfig = normalizeAbilityConfig(mergedAbilityConfig);
            expanded.system.tags = syncAbilityAutoTags(expanded.system.tags ?? this.item.system?.tags, resolvedAbility);
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
