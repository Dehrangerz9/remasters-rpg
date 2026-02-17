import { SYSTEM_ID } from "./constants.js";
import { RMRPGActor } from "./documents/actor.js";
import { RMRPGItem } from "./documents/item.js";
import { RMRPGActorSheet } from "./sheets/actor/sheet.js";
import { RMRPGItemSheet } from "./sheets/item/sheet.js";

const applyPunkCityTheme = (enabled: boolean) => {
  document.body?.classList.toggle("punk-city", enabled);
};

Hooks.once("init", () => {
  console.log(`${SYSTEM_ID} | Initializing system`);

  loadTemplates([
    `systems/${SYSTEM_ID}/templates/actors/partials/left-column.hbs`,
    `systems/${SYSTEM_ID}/templates/actors/partials/header.hbs`,
    `systems/${SYSTEM_ID}/templates/actors/partials/nav-tabs.hbs`,
    `systems/${SYSTEM_ID}/templates/actors/partials/tabs/main.hbs`,
    `systems/${SYSTEM_ID}/templates/actors/partials/tabs/actions.hbs`,
    `systems/${SYSTEM_ID}/templates/actors/partials/tabs/inventory.hbs`,
    `systems/${SYSTEM_ID}/templates/actors/partials/tabs/abilities.hbs`,
    `systems/${SYSTEM_ID}/templates/actors/partials/tabs/personal.hbs`,
    `systems/${SYSTEM_ID}/templates/actors/partials/tabs/advancements.hbs`,
    `systems/${SYSTEM_ID}/templates/actors/partials/tabs/effects.hbs`,
    `systems/${SYSTEM_ID}/templates/items/partials/header.hbs`,
    `systems/${SYSTEM_ID}/templates/items/partials/weapon.hbs`,
    `systems/${SYSTEM_ID}/templates/items/partials/non-weapon.hbs`
  ]);

  CONFIG.Actor.documentClass = RMRPGActor;
  CONFIG.Item.documentClass = RMRPGItem;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet(SYSTEM_ID, RMRPGActorSheet, {
    makeDefault: true,
    label: "RMRPG.Sheets.Actor"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet(SYSTEM_ID, RMRPGItemSheet, {
    makeDefault: true,
    label: "RMRPG.Sheets.Item"
  });

  game.settings.register(SYSTEM_ID, "punkCityTheme", {
    name: "RMRPG.Settings.PunkCity.Name",
    hint: "RMRPG.Settings.PunkCity.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => {
      applyPunkCityTheme(Boolean(value));
      const windows = (ui.windows ?? {}) as Record<string, any>;
      for (const app of Object.values(windows)) {
        if (app?.render) {
          app.render(false);
        }
      }
    }
  });
});

Hooks.once("setup", () => {
  console.log(`${SYSTEM_ID} | Setup complete`);
});

Hooks.once("ready", () => {
  console.log(`${SYSTEM_ID} | Ready`);
  applyPunkCityTheme(Boolean(game.settings.get(SYSTEM_ID, "punkCityTheme")));
});
