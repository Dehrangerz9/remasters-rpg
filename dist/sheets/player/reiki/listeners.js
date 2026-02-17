import { clampInteger } from "../../global-functions/utils.js";
import { MAX_PROTAGONISM_POINTS } from "../../actor/config.js";
import { rollReikiSurge } from "../rolls/reiki.js";
export const bindPlayerReikiListeners = (sheet, html) => {
    html.find("[data-action='roll-reiki']").on("click", async (event) => {
        event.preventDefault();
        await rollReikiSurge(sheet);
    });
    html.find("[data-action='set-protagonism']").on("click", async (event) => {
        event.preventDefault();
        if (sheet.actor.type !== "player")
            return;
        const value = clampInteger(Number(event.currentTarget.dataset.value), 0, MAX_PROTAGONISM_POINTS);
        await sheet.actor.update({ "system.player.protagonismPoints": value });
    });
    html.find("[data-action='set-protagonism']").on("contextmenu", async (event) => {
        event.preventDefault();
        if (sheet.actor.type !== "player")
            return;
        const current = clampInteger(Number(sheet.actor.system.player?.protagonismPoints ?? 1), 0, MAX_PROTAGONISM_POINTS);
        await sheet.actor.update({ "system.player.protagonismPoints": Math.max(0, current - 1) });
    });
};
