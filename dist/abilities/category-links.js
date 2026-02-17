import { ABILITY_PARENT_FLAG, SYSTEM_ID } from "../constants.js";
const sortByDocument = (a, b) => {
    const aSort = Number(a?.sort ?? 0);
    const bSort = Number(b?.sort ?? 0);
    if (aSort !== bSort)
        return aSort - bSort;
    return String(a?.name ?? "").localeCompare(String(b?.name ?? ""));
};
export const getLinkedCategoryItems = (abilityItem) => {
    const actor = abilityItem?.parent;
    const abilityId = String(abilityItem?.id ?? "");
    if (!actor || !abilityId)
        return [];
    const items = actor.items?.filter((item) => item.type === "category-effect" &&
        String(item.getFlag?.(SYSTEM_ID, ABILITY_PARENT_FLAG) ?? "") === abilityId) ?? [];
    return items.slice().sort(sortByDocument);
};
export const buildCategoryEntryFromItem = (item) => {
    const system = item?.system ?? {};
    const rawCost = Number(system.cost ?? 0);
    const cost = Number.isFinite(rawCost) ? rawCost : 0;
    return {
        id: String(item?.id ?? ""),
        uuid: String(item?.uuid ?? ""),
        name: String(item?.name ?? ""),
        img: String(item?.img ?? ""),
        category: String(system.category ?? ""),
        cost,
        description: String(system.description ?? "")
    };
};
export const resolveAbilityCategories = (abilityItem, ability) => {
    const current = Array.isArray(ability?.categories) ? ability.categories : [];
    const linkedItems = getLinkedCategoryItems(abilityItem);
    if (!linkedItems.length)
        return current.map((entry) => ({ ...entry }));
    const linkedByUuid = new Map(linkedItems.map((item) => [String(item.uuid ?? ""), item]));
    const linkedById = new Map(linkedItems.map((item) => [String(item.id ?? ""), item]));
    const usedIds = new Set();
    const resolved = [];
    for (const entry of current) {
        const uuid = String(entry?.uuid ?? "");
        const id = String(entry?.id ?? "");
        const matched = (uuid && linkedByUuid.get(uuid)) || (id && linkedById.get(id));
        if (matched) {
            resolved.push(buildCategoryEntryFromItem(matched));
            usedIds.add(String(matched.id ?? ""));
            continue;
        }
        resolved.push({ ...entry });
    }
    for (const item of linkedItems) {
        const id = String(item?.id ?? "");
        if (!id || usedIds.has(id))
            continue;
        resolved.push(buildCategoryEntryFromItem(item));
    }
    return resolved;
};
