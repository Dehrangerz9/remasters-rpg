import { buildAbilityOptions, getAbilityCategoryRule, getAbilityCharacteristicRule, getCharacteristicLevelChoices, getCategoryLabel, getCategoryTag, getCategoryTooltip, resolveCost, listCategoryTags, normalizeAbilityData, calculateAbilityCost, sanitizeAbilityData } from "../../../abilities/rules.js";
import { ABILITY_PARENT_FLAG, SYSTEM_ID } from "../../../constants.js";
import { resolveAbilityCategories, getLinkedCategoryItems } from "../../../abilities/category-links.js";
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
const isActorOwnedAbility = (sheet) => sheet.item.type === "ability" && sheet.item.parent?.documentName === "Actor";
const getActorRank = (sheet) => isActorOwnedAbility(sheet) ? String(sheet.item.parent.system?.rank?.value ?? "") : null;
const findLinkedCategoryItem = (sheet, entry) => {
    if (!isActorOwnedAbility(sheet))
        return null;
    const actor = sheet.item.parent;
    const linkedItems = getLinkedCategoryItems(sheet.item);
    const entryId = String(entry?.id ?? "");
    const entryUuid = String(entry?.uuid ?? "");
    for (const item of linkedItems) {
        if (entryId && String(item.id ?? "") === entryId)
            return item;
        if (entryUuid && String(item.uuid ?? "") === entryUuid)
            return item;
    }
    return null;
};
const removeStoredCategoryEntry = (ability, entry, fallbackIndex, useFallback = true) => {
    const entryId = String(entry?.id ?? "");
    const entryUuid = String(entry?.uuid ?? "");
    let index = -1;
    if (entryId) {
        index = ability.categories.findIndex((candidate) => String(candidate?.id ?? "") === entryId);
    }
    if (index < 0 && entryUuid) {
        index = ability.categories.findIndex((candidate) => String(candidate?.uuid ?? "") === entryUuid);
    }
    if (index < 0 && useFallback) {
        index = fallbackIndex;
    }
    if (index < 0 || index >= ability.categories.length)
        return;
    ability.categories.splice(index, 1);
};
const createLinkedCategoryEffect = async (sheet, data) => {
    if (!isActorOwnedAbility(sheet))
        return null;
    const actor = sheet.item.parent;
    const parentAbilityId = String(sheet.item.id ?? "");
    const created = await actor.createEmbeddedDocuments("Item", [
        {
            name: data.name,
            type: "category-effect",
            img: data.img || "icons/svg/book.svg",
            system: {
                category: data.category,
                cost: data.cost,
                description: data.description
            },
            flags: {
                [SYSTEM_ID]: {
                    [ABILITY_PARENT_FLAG]: parentAbilityId
                }
            }
        }
    ]);
    return created?.[0] ?? null;
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
const normalizeAttackBonusConfig = (raw) => {
    if (!Array.isArray(raw))
        return [];
    return raw.map((entry) => ({
        label: String(entry?.label ?? ""),
        value: Number.isFinite(Number(entry?.value)) ? Math.floor(Number(entry.value)) : 0
    }));
};
const normalizeDamageBonusConfig = (raw) => {
    if (!Array.isArray(raw))
        return [];
    return raw.map((entry) => ({
        formula: String(entry?.formula ?? ""),
        type: String(entry?.type ?? "physical") || "physical"
    }));
};
export const setupAbilityListeners = (sheet, html) => {
    if (sheet.item.type !== "ability")
        return;
    const localize = (key) => game.i18n.localize(key);
    const options = buildAbilityOptions(localize);
    const resolveCategoryLabel = (category) => getCategoryLabel(category, localize) || category;
    const persistAbility = async (ability) => {
        const actorRank = getActorRank(sheet);
        const resolvedCategories = resolveAbilityCategories(sheet.item, ability);
        const sanitized = sanitizeAbilityData({ ...ability, categories: resolvedCategories }, { actorRank });
        const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
        await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
        await syncCategoryTags(sheet, sanitized);
        return sanitized;
    };
    html.find("[data-action='ability-category-add']").on("click", async (event) => {
        event.preventDefault();
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const ability = normalizeAbilityData(sheet.item.system?.ability);
        const defaultCategory = options.categories[0]?.value ?? "";
        const rule = getAbilityCategoryRule(defaultCategory);
        const defaultCost = resolveCost(rule?.cost, 1);
        if (isActorOwnedAbility(sheet)) {
            const created = await createLinkedCategoryEffect(sheet, {
                name: localize("RMRPG.Item.AbilityCategory.NewName"),
                img: "icons/svg/book.svg",
                category: defaultCategory,
                cost: defaultCost,
                description: ""
            });
            if (created?.sheet) {
                created.sheet.render(true);
            }
            await persistAbility(ability);
            return;
        }
        ability.categories.push({
            id: "",
            uuid: "",
            name: resolveCategoryLabel(defaultCategory),
            img: "icons/svg/book.svg",
            category: defaultCategory,
            cost: defaultCost,
            description: ""
        });
        await persistAbility(ability);
    });
    html.find("[data-action='ability-category-remove']").on("click", async (event) => {
        event.preventDefault();
        const index = Number(event.currentTarget.dataset.index);
        if (!Number.isFinite(index) || index < 0)
            return;
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const ability = normalizeAbilityData(sheet.item.system?.ability);
        const resolvedCategories = resolveAbilityCategories(sheet.item, ability);
        if (index >= resolvedCategories.length)
            return;
        const entry = resolvedCategories[index];
        const linkedItem = findLinkedCategoryItem(sheet, entry);
        if (linkedItem) {
            await sheet.item.parent.deleteEmbeddedDocuments("Item", [linkedItem.id]);
        }
        removeStoredCategoryEntry(ability, entry, index, !linkedItem);
        await persistAbility(ability);
    });
    html.find("[data-action='ability-category-open']").on("click", async (event) => {
        event.preventDefault();
        const id = String(event.currentTarget.dataset.id ?? "");
        if (id && isActorOwnedAbility(sheet)) {
            const item = sheet.item.parent.items?.get(id);
            if (item?.sheet) {
                item.sheet.render(true);
            }
            return;
        }
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
            const rawSystem = itemData.system ?? {};
            const entryData = {
                name: String(itemData.name ?? localize("RMRPG.Item.AbilityCategory.NewName")),
                img: String(itemData.img ?? "icons/svg/book.svg"),
                category: String(rawSystem.category ?? ""),
                cost: Number(rawSystem.cost ?? 0),
                description: String(rawSystem.description ?? "")
            };
            if (isActorOwnedAbility(sheet)) {
                await createLinkedCategoryEffect(sheet, {
                    ...entryData,
                    cost: Number.isFinite(entryData.cost) ? entryData.cost : 0
                });
                await persistAbility(ability);
                return;
            }
            ability.categories.push({
                id: "",
                uuid,
                name: entryData.name || resolveCategoryLabel(entryData.category),
                img: entryData.img,
                category: entryData.category,
                cost: Number.isFinite(entryData.cost) ? entryData.cost : 0,
                description: entryData.description
            });
            await persistAbility(ability);
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
            level: rule?.min ?? 1,
            damageType: defaultId === "destruicao" ? "physical" : "",
            areaType: defaultId === "area" ? "emanacao" : ""
        });
        const actorRank = getActorRank(sheet);
        const sanitized = sanitizeAbilityData(ability, { actorRank });
        const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
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
        const actorRank = getActorRank(sheet);
        const sanitized = sanitizeAbilityData(ability, { actorRank });
        const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
        await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
    });
    html.find("[data-action='ability-characteristic-level-picker']").on("click", async (event) => {
        event.preventDefault();
        const index = Number(event.currentTarget.dataset.index);
        if (!Number.isFinite(index) || index < 0)
            return;
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const ability = normalizeAbilityData(sheet.item.system?.ability);
        if (index >= ability.characteristics.length)
            return;
        const entry = ability.characteristics[index];
        const levelChoices = getCharacteristicLevelChoices(entry.id, localize);
        const fallbackRule = getAbilityCharacteristicRule(entry.id);
        const fallbackChoices = fallbackRule
            ? Array.from({ length: Math.max(1, fallbackRule.max - fallbackRule.min + 1) }, (_, i) => {
                const level = fallbackRule.min + i;
                return { value: String(level), label: String(level), level };
            })
            : [{ value: String(entry.level ?? 1), label: String(entry.level ?? 1), level: Number(entry.level ?? 1) }];
        const choices = levelChoices.length ? levelChoices : fallbackChoices;
        const optionsHtml = choices
            .map((choice) => {
            const value = String(choice.value ?? choice.level ?? "");
            const label = String(choice.label ?? value);
            const selected = Number(value) === Number(entry.level) ? " selected" : "";
            return `<option value="${value}"${selected}>${label}</option>`;
        })
            .join("");
        const selectedLevel = await Dialog.prompt({
            title: localize("RMRPG.Item.Ability.Characteristics.LevelLabel"),
            content: `
        <form class="rmrpg-level-picker">
          <div class="form-group">
            <label>${localize("RMRPG.Item.Ability.Characteristics.LevelLabel")}</label>
            <select name="level">${optionsHtml}</select>
          </div>
        </form>
      `,
            callback: (html) => Number(html.find("[name='level']").val())
        });
        if (selectedLevel === null || selectedLevel === undefined || selectedLevel === "")
            return;
        const parsedLevel = Number(selectedLevel);
        if (!Number.isFinite(parsedLevel))
            return;
        entry.level = parsedLevel;
        const actorRank = getActorRank(sheet);
        const sanitized = sanitizeAbilityData(ability, { actorRank });
        const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
        await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
    });
    html.find("[data-action='ability-enhancement-add']").on("click", async (event) => {
        event.preventDefault();
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const ability = normalizeAbilityData(sheet.item.system?.ability);
        ability.enhancements.push({ id: options.enhancements[0]?.value ?? "" });
        const actorRank = getActorRank(sheet);
        const sanitized = sanitizeAbilityData(ability, { actorRank });
        const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
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
        const actorRank = getActorRank(sheet);
        const sanitized = sanitizeAbilityData(ability, { actorRank });
        const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
        await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
    });
    html.find("[data-action='ability-attack-bonus-add']").on("click", async (event) => {
        event.preventDefault();
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const bonuses = normalizeAttackBonusConfig(sheet.item.system?.abilityConfig?.attack?.bonuses).map((entry) => ({
            ...entry
        }));
        bonuses.push({ label: "", value: 0 });
        await sheet.item.update({ "system.abilityConfig.attack.bonuses": bonuses });
    });
    html.find("[data-action='ability-attack-bonus-remove']").on("click", async (event) => {
        event.preventDefault();
        const index = Number(event.currentTarget.dataset.index);
        if (!Number.isFinite(index) || index < 0)
            return;
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const bonuses = normalizeAttackBonusConfig(sheet.item.system?.abilityConfig?.attack?.bonuses).map((entry) => ({
            ...entry
        }));
        if (index >= bonuses.length)
            return;
        bonuses.splice(index, 1);
        await sheet.item.update({ "system.abilityConfig.attack.bonuses": bonuses });
    });
    html.find("[data-action='ability-damage-bonus-add']").on("click", async (event) => {
        event.preventDefault();
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const bonuses = normalizeDamageBonusConfig(sheet.item.system?.abilityConfig?.damage?.bonuses).map((entry) => ({
            ...entry
        }));
        bonuses.push({ formula: "", type: "physical" });
        await sheet.item.update({ "system.abilityConfig.damage.bonuses": bonuses });
    });
    html.find("[data-action='ability-damage-bonus-remove']").on("click", async (event) => {
        event.preventDefault();
        const index = Number(event.currentTarget.dataset.index);
        if (!Number.isFinite(index) || index < 0)
            return;
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const bonuses = normalizeDamageBonusConfig(sheet.item.system?.abilityConfig?.damage?.bonuses).map((entry) => ({
            ...entry
        }));
        if (index >= bonuses.length)
            return;
        bonuses.splice(index, 1);
        await sheet.item.update({ "system.abilityConfig.damage.bonuses": bonuses });
    });
    html.find("[data-action='ability-enhancement-toggle']").on("click", (event) => {
        event.preventDefault();
        const button = event.currentTarget;
        const container = button.closest(".ability-enhancement-description");
        if (!container)
            return;
        const expanded = container.classList.toggle("is-expanded");
        button.setAttribute("aria-expanded", String(expanded));
    });
};
