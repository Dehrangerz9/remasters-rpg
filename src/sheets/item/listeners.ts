import { normalizeBonusArray } from "../global-functions/utils.js";
import { setupTagSystem } from "./tags.js";
import { sendItemToChat } from "./chat.js";

export const activateItemListeners = (sheet: any, html: JQuery) => {
  html.find("[data-action='weapon-hit-bonus-add']").on("click", async (event: any) => {
    event.preventDefault();
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const bonuses = normalizeBonusArray(sheet.item.system?.weapon?.hit?.bonuses).map((bonus) => ({ ...bonus }));
    bonuses.push({ label: "", value: 0 });
    await sheet.item.update({ "system.weapon.hit.bonuses": bonuses });
  });

  html.find("[data-action='weapon-hit-bonus-remove']").on("click", async (event: any) => {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const bonuses = normalizeBonusArray(sheet.item.system?.weapon?.hit?.bonuses).map((bonus) => ({ ...bonus }));
    if (index >= bonuses.length) return;
    bonuses.splice(index, 1);
    await sheet.item.update({ "system.weapon.hit.bonuses": bonuses });
  });

  html.find("[data-action='weapon-damage-bonus-add']").on("click", async (event: any) => {
    event.preventDefault();
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const bonuses = normalizeBonusArray(sheet.item.system?.weapon?.damage?.bonuses).map((bonus) => ({ ...bonus }));
    bonuses.push({ formula: "", type: "physical" });
    await sheet.item.update({ "system.weapon.damage.bonuses": bonuses });
  });

  html.find("[data-action='weapon-damage-bonus-remove']").on("click", async (event: any) => {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;
    await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    const bonuses = normalizeBonusArray(sheet.item.system?.weapon?.damage?.bonuses).map((bonus) => ({ ...bonus }));
    if (index >= bonuses.length) return;
    bonuses.splice(index, 1);
    await sheet.item.update({ "system.weapon.damage.bonuses": bonuses });
  });

  html.find("[data-action='item-chat']").on("click", async (event: any) => {
    event.preventDefault();
    await sendItemToChat(sheet);
  });

  setupTagSystem(sheet, html);
};
