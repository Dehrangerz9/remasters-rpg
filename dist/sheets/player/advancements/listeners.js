import { extractAdvancementIndex } from "./helpers.js";
export const bindPlayerAdvancementListeners = (sheet, html) => {
    html.find("[data-action='add-advancement']").on("click", async (event) => {
        event.preventDefault();
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        const advancements = sheet.actor.system.player?.advancements ?? {};
        const existingKeys = Object.keys(advancements);
        const highest = existingKeys.reduce((max, key) => Math.max(max, extractAdvancementIndex(key)), 0);
        const nextKey = `e${highest + 1}`;
        await sheet.actor.update({ [`system.player.advancements.${nextKey}`]: "" });
    });
    html.find("[data-action='remove-advancement']").on("click", async (event) => {
        event.preventDefault();
        const key = String(event.currentTarget.dataset.key ?? "");
        if (!key)
            return;
        await sheet._onSubmit(event, { preventClose: true, preventRender: true });
        await sheet.actor.update({ [`system.player.advancements.-=${key}`]: null });
    });
};
