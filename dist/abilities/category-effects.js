import { calculateAbilityCost, getCategoryTag, getCategoryTooltip, listCategoryTags, sanitizeAbilityData } from "./rules.js";
const normalizeTags = (raw) => {
    if (!Array.isArray(raw))
        return [];
    return raw
        .map((entry) => typeof entry === "string"
        ? { name: String(entry ?? ""), tooltip: "" }
        : { name: String(entry?.name ?? ""), tooltip: String(entry?.tooltip ?? "") })
        .map((entry) => ({
        name: String(entry.name ?? "").trim(),
        tooltip: String(entry.tooltip ?? "").trim()
    }))
        .filter((entry) => entry.name);
};
export const syncAbilitiesForCategoryEffect = async (item) => {
    if (!item || item.type !== "category-effect")
        return;
    const uuid = String(item.uuid ?? "");
    if (!uuid)
        return;
    const localize = (key) => game.i18n.localize(key);
    const categoryTagNames = new Set(listCategoryTags(localize).map((tag) => tag.toLowerCase()));
    const applyAbilityUpdate = async (abilityItem) => {
        const ability = abilityItem.system?.ability;
        if (!ability || !Array.isArray(ability.categories))
            return;
        const categorySystem = item.system ?? {};
        const updatedCategories = ability.categories.map((entry) => {
            if (String(entry?.uuid ?? "") !== uuid)
                return entry;
            return {
                ...entry,
                uuid,
                name: String(item.name ?? ""),
                img: String(item.img ?? ""),
                category: String(categorySystem.category ?? entry.category ?? ""),
                cost: Number(categorySystem.cost ?? entry.cost ?? 0),
                description: String(categorySystem.description ?? entry.description ?? "")
            };
        });
        if (!updatedCategories.some((entry) => String(entry?.uuid ?? "") === uuid))
            return;
        const sanitized = sanitizeAbilityData({ ...ability, categories: updatedCategories });
        const costInfo = calculateAbilityCost(sanitized);
        const categoryTags = sanitized.categories
            .map((entry) => ({
            name: getCategoryTag(entry.category, localize),
            tooltip: getCategoryTooltip(entry.category, localize)
        }))
            .filter((entry) => entry.name);
        const preserved = normalizeTags(abilityItem.system?.tags).filter((tag) => !categoryTagNames.has(tag.name.toLowerCase()));
        const mergedTags = [
            ...preserved,
            ...categoryTags.filter((entry, index, list) => list.findIndex((t) => t.name === entry.name) === index)
        ];
        await abilityItem.update({
            "system.ability": sanitized,
            "system.cost": costInfo.totalCost,
            "system.tags": mergedTags
        });
    };
    const worldAbilities = game.items?.filter((entry) => entry.type === "ability") ?? [];
    for (const abilityItem of worldAbilities) {
        void applyAbilityUpdate(abilityItem);
    }
    const actors = game.actors?.contents ?? [];
    for (const actor of actors) {
        const abilityItems = actor.items?.filter((entry) => entry.type === "ability") ?? [];
        for (const abilityItem of abilityItems) {
            void applyAbilityUpdate(abilityItem);
        }
    }
    const windows = (ui.windows ?? {});
    for (const app of Object.values(windows)) {
        if (!app?.item || app.item.type !== "ability")
            continue;
        const categories = app.item.system?.ability?.categories ?? [];
        if (!Array.isArray(categories))
            continue;
        if (categories.some((entry) => String(entry?.uuid ?? "") === uuid)) {
            app.render(false);
        }
    }
};
