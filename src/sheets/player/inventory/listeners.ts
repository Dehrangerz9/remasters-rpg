import { clampInteger } from "../../global-functions/utils.js";
import { ITEM_STATUS_ORDER } from "../../actor/config.js";
import { sendInventoryItemToChat } from "./chat.js";

export const bindPlayerInventoryListeners = (sheet: any, html: JQuery) => {
  const inventoryRoot = html.find("[data-tab='inventory']");

  html.find("[data-action='item-qty']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const delta = Number(event.currentTarget.dataset.delta ?? 0);
    if (!Number.isFinite(delta) || delta === 0) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    const current = Number(item.system?.quantity ?? 0);
    const next = clampInteger(current + delta, 0, 9999);
    await item.update({ "system.quantity": next });
  });

  html.find("[data-action='item-status']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    const rawStatus = String(item.system?.status ?? "stowed");
    const currentIndex = ITEM_STATUS_ORDER.indexOf(rawStatus);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % ITEM_STATUS_ORDER.length;
    const nextStatus = ITEM_STATUS_ORDER[nextIndex];
    await item.update({ "system.status": nextStatus });
  });

  html.find("[data-action='item-delete']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("RMRPG.Actor.Inventory.DeleteConfirmTitle"),
      content: `<p>${game.i18n.format("RMRPG.Actor.Inventory.DeleteConfirmBody", { name: item.name })}</p>`
    });
    if (!confirmed) return;
    await item.delete();
  });

  html.find("[data-action='category-add']").on("click", async (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    if (sheet.actor.type !== "player") return;
    const category = String(event.currentTarget.dataset.category ?? "");
    if (!category) return;
    const created = await sheet.actor.createEmbeddedDocuments("Item", [
      {
        name: game.i18n.localize("RMRPG.Actor.Inventory.NewItem"),
        type: category
      }
    ]);
    if (!created?.length) return;
  });

  html.find("[data-action='category-search']").on("click", (event: any) => {
    event.preventDefault();
    event.stopPropagation();
  });

  inventoryRoot.find("[data-action='item-toggle-details']").on("click", (event: any) => {
    event.preventDefault();
    const row = (event.currentTarget as HTMLElement).closest(".equipment-row");
    if (!row) return;
    row.classList.toggle("is-expanded");
  });

  inventoryRoot.find("[data-action='item-chat']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    await sendInventoryItemToChat(sheet, item);
  });
};
