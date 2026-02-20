import { ADVANCEMENTS_PER_RANK, RANK_BONUS_BY_RANK, RANKS } from "../constants.js";
import { calculateAbilityCost, normalizeAbilityData, sanitizeAbilityData } from "../abilities/rules.js";
import { resolveAbilityCategories } from "../abilities/category-links.js";
import { rollSkillOrDerivedCheck } from "../sheets/player/rolls/check.js";
import { DERIVED_CONFIG } from "../sheets/actor/config.js";
import { formatSigned } from "../sheets/global-functions/utils.js";
const DERIVED_LABEL_BY_KEY = new Map(DERIVED_CONFIG.map((entry) => [entry.key, entry.labelKey]));
class RMRPGGenericActor extends Actor {
    prepareDerivedData() {
        super.prepareDerivedData();
        const system = this.system ?? {};
        const rankState = this.resolveRankState(system);
        system.rank ??= {};
        system.rank.value = rankState.rank;
        system.rank.bonus = rankState.bonus;
        system.hp ??= {};
        const rawHpMax = Number(system.hp.max);
        const safeHpMax = Number.isFinite(rawHpMax) ? Math.max(1, Math.floor(rawHpMax)) : 20;
        const rawHpValue = Number(system.hp.value);
        const safeHpValue = Number.isFinite(rawHpValue) ? Math.max(0, Math.floor(rawHpValue)) : safeHpMax;
        const rawHpTemp = Number(system.hp.temp);
        const safeHpTemp = Number.isFinite(rawHpTemp) ? Math.max(0, Math.floor(rawHpTemp)) : 0;
        system.hp.max = safeHpMax;
        system.hp.value = Math.min(safeHpValue, safeHpMax);
        system.hp.temp = safeHpTemp;
        const attributes = system.attributes ?? {};
        const corpo = this.asNumber(attributes.corpo?.value);
        const coordenacao = this.asNumber(attributes.coordenacao?.value);
        const agilidade = this.asNumber(attributes.agilidade?.value);
        const atencao = this.asNumber(attributes.atencao?.value);
        const mente = this.asNumber(attributes.mente?.value);
        const carisma = this.asNumber(attributes.carisma?.value);
        const derivedModifiers = system.derived?.modifiers ?? {};
        const reflexoMod = this.asNumber(derivedModifiers.reflexo);
        const determinacaoMod = this.asNumber(derivedModifiers.determinacao);
        const vigorMod = this.asNumber(derivedModifiers.vigor);
        const iniciativaMod = this.asNumber(derivedModifiers.iniciativa);
        const reflexoBase = (atencao + agilidade + coordenacao) / 2 + rankState.bonus;
        const determinacaoBase = (atencao + carisma + mente) / 2 + rankState.bonus;
        const vigorBase = (agilidade + coordenacao + corpo) / 2 + rankState.bonus;
        const iniciativaBase = atencao;
        const reflexo = this.roundDown(reflexoBase + reflexoMod);
        const determinacao = this.roundDown(determinacaoBase + determinacaoMod);
        const vigor = this.roundDown(vigorBase + vigorMod);
        const iniciativa = this.roundDown(iniciativaBase + iniciativaMod);
        system.derived ??= {};
        system.derived.modifiers ??= {};
        system.derived.modifiers.reflexo = reflexoMod;
        system.derived.modifiers.determinacao = determinacaoMod;
        system.derived.modifiers.vigor = vigorMod;
        system.derived.modifiers.iniciativa = iniciativaMod;
        system.derived.reflexo = reflexo;
        system.derived.determinacao = determinacao;
        system.derived.vigor = vigor;
        system.derived.iniciativa = iniciativa;
        system.movement ??= {};
        const rawMovementRate = Number(system.movement.rate);
        system.movement.rate = Number.isFinite(rawMovementRate) ? rawMovementRate : 5;
        const manualDefense = this.asNumber(system.defense?.value);
        const calculatedDefense = manualDefense > 0 ? this.roundDown(manualDefense) : this.roundDown(12 + reflexo);
        system.defense ??= {};
        system.defense.calculated = calculatedDefense;
        const resistance = system.resistance ?? {};
        const physicalRes = this.asNumber(resistance.physical);
        const elementalRes = this.asNumber(resistance.elemental);
        const mentalRes = this.asNumber(resistance.mental);
        const deterioratingRes = this.asNumber(resistance.deteriorating);
        system.resistance ??= {};
        system.resistance.physical = this.roundDown(physicalRes);
        system.resistance.elemental = this.roundDown(elementalRes);
        system.resistance.mental = this.roundDown(mentalRes);
        system.resistance.deteriorating = this.roundDown(deterioratingRes);
        // Resolve linked category-effect items before ability totals are consumed elsewhere.
        const abilityItems = this.items?.filter((item) => item.type === "ability") ?? [];
        const actorRank = String(system.rank?.value ?? "");
        for (const abilityItem of abilityItems) {
            const ability = normalizeAbilityData(abilityItem.system?.ability);
            const resolvedCategories = resolveAbilityCategories(abilityItem, ability);
            const sanitized = sanitizeAbilityData({ ...ability, categories: resolvedCategories }, { actorRank });
            abilityItem.system.ability = sanitized;
            abilityItem.system.cost = calculateAbilityCost(sanitized, { actorRank }).totalCost;
        }
    }
    resolveRankState(system) {
        const rank = this.normalizeRank(system.rank?.value);
        return {
            rank,
            bonus: RANK_BONUS_BY_RANK[rank]
        };
    }
    normalizeRank(value) {
        const rankText = String(value ?? "D").toUpperCase();
        return rankText in RANK_BONUS_BY_RANK ? rankText : "D";
    }
    asNumber(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    roundDown(value) {
        return Math.floor(value);
    }
    async rollAttribute(attributeKey) {
        const value = this.asNumber(this.system.attributes?.[attributeKey]?.value);
        const roll = await new Roll("1d20 + @value", { value }).evaluate();
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `${this.name} rolls ${attributeKey}`
        });
        return roll;
    }
    async rollDerived(derivedKey, options = {}) {
        const value = this.asNumber(this.system.derived?.[derivedKey]);
        const derivedLabelKey = DERIVED_LABEL_BY_KEY.get(derivedKey);
        const derivedLabel = derivedLabelKey ? game.i18n.localize(derivedLabelKey) : derivedKey;
        const result = await rollSkillOrDerivedCheck({
            actor: this,
            label: `${derivedLabel}`,
            totalModifier: value,
            dc: options.dc,
            passosDeSucessos: options.passosDeSucessos,
            passosDeFalha: options.passosDeFalha,
            breakdownTags: [`${derivedLabel} ${formatSigned(value)}`]
        });
        return result.roll;
    }
    async rollSkill(skillLabel, total, options = {}) {
        const totalBonus = this.asNumber(total);
        const result = await rollSkillOrDerivedCheck({
            actor: this,
            label: `${skillLabel}`,
            totalModifier: totalBonus,
            dc: options.dc,
            passosDeSucessos: options.passosDeSucessos,
            passosDeFalha: options.passosDeFalha,
            breakdownTags: [`${skillLabel} ${formatSigned(totalBonus)}`]
        });
        return result.roll;
    }
}
export class RMRPGPlayerActor extends RMRPGGenericActor {
    static getProgressionState(system) {
        const advancements = system.player?.advancements ?? {};
        const advancementCount = Object.keys(advancements).length;
        const completedSteps = Math.max(advancementCount - 1, 0);
        const rankIndex = Math.min(RANKS.length - 1, Math.floor(completedSteps / ADVANCEMENTS_PER_RANK));
        const rank = RANKS[rankIndex];
        const bonus = RANK_BONUS_BY_RANK[rank];
        const nextRankAt = rankIndex < RANKS.length - 1 ? (rankIndex + 1) * ADVANCEMENTS_PER_RANK + 1 : null;
        return {
            advancementCount,
            nextRankAt,
            rank,
            bonus,
            reikiDefaultMax: 1 + bonus
        };
    }
}
export class RMRPGNPCActor extends RMRPGGenericActor {
}
export class RMRPGSummonActor extends RMRPGGenericActor {
}
export class RMRPGActor extends RMRPGGenericActor {
    resolveRankState(system) {
        if (this.type !== "player") {
            return super.resolveRankState(system);
        }
        const progression = RMRPGPlayerActor.getProgressionState(system);
        system.player ??= {};
        system.player.progression ??= {};
        system.player.progression.advancementCount = progression.advancementCount;
        system.player.progression.nextRankAt = progression.nextRankAt;
        const protagonism = Number(system.player.protagonismPoints);
        if (Number.isFinite(protagonism)) {
            system.player.protagonismPoints = Math.max(0, Math.min(3, Math.floor(protagonism)));
        }
        else {
            system.player.protagonismPoints = 1;
        }
        system.player.reiki ??= {};
        const rawMax = Number(system.player.reiki.max);
        const reikiMax = Number.isFinite(rawMax) ? Math.max(0, Math.floor(rawMax)) : progression.reikiDefaultMax;
        let reikiCurrent;
        const rawCurrent = Number(system.player.reiki.current);
        if (Number.isFinite(rawCurrent)) {
            reikiCurrent = Math.max(0, Math.floor(rawCurrent));
        }
        else {
            const legacySlots = system.player.reiki.slots ?? {};
            const legacyCount = Object.values(legacySlots).filter(Boolean).length;
            reikiCurrent = legacyCount > 0 ? legacyCount : reikiMax;
        }
        system.player.reiki.max = reikiMax;
        system.player.reiki.current = Math.min(reikiCurrent, reikiMax);
        return {
            rank: progression.rank,
            bonus: progression.bonus
        };
    }
}
