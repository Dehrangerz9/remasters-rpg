import { DERIVED_CONFIG } from "../../actor/config.js";
import { getAttributeLabel } from "../../actor/helpers.js";
import { formatSigned, localize, normalizeBonusArray } from "../../global-functions/utils.js";
import { collectItemTags, escapeHtml } from "../item-summary.js";
import { openRollDialog } from "../rolls/dialog.js";
import { rollDamageWithDialog } from "../rolls/damage.js";
import { rollSkillOrDerivedCheck } from "../rolls/check.js";
const DESTRUCTION_DIE_BY_LEVEL = {
    1: "",
    2: "d4",
    3: "d6",
    4: "d8",
    5: "d10",
    6: "d12"
};
const ATTRIBUTE_KEYS = new Set(["corpo", "coordenacao", "agilidade", "atencao", "mente", "carisma"]);
const DERIVED_KEYS = new Set(DERIVED_CONFIG.map((entry) => entry.key).filter((key) => key !== "iniciativa"));
const DERIVED_LABEL_BY_KEY = new Map(DERIVED_CONFIG.filter((entry) => entry.key !== "iniciativa").map((entry) => [entry.key, entry.labelKey]));
let hookRegistered = false;
const escapeAttr = (value) => escapeHtml(value).replace(/`/g, "&#96;");
const normalizeDamageType = (value) => {
    const key = String(value ?? "none").trim().toLowerCase();
    if (key === "physical")
        return "physical";
    if (key === "elemental")
        return "elemental";
    if (key === "mental")
        return "mental";
    if (key === "deteriorating")
        return "deteriorating";
    return "none";
};
const normalizeAbilityConfig = (raw) => {
    const source = raw && typeof raw === "object" ? raw : {};
    const attack = source.attack && typeof source.attack === "object" ? source.attack : {};
    const secondary = source.secondary && typeof source.secondary === "object" ? source.secondary : {};
    const damage = source.damage && typeof source.damage === "object" ? source.damage : {};
    return {
        attack: {
            useOverride: Boolean(attack.useOverride),
            attribute: String(attack.attribute ?? "default") || "default",
            manualBonus: Number.isFinite(Number(attack.manualBonus)) ? Math.floor(Number(attack.manualBonus)) : 0,
            bonuses: normalizeBonusArray(attack.bonuses).map((entry) => ({
                label: String(entry?.label ?? "").trim(),
                value: Number.isFinite(Number(entry?.value)) ? Math.floor(Number(entry.value)) : 0
            }))
        },
        secondary: {
            attribute: String(secondary.attribute ?? "vigor") || "vigor",
            manualDcEnabled: Boolean(secondary.manualDcEnabled),
            manualDc: Number.isFinite(Number(secondary.manualDc)) ? Math.floor(Number(secondary.manualDc)) : 10
        },
        damage: {
            useOverride: Boolean(damage.useOverride),
            formula: String(damage.formula ?? "").trim(),
            type: normalizeDamageType(damage.type),
            bonuses: normalizeBonusArray(damage.bonuses).map((entry) => ({
                formula: String(entry?.formula ?? "").trim(),
                type: normalizeDamageType(entry?.type)
            }))
        }
    };
};
const getAbilityFeatureState = (item) => {
    const characteristics = Array.isArray(item?.system?.ability?.characteristics) ? item.system.ability.characteristics : [];
    const hasCharacteristic = (id) => characteristics.some((entry) => String(entry?.id ?? "") === id);
    const tagSet = new Set(collectItemTags(item).map((tag) => String(tag ?? "").trim().toLowerCase()).filter(Boolean));
    const hasDestruction = hasCharacteristic("destruicao") || tagSet.has("destruicao");
    const hasArea = hasCharacteristic("area") || tagSet.has("area");
    const hasCondition = hasCharacteristic("condicao") || tagSet.has("condicao");
    const hasAttack = hasDestruction || tagSet.has("ataque");
    return {
        hasDestruction,
        hasArea,
        hasCondition,
        hasAttack,
        canAttack: hasAttack && !hasArea,
        hasSecondary: hasArea || hasCondition
    };
};
const resolveCastingAttribute = (actor, config) => {
    const actorCasting = String(actor?.system?.player?.casting?.attribute ?? "mente");
    const fallbackAttribute = ATTRIBUTE_KEYS.has(actorCasting) ? actorCasting : "mente";
    const overrideAttribute = String(config.attack.attribute ?? "default");
    const useOverride = config.attack.useOverride && overrideAttribute !== "default" && ATTRIBUTE_KEYS.has(overrideAttribute);
    return useOverride ? overrideAttribute : fallbackAttribute;
};
const resolveCde = (actor) => {
    const castingAttribute = String(actor?.system?.player?.casting?.attribute ?? "mente");
    const safeAttribute = ATTRIBUTE_KEYS.has(castingAttribute) ? castingAttribute : "mente";
    const castingValue = Math.floor(Number(actor?.system?.attributes?.[safeAttribute]?.value ?? 0));
    const rankBonus = Math.floor(Number(actor?.system?.rank?.bonus ?? 0));
    return Math.floor(12 + castingValue + rankBonus);
};
const resolveSecondaryAttribute = (config) => {
    const key = String(config.secondary.attribute ?? "vigor");
    if (DERIVED_KEYS.has(key))
        return key;
    return "vigor";
};
const resolveSecondaryDc = (actor, config) => {
    if (config.secondary.manualDcEnabled) {
        return Math.floor(Number(config.secondary.manualDc ?? 10));
    }
    return resolveCde(actor);
};
const resolveSecondaryLabel = (key) => {
    const labelKey = DERIVED_LABEL_BY_KEY.get(key);
    return labelKey ? localize(labelKey) : key;
};
const resolveTargetDc = () => {
    const targets = Array.from(game.user?.targets ?? []);
    const token = targets[0] ?? null;
    if (!token?.actor)
        return { dc: null, targetInfoLabel: "" };
    const raw = Number(token.actor.system?.defense?.calculated ?? token.actor.system?.defense?.value);
    if (!Number.isFinite(raw))
        return { dc: null, targetInfoLabel: "" };
    const dc = Math.floor(raw);
    const targetLabel = String(token.actor?.name ?? token.name ?? "").trim();
    const defenseLabel = localize("RMRPG.Actor.Defense.Title");
    return {
        dc,
        targetInfoLabel: targetLabel ? `${targetLabel} ${defenseLabel} ${dc}` : `${defenseLabel} ${dc}`
    };
};
const collectSecondaryRollTargets = () => {
    const controlled = Array.from(canvas?.tokens?.controlled ?? []);
    const targets = Array.from(game.user?.targets ?? []);
    const merged = [...controlled, ...targets];
    const selected = [];
    const seen = new Set();
    for (const token of merged) {
        const tokenId = String(token?.id ?? "");
        if (!tokenId || seen.has(tokenId))
            continue;
        if (!token?.actor)
            continue;
        seen.add(tokenId);
        selected.push(token);
    }
    return selected;
};
const resolveDestructionBaseFormula = (actor, item) => {
    const characteristics = Array.isArray(item?.system?.ability?.characteristics) ? item.system.ability.characteristics : [];
    const destruction = characteristics.find((entry) => String(entry?.id ?? "") === "destruicao");
    if (!destruction)
        return "";
    const level = Math.floor(Number(destruction.level ?? 1));
    const die = DESTRUCTION_DIE_BY_LEVEL[level] ?? "";
    if (!die)
        return "";
    const rankBonus = Math.floor(Number(actor?.system?.rank?.bonus ?? 0));
    const diceCount = Math.max(1, rankBonus - 1);
    return `${diceCount}${die}`;
};
const resolveDamageFallbackFormula = (actor, item, config) => {
    if (config.damage.useOverride && config.damage.formula) {
        return config.damage.formula;
    }
    const destructionFormula = resolveDestructionBaseFormula(actor, item);
    return destructionFormula || "0";
};
const buildAttackModifiers = (actor, config) => {
    const modifiers = [];
    const attributeKey = resolveCastingAttribute(actor, config);
    const attributeValue = Math.floor(Number(actor?.system?.attributes?.[attributeKey]?.value ?? 0));
    const rankBonus = Math.floor(Number(actor?.system?.rank?.bonus ?? 0));
    const manualBonus = Math.floor(Number(config.attack.manualBonus ?? 0));
    modifiers.push({
        key: "attribute",
        name: getAttributeLabel(attributeKey),
        type: localize("RMRPG.Dialogs.Roll.Types.Attribute"),
        value: attributeValue,
        checked: true
    });
    modifiers.push({
        key: "rank-bonus",
        name: localize("RMRPG.Actor.RankBonus"),
        type: localize("RMRPG.Dialogs.Roll.Types.Untyped"),
        value: rankBonus,
        checked: true
    });
    if (manualBonus !== 0) {
        modifiers.push({
            key: "manual-bonus",
            name: localize("RMRPG.Item.Ability.AdditionalSettings.Attack.ManualBonus"),
            type: localize("RMRPG.Dialogs.Roll.Types.Untyped"),
            value: manualBonus,
            checked: true
        });
    }
    config.attack.bonuses.forEach((entry, index) => {
        if (!entry.label && entry.value === 0)
            return;
        modifiers.push({
            key: `ability-attack-bonus-${index}`,
            name: entry.label || localize("RMRPG.Dialogs.Roll.BonusFallback", { index: index + 1 }),
            type: localize("RMRPG.Dialogs.Roll.Types.Untyped"),
            value: Math.floor(Number(entry.value ?? 0)),
            checked: Number(entry.value ?? 0) !== 0
        });
    });
    return modifiers;
};
const buildCastChatContent = async (actor, item) => {
    const features = getAbilityFeatureState(item);
    const config = normalizeAbilityConfig(item.system?.abilityConfig);
    const tags = collectItemTags(item).map((tag) => String(tag ?? "").trim().toUpperCase()).filter(Boolean);
    const description = await TextEditor.enrichHTML(String(item.system?.description ?? ""), { async: true });
    const actorName = String(actor?.name ?? "-");
    const actorImg = String(actor?.img ?? "icons/svg/mystery-man.svg");
    const createdBy = String(game.user?.name ?? "-");
    const secondaryAttribute = resolveSecondaryAttribute(config);
    const secondaryLabel = resolveSecondaryLabel(secondaryAttribute);
    const secondaryDc = resolveSecondaryDc(actor, config);
    const tagsMarkup = tags.length
        ? tags.map((tag) => `<span class="rmrpg-cast-tag">${escapeHtml(tag)}</span>`).join("")
        : `<span class="rmrpg-cast-tag rmrpg-cast-tag-muted">-</span>`;
    const secondaryButtonLabel = localize("RMRPG.Actor.Abilities.CastRoll.SecondaryButton", {
        attribute: secondaryLabel,
        dc: secondaryDc
    });
    const actions = [];
    if (features.canAttack) {
        actions.push(`
      <button type="button" data-action="cast-roll-attack">
        ${escapeHtml(localize("RMRPG.Actor.Abilities.CastRoll.RollAttack"))}
      </button>
    `);
    }
    if (features.hasSecondary) {
        actions.push(`
      <button type="button" data-action="cast-roll-secondary">
        ${escapeHtml(secondaryButtonLabel)}
      </button>
    `);
    }
    if (features.hasDestruction) {
        actions.push(`
      <button type="button" data-action="cast-roll-damage">
        ${escapeHtml(localize("RMRPG.Actor.Abilities.CastRoll.RollDamage"))}
      </button>
    `);
    }
    const actionsMarkup = actions.length
        ? `<div class="rmrpg-cast-actions">${actions.join("")}</div>`
        : `<div class="rmrpg-cast-actions"><button type="button" disabled>${escapeHtml(localize("RMRPG.Actor.Abilities.CastRoll.NoActions"))}</button></div>`;
    return `
    <article
      class="rmrpg-cast-card"
      data-actor-id="${escapeAttr(String(actor?.id ?? ""))}"
      data-item-id="${escapeAttr(String(item?.id ?? ""))}"
    >
      <header class="rmrpg-cast-header">
        <img class="rmrpg-cast-avatar" src="${escapeAttr(actorImg)}" alt="${escapeAttr(actorName)}" />
        <div class="rmrpg-cast-meta">
          <div class="rmrpg-cast-name">${escapeHtml(actorName)}</div>
          <div class="rmrpg-cast-user">${escapeHtml(createdBy)}</div>
        </div>
      </header>
      <h3 class="rmrpg-cast-title">${escapeHtml(String(item?.name ?? "-"))}</h3>
      <div class="rmrpg-cast-divider"></div>
      <div class="rmrpg-cast-tags">${tagsMarkup}</div>
      <div class="rmrpg-cast-description">${description}</div>
      ${actionsMarkup}
    </article>
  `;
};
const rollAbilityAttack = async (actor, item) => {
    const config = normalizeAbilityConfig(item.system?.abilityConfig);
    const features = getAbilityFeatureState(item);
    if (!features.canAttack)
        return;
    const modifiers = buildAttackModifiers(actor, config);
    const title = localize("RMRPG.Dialogs.Roll.Title", {
        label: String(item?.name ?? localize("RMRPG.Actor.Abilities.CastRoll.RollAttack"))
    });
    const result = await openRollDialog(title, modifiers);
    if (!result)
        return;
    const targetDc = resolveTargetDc();
    const damageFormula = resolveDamageFallbackFormula(actor, item, config);
    const damageButton = features.hasDestruction
        ? {
            formula: damageFormula,
            itemName: String(item?.name ?? ""),
            itemId: String(item?.id ?? "")
        }
        : null;
    const breakdownTags = result.modifiers
        .filter((modifier) => modifier.checked)
        .map((modifier) => `${modifier.name} ${formatSigned(Math.floor(Number(modifier.value ?? 0)))}`);
    await rollSkillOrDerivedCheck({
        actor,
        label: String(item?.name ?? localize("RMRPG.Actor.Abilities.CastRoll.RollAttack")),
        totalModifier: result.total,
        dc: targetDc.dc,
        targetInfoLabel: targetDc.targetInfoLabel,
        breakdownTags,
        damageButton
    });
};
const rollAbilitySecondaryForSelectedTargets = async (caster, item) => {
    const config = normalizeAbilityConfig(item.system?.abilityConfig);
    const features = getAbilityFeatureState(item);
    if (!features.hasSecondary)
        return;
    const targets = collectSecondaryRollTargets();
    if (!targets.length) {
        ui.notifications.error(localize("RMRPG.Errors.SelectOneOrMoreTargets"));
        return;
    }
    const secondaryKey = resolveSecondaryAttribute(config);
    const secondaryLabel = resolveSecondaryLabel(secondaryKey);
    const dc = resolveSecondaryDc(caster, config);
    const label = localize("RMRPG.Actor.Abilities.CastRoll.SecondaryButton", {
        attribute: secondaryLabel,
        dc
    });
    for (const token of targets) {
        const actor = token?.actor;
        if (!actor)
            continue;
        const value = Math.floor(Number(actor.system?.derived?.[secondaryKey] ?? 0));
        await rollSkillOrDerivedCheck({
            actor,
            label,
            totalModifier: value,
            dc,
            breakdownTags: [`${secondaryLabel} ${formatSigned(value)}`]
        });
    }
};
const rollAbilityDamage = async (actor, item) => {
    const features = getAbilityFeatureState(item);
    if (!features.hasDestruction)
        return;
    const config = normalizeAbilityConfig(item.system?.abilityConfig);
    const formula = resolveDamageFallbackFormula(actor, item, config);
    await rollDamageWithDialog({
        actor,
        item,
        fallbackFormula: formula,
        itemName: String(item?.name ?? ""),
        sourceLabel: String(item?.name ?? localize("RMRPG.Actor.Abilities.CastRoll.RollDamage")),
        criticalMultiplier: 1
    });
};
export const setupAbilityCastChatInteractions = () => {
    if (hookRegistered)
        return;
    hookRegistered = true;
    Hooks.on("renderChatMessage", (chatItem, html) => {
        const card = html.find(".rmrpg-cast-card");
        if (!card.length)
            return;
        if (!chatItem?.isOwner)
            return;
        const actorId = String(card.data("actorId") ?? "");
        const itemId = String(card.data("itemId") ?? "");
        const actor = actorId ? game.actors?.get(actorId) : null;
        const item = itemId && actor ? actor.items?.get(itemId) : null;
        if (!actor || !item || item.type !== "ability")
            return;
        card.find("[data-action='cast-roll-attack']").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await rollAbilityAttack(actor, item);
        });
        card.find("[data-action='cast-roll-secondary']").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await rollAbilitySecondaryForSelectedTargets(actor, item);
        });
        card.find("[data-action='cast-roll-damage']").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await rollAbilityDamage(actor, item);
        });
    });
};
export const sendCastAbilityToChat = async (sheet, item) => {
    if (!sheet?.actor || !item || item.type !== "ability")
        return;
    const content = await buildCastChatContent(sheet.actor, item);
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: sheet.actor }),
        content
    });
};
