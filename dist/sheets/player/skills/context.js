import { SKILL_DEFS } from "../../actor/config.js";
import { localize } from "../../global-functions/utils.js";
export const applyPlayerSkillsContext = (context) => {
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
            label = `${localize(definition.labelKey)}: ${specialization}`;
            labelKey = null;
        }
        else if (labelOverride) {
            label = labelOverride;
            labelKey = null;
        }
        const displayLabel = labelKey ? localize(labelKey) : label;
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
        const label = String(entry.label ?? localize("RMRPG.Actor.Skills.CustomDefault"));
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
};
