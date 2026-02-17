export const bindPlayerAbilityListeners = (sheet: any, html: JQuery) => {
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
};
