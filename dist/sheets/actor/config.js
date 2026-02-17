export const MAX_PROTAGONISM_POINTS = 3;
export const ATTRIBUTE_CONFIG = [
    { key: "corpo", labelKey: "RMRPG.Actor.Attributes.Corpo" },
    { key: "coordenacao", labelKey: "RMRPG.Actor.Attributes.Coordenacao" },
    { key: "agilidade", labelKey: "RMRPG.Actor.Attributes.Agilidade" },
    { key: "atencao", labelKey: "RMRPG.Actor.Attributes.Atencao" },
    { key: "mente", labelKey: "RMRPG.Actor.Attributes.Mente" },
    { key: "carisma", labelKey: "RMRPG.Actor.Attributes.Carisma" }
];
export const DERIVED_CONFIG = [
    { key: "reflexo", labelKey: "RMRPG.Actor.Derived.Reflexo" },
    { key: "vigor", labelKey: "RMRPG.Actor.Derived.Vigor" },
    { key: "determinacao", labelKey: "RMRPG.Actor.Derived.Determinacao" },
    { key: "iniciativa", labelKey: "RMRPG.Actor.Derived.Iniciativa" }
];
export const RESISTANCE_CONFIG = [
    { key: "physical", labelKey: "RMRPG.Actor.Resistance.Physical" },
    { key: "elemental", labelKey: "RMRPG.Actor.Resistance.Elemental" },
    { key: "mental", labelKey: "RMRPG.Actor.Resistance.Mental" },
    { key: "deteriorating", labelKey: "RMRPG.Actor.Resistance.Deteriorating" }
];
export const SKILL_DEFS = [
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
export const EQUIPMENT_TYPES = ["weapon", "consumable", "misc", "item"];
export const EQUIPMENT_CATEGORIES = [
    { key: "weapon", labelKey: "RMRPG.Actor.Inventory.Category.Weapons" },
    { key: "consumable", labelKey: "RMRPG.Actor.Inventory.Category.Consumables" },
    { key: "misc", labelKey: "RMRPG.Actor.Inventory.Category.Misc" }
];
export const ITEM_STATUS_ORDER = ["stowed", "hand", "dropped"];
export const ITEM_STATUS_ICONS = {
    stowed: "fas fa-box",
    hand: "fas fa-hand",
    dropped: "fas fa-arrow-down"
};
