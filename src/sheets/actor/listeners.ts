import { bindPlayerListeners } from "../player/listeners.js";
import { bindNpcListeners } from "../npc/sheet.js";
import { bindSummonListeners } from "../summon/sheet.js";
import { bindInlineIntegerInput } from "./inputs.js";
import {
  openAttributeDialog,
  openDefenseDialog,
  openDerivedDialog,
  openHpDialog,
  openReikiDialog,
  openResistanceDialog
} from "./dialogs.js";
import { bindReorderList, setItemDragData } from "./drag.js";
import { clampInteger } from "../global-functions/utils.js";

export const activateActorListeners = (sheet: any, html: JQuery) => {
  html.find("[data-action='set-attribute']").on("click", async (event: any) => {
    event.preventDefault();
    await openAttributeDialog(sheet);
  });

  html.find("[data-action='set-defense']").on("click", async (event: any) => {
    event.preventDefault();
    await openDefenseDialog(sheet);
  });

  html.find("[data-action='set-derived']").on("click", async (event: any) => {
    event.preventDefault();
    await openDerivedDialog(sheet);
  });

  html.find("[data-action='set-resistance']").on("click", async (event: any) => {
    event.preventDefault();
    await openResistanceDialog(sheet);
  });

  html.find("[data-action='set-hp']").on("click", async (event: any) => {
    event.preventDefault();
    await openHpDialog(sheet);
  });

  html.find("[data-action='set-reiki']").on("click", async (event: any) => {
    event.preventDefault();
    await openReikiDialog(sheet);
  });

  html.find("[data-action='roll-derived']").on("click", async (event: any) => {
    event.preventDefault();
    const derived = String(event.currentTarget.dataset.derived ?? "");
    if (!derived) return;
    await sheet.actor.rollDerived(derived);
  });

  html.find("[data-action='item-open']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    item.sheet?.render(true);
  });

  bindInlineIntegerInput(sheet, html, "[data-action='inline-hp-value']", async (value) => {
    const hpMax = Math.max(1, Math.floor(Number(sheet.actor.system.hp?.max ?? 1)));
    await sheet.actor.update({ "system.hp.value": clampInteger(value, 0, hpMax) });
  });

  bindInlineIntegerInput(sheet, html, "[data-action='inline-hp-temp']", async (value) => {
    await sheet.actor.update({ "system.hp.temp": Math.max(0, value) });
  });

  bindInlineIntegerInput(sheet, html, "[data-action='inline-reiki-current']", async (value) => {
    const reikiMax = Math.max(0, Math.floor(Number(sheet.actor.system.player?.reiki?.max ?? 0)));
    await sheet.actor.update({ "system.player.reiki.current": clampInteger(value, 0, reikiMax) });
  });

  if (sheet.actor.type === "player") {
    bindPlayerListeners(sheet, html);
  } else if (sheet.actor.type === "npc") {
    bindNpcListeners(sheet, html);
  } else if (sheet.actor.type === "summon") {
    bindSummonListeners(sheet, html);
  }

  html.find(".equipment-category").each((_, element) => {
    const details = element as HTMLDetailsElement;
    const key = String(details.dataset.category ?? "");
    if (!key) return;
    const stored = sheet.equipmentOpenState[key];
    if (typeof stored === "boolean") {
      details.open = stored;
    } else {
      sheet.equipmentOpenState[key] = details.open;
    }
    details.addEventListener("toggle", () => {
      sheet.equipmentOpenState[key] = details.open;
    });
  });

  html.find(".feat-row").each((_, row) => {
    row.addEventListener("dragstart", (event) => {
      const dragEvent = event as DragEvent;
      const id = String((row as HTMLElement).dataset.id ?? "");
      if (!id) return;
      setItemDragData(sheet, dragEvent, { id, group: "feats" });
    });
  });

  const featList = html.find(".feats-list").get(0);
  if (featList) {
    bindReorderList(sheet, featList, ".feat-row", "feats");
  }

  html.find(".equipment-table").each((_, table) => {
    const listElement = table as HTMLElement;
    const group = String(listElement.dataset.category ?? "");
    if (!group) return;
    bindReorderList(sheet, listElement, ".equipment-row", `equip:${group}`);
  });

  html.find(".action-list").each((_, list) => {
    const listElement = list as HTMLElement;
    const group = String(listElement.dataset.group ?? "");
    if (!group) return;
    bindReorderList(sheet, listElement, ".action-item-row", `actions:${group}`);
    listElement.addEventListener("dragstart", (event) => {
      const dragEvent = event as DragEvent;
      const target = (dragEvent.target as HTMLElement | null)?.closest(".action-item-row") as HTMLElement | null;
      if (!target) return;
      const id = String(target.dataset.id ?? "");
      if (!id) return;
      setItemDragData(sheet, dragEvent, { id, group: `actions:${group}` });
    });
  });

  html.find(".action-item-row").each((_, row) => {
    row.addEventListener("dragstart", (event) => {
      const dragEvent = event as DragEvent;
      const id = String((row as HTMLElement).dataset.id ?? "");
      const list = (row as HTMLElement).closest(".action-list") as HTMLElement | null;
      const group = String(list?.dataset.group ?? "");
      if (!id || !group) return;
      setItemDragData(sheet, dragEvent, { id, group: `actions:${group}` });
    });
  });

  html.find(".equipment-row").each((_, row) => {
    row.addEventListener("dragstart", (event) => {
      const dragEvent = event as DragEvent;
      const id = String((row as HTMLElement).dataset.id ?? "");
      const group = String((row as HTMLElement).dataset.category ?? "");
      if (!id || !group) return;
      setItemDragData(sheet, dragEvent, { id, group: `equip:${group}` });
    });
  });
};
