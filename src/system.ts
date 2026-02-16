import { SYSTEM_ID } from "./constants.js";
import { RMRPGActor } from "./documents/actor.js";
import { RMRPGItem } from "./documents/item.js";
import { RMRPGActorSheet } from "./sheets/actor-sheet.js";
import { RMRPGItemSheet } from "./sheets/item-sheet.js";

Hooks.once("init", () => {
  console.log(`${SYSTEM_ID} | Initializing system`);

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
});

Hooks.once("setup", () => {
  console.log(`${SYSTEM_ID} | Setup complete`);
});

Hooks.once("ready", () => {
  console.log(`${SYSTEM_ID} | Ready`);
});
