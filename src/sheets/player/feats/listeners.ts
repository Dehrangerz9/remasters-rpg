import { sendFeatToChat } from "./chat.js";
import { handleFeatDrop } from "./drop.js";

export const bindPlayerFeatListeners = (sheet: any, html: JQuery) => {
  const mainRoot = html.find("[data-tab='main']");

  html.find("[data-action='add-feat']").on("click", async (event: any) => {
    event.preventDefault();
    if (sheet.actor.type !== "player") return;

    await sheet.actor.createEmbeddedDocuments("Item", [
      {
        name: game.i18n.localize("RMRPG.Actor.Feats.NewName"),
        type: "feat",
        img: "systems/remasters-rpg/assets/icons/stars-stack.png"
      }
    ]);
  });

  mainRoot.find("[data-action='feat-chat']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    await sendFeatToChat(sheet, item);
  });

  mainRoot.find("[data-action='feat-toggle-details']").on("click", (event: any) => {
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const row = button.closest(".feat-row");
    if (!row) return;
    const expanded = row.classList.toggle("is-expanded");
    button.setAttribute("aria-expanded", expanded ? "true" : "false");
  });

  mainRoot.find("[data-action='feat-open']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    item.sheet?.render(true);
  });

  mainRoot.find("[data-action='feat-delete']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("RMRPG.Actor.Feats.DeleteConfirmTitle"),
      content: `<p>${game.i18n.format("RMRPG.Actor.Feats.DeleteConfirmBody", { name: item.name })}</p>`
    });
    if (!confirmed) return;
    await item.delete();
  });

  const featDrop = html.find("[data-action='feat-drop']");
  featDrop.on("dragover", (event: any) => event.preventDefault());
  featDrop.on("drop", async (event: any) => {
    await handleFeatDrop(sheet, event);
  });
};
