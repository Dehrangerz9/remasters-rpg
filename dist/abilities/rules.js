import { RANKS } from "../constants.js";
import { clampInteger } from "../sheets/global-functions/utils.js";
const ABILITY_DAMAGE_TYPES = ["physical", "elemental", "mental", "deteriorating"];
const ABILITY_AREA_TYPES = ["emanacao", "feixe", "explosao", "line"];
export const ABILITY_RULES = {
    // Replace these placeholder tables with the campaign's progression rules.
    categoryLimit: 2,
    characteristicLimit: 3,
    castingTimes: [
        { id: "1-action", labelKey: "RMRPG.Item.Ability.CastingTime.OneAction", cost: { type: "flat", value: 0 } },
        { id: "2-actions", labelKey: "RMRPG.Item.Ability.CastingTime.TwoActions", cost: { type: "flat", value: 0 } },
        { id: "3-actions", labelKey: "RMRPG.Item.Ability.CastingTime.ThreeActions", cost: { type: "flat", value: 0 } },
        { id: "free", labelKey: "RMRPG.Item.Ability.CastingTime.FreeAction", cost: { type: "flat", value: 0 } },
        { id: "reaction", labelKey: "RMRPG.Item.Ability.CastingTime.Reaction", cost: { type: "flat", value: 0 } }
    ],
    castingCosts: [
        { id: "default", labelKey: "RMRPG.Item.Ability.CastingCost.Default" },
        { id: "enhanced-check", labelKey: "RMRPG.Item.Ability.CastingCost.EnhancedCheck" },
        { id: "free", labelKey: "RMRPG.Item.Ability.CastingCost.Free" }
    ],
    categories: [
        {
            id: "criacao",
            labelKey: "RMRPG.Item.Ability.Category.Criacao",
            tooltipKey: "RMRPG.Item.Ability.CategoryTooltip.Criacao",
            cost: { type: "flat", value: 1 }
        },
        {
            id: "evocao",
            labelKey: "RMRPG.Item.Ability.Category.Evocao",
            tooltipKey: "RMRPG.Item.Ability.CategoryTooltip.Evocao",
            cost: { type: "flat", value: 1 }
        },
        {
            id: "identificacao",
            labelKey: "RMRPG.Item.Ability.Category.Identificacao",
            tooltipKey: "RMRPG.Item.Ability.CategoryTooltip.Identificacao",
            cost: { type: "flat", value: 1 }
        },
        {
            id: "omissao",
            labelKey: "RMRPG.Item.Ability.Category.Omissao",
            tooltipKey: "RMRPG.Item.Ability.CategoryTooltip.Omissao",
            cost: { type: "flat", value: 1 }
        },
        {
            id: "manipulacao-mental",
            labelKey: "RMRPG.Item.Ability.Category.ManipulacaoMental",
            tooltipKey: "RMRPG.Item.Ability.CategoryTooltip.ManipulacaoMental",
            cost: { type: "flat", value: 1 }
        },
        {
            id: "reforco",
            labelKey: "RMRPG.Item.Ability.Category.Reforco",
            tooltipKey: "RMRPG.Item.Ability.CategoryTooltip.Reforco",
            cost: { type: "flat", value: 1 }
        },
        {
            id: "recuperacao",
            labelKey: "RMRPG.Item.Ability.Category.Recuperacao",
            tooltipKey: "RMRPG.Item.Ability.CategoryTooltip.Recuperacao",
            cost: { type: "flat", value: 1 }
        }
    ],
    characteristics: [
        {
            id: "alvos",
            labelKey: "RMRPG.Item.Ability.Characteristic.Alvos",
            min: 1,
            max: 5,
            cost: { type: "table", values: [0, 6, 15, 27, 39] },
            levels: [
                { level: 1, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Targets1", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Targets1", rank: "D" },
                { level: 2, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Targets2", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Targets2", rank: "D" },
                { level: 3, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Targets3", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Targets3", rank: "C" },
                { level: 4, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Targets4", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Targets4", rank: "B" },
                { level: 5, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Targets5", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Targets5", rank: "A" }
            ]
        },
        {
            id: "area",
            labelKey: "RMRPG.Item.Ability.Characteristic.Area",
            min: 1,
            max: 3,
            cumulativeCost: true,
            cost: { type: "table", values: [12, 9, 6] },
            levels: [
                { level: 1, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.AreaSmall", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.AreaSmall", rank: "D" },
                { level: 2, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.AreaMedium", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.AreaMedium", rank: "C" },
                { level: 3, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.AreaLarge", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.AreaLarge", rank: "B" }
            ]
        },
        {
            id: "condicao",
            labelKey: "RMRPG.Item.Ability.Characteristic.Condicao",
            min: 1,
            max: 4,
            cost: { type: "table", values: [3, 6, 12, 18] },
            levels: [
                { level: 1, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.ConditionGrade1", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.ConditionGrade1", rank: "D" },
                { level: 2, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.ConditionGrade2", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.ConditionGrade2", rank: "C" },
                { level: 3, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.ConditionGrade3", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.ConditionGrade3", rank: "B" },
                { level: 4, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.ConditionGrade4", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.ConditionGrade4", rank: "A" }
            ]
        },
        {
            id: "destruicao",
            labelKey: "RMRPG.Item.Ability.Characteristic.Destruicao",
            min: 1,
            max: 6,
            cost: { type: "table", values: [0, 3, 9, 18, 30, 42] },
            levels: [
                { level: 1, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DestructionNoDie", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DestructionNoDie", rank: "D" },
                { level: 2, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DestructionD4", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DestructionD4", rank: "D" },
                { level: 3, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DestructionD6", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DestructionD6", rank: "D" },
                { level: 4, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DestructionD8", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DestructionD8", rank: "C" },
                { level: 5, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DestructionD10", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DestructionD10", rank: "B" },
                { level: 6, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DestructionD12", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DestructionD12", rank: "A" }
            ]
        },
        {
            id: "distancia",
            labelKey: "RMRPG.Item.Ability.Characteristic.Distancia",
            min: 1,
            max: 11,
            cost: { type: "table", values: [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30] },
            levels: [
                { level: 1, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DistanceMelee", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DistanceMelee", rank: "D" },
                { level: 2, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Distance3", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Distance3", rank: "D" },
                { level: 3, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Distance6", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Distance6", rank: "D" },
                { level: 4, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Distance9", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Distance9", rank: "C" },
                { level: 5, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Distance12", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Distance12", rank: "C" },
                { level: 6, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Distance15", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Distance15", rank: "B" },
                { level: 7, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Distance18", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Distance18", rank: "B" },
                { level: 8, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Distance21", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Distance21", rank: "A" },
                { level: 9, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Distance24", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Distance24", rank: "A" },
                { level: 10, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Distance27", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Distance27", rank: "A" },
                { level: 11, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.Distance30", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.Distance30", rank: "A" }
            ]
        },
        {
            id: "duracao",
            labelKey: "RMRPG.Item.Ability.Characteristic.Duracao",
            min: 1,
            max: 5,
            cost: { type: "table", values: [0, 6, 15, 27, 39] },
            levels: [
                { level: 1, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DurationInstant", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DurationInstant", rank: "D" },
                { level: 2, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DurationScene", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DurationScene", rank: "D" },
                { level: 3, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DurationHours", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DurationHours", rank: "D" },
                { level: 4, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DurationDay", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DurationDay", rank: "B" },
                { level: 5, labelKey: "RMRPG.Item.Ability.CharacteristicLevel.DurationPermanent", shortLabelKey: "RMRPG.Item.Ability.CharacteristicLevelShort.DurationPermanent", rank: "A" }
            ]
        }
    ],
    enhancements: [
        {
            id: "caracteristica-adicional",
            labelKey: "RMRPG.Item.Ability.Enhancement.CaracteristicaAdicional",
            descriptionKey: "RMRPG.Item.Ability.EnhancementDesc.CaracteristicaAdicional",
            cost: { type: "flat", value: 1 },
            modifiers: { characteristicSlots: 1 }
        },
        {
            id: "categoria-adicional",
            labelKey: "RMRPG.Item.Ability.Enhancement.CategoriaAdicional",
            descriptionKey: "RMRPG.Item.Ability.EnhancementDesc.CategoriaAdicional",
            cost: { type: "flat", value: 1 },
            modifiers: { categorySlots: 1 }
        },
        {
            id: "conjuracao-adiada",
            labelKey: "RMRPG.Item.Ability.Enhancement.ConjuracaoAdiada",
            descriptionKey: "RMRPG.Item.Ability.EnhancementDesc.ConjuracaoAdiada",
            cost: { type: "flat", value: 1 }
        },
        {
            id: "conjuracao-reativa",
            labelKey: "RMRPG.Item.Ability.Enhancement.ConjuracaoReativa",
            descriptionKey: "RMRPG.Item.Ability.EnhancementDesc.ConjuracaoReativa",
            cost: { type: "flat", value: 2 }
        },
        {
            id: "conjuracao-cuidadosa",
            labelKey: "RMRPG.Item.Ability.Enhancement.ConjuracaoCuidadosa",
            descriptionKey: "RMRPG.Item.Ability.EnhancementDesc.ConjuracaoCuidadosa",
            cost: { type: "flat", value: 1 }
        },
        {
            id: "dado-reiki-aprimorado",
            labelKey: "RMRPG.Item.Ability.Enhancement.DadoReikiAprimorado",
            descriptionKey: "RMRPG.Item.Ability.EnhancementDesc.DadoReikiAprimorado",
            cost: { type: "flat", value: 2 }
        },
        {
            id: "conjuracao-destrutiva",
            labelKey: "RMRPG.Item.Ability.Enhancement.ConjuracaoDestrutiva",
            descriptionKey: "RMRPG.Item.Ability.EnhancementDesc.ConjuracaoDestrutiva",
            cost: { type: "flat", value: 2 }
        },
        {
            id: "perfuracao",
            labelKey: "RMRPG.Item.Ability.Enhancement.Perfuracao",
            descriptionKey: "RMRPG.Item.Ability.EnhancementDesc.Perfuracao",
            cost: { type: "flat", value: 1 }
        }
    ]
};
const ruleHandlers = {
    flat: (rule, _level) => Number(rule.value ?? 0),
    linear: (rule, level) => Number(rule.base ?? 0) + Number(rule.step ?? 0) * Math.max(0, level - 1),
    exponential: (rule, level) => Number(rule.base ?? 0) * Math.pow(Number(rule.factor ?? 1), Math.max(0, level - 1)),
    step: (rule, level) => {
        const steps = Array.isArray(rule.steps) ? rule.steps : [];
        for (const step of steps) {
            if (level <= Number(step.upto ?? 0))
                return Number(step.value ?? 0);
        }
        return Number(steps[steps.length - 1]?.value ?? 0);
    },
    table: (rule, level) => {
        const values = Array.isArray(rule.values) ? rule.values : [];
        if (!values.length)
            return 0;
        const index = Math.min(values.length - 1, Math.max(0, level - 1));
        return Number(values[index] ?? 0);
    }
};
export const resolveCost = (rule, level = 1) => {
    if (!rule)
        return 0;
    const handler = ruleHandlers[rule.type];
    if (!handler)
        return 0;
    return handler(rule, Math.max(1, Math.floor(level)));
};
const resolveCharacteristicCost = (rule, level) => {
    if (!rule)
        return 0;
    const normalizedLevel = Math.max(1, Math.floor(level));
    if (!rule.cumulativeCost) {
        return resolveCost(rule.cost, normalizedLevel);
    }
    const startLevel = Math.max(1, Math.floor(rule.min ?? 1));
    let total = 0;
    for (let current = startLevel; current <= normalizedLevel; current += 1) {
        total += resolveCost(rule.cost, current);
    }
    return total;
};
const categoryMap = new Map(ABILITY_RULES.categories.map((entry) => [entry.id, entry]));
const characteristicMap = new Map(ABILITY_RULES.characteristics.map((entry) => [entry.id, entry]));
const enhancementMap = new Map(ABILITY_RULES.enhancements.map((entry) => [entry.id, entry]));
const castingTimeMap = new Map(ABILITY_RULES.castingTimes.map((entry) => [entry.id, entry]));
const castingCostMap = new Map(ABILITY_RULES.castingCosts.map((entry) => [entry.id, entry]));
const rankOrder = new Map(RANKS.map((rank, index) => [rank, index]));
const normalizeRank = (value) => {
    const rank = String(value ?? "").toUpperCase();
    return rankOrder.has(rank) ? rank : null;
};
const isRankLowerThan = (actorRank, minRank) => {
    if (!actorRank || !minRank)
        return false;
    return (rankOrder.get(actorRank) ?? 0) < (rankOrder.get(minRank) ?? 0);
};
const getCharacteristicLevelRequirement = (id, level) => {
    const rule = characteristicMap.get(id);
    const definition = rule?.levels?.find((entry) => Number(entry.level) === Number(level));
    return normalizeRank(definition?.rank);
};
export const getAbilityCategoryRule = (id) => categoryMap.get(id);
export const getAbilityCharacteristicRule = (id) => characteristicMap.get(id);
export const getAbilityEnhancementRule = (id) => enhancementMap.get(id);
export const getAbilityCastingTimeRule = (id) => castingTimeMap.get(id);
export const getAbilityCastingCostRule = (id) => castingCostMap.get(id);
const normalizeEntries = (raw, defaults) => {
    if (!Array.isArray(raw))
        return [];
    return raw.map((entry) => ({ ...defaults, ...(entry ?? {}) }));
};
export const normalizeAbilityData = (raw) => {
    const ability = raw && typeof raw === "object" ? raw : {};
    return {
        castingTime: String(ability.castingTime ?? ABILITY_RULES.castingTimes[0]?.id ?? "1-action"),
        castingCost: String(ability.castingCost ?? ABILITY_RULES.castingCosts[0]?.id ?? "default"),
        categories: normalizeEntries(ability.categories, {
            id: "",
            uuid: "",
            name: "",
            img: "",
            category: "",
            cost: NaN,
            description: ""
        }).map((entry) => {
            const category = String(entry.category ?? entry.id ?? "");
            const rule = categoryMap.get(category);
            const rawCost = Number(entry.cost);
            const fallbackCost = resolveCost(rule?.cost, 1);
            const cost = Number.isFinite(rawCost) ? rawCost : fallbackCost;
            return {
                id: String(entry.id ?? ""),
                uuid: String(entry.uuid ?? ""),
                name: String(entry.name ?? ""),
                img: String(entry.img ?? ""),
                category,
                cost,
                description: String(entry.description ?? entry.notes ?? "")
            };
        }),
        characteristics: normalizeEntries(ability.characteristics, { id: "", level: 1, damageType: "", areaType: "" }),
        enhancements: normalizeEntries(ability.enhancements, { id: "" }),
        restrictions: {
            description: String(ability.restrictions?.description ?? ""),
            advances: clampInteger(Number(ability.restrictions?.advances ?? 0), 0, 99),
            advancesTarget: ability.restrictions?.advancesTarget === "" || ability.restrictions?.advancesTarget === null
                ? null
                : Number(ability.restrictions?.advancesTarget)
        }
    };
};
const mergeModifiers = (base, next) => ({
    categorySlots: (base.categorySlots ?? 0) + (next.categorySlots ?? 0),
    characteristicSlots: (base.characteristicSlots ?? 0) + (next.characteristicSlots ?? 0),
    costModifier: (base.costModifier ?? 0) + (next.costModifier ?? 0),
    characteristicMaxOverrides: { ...(base.characteristicMaxOverrides ?? {}), ...(next.characteristicMaxOverrides ?? {}) },
    characteristicMinOverrides: { ...(base.characteristicMinOverrides ?? {}), ...(next.characteristicMinOverrides ?? {}) }
});
export const collectAbilityModifiers = (enhancements) => enhancements.reduce((mods, entry) => {
    const rule = enhancementMap.get(entry.id);
    if (!rule?.modifiers)
        return mods;
    return mergeModifiers(mods, rule.modifiers);
}, {});
export const getCategoryLimit = (modifiers) => {
    const base = ABILITY_RULES.categoryLimit;
    if (base === null)
        return null;
    const delta = modifiers?.categorySlots ?? 0;
    return Math.max(0, base + delta);
};
export const getCharacteristicLimit = (modifiers) => {
    const base = ABILITY_RULES.characteristicLimit;
    if (base === null)
        return null;
    const delta = modifiers?.characteristicSlots ?? 0;
    return Math.max(0, base + delta);
};
export const sanitizeAbilityData = (raw, options) => {
    const ability = normalizeAbilityData(raw);
    const modifiers = collectAbilityModifiers(ability.enhancements);
    if (!castingTimeMap.has(ability.castingTime)) {
        ability.castingTime = ABILITY_RULES.castingTimes[0]?.id ?? "1-action";
    }
    if (!castingCostMap.has(ability.castingCost)) {
        ability.castingCost = ABILITY_RULES.castingCosts[0]?.id ?? "default";
    }
    ability.categories = ability.categories
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
        const category = String(entry.category ?? entry.id ?? "");
        const rule = categoryMap.get(category);
        const rawCost = Number(entry.cost);
        const fallbackCost = resolveCost(rule?.cost, 1);
        const cost = Number.isFinite(rawCost) ? rawCost : fallbackCost;
        return {
            id: String(entry.id ?? ""),
            uuid: String(entry.uuid ?? ""),
            name: String(entry.name ?? ""),
            img: String(entry.img ?? ""),
            category: rule ? category : "",
            cost: Number.isFinite(cost) ? Math.max(0, cost) : 0,
            description: String(entry.description ?? entry.notes ?? "")
        };
    });
    ability.characteristics = ability.characteristics
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
        const id = String(entry.id ?? "");
        const rule = characteristicMap.get(id);
        const minOverride = modifiers.characteristicMinOverrides?.[id];
        const maxOverride = modifiers.characteristicMaxOverrides?.[id];
        const min = minOverride ?? rule?.min ?? 0;
        const max = maxOverride ?? rule?.max ?? 0;
        const rawDamageType = String(entry.damageType ?? "");
        const normalizedDamageType = ABILITY_DAMAGE_TYPES.includes(rawDamageType)
            ? rawDamageType
            : "";
        const rawAreaType = String(entry.areaType ?? "");
        const normalizedAreaType = ABILITY_AREA_TYPES.includes(rawAreaType)
            ? rawAreaType
            : "";
        const damageType = id === "destruicao" ? normalizedDamageType || "physical" : "";
        const areaType = id === "area" ? normalizedAreaType || "emanacao" : "";
        return {
            id: rule ? id : "",
            level: clampInteger(Number(entry.level ?? min), min, max),
            damageType,
            areaType
        };
    });
    const maxIndex = ability.characteristics.length - 1;
    if (!Number.isFinite(ability.restrictions.advancesTarget ?? NaN)) {
        ability.restrictions.advancesTarget = null;
    }
    if (ability.restrictions.advancesTarget === null || ability.restrictions.advancesTarget < 0) {
        ability.restrictions.advancesTarget = null;
    }
    else if (ability.restrictions.advancesTarget > maxIndex) {
        ability.restrictions.advancesTarget = null;
    }
    if (ability.restrictions.advancesTarget !== null) {
        const target = ability.characteristics[ability.restrictions.advancesTarget];
        const rule = target ? characteristicMap.get(target.id) : null;
        if (rule) {
            const maxOverride = modifiers.characteristicMaxOverrides?.[rule.id] ?? rule.max;
            const maxAdvances = Math.max(0, maxOverride - target.level);
            ability.restrictions.advances = clampInteger(ability.restrictions.advances, 0, maxAdvances);
        }
        else {
            ability.restrictions.advances = 0;
        }
    }
    else {
        ability.restrictions.advances = 0;
    }
    ability.enhancements = ability.enhancements
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => ({ id: enhancementMap.has(String(entry.id ?? "")) ? String(entry.id ?? "") : "" }));
    return ability;
};
export const calculateAbilityCost = (raw, options) => {
    const ability = sanitizeAbilityData(raw, options);
    const modifiers = collectAbilityModifiers(ability.enhancements);
    const categoryCost = ability.categories.reduce((total, entry) => {
        const rawCost = Number(entry.cost);
        return total + (Number.isFinite(rawCost) ? rawCost : 0);
    }, 0);
    const castingCost = resolveCost(castingTimeMap.get(ability.castingTime)?.cost, 1);
    const characteristicsCost = ability.characteristics.reduce((total, entry, index) => {
        const rule = characteristicMap.get(entry.id);
        if (!rule)
            return total;
        const minOverride = modifiers.characteristicMinOverrides?.[rule.id];
        const maxOverride = modifiers.characteristicMaxOverrides?.[rule.id];
        const min = minOverride ?? rule.min;
        const max = maxOverride ?? rule.max;
        const baseLevel = clampInteger(entry.level, min, max);
        const extra = ability.restrictions.advancesTarget === index ? ability.restrictions.advances : 0;
        const effectiveLevel = clampInteger(baseLevel + extra, min, max);
        return total + resolveCharacteristicCost(rule, effectiveLevel);
    }, 0);
    const enhancementCost = ability.enhancements.reduce((total, entry) => {
        const rule = enhancementMap.get(entry.id);
        return total + resolveCost(rule?.cost, 1);
    }, 0);
    const restrictionCost = 0;
    const totalCost = categoryCost + castingCost + characteristicsCost + enhancementCost + restrictionCost + (modifiers.costModifier ?? 0);
    return {
        totalCost,
        breakdown: {
            categories: categoryCost,
            castingTime: castingCost,
            characteristics: characteristicsCost,
            enhancements: enhancementCost,
            restrictions: restrictionCost,
            modifiers: modifiers.costModifier ?? 0
        },
        limits: {
            categories: getCategoryLimit(modifiers),
            characteristics: getCharacteristicLimit(modifiers)
        }
    };
};
export const buildAbilityOptions = (localize) => ({
    castingTimes: ABILITY_RULES.castingTimes.map((entry) => ({ value: entry.id, label: localize(entry.labelKey) })),
    castingCosts: ABILITY_RULES.castingCosts.map((entry) => ({ value: entry.id, label: localize(entry.labelKey) })),
    categories: ABILITY_RULES.categories.map((entry) => ({ value: entry.id, label: localize(entry.labelKey) })),
    characteristics: ABILITY_RULES.characteristics.map((entry) => ({ value: entry.id, label: localize(entry.labelKey) })),
    enhancements: ABILITY_RULES.enhancements.map((entry) => ({ value: entry.id, label: localize(entry.labelKey) }))
});
export const getCategoryTag = (categoryId, localize) => {
    const rule = categoryMap.get(categoryId);
    if (!rule)
        return "";
    const key = rule.tagKey ?? rule.labelKey;
    return localize(key);
};
export const getCategoryLabel = (categoryId, localize) => {
    const rule = categoryMap.get(categoryId);
    return rule ? localize(rule.labelKey) : categoryId;
};
export const listCategoryTags = (localize) => ABILITY_RULES.categories.map((entry) => localize(entry.tagKey ?? entry.labelKey));
export const getCategoryTooltip = (categoryId, localize) => {
    const rule = categoryMap.get(categoryId);
    if (!rule?.tooltipKey)
        return "";
    return localize(rule.tooltipKey);
};
export const describeEnhancement = (id, localize) => {
    const rule = enhancementMap.get(id);
    return rule ? localize(rule.descriptionKey) : "";
};
export const describeCharacteristicLimits = (id, modifiers, options) => {
    const rule = characteristicMap.get(id);
    if (!rule)
        return { min: 0, max: 0 };
    const min = modifiers?.characteristicMinOverrides?.[id] ?? rule.min;
    const modifiedMax = modifiers?.characteristicMaxOverrides?.[id] ?? rule.max;
    return {
        min,
        max: Math.max(min, modifiedMax)
    };
};
export const getCharacteristicLevelChoices = (id, localize, options) => {
    const rule = characteristicMap.get(id);
    if (!rule)
        return [];
    const configuredLevels = Array.isArray(rule.levels) && rule.levels.length
        ? rule.levels
            .filter((entry) => Number.isFinite(entry.level))
            .map((entry) => ({
            level: Number(entry.level),
            label: entry.shortLabelKey
                ? localize(entry.shortLabelKey)
                : entry.labelKey
                    ? localize(entry.labelKey)
                    : String(entry.level),
            minRank: normalizeRank(entry.rank)
        }))
        : Array.from({ length: Math.max(0, rule.max - rule.min + 1) }, (_, index) => {
            const level = rule.min + index;
            return {
                level,
                label: String(level),
                minRank: null
            };
        });
    return configuredLevels
        .map((entry) => ({
        value: String(entry.level),
        label: String(entry.label),
        level: entry.level,
        minRank: entry.minRank,
        cost: resolveCharacteristicCost(rule, entry.level)
    }))
        .sort((a, b) => a.level - b.level);
};
export const isOverRankingCharacteristicLevel = (id, level, actorRank) => {
    const requiredRank = getCharacteristicLevelRequirement(id, level);
    const normalizedActorRank = normalizeRank(actorRank);
    return isRankLowerThan(normalizedActorRank, requiredRank);
};
