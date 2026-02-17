import {
  calculateAbilityCost,
  getCategoryTag,
  getCategoryTooltip,
  listCategoryTags,
  normalizeAbilityData,
  sanitizeAbilityData
} from "./rules.js";
import { resolveAbilityCategories } from "./category-links.js";
import { ABILITY_PARENT_FLAG, SYSTEM_ID } from "../constants.js";

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

export const syncAbilitiesForCategoryEffect = async (item: any) => {
  if (!item || item.type !== "category-effect") return;
  const actor = item.parent;
  if (actor?.documentName !== "Actor") return;
  const parentAbilityId = String(item.getFlag?.(SYSTEM_ID, ABILITY_PARENT_FLAG) ?? "");
  if (!parentAbilityId) return;
  const abilityItem = actor.items?.get(parentAbilityId);
  if (!abilityItem || abilityItem.type !== "ability") return;

  const ability = normalizeAbilityData(abilityItem.system?.ability);
  const resolvedCategories = resolveAbilityCategories(abilityItem, ability);
  const sanitized = sanitizeAbilityData({ ...ability, categories: resolvedCategories });
  const costInfo = calculateAbilityCost(sanitized);

  const localize = (key: string) => game.i18n.localize(key);
  const categoryTagNames = new Set(listCategoryTags(localize).map((tag) => tag.toLowerCase()));
  const categoryTags = sanitized.categories
    .map((entry) => ({
      name: getCategoryTag(entry.category, localize),
      tooltip: getCategoryTooltip(entry.category, localize)
    }))
    .filter((entry) => entry.name);

  const preserved = normalizeTags(abilityItem.system?.tags).filter(
    (tag) => !categoryTagNames.has(tag.name.toLowerCase())
  );
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
