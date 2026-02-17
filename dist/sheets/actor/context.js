import { RANKS } from "../../constants.js";
import { ATTRIBUTE_CONFIG } from "./config.js";
import { localize } from "../global-functions/utils.js";
import { applyPlayerContext } from "../player/context.js";
import { applyNpcContext } from "../npc/sheet.js";
import { applySummonContext } from "../summon/sheet.js";
export const buildActorContext = async (sheet, context) => {
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
        label: localize(attribute.labelKey)
    }));
    context.rankBonus = Number(context.system.rank?.bonus ?? 2);
    context.derivedReflexo = Number(context.system.derived?.reflexo ?? 0);
    context.derivedVigor = Number(context.system.derived?.vigor ?? 0);
    context.derivedDeterminacao = Number(context.system.derived?.determinacao ?? 0);
    context.derivedIniciativa = Number(context.system.derived?.iniciativa ?? 0);
    context.defenseCalculated = Number(context.system.defense?.calculated ?? 12 + context.derivedReflexo);
    context.defenseManual = Number(context.system.defense?.value ?? 0);
    context.hasManualDefense = context.defenseManual > 0;
    context.movementRate = Number(context.system.movement?.rate ?? 0);
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
    context.protagonismPoints = 0;
    context.advancementEntries = [];
    context.hasAdvancements = false;
    context.advancementCount = Number(context.system.player?.progression?.advancementCount ?? 0);
    context.feats = [];
    context.attackItems = [];
    context.actionItems = [];
    context.reactionItems = [];
    context.equipmentCategories = [];
    context.carryCapacity = 0;
    context.carryWeight = 0;
    context.carryPercent = 0;
    if (context.isPlayer) {
        applyPlayerContext(sheet, context);
    }
    else if (context.isNPC) {
        applyNpcContext(sheet, context);
    }
    else if (context.isSummon) {
        applySummonContext(sheet, context);
    }
    return context;
};
