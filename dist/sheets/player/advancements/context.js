import { getEvolutionLabel, sortAdvancementKeys } from "./helpers.js";
export const applyPlayerAdvancementsContext = (context) => {
    const advancements = context.system.player?.advancements ?? {};
    const keys = sortAdvancementKeys(Object.keys(advancements));
    context.advancementEntries = keys.map((key, index) => ({
        key,
        code: getEvolutionLabel(index + 1),
        path: `system.player.advancements.${key}`,
        value: String(advancements[key] ?? "")
    }));
    context.hasAdvancements = context.advancementEntries.length > 0;
};
