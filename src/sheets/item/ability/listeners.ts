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
  const resolveCategoryLabel = (category: string) => getCategoryLabel(category, localize);

  const buildCategoryEntry = (itemData: any, uuid: string) => {
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

  const addCategoryEntry = async (ability: any, entry: any) => {
    ability.categories.push(entry);
    const sanitized = sanitizeAbilityData(ability);
    const cost = calculateAbilityCost(sanitized).totalCost;
    await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
    await syncCategoryTags(sheet, sanitized);
  };

  html.find("[data-action='ability-category-add']").on("click", async (event: any) => {
    event.preventDefault();
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const ability = normalizeAbilityData(sheet.item.system?.ability);
    const limit = calculateAbilityCost(ability).limits.categories;
    if (limit !== null && ability.categories.length >= limit) return;
    const defaultCategory = options.categories[0]?.value ?? "";
    const rule = getAbilityCategoryRule(defaultCategory);
    const defaultCost = resolveCost(rule?.cost, 1);
    const created = await Item.create(
      {
        name: localize("RMRPG.Item.AbilityCategory.NewName"),
        type: "ability-category",
        system: {
          category: defaultCategory,
          cost: defaultCost
        }
      },
      { renderSheet: true }
    );
    if (!created) return;
    await addCategoryEntry(ability, buildCategoryEntry(created.toObject(), created.uuid));
  });

  html.find("[data-action='ability-category-remove']").on("click", async (event: any) => {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const ability = normalizeAbilityData(sheet.item.system?.ability);
    if (index >= ability.categories.length) return;
    ability.categories.splice(index, 1);
    const sanitized = sanitizeAbilityData(ability);
    const cost = calculateAbilityCost(sanitized).totalCost;
    await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
    await syncCategoryTags(sheet, sanitized);
  });

  html.find("[data-action='ability-category-open']").on("click", async (event: any) => {
    event.preventDefault();
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

      if (!itemData || itemData.type !== "ability-category") return;

      const ability = normalizeAbilityData(sheet.item.system?.ability);
      const limit = calculateAbilityCost(ability).limits.categories;
      if (limit !== null && ability.categories.length >= limit) return;
      await addCategoryEntry(ability, buildCategoryEntry(itemData, uuid));
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
      level: rule?.min ?? 1
    });
    const sanitized = sanitizeAbilityData(ability);
    const cost = calculateAbilityCost(sanitized).totalCost;
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
    const sanitized = sanitizeAbilityData(ability);
    const cost = calculateAbilityCost(sanitized).totalCost;
    await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
  });

  html.find("[data-action='ability-enhancement-add']").on("click", async (event: any) => {
    event.preventDefault();
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const ability = normalizeAbilityData(sheet.item.system?.ability);
    ability.enhancements.push({ id: options.enhancements[0]?.value ?? "" });
    const sanitized = sanitizeAbilityData(ability);
    const cost = calculateAbilityCost(sanitized).totalCost;
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
    const sanitized = sanitizeAbilityData(ability);
    const cost = calculateAbilityCost(sanitized).totalCost;
    await sheet.item.update({ "system.ability": sanitized, "system.cost": cost });
  });
};
