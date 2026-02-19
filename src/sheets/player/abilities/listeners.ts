import { sendCastAbilityToChat } from "./chat.js";

export const bindPlayerAbilityListeners = (sheet: any, html: JQuery) => {
  const abilitiesRoot = html.find("[data-tab='abilities']");

  html.find("[data-action='add-ability']").on("click", async (event: any) => {
    event.preventDefault();
    if (sheet.actor.type !== "player") return;

    const created = await sheet.actor.createEmbeddedDocuments("Item", [
      {
        name: game.i18n.localize("RMRPG.Actor.Abilities.NewName"),
        type: "ability"
      }
    ]);

    const ability = created?.[0];
    if (ability) {
      ability.sheet?.render(true);
    }
  });

  html.find("[data-action='casting-attr']").on("change", async (event: any) => {
    event.preventDefault();
    if (sheet.actor.type !== "player") return;
    const value = String(event.currentTarget?.value ?? "mente");
    await sheet.actor.update({ "system.player.casting.attribute": value });
  });

  abilitiesRoot.find("[data-action='item-toggle-details']").on("click", (event: any) => {
    event.preventDefault();
    const row = (event.currentTarget as HTMLElement).closest(".ability-row");
    if (!row) return;
    row.classList.toggle("is-expanded");
  });

  abilitiesRoot.find("[data-action='ability-cast']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    await sendCastAbilityToChat(sheet, item);
  });
};
