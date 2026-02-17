import { sendFeatToChat } from "./chat.js";
import { handleFeatDrop } from "./drop.js";
export const bindPlayerFeatListeners = (sheet, html) => {
    html.find("[data-action='add-feat']").on("click", async (event) => {
        event.preventDefault();
        if (sheet.actor.type !== "player")
            return;
        const created = await sheet.actor.createEmbeddedDocuments("Item", [
            {
                name: game.i18n.localize("RMRPG.Actor.Feats.NewName"),
                type: "feat",
                img: "systems/remasters-rpg/assets/icons/stars-stack.png"
            }
        ]);
        const feat = created?.[0];
        if (feat) {
            feat.sheet?.render(true);
        }
    });
    html.find("[data-action='feat-chat']").on("click", async (event) => {
        event.preventDefault();
        const id = String(event.currentTarget.dataset.id ?? "");
        if (!id)
            return;
        const item = sheet.actor.items?.get(id);
        if (!item)
            return;
        await sendFeatToChat(sheet, item);
    });
    html.find("[data-action='feat-open']").on("click", async (event) => {
        event.preventDefault();
        const id = String(event.currentTarget.dataset.id ?? "");
        if (!id)
            return;
        const item = sheet.actor.items?.get(id);
        if (!item)
            return;
        item.sheet?.render(true);
    });
    html.find("[data-action='feat-delete']").on("click", async (event) => {
        event.preventDefault();
        const id = String(event.currentTarget.dataset.id ?? "");
        if (!id)
            return;
        const item = sheet.actor.items?.get(id);
        if (!item)
            return;
        await item.delete();
    });
    const featDrop = html.find("[data-action='feat-drop']");
    featDrop.on("dragover", (event) => event.preventDefault());
    featDrop.on("drop", async (event) => {
        await handleFeatDrop(sheet, event);
    });
};
