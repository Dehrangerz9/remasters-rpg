import {
  buildAbilityOptions,
  getAbilityCategoryRule,
  getAbilityCharacteristicRule,
  getCategoryLabel,
  getCategoryTag,
  getCategoryTooltip,
  resolveCost,
  listCategoryTags,
  normalizeAbilityData,
  calculateAbilityCost,
  sanitizeAbilityData
} from "../../../abilities/rules.js";
import { ABILITY_PARENT_FLAG, SYSTEM_ID } from "../../../constants.js";
import { resolveAbilityCategories, getLinkedCategoryItems } from "../../../abilities/category-links.js";

const normalizeTags = (raw: unknown) => {
  if (!Array.isArray(raw)) return [] as { name: string; tooltip: string }[];
  return raw
    .map((entry: any) =>
      typeof entry === "string"
        ? { name: String(entry ?? ""), tooltip: "" }
        : { name: String(entry?.name ?? ""), tooltip: String(entry?.tooltip ?? "") }
    )
    .map((entry: { name: string; tooltip: string }) => ({
      name: String(entry.name ?? "").trim(),
      tooltip: String(entry.tooltip ?? "").trim()
    }))
    .filter((entry) => entry.name);
};

const dedupeTags = (entries: { name: string; tooltip: string }[]) => {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = entry.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const isActorOwnedAbility = (sheet: any) =>
  sheet.item.type === "ability" && sheet.item.parent?.documentName === "Actor";

const getActorRank = (sheet: any) =>
  isActorOwnedAbility(sheet) ? String(sheet.item.parent.system?.rank?.value ?? "") : null;

const findLinkedCategoryItem = (sheet: any, entry: any) => {
  if (!isActorOwnedAbility(sheet)) return null;
  const actor = sheet.item.parent;
  const linkedItems = getLinkedCategoryItems(sheet.item);
  const entryId = String(entry?.id ?? "");
  const entryUuid = String(entry?.uuid ?? "");
  for (const item of linkedItems) {
    if (entryId && String(item.id ?? "") === entryId) return item;
    if (entryUuid && String(item.uuid ?? "") === entryUuid) return item;
  }
  return null;
};

const removeStoredCategoryEntry = (ability: any, entry: any, fallbackIndex: number, useFallback = true) => {
  const entryId = String(entry?.id ?? "");
  const entryUuid = String(entry?.uuid ?? "");
  let index = -1;
  if (entryId) {
    index = ability.categories.findIndex((candidate: any) => String(candidate?.id ?? "") === entryId);
  }
  if (index < 0 && entryUuid) {
    index = ability.categories.findIndex((candidate: any) => String(candidate?.uuid ?? "") === entryUuid);
  }
  if (index < 0 && useFallback) {
    index = fallbackIndex;
  }
  if (index < 0 || index >= ability.categories.length) return;
  ability.categories.splice(index, 1);
};

const createLinkedCategoryEffect = async (
  sheet: any,
  data: { name: string; img: string; category: string; cost: number; description: string }
) => {
  if (!isActorOwnedAbility(sheet)) return null;
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

const syncCategoryTags = async (sheet: any, ability: ReturnType<typeof normalizeAbilityData>) => {
  const localize = (key: string) => game.i18n.localize(key);
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

export const setupAbilityListeners = (sheet: any, html: JQuery) => {
  if (sheet.item.type !== "ability") return;
  const localize = (key: string) => game.i18n.localize(key);
  const options = buildAbilityOptions(localize);
  const resolveCategoryLabel = (category: string) => getCategoryLabel(category, localize) || category;

  const persistAbility = async (ability: any) => {
    const actorRank = getActorRank(sheet);
    const resolvedCategories = resolveAbilityCategories(sheet.item, ability);
    const sanitized = sanitizeAbilityData({ ...ability, categories: resolvedCategories }, { actorRank });
    const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
    await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
    await syncCategoryTags(sheet, sanitized);
    return sanitized;
  };

  html.find("[data-action='ability-category-add']").on("click", async (event: any) => {
    event.preventDefault();
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const ability = normalizeAbilityData(sheet.item.system?.ability);
    const resolvedCategories = resolveAbilityCategories(sheet.item, ability);
    const actorRank = getActorRank(sheet);
    const limit = calculateAbilityCost({ ...ability, categories: resolvedCategories }, { actorRank }).limits.categories;
    if (limit !== null && resolvedCategories.length >= limit) return;
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

  html.find("[data-action='ability-category-remove']").on("click", async (event: any) => {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const ability = normalizeAbilityData(sheet.item.system?.ability);
    const resolvedCategories = resolveAbilityCategories(sheet.item, ability);
    if (index >= resolvedCategories.length) return;
    const entry = resolvedCategories[index];
    const linkedItem = findLinkedCategoryItem(sheet, entry);
    if (linkedItem) {
      await sheet.item.parent.deleteEmbeddedDocuments("Item", [linkedItem.id]);
    }
    removeStoredCategoryEntry(ability, entry, index, !linkedItem);
    await persistAbility(ability);
  });

  html.find("[data-action='ability-category-open']").on("click", async (event: any) => {
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
    if (!uuid) return;
    const item = await fromUuid(uuid);
    if (item?.sheet) {
      item.sheet.render(true);
    }
  });

  const categoryTable = html.find(".ability-category-table").get(0);
  if (categoryTable) {
    categoryTable.addEventListener("dragover", (event) => {
      const dragEvent = event as DragEvent;
      const data = TextEditor.getDragEventData(dragEvent);
      if (data?.type !== "Item") return;
      event.preventDefault();
    });

    categoryTable.addEventListener("drop", async (event) => {
      const dragEvent = event as DragEvent;
      const data = TextEditor.getDragEventData(dragEvent);
      if (!data || data.type !== "Item") return;
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

      if (!itemData || itemData.type !== "category-effect") return;

      const ability = normalizeAbilityData(sheet.item.system?.ability);
      const resolvedCategories = resolveAbilityCategories(sheet.item, ability);
      const actorRank = getActorRank(sheet);
      const limit = calculateAbilityCost({ ...ability, categories: resolvedCategories }, { actorRank }).limits.categories;
      if (limit !== null && resolvedCategories.length >= limit) return;

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

  html.find("[data-action='ability-characteristic-add']").on("click", async (event: any) => {
    event.preventDefault();
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const ability = normalizeAbilityData(sheet.item.system?.ability);
    const defaultId = options.characteristics[0]?.value ?? "";
    const rule = getAbilityCharacteristicRule(defaultId);
    ability.characteristics.push({
      id: defaultId,
      level: rule?.min ?? 1,
      damageType: defaultId === "destruicao" ? "physical" : ""
    });
    const actorRank = getActorRank(sheet);
    const sanitized = sanitizeAbilityData(ability, { actorRank });
    const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
    await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
  });

  html.find("[data-action='ability-characteristic-remove']").on("click", async (event: any) => {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const ability = normalizeAbilityData(sheet.item.system?.ability);
    if (index >= ability.characteristics.length) return;
    ability.characteristics.splice(index, 1);
    const actorRank = getActorRank(sheet);
    const sanitized = sanitizeAbilityData(ability, { actorRank });
    const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
    await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
  });

  html.find("[data-action='ability-enhancement-add']").on("click", async (event: any) => {
    event.preventDefault();
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const ability = normalizeAbilityData(sheet.item.system?.ability);
    ability.enhancements.push({ id: options.enhancements[0]?.value ?? "" });
    const actorRank = getActorRank(sheet);
    const sanitized = sanitizeAbilityData(ability, { actorRank });
    const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
    await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
  });

  html.find("[data-action='ability-enhancement-remove']").on("click", async (event: any) => {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const ability = normalizeAbilityData(sheet.item.system?.ability);
    if (index >= ability.enhancements.length) return;
    ability.enhancements.splice(index, 1);
    const actorRank = getActorRank(sheet);
    const sanitized = sanitizeAbilityData(ability, { actorRank });
    const cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
    await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
  });
};
