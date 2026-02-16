import { RANKS, SYSTEM_ID } from "../constants.js";
const MAX_PROTAGONISM_POINTS = 3;
const ATTRIBUTE_CONFIG = [
    { key: "corpo", labelKey: "RMRPG.Actor.Attributes.Corpo" },
    { key: "coordenacao", labelKey: "RMRPG.Actor.Attributes.Coordenacao" },
    { key: "agilidade", labelKey: "RMRPG.Actor.Attributes.Agilidade" },
    { key: "atencao", labelKey: "RMRPG.Actor.Attributes.Atencao" },
    { key: "mente", labelKey: "RMRPG.Actor.Attributes.Mente" },
    { key: "carisma", labelKey: "RMRPG.Actor.Attributes.Carisma" }
];
const SKILL_DEFS = [
    { key: "acrobatismo", labelKey: "RMRPG.Actor.Skills.Acrobatismo", attribute: "agilidade" },
    { key: "atletismo", labelKey: "RMRPG.Actor.Skills.Atletismo", attribute: "corpo" },
    { key: "malandragem", labelKey: "RMRPG.Actor.Skills.Malandragem", attribute: "mente" },
    { key: "dirigir", labelKey: "RMRPG.Actor.Skills.Dirigir", attribute: "atencao" },
    { key: "enganar", labelKey: "RMRPG.Actor.Skills.Enganar", attribute: "carisma" },
    { key: "furtividade", labelKey: "RMRPG.Actor.Skills.Furtividade", attribute: "agilidade" },
    { key: "historia", labelKey: "RMRPG.Actor.Skills.Historia", attribute: "mente" },
    { key: "intimidar", labelKey: "RMRPG.Actor.Skills.Intimidar", attribute: "carisma" },
    { key: "medicina", labelKey: "RMRPG.Actor.Skills.Medicina", attribute: "mente" },
    { key: "observar", labelKey: "RMRPG.Actor.Skills.Observar", attribute: "atencao" },
    { key: "oficios", labelKey: "RMRPG.Actor.Skills.Oficios", attribute: "mente" },
    { key: "persuadir", labelKey: "RMRPG.Actor.Skills.Persuadir", attribute: "carisma" },
    { key: "sobrevivencia", labelKey: "RMRPG.Actor.Skills.Sobrevivencia", attribute: "atencao" },
    { key: "reiki", labelKey: "RMRPG.Actor.Skills.Reiki", attribute: "mente" },
    { key: "tecnologia", labelKey: "RMRPG.Actor.Skills.Tecnologia", attribute: "mente" }
];
const EQUIPMENT_TYPES = ["weapon", "mystic", "consumable", "misc", "item"];
const EQUIPMENT_CATEGORIES = [
    { key: "weapon", labelKey: "RMRPG.Actor.Inventory.Category.Weapons" },
    { key: "mystic", labelKey: "RMRPG.Actor.Inventory.Category.Mystic" },
    { key: "consumable", labelKey: "RMRPG.Actor.Inventory.Category.Consumables" },
    { key: "misc", labelKey: "RMRPG.Actor.Inventory.Category.Misc" }
];
const ITEM_STATUS_ORDER = ["stowed", "hand", "dropped"];
const ITEM_STATUS_ICONS = {
    stowed: "fas fa-box",
    hand: "fas fa-hand",
    dropped: "fas fa-arrow-down"
};
function getEvolutionLabel(index) {
    const rankIndex = Math.min(RANKS.length - 1, Math.floor((index - 1) / 4));
    const step = ((index - 1) % 4) + 1;
    return `${RANKS[rankIndex]}${step}`;
}
function extractAdvancementIndex(key) {
    const match = key.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
}
function sortAdvancementKeys(keys) {
    return [...keys].sort((a, b) => {
        const aIndex = extractAdvancementIndex(a);
        const bIndex = extractAdvancementIndex(b);
        if (aIndex !== bIndex) {
            return aIndex - bIndex;
        }
        return a.localeCompare(b);
    });
}
export class RMRPGActorSheet extends ActorSheet {
    equipmentOpenState = {};
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["rmrpg", "sheet", "actor"],
            width: 1180,
            height: 780,
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: ".sheet-body",
                    initial: "main"
                }
            ]
        });
    }
    render(force = false, options = {}) {
        this.applyThemeClass();
        return super.render(force, options);
    }
    get template() {
        return `systems/${SYSTEM_ID}/templates/actors/actor-sheet.hbs`;
    }
    async getData(options = {}) {
        const context = await super.getData(options);
        context.system = context.actor.system;
        context.isPlayer = context.actor.type === "player";
        context.isNPC = context.actor.type === "npc";
        context.isSummon = context.actor.type === "summon";
        context.rankOptions = RANKS.map((rank) => ({
            value: rank,
            label: rank
        }));
        context.attributeOptions = ATTRIBUTE_CONFIG.map((attribute) => ({
            value: attribute.key,
            label: game.i18n.localize(attribute.labelKey)
        }));
        context.rankBonus = Number(context.system.rank?.bonus ?? 2);
        context.derivedReflexo = Number(context.system.derived?.reflexo ?? 0);
        context.derivedVigor = Number(context.system.derived?.vigor ?? 0);
        context.derivedDeterminacao = Number(context.system.derived?.determinacao ?? 0);
        context.defenseCalculated = Number(context.system.defense?.calculated ?? 12 + context.derivedReflexo);
        context.defenseManual = Number(context.system.defense?.value ?? 0);
        context.hasManualDefense = context.defenseManual > 0;
        const hpValue = Number(context.system.hp?.value ?? 0);
        const hpMax = Math.max(1, Number(context.system.hp?.max ?? 1));
        const hpTemp = Math.max(0, Number(context.system.hp?.temp ?? 0));
        context.hpValue = hpValue;
        context.hpMax = hpMax;
        context.hpTemp = hpTemp;
        context.hpPercent = Math.max(0, Math.min(100, (hpValue / hpMax) * 100));
        context.attributeCards = ATTRIBUTE_CONFIG.map((attribute) => ({
            key: attribute.key,
            labelKey: attribute.labelKey,
            value: Number(context.system.attributes?.[attribute.key]?.value ?? 0)
        }));
        context.skillEntries = [];
        context.reikiCurrent = 0;
        context.reikiMax = 0;
        context.reikiPercent = 0;
        context.protagonismSlots = [];
        context.advancementEntries = [];
        context.hasAdvancements = false;
        context.advancementCount = Number(context.system.player?.progression?.advancementCount ?? 0);
        if (context.isPlayer) {
            const reikiMax = Math.max(0, Math.floor(Number(context.system.player?.reiki?.max ?? 0)));
            const reikiCurrent = Math.max(0, Math.floor(Number(context.system.player?.reiki?.current ?? 0)));
            const reikiClamped = Math.min(reikiCurrent, reikiMax);
            context.reikiMax = reikiMax;
            context.reikiCurrent = reikiClamped;
            context.reikiPercent = reikiMax > 0 ? Math.max(0, Math.min(100, (reikiClamped / reikiMax) * 100)) : 0;
            const protagonismPoints = this.clampInteger(Number(context.system.player?.protagonismPoints ?? 1), 0, MAX_PROTAGONISM_POINTS);
            context.protagonismPoints = protagonismPoints;
            context.protagonismSlots = Array.from({ length: MAX_PROTAGONISM_POINTS }, (_, index) => {
                const value = index + 1;
                return {
                    value,
                    active: value <= protagonismPoints
                };
            });
            const skills = context.system.player?.skills ?? {};
            const baseSkills = SKILL_DEFS.map((definition) => {
                const stored = skills[definition.key] ?? {};
                const attribute = String(stored.attribute ?? definition.attribute);
                const bonus = Number(stored.bonus ?? 0);
                const trained = Boolean(stored.trained);
                const attributeValue = Number(context.system.attributes?.[attribute]?.value ?? 0);
                const trainedBonus = trained ? context.rankBonus : 0;
                const totalBonus = Math.floor(attributeValue + bonus + trainedBonus);
                const labelOverride = String(stored.label ?? "").trim();
                const specialization = definition.key === "oficios" ? String(stored.specialization ?? "").trim() : "";
                let labelKey = definition.labelKey;
                let label = "";
                if (definition.key === "oficios" && specialization) {
                    label = `${game.i18n.localize(definition.labelKey)}: ${specialization}`;
                    labelKey = null;
                }
                else if (labelOverride) {
                    label = labelOverride;
                    labelKey = null;
                }
                const displayLabel = labelKey ? game.i18n.localize(labelKey) : label;
                return {
                    key: definition.key,
                    isCustom: false,
                    trained,
                    totalBonus,
                    attribute,
                    bonus,
                    labelKey,
                    label,
                    displayLabel,
                    trainedPath: `system.player.skills.${definition.key}.trained`,
                    attributePath: `system.player.skills.${definition.key}.attribute`,
                    bonusPath: `system.player.skills.${definition.key}.bonus`
                };
            });
            const customSkills = Array.isArray(skills.custom) ? skills.custom : [];
            const customEntries = customSkills.map((entry, index) => {
                const attribute = String(entry.attribute ?? "mente");
                const bonus = Number(entry.bonus ?? 0);
                const trained = Boolean(entry.trained);
                const attributeValue = Number(context.system.attributes?.[attribute]?.value ?? 0);
                const trainedBonus = trained ? context.rankBonus : 0;
                const totalBonus = Math.floor(attributeValue + bonus + trainedBonus);
                const label = String(entry.label ?? game.i18n.localize("RMRPG.Actor.Skills.CustomDefault"));
                return {
                    key: entry.id ?? `custom-${index + 1}`,
                    isCustom: true,
                    customIndex: index,
                    trained,
                    totalBonus,
                    attribute,
                    bonus,
                    labelKey: null,
                    label,
                    displayLabel: label,
                    trainedPath: `system.player.skills.custom.${index}.trained`,
                    attributePath: `system.player.skills.custom.${index}.attribute`,
                    bonusPath: `system.player.skills.custom.${index}.bonus`,
                    labelPath: `system.player.skills.custom.${index}.label`
                };
            });
            context.skillEntries = [...baseSkills, ...customEntries];
            const advancements = context.system.player?.advancements ?? {};
            const keys = sortAdvancementKeys(Object.keys(advancements));
            context.advancementEntries = keys.map((key, index) => ({
                key,
                code: getEvolutionLabel(index + 1),
                path: `system.player.advancements.${key}`,
                value: String(advancements[key] ?? "")
            }));
            context.hasAdvancements = context.advancementEntries.length > 0;
            const feats = context.actor.items?.filter((item) => item.type === "feat") ?? [];
            context.feats = feats.map((item) => ({
                id: item.id,
                name: item.name,
                img: item.img,
                requirements: item.system?.requirements ?? "",
                rank: item.system?.rank ?? "",
                description: item.system?.description ?? ""
            }));
            const statusLabels = {
                stowed: game.i18n.localize("RMRPG.Item.Status.Stowed"),
                hand: game.i18n.localize("RMRPG.Item.Status.InHand"),
                dropped: game.i18n.localize("RMRPG.Item.Status.Dropped")
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
                const quantity = this.clampInteger(Number(item.system?.quantity ?? 1), 0, 9999);
                const weight = Number(item.system?.weight ?? 0);
                const safeWeight = Number.isFinite(weight) ? weight : 0;
                const totalWeight = Math.round(safeWeight * quantity * 10) / 10;
                const rawStatus = String(item.system?.status ?? "stowed");
                const status = ITEM_STATUS_ORDER.includes(rawStatus) ? rawStatus : "stowed";
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
                    statusLabel: statusLabels[status] ?? statusLabels.stowed
                };
            });
            context.equipmentCategories = EQUIPMENT_CATEGORIES.map((category) => ({
                key: category.key,
                label: game.i18n.localize(category.labelKey),
                items: mappedEquipment.filter((item) => item.type === category.key)
            }));
            const totalWeight = mappedEquipment.reduce((sum, item) => sum + (item.status === "dropped" ? 0 : item.totalWeight), 0);
            const corpo = Number(context.system.attributes?.corpo?.value ?? 0);
            const carryCapacity = Math.max(0, 5 + corpo);
            context.carryCapacity = carryCapacity;
            context.carryWeight = Math.round(totalWeight * 10) / 10;
            context.carryPercent = carryCapacity > 0 ? Math.min(100, (totalWeight / carryCapacity) * 100) : 0;
        }
        return context;
    }
    activateListeners(html) {
        super.activateListeners(html);
        this.applyThemeClass();
        html.find("[data-action='set-attribute']").on("click", async (event) => {
            event.preventDefault();
            await this.openAttributeDialog();
        });
        html.find("[data-action='set-defense']").on("click", async (event) => {
            event.preventDefault();
            await this.openDefenseDialog();
        });
        html.find("[data-action='set-hp']").on("click", async (event) => {
            event.preventDefault();
            await this.openHpDialog();
        });
        html.find("[data-action='set-reiki']").on("click", async (event) => {
            event.preventDefault();
            await this.openReikiDialog();
        });
        html.find("[data-action='roll-skill']").on("click", async (event) => {
            event.preventDefault();
            const button = event.currentTarget;
            const label = String(button.dataset.label ?? "");
            const row = button.closest(".skill-row");
            const attribute = String(row?.querySelector("select")?.value ?? button.dataset.attr ?? "");
            const bonus = Number(button.dataset.bonus ?? 0);
            const trained = Boolean(row?.querySelector("input[type='checkbox']")?.checked);
            const rankBonus = Number(this.actor.system.rank?.bonus ?? 0);
            const attributeValue = Number(this.actor.system.attributes?.[attribute]?.value ?? 0);
            const total = Math.floor(attributeValue + bonus + (trained ? rankBonus : 0));
            if (!attribute)
                return;
            await this.actor.rollSkill(label || "Skill", total);
        });
        html.find("[data-action='edit-skills']").on("click", async (event) => {
            event.preventDefault();
            await this.openSkillSettings();
        });
        html.find("[data-action='add-skill']").on("click", async (event) => {
            event.preventDefault();
            if (this.actor.type !== "player")
                return;
            const skills = this.actor.system.player?.skills ?? {};
            const custom = Array.isArray(skills.custom) ? [...skills.custom] : [];
            const id = `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            custom.push({
                id,
                label: game.i18n.localize("RMRPG.Actor.Skills.CustomDefault"),
                attribute: "mente",
                trained: false,
                bonus: 0
            });
            await this.actor.update({ "system.player.skills.custom": custom });
        });
        html.find("[data-action='add-feat']").on("click", async (event) => {
            event.preventDefault();
            if (this.actor.type !== "player")
                return;
            const created = await this.actor.createEmbeddedDocuments("Item", [
                {
                    name: game.i18n.localize("RMRPG.Actor.Feats.NewName"),
                    type: "feat"
                }
            ]);
            const feat = created?.[0];
            if (feat) {
                feat.sheet?.render(true);
            }
        });
        html.find("[data-action='item-open']").on("click", async (event) => {
            event.preventDefault();
            const id = String(event.currentTarget.dataset.id ?? "");
            if (!id)
                return;
            const item = this.actor.items?.get(id);
            if (!item)
                return;
            item.sheet?.render(true);
        });
        html.find("[data-action='item-qty']").on("click", async (event) => {
            event.preventDefault();
            const id = String(event.currentTarget.dataset.id ?? "");
            if (!id)
                return;
            const delta = Number(event.currentTarget.dataset.delta ?? 0);
            if (!Number.isFinite(delta) || delta === 0)
                return;
            const item = this.actor.items?.get(id);
            if (!item)
                return;
            const current = Number(item.system?.quantity ?? 0);
            const next = this.clampInteger(current + delta, 0, 9999);
            await item.update({ "system.quantity": next });
        });
        html.find("[data-action='item-status']").on("click", async (event) => {
            event.preventDefault();
            const id = String(event.currentTarget.dataset.id ?? "");
            if (!id)
                return;
            const item = this.actor.items?.get(id);
            if (!item)
                return;
            const rawStatus = String(item.system?.status ?? "stowed");
            const currentIndex = ITEM_STATUS_ORDER.indexOf(rawStatus);
            const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % ITEM_STATUS_ORDER.length;
            const nextStatus = ITEM_STATUS_ORDER[nextIndex];
            await item.update({ "system.status": nextStatus });
        });
        html.find("[data-action='item-delete']").on("click", async (event) => {
            event.preventDefault();
            const id = String(event.currentTarget.dataset.id ?? "");
            if (!id)
                return;
            const item = this.actor.items?.get(id);
            if (!item)
                return;
            await item.delete();
        });
        html.find("[data-action='category-add']").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (this.actor.type !== "player")
                return;
            const category = String(event.currentTarget.dataset.category ?? "");
            if (!category)
                return;
            const created = await this.actor.createEmbeddedDocuments("Item", [
                {
                    name: game.i18n.localize("RMRPG.Actor.Inventory.NewItem"),
                    type: category
                }
            ]);
            const item = created?.[0];
            if (item) {
                item.sheet?.render(true);
            }
        });
        html.find("[data-action='category-search']").on("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
        html.find("[data-action='item-move']").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const button = event.currentTarget;
            const id = String(button.dataset.id ?? "");
            const direction = String(button.dataset.direction ?? "");
            if (!id || (direction !== "up" && direction !== "down"))
                return;
            const row = button.closest(".equipment-row");
            const table = row?.closest(".equipment-table");
            if (!row || !table)
                return;
            const rows = Array.from(table.querySelectorAll(".equipment-row"));
            const index = rows.findIndex((entry) => entry.dataset.id === id);
            if (index === -1)
                return;
            const targetIndex = direction === "up" ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= rows.length)
                return;
            const ordered = rows.map((entry) => entry.dataset.id ?? "").filter(Boolean);
            const [moved] = ordered.splice(index, 1);
            ordered.splice(targetIndex, 0, moved);
            await this.updateItemSortOrder(ordered);
        });
        html.find(".equipment-category").each((_, element) => {
            const details = element;
            const key = String(details.dataset.category ?? "");
            if (!key)
                return;
            const stored = this.equipmentOpenState[key];
            if (typeof stored === "boolean") {
                details.open = stored;
            }
            else {
                this.equipmentOpenState[key] = details.open;
            }
            details.addEventListener("toggle", () => {
                this.equipmentOpenState[key] = details.open;
            });
        });
        const bindReorderList = (listElement, rowSelector, group) => {
            listElement.addEventListener("dragover", (event) => {
                const dragEvent = event;
                const data = this.readItemDragData(dragEvent);
                if (!data || data.group !== group)
                    return;
                event.preventDefault();
            });
            listElement.addEventListener("drop", async (event) => {
                const dragEvent = event;
                const data = this.readItemDragData(dragEvent);
                if (!data || data.group !== group)
                    return;
                event.preventDefault();
                const rows = Array.from(listElement.querySelectorAll(rowSelector));
                const draggedIndex = rows.findIndex((row) => row.dataset.id === data.id);
                if (draggedIndex === -1)
                    return;
                const targetRow = dragEvent.target?.closest(rowSelector);
                let insertIndex = rows.length;
                if (targetRow) {
                    const targetIndex = rows.findIndex((row) => row === targetRow);
                    const rect = targetRow.getBoundingClientRect();
                    const isAfter = dragEvent.clientY > rect.top + rect.height / 2;
                    insertIndex = targetIndex + (isAfter ? 1 : 0);
                }
                const ordered = rows.map((row) => row.dataset.id ?? "").filter(Boolean);
                const [moved] = ordered.splice(draggedIndex, 1);
                let normalizedIndex = insertIndex;
                if (normalizedIndex > draggedIndex)
                    normalizedIndex -= 1;
                normalizedIndex = Math.max(0, Math.min(ordered.length, normalizedIndex));
                ordered.splice(normalizedIndex, 0, moved);
                await this.updateItemSortOrder(ordered);
            });
        };
        html.find(".feat-row").each((_, row) => {
            row.addEventListener("dragstart", (event) => {
                const dragEvent = event;
                const id = String(row.dataset.id ?? "");
                if (!id)
                    return;
                this.setItemDragData(dragEvent, { id, group: "feats" });
            });
        });
        const featList = html.find(".feats-list").get(0);
        if (featList) {
            bindReorderList(featList, ".feat-row", "feats");
        }
        html.find(".equipment-table").each((_, table) => {
            const listElement = table;
            const group = String(listElement.dataset.category ?? "");
            if (!group)
                return;
            bindReorderList(listElement, ".equipment-row", `equip:${group}`);
        });
        html.find(".equipment-row").each((_, row) => {
            row.addEventListener("dragstart", (event) => {
                const dragEvent = event;
                const id = String(row.dataset.id ?? "");
                const group = String(row.dataset.category ?? "");
                if (!id || !group)
                    return;
                this.setItemDragData(dragEvent, { id, group: `equip:${group}` });
            });
        });
        html.find("[data-action='remove-skill']").on("click", async (event) => {
            event.preventDefault();
            if (this.actor.type !== "player")
                return;
            const index = Number(event.currentTarget.dataset.index);
            if (!Number.isFinite(index) || index < 0)
                return;
            const skills = this.actor.system.player?.skills ?? {};
            const custom = Array.isArray(skills.custom) ? [...skills.custom] : [];
            if (index >= custom.length)
                return;
            custom.splice(index, 1);
            await this.actor.update({ "system.player.skills.custom": custom });
        });
        html.find("[data-action='roll-derived']").on("click", async (event) => {
            event.preventDefault();
            const derived = String(event.currentTarget.dataset.derived ?? "");
            if (!derived)
                return;
            await this.actor.rollDerived(derived);
        });
        html.find("[data-action='set-protagonism']").on("click", async (event) => {
            event.preventDefault();
            if (this.actor.type !== "player")
                return;
            const value = this.clampInteger(Number(event.currentTarget.dataset.value), 0, MAX_PROTAGONISM_POINTS);
            await this.actor.update({ "system.player.protagonismPoints": value });
        });
        html.find("[data-action='set-protagonism']").on("contextmenu", async (event) => {
            event.preventDefault();
            if (this.actor.type !== "player")
                return;
            const current = this.clampInteger(Number(this.actor.system.player?.protagonismPoints ?? 1), 0, MAX_PROTAGONISM_POINTS);
            await this.actor.update({ "system.player.protagonismPoints": Math.max(0, current - 1) });
        });
        html.find("[data-action='add-advancement']").on("click", async (event) => {
            event.preventDefault();
            await this._onSubmit(event, { preventClose: true, preventRender: true });
            const advancements = this.actor.system.player?.advancements ?? {};
            const existingKeys = Object.keys(advancements);
            const highest = existingKeys.reduce((max, key) => Math.max(max, extractAdvancementIndex(key)), 0);
            const nextKey = `e${highest + 1}`;
            await this.actor.update({ [`system.player.advancements.${nextKey}`]: "" });
        });
        html.find("[data-action='remove-advancement']").on("click", async (event) => {
            event.preventDefault();
            const key = String(event.currentTarget.dataset.key ?? "");
            if (!key)
                return;
            await this._onSubmit(event, { preventClose: true, preventRender: true });
            await this.actor.update({ [`system.player.advancements.-=${key}`]: null });
        });
        this.bindInlineIntegerInput(html, "[data-action='inline-hp-value']", async (value) => {
            const hpMax = Math.max(1, Math.floor(Number(this.actor.system.hp?.max ?? 1)));
            await this.actor.update({ "system.hp.value": this.clampInteger(value, 0, hpMax) });
        });
        this.bindInlineIntegerInput(html, "[data-action='inline-hp-temp']", async (value) => {
            await this.actor.update({ "system.hp.temp": Math.max(0, value) });
        });
        this.bindInlineIntegerInput(html, "[data-action='inline-reiki-current']", async (value) => {
            const reikiMax = Math.max(0, Math.floor(Number(this.actor.system.player?.reiki?.max ?? 0)));
            await this.actor.update({ "system.player.reiki.current": this.clampInteger(value, 0, reikiMax) });
        });
        html.find("[data-action='feat-chat']").on("click", async (event) => {
            event.preventDefault();
            const id = String(event.currentTarget.dataset.id ?? "");
            if (!id)
                return;
            const item = this.actor.items?.get(id);
            if (!item)
                return;
            await this.sendFeatToChat(item);
        });
        html.find("[data-action='feat-open']").on("click", async (event) => {
            event.preventDefault();
            const id = String(event.currentTarget.dataset.id ?? "");
            if (!id)
                return;
            const item = this.actor.items?.get(id);
            if (!item)
                return;
            item.sheet?.render(true);
        });
        html.find("[data-action='feat-delete']").on("click", async (event) => {
            event.preventDefault();
            const id = String(event.currentTarget.dataset.id ?? "");
            if (!id)
                return;
            const item = this.actor.items?.get(id);
            if (!item)
                return;
            await item.delete();
        });
        const featDrop = html.find("[data-action='feat-drop']");
        featDrop.on("dragover", (event) => event.preventDefault());
        featDrop.on("drop", async (event) => {
            await this.onFeatDrop(event);
        });
    }
    applyThemeClass() {
        const enabled = game.settings.get(SYSTEM_ID, "punkCityTheme");
        document.body?.classList.toggle("punk-city", Boolean(enabled));
        const classes = new Set(this.options.classes ?? []);
        if (enabled) {
            classes.add("punk-city");
        }
        else {
            classes.delete("punk-city");
        }
        this.options.classes = Array.from(classes);
        this.element?.toggleClass("punk-city", enabled);
    }
    setItemDragData(event, data) {
        if (!event.dataTransfer)
            return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-rmrpg-item", JSON.stringify(data));
        const item = this.actor.items?.get(data.id);
        if (item && typeof item.toDragData === "function") {
            event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
        }
    }
    readItemDragData(event) {
        const raw = event.dataTransfer?.getData("application/x-rmrpg-item");
        if (!raw)
            return null;
        try {
            const parsed = JSON.parse(raw);
            if (!parsed?.id || !parsed?.group)
                return null;
            return parsed;
        }
        catch {
            return null;
        }
    }
    async updateItemSortOrder(ids) {
        if (!ids.length)
            return;
        const updates = ids.map((id, index) => ({
            _id: id,
            sort: (index + 1) * 10
        }));
        await this.actor.updateEmbeddedDocuments("Item", updates);
    }
    bindInlineIntegerInput(html, selector, onCommit) {
        const commit = async (target) => {
            if (!target)
                return;
            const input = target;
            const parsed = this.parseNumericInput(input.value);
            if (parsed === null) {
                ui.notifications.warn(game.i18n.localize("RMRPG.Dialogs.InvalidNumber"));
                this.render(false);
                return;
            }
            await onCommit(Math.floor(parsed));
        };
        html.find(selector).on("change", async (event) => {
            await commit(event.currentTarget);
        });
        html.find(selector).on("keydown", async (event) => {
            if (event.key !== "Enter")
                return;
            event.preventDefault();
            await commit(event.currentTarget);
        });
    }
    parseNumericInput(rawValue) {
        const trimmed = String(rawValue ?? "").trim();
        if (trimmed === "") {
            return 0;
        }
        const parsed = Number(trimmed.replace(",", "."));
        return Number.isFinite(parsed) ? parsed : null;
    }
    async openAttributeDialog() {
        const dialog = await this.showDialog(game.i18n.localize("RMRPG.Dialogs.Attributes.Title"), `
      <form class="rmrpg-dialog-form">
        ${ATTRIBUTE_CONFIG.map((attribute) => {
            const label = game.i18n.localize(attribute.labelKey);
            const current = Number(this.actor.system.attributes?.[attribute.key]?.value ?? 0);
            return `
            <div class="form-group">
              <label>${label}</label>
              <input type="number" name="${attribute.key}" value="${current}" step="1" />
            </div>
          `;
        }).join("")}
      </form>
      `);
        if (!dialog)
            return;
        const updateData = {};
        for (const attribute of ATTRIBUTE_CONFIG) {
            const fallback = Number(this.actor.system.attributes?.[attribute.key]?.value ?? 0);
            const parsed = this.readDialogNumber(dialog, attribute.key, fallback);
            if (parsed === null)
                return;
            updateData[`system.attributes.${attribute.key}.value`] = Math.floor(parsed);
        }
        await this.actor.update(updateData);
    }
    async openHpDialog() {
        const dialog = await this.showDialog(game.i18n.localize("RMRPG.Dialogs.HP.Title"), `
      <form class="rmrpg-dialog-form">
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.HP.Current")}</label>
          <input type="number" name="hpValue" value="${Number(this.actor.system.hp?.value ?? 0)}" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.HP.Max")}</label>
          <input type="number" name="hpMax" value="${Number(this.actor.system.hp?.max ?? 1)}" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.HP.Temp")}</label>
          <input type="number" name="hpTemp" value="${Number(this.actor.system.hp?.temp ?? 0)}" step="1" />
        </div>
      </form>
      `);
        if (!dialog)
            return;
        const hpValue = this.readDialogNumber(dialog, "hpValue", Number(this.actor.system.hp?.value ?? 0));
        const hpMax = this.readDialogNumber(dialog, "hpMax", Number(this.actor.system.hp?.max ?? 1));
        const hpTemp = this.readDialogNumber(dialog, "hpTemp", Number(this.actor.system.hp?.temp ?? 0));
        if (hpValue === null || hpMax === null || hpTemp === null)
            return;
        const safeMax = Math.max(1, Math.floor(hpMax));
        await this.actor.update({
            "system.hp.value": this.clampInteger(Math.floor(hpValue), 0, safeMax),
            "system.hp.max": safeMax,
            "system.hp.temp": Math.max(0, Math.floor(hpTemp))
        });
    }
    async openDefenseDialog() {
        const current = Number(this.actor.system.defense?.value ?? 0);
        const dialog = await this.showDialog(game.i18n.localize("RMRPG.Dialogs.Defense.Title"), `
      <form class="rmrpg-dialog-form">
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.Defense.Manual")}</label>
          <input type="number" name="defenseValue" value="${current > 0 ? current : ""}" step="1" placeholder="${game.i18n.localize("RMRPG.Dialogs.Defense.BlankForAuto")}" />
        </div>
      </form>
      `);
        if (!dialog)
            return;
        const input = this.readDialogRawValue(dialog, "defenseValue");
        if (input === "") {
            await this.actor.update({ "system.defense.value": 0 });
            return;
        }
        const parsed = this.parseNumericInput(input);
        if (parsed === null) {
            ui.notifications.warn(game.i18n.localize("RMRPG.Dialogs.InvalidNumber"));
            return;
        }
        await this.actor.update({ "system.defense.value": Math.max(0, Math.floor(parsed)) });
    }
    async openReikiDialog() {
        if (this.actor.type !== "player")
            return;
        const current = Math.max(0, Math.floor(Number(this.actor.system.player?.reiki?.current ?? 0)));
        const max = Math.max(0, Math.floor(Number(this.actor.system.player?.reiki?.max ?? 0)));
        const dialog = await this.showDialog(game.i18n.localize("RMRPG.Dialogs.Reiki.Title"), `
      <form class="rmrpg-dialog-form">
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.Reiki.Current")}</label>
          <input type="number" name="reikiCurrent" value="${current}" min="0" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.Reiki.Max")}</label>
          <input type="number" name="reikiMax" value="${max}" min="0" step="1" />
        </div>
      </form>
      `);
        if (!dialog)
            return;
        const parsedCurrent = this.readDialogNumber(dialog, "reikiCurrent", current);
        const parsedMax = this.readDialogNumber(dialog, "reikiMax", max);
        if (parsedCurrent === null || parsedMax === null)
            return;
        const safeMax = Math.max(0, Math.floor(parsedMax));
        const safeCurrent = this.clampInteger(Math.floor(parsedCurrent), 0, safeMax);
        await this.actor.update({
            "system.player.reiki.current": safeCurrent,
            "system.player.reiki.max": safeMax
        });
    }
    async openSkillSettings() {
        if (this.actor.type !== "player")
            return;
        const skills = this.actor.system.player?.skills ?? {};
        const customSkills = Array.isArray(skills.custom) ? skills.custom : [];
        const dialog = await this.showDialog(game.i18n.localize("RMRPG.Actor.Skills.NamesTitle"), `
      <form class="rmrpg-dialog-form">
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Actor.Skills.OficiosSpecialization")}</label>
          <input type="text" name="oficiosSpec" value="${String(skills.oficios?.specialization ?? "")}" />
        </div>
        <h3 class="dialog-section-title">${game.i18n.localize("RMRPG.Actor.Skills.NamesTitle")}</h3>
        <div class="skill-settings-list">
          ${SKILL_DEFS.map((definition) => {
            const stored = skills[definition.key] ?? {};
            const labelValue = String(stored.label ?? "");
            return `
              <div class="skill-settings-row">
                <label>${game.i18n.localize(definition.labelKey)}</label>
                <input type="text" name="label_${definition.key}" value="${labelValue}" />
              </div>
            `;
        }).join("")}
          ${customSkills.map((entry, index) => {
            const labelValue = String(entry.label ?? "");
            return `
              <div class="skill-settings-row">
                <label>${game.i18n.localize("RMRPG.Actor.Skills.CustomLabel")} ${index + 1}</label>
                <input type="text" name="label_custom_${index}" value="${labelValue}" />
                <label class="skill-remove-toggle" title="${game.i18n.localize("RMRPG.Actor.Advancements.Remove")}">
                  <input type="checkbox" name="remove_custom_${index}" />
                  <i class="fas fa-trash"></i>
                </label>
              </div>
            `;
        }).join("")}
        </div>
      </form>
      `);
        if (!dialog)
            return;
        const updates = {};
        updates["system.player.skills.oficios.specialization"] = this.readDialogRawValue(dialog, "oficiosSpec");
        for (const definition of SKILL_DEFS) {
            const label = this.readDialogRawValue(dialog, `label_${definition.key}`);
            updates[`system.player.skills.${definition.key}.label`] = label;
        }
        if (customSkills.length) {
            const nextCustom = customSkills.map((entry) => ({ ...entry }));
            const removeFlags = customSkills.map((_, index) => {
                return dialog.find(`[name='remove_custom_${index}']`).prop("checked");
            });
            nextCustom.forEach((entry, index) => {
                const label = this.readDialogRawValue(dialog, `label_custom_${index}`);
                entry.label = label;
            });
            updates["system.player.skills.custom"] = nextCustom.filter((_, index) => !removeFlags[index]);
        }
        await this.actor.update(updates);
    }
    async onFeatDrop(event) {
        event.preventDefault();
        if (!this.actor)
            return;
        const reorderData = this.readItemDragData(event);
        if (reorderData?.group === "feats")
            return;
        const data = TextEditor.getDragEventData(event);
        if (!data || data.type !== "Item")
            return;
        let itemData = data.data;
        if (!itemData && data.uuid) {
            const item = await fromUuid(data.uuid);
            if (item) {
                itemData = item.toObject();
            }
        }
        if (!itemData || itemData.type !== "feat")
            return;
        await this.actor.createEmbeddedDocuments("Item", [itemData]);
    }
    async sendFeatToChat(item) {
        const requirements = String(item.system?.requirements ?? "");
        const rank = String(item.system?.rank ?? "");
        const description = await TextEditor.enrichHTML(String(item.system?.description ?? ""), { async: true });
        const content = `
      <div class="rmrpg-feat-chat">
        <h2>${item.name}</h2>
        <p><strong>${game.i18n.localize("RMRPG.Item.Feat.Requirements")}:</strong> ${requirements || "-"}</p>
        <p><strong>${game.i18n.localize("RMRPG.Item.Feat.Rank")}:</strong> ${rank || "-"}</p>
        <div class="rmrpg-feat-desc">${description}</div>
      </div>
    `;
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content
        });
    }
    async showDialog(title, content) {
        return new Promise((resolve) => {
            let resolved = false;
            new Dialog({
                title,
                content,
                buttons: {
                    cancel: {
                        icon: "<i class='fas fa-times'></i>",
                        label: game.i18n.localize("Cancel"),
                        callback: () => {
                            resolved = true;
                            resolve(null);
                        }
                    },
                    save: {
                        icon: "<i class='fas fa-check'></i>",
                        label: game.i18n.localize("Save"),
                        callback: (dialogHtml) => {
                            resolved = true;
                            resolve(dialogHtml);
                        }
                    }
                },
                default: "save",
                close: () => {
                    if (!resolved)
                        resolve(null);
                }
            }).render(true);
        });
    }
    readDialogRawValue(dialogHtml, inputName) {
        return String(dialogHtml.find(`[name='${inputName}']`).val() ?? "").trim();
    }
    readDialogNumber(dialogHtml, inputName, fallback) {
        const raw = this.readDialogRawValue(dialogHtml, inputName);
        if (raw === "") {
            return fallback;
        }
        const parsed = this.parseNumericInput(raw);
        if (parsed === null) {
            ui.notifications.warn(game.i18n.localize("RMRPG.Dialogs.InvalidNumber"));
            return null;
        }
        return parsed;
    }
    clampInteger(value, min, max) {
        if (!Number.isFinite(value))
            return min;
        return Math.max(min, Math.min(max, Math.floor(value)));
    }
}
