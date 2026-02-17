import { RANK_BONUS_BY_RANK, RANKS } from "../constants.js";
class RMRPGGenericActor extends Actor {
    prepareDerivedData() {
        super.prepareDerivedData();
        const system = this.system ?? {};
        const rankState = this.resolveRankState(system);
        system.rank ??= {};
        system.rank.value = rankState.rank;
        system.rank.bonus = rankState.bonus;
        system.hp ??= {};
        system.hp.value = Math.max(0, this.asNumber(system.hp.value));
        system.hp.max = Math.max(1, this.asNumber(system.hp.max || 1));
        system.hp.temp = Math.max(0, this.asNumber(system.hp.temp));
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
        system.movement.rate = this.asNumber(system.movement.rate);
        const manualDefense = this.asNumber(system.defense?.value);
        const calculatedDefense = manualDefense > 0 ? this.roundDown(manualDefense) : this.roundDown(12 + reflexo);
        system.defense ??= {};
        system.defense.calculated = calculatedDefense;
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
    async rollDerived(derivedKey) {
        const value = this.asNumber(this.system.derived?.[derivedKey]);
        const roll = await new Roll("1d20 + @value", { value }).evaluate();
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `${this.name} rolls ${derivedKey}`
        });
        return roll;
    }
    async rollSkill(skillLabel, total) {
        const totalBonus = this.asNumber(total);
        const roll = await new Roll("1d20 + @total", {
            total: totalBonus
        }).evaluate();
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `${this.name} rolls ${skillLabel}`
        });
        return roll;
    }
}
export class RMRPGPlayerActor extends RMRPGGenericActor {
    static getProgressionState(system) {
        const advancements = system.player?.advancements ?? {};
        const advancementCount = Object.keys(advancements).length;
        const rankIndex = Math.min(RANKS.length - 1, Math.floor(advancementCount / 4));
        const rank = RANKS[rankIndex];
        const bonus = RANK_BONUS_BY_RANK[rank];
        const nextRankAt = rankIndex < RANKS.length - 1 ? (rankIndex + 1) * 4 : null;
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
            reikiCurrent = Object.values(legacySlots).filter(Boolean).length;
        }
        system.player.reiki.max = reikiMax;
        system.player.reiki.current = Math.min(reikiCurrent, reikiMax);
        return {
            rank: progression.rank,
            bonus: progression.bonus
        };
    }
}
