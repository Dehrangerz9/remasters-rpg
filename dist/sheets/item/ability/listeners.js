import { buildAbilityOptions, getAbilityCategoryRule, getAbilityCharacteristicRule, getCategoryLabel, getCategoryTag, getCategoryTooltip, resolveCost, listCategoryTags, normalizeAbilityData, calculateAbilityCost, sanitizeAbilityData } from "../../../abilities/rules.js";
import { SYSTEM_ID } from "../../../constants.js";
const CATEGORY_EFFECT_PACK_NAME = "rmrpg-category-effects";
const CATEGORY_EFFECT_PACK_ID = `world.${CATEGORY_EFFECT_PACK_NAME}`;
const getCompendiumFactory = () => {
    const globalCtor = globalThis?.CompendiumCollection;
    if (globalCtor?.createCompendium)
        return globalCtor;
    const packsCtor = game?.packs?.constructor;
    if (packsCtor?.createCompendium)
        return packsCtor;
    return null;
};
const ensureCategoryEffectPack = async (localize) => {
    let pack = game.packs?.get(CATEGORY_EFFECT_PACK_ID);
    if (pack)
        return pack;
    const compendiumFactory = getCompendiumFactory();
    if (!compendiumFactory)
        return null;
    try {
        pack = await compendiumFactory.createCompendium({
            name: CATEGORY_EFFECT_PACK_NAME,
            label: localize("RMRPG.Item.Ability.Categories.Title"),
            type: "Item",
            package: "world",
            system: SYSTEM_ID
        });
    }
    catch (error) {
        console.error(`${SYSTEM_ID} | Failed to create Category Effects compendium`, error);
        return null;
    }
    return pack ?? null;
};
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
const dedupeTags = (entries) => {
    const seen = new Set();
    return entries.filter((entry) => {
        const key = entry.name.toLowerCase();
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
};
const syncCategoryTags = async (sheet, ability) => {
    const localize = (key) => game.i18n.localize(key);
    const categoryTagNames = new Set(listCategoryTags(localize).map((tag) => tag.toLowerCase()));
    const selectedTags = ability.categories
        .map((entry) => ({
        name: getCategoryTag(entry.category, localize),
        tooltip: getCategoryTooltip(entry.category, localize)
    }))
        .filter((entry) => entry.name);
    const currentTags = normalizeTags(sheet.item.system?.tags);
    const preserved = currentTags.filter((tag) => !categoryTagNames.has(tag.name.toLowerCase()));
    const merged = dedupeTags([
        ...preserved,
        ...selectedTags
    ]);
    await sheet.item.update({ "system.tags": merged });
};
export const setupAbilityListeners = (sheet, html) => {
    if (sheet.item.type !== "ability")
        return;
    const localize = (key) => game.i18n.localize(key);
    const options = buildAbilityOptions(localize);
    const resolveCategoryLabel = (category) => getCategoryLabel(category, localize);
    const buildCategoryEntry = (itemData, uuid) => {
        const system = itemData?.system ?? {};
        const category = String(system.category ?? "");
        const cost = Number(system.cost ?? 0);
        return {
            uuid,
            name: String(itemData?.name ?? resolveCategoryLabel(category)),
            img: String(itemData?.img ?? ""),
            category,
            cost: Number.isFinite(cost) ? cost : 0,
            description: String(system.description ?? "")
        };
    };
    const addCategoryEntry = async (ability, entry) => {
        ability.categories.push(entry);
        const sanitized = sanitizeAbilityData(ability);
        const cost = calculateAbilityCost(sanitized).totalCost;
        await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
        await syncCategoryTags(sheet, sanitized);
    };
    html.find("[data-action='ability-category-add']").on("click", async (event) => {
        event.preventDefault();
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const ability = normalizeAbilityData(sheet.item.system?.ability);
        const limit = calculateAbilityCost(ability).limits.categories;
        if (limit !== null && ability.categories.length >= limit)
            return;
        const pack = await ensureCategoryEffectPack(localize);
        if (!pack)
            return;
        const defaultCategory = options.categories[0]?.value ?? "";
        const rule = getAbilityCategoryRule(defaultCategory);
        const defaultCost = resolveCost(rule?.cost, 1);
        const created = await pack.createDocument({
            name: localize("RMRPG.Item.AbilityCategory.NewName"),
            type: "category-effect",
            system: {
                category: defaultCategory,
                cost: defaultCost
            }
        });
        if (!created)
            return;
        created.sheet?.render(true);
        await addCategoryEntry(ability, buildCategoryEntry(created.toObject(), created.uuid));
    });
    html.find("[data-action='ability-category-remove']").on("click", async (event) => {
        event.preventDefault();
        const index = Number(event.currentTarget.dataset.index);
        if (!Number.isFinite(index) || index < 0)
            return;
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const ability = normalizeAbilityData(sheet.item.system?.ability);
        if (index >= ability.categories.length)
            return;
        ability.categories.splice(index, 1);
        const sanitized = sanitizeAbilityData(ability);
        const cost = calculateAbilityCost(sanitized).totalCost;
        await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
        await syncCategoryTags(sheet, sanitized);
    });
    html.find("[data-action='ability-category-open']").on("click", async (event) => {
        event.preventDefault();
        const uuid = String(event.currentTarget.dataset.uuid ?? "");
        if (!uuid)
            return;
        const item = await fromUuid(uuid);
        if (item?.sheet) {
            item.sheet.render(true);
        }
    });
    const categoryTable = html.find(".ability-category-table").get(0);
    if (categoryTable) {
        categoryTable.addEventListener("dragover", (event) => {
            const dragEvent = event;
            const data = TextEditor.getDragEventData(dragEvent);
            if (data?.type !== "Item")
                return;
            event.preventDefault();
        });
        categoryTable.addEventListener("drop", async (event) => {
            const dragEvent = event;
            const data = TextEditor.getDragEventData(dragEvent);
            if (!data || data.type !== "Item")
                return;
            event.preventDefault();
            await sheet._onSubmit(dragEvent, { preventClose: true, preventRender: true });
            let itemData = data.data;
            let uuid = String(data.uuid ?? "");
            if (!itemData && data.uuid) {
                const item = await fromUuid(data.uuid);
                if (item) {
                    itemData = item.toObject();
                    uuid = item.uuid;
                }
            }
            if (!itemData || itemData.type !== "category-effect")
                return;
            const ability = normalizeAbilityData(sheet.item.system?.ability);
            const limit = calculateAbilityCost(ability).limits.categories;
            if (limit !== null && ability.categories.length >= limit)
                return;
            await addCategoryEntry(ability, buildCategoryEntry(itemData, uuid));
        });
    }
    html.find("[data-action='ability-characteristic-add']").on("click", async (event) => {
        event.preventDefault();
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const ability = normalizeAbilityData(sheet.item.system?.ability);
        const defaultId = options.characteristics[0]?.value ?? "";
        const rule = getAbilityCharacteristicRule(defaultId);
        ability.characteristics.push({
            id: defaultId,
            level: rule?.min ?? 1
        });
        const sanitized = sanitizeAbilityData(ability);
        const cost = calculateAbilityCost(sanitized).totalCost;
        await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
    });
    html.find("[data-action='ability-characteristic-remove']").on("click", async (event) => {
        event.preventDefault();
        const index = Number(event.currentTarget.dataset.index);
        if (!Number.isFinite(index) || index < 0)
            return;
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const ability = normalizeAbilityData(sheet.item.system?.ability);
        if (index >= ability.characteristics.length)
            return;
        ability.characteristics.splice(index, 1);
        const sanitized = sanitizeAbilityData(ability);
        const cost = calculateAbilityCost(sanitized).totalCost;
        await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
    });
    html.find("[data-action='ability-enhancement-add']").on("click", async (event) => {
        event.preventDefault();
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const ability = normalizeAbilityData(sheet.item.system?.ability);
        ability.enhancements.push({ id: options.enhancements[0]?.value ?? "" });
        const sanitized = sanitizeAbilityData(ability);
        const cost = calculateAbilityCost(sanitized).totalCost;
        await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
    });
    html.find("[data-action='ability-enhancement-remove']").on("click", async (event) => {
        event.preventDefault();
        const index = Number(event.currentTarget.dataset.index);
        if (!Number.isFinite(index) || index < 0)
            return;
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const ability = normalizeAbilityData(sheet.item.system?.ability);
        if (index >= ability.enhancements.length)
            return;
        ability.enhancements.splice(index, 1);
        const sanitized = sanitizeAbilityData(ability);
        const cost = calculateAbilityCost(sanitized).totalCost;
        await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
    });
};
