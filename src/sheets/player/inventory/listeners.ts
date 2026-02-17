import { clampInteger } from "../../global-functions/utils.js";
import { ITEM_STATUS_ORDER } from "../../actor/config.js";
import { updateItemSortOrder } from "../../actor/drag.js";

export const bindPlayerInventoryListeners = (sheet: any, html: JQuery) => {
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
    const item = created?.[0];
    if (item) {
      item.sheet?.render(true);
    }
  });

  html.find("[data-action='category-search']").on("click", (event: any) => {
    event.preventDefault();
    event.stopPropagation();
  });

  html.find("[data-action='item-move']").on("click", async (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const id = String(button.dataset.id ?? "");
    const direction = String(button.dataset.direction ?? "");
    if (!id || (direction !== "up" && direction !== "down")) return;
    const row = button.closest(".equipment-row") as HTMLElement | null;
    const table = row?.closest(".equipment-table") as HTMLElement | null;
    if (!row || !table) return;

    const rows = Array.from(table.querySelectorAll(".equipment-row")) as HTMLElement[];
    const index = rows.findIndex((entry) => entry.dataset.id === id);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rows.length) return;

    const ordered = rows.map((entry) => entry.dataset.id ?? "").filter(Boolean);
    const [moved] = ordered.splice(index, 1);
    ordered.splice(targetIndex, 0, moved);
    await updateItemSortOrder(sheet, ordered);
  });
};
