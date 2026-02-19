import { EQUIPMENT_TYPES, EQUIPMENT_CATEGORIES, ITEM_STATUS_ORDER, ITEM_STATUS_ICONS } from "../../actor/config.js";
import { clampInteger, localize } from "../../global-functions/utils.js";
import { collectItemTags, getItemDescriptionText } from "../item-summary.js";
export const applyPlayerInventoryContext = (context) => {
    const statusLabels = {
        stowed: localize("RMRPG.Item.Status.Stowed"),
        hand: localize("RMRPG.Item.Status.InHand"),
        dropped: localize("RMRPG.Item.Status.Dropped")
    };
    const equipmentItems = context.actor.items?.filter((item) => EQUIPMENT_TYPES.includes(item.type)) ?? [];
    equipmentItems.sort((a, b) => {
        const aSort = Number(a.sort ?? 0);
        const bSort = Number(b.sort ?? 0);
        if (aSort !== bSort) {
            return aSort - bSort;
        }
        return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });
    const mappedEquipment = equipmentItems.map((item) => {
        const quantity = clampInteger(Number(item.system?.quantity ?? 1), 0, 9999);
        const weight = Number(item.system?.weight ?? 0);
        const safeWeight = Number.isFinite(weight) ? weight : 0;
        const totalWeight = Math.round(safeWeight * quantity * 10) / 10;
        const rawStatus = String(item.system?.status ?? "stowed");
        const status = ITEM_STATUS_ORDER.includes(rawStatus) ? rawStatus : "stowed";
        const tags = collectItemTags(item);
        const description = getItemDescriptionText(item);
        return {
            id: item.id,
            name: item.name,
            img: item.img,
            type: item.type,
            quantity,
            weight: safeWeight,
            totalWeight,
            status,
            statusClass: `status-${status}`,
            statusIcon: ITEM_STATUS_ICONS[status] ?? ITEM_STATUS_ICONS.stowed,
            statusLabel: statusLabels[status] ?? statusLabels.stowed,
            tags,
            description
        };
    });
    context.equipmentCategories = EQUIPMENT_CATEGORIES.map((category) => ({
        key: category.key,
        label: localize(category.labelKey),
        items: mappedEquipment.filter((item) => item.type === category.key)
    }));
    const totalWeight = mappedEquipment.reduce((sum, item) => sum + (item.status === "dropped" ? 0 : item.totalWeight), 0);
    const corpo = Number(context.system.attributes?.corpo?.value ?? 0);
    const carryCapacity = Math.max(0, 5 + corpo);
    context.carryCapacity = carryCapacity;
    context.carryWeight = Math.round(totalWeight * 10) / 10;
    context.carryPercent = carryCapacity > 0 ? Math.min(100, (totalWeight / carryCapacity) * 100) : 0;
};
