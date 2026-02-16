import { SYSTEM_ID } from "../constants.js";

export class RMRPGItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rmrpg", "sheet", "item"],
      width: 520,
      height: 560
    });
  }

  get template() {
    return `systems/${SYSTEM_ID}/templates/items/item-sheet.hbs`;
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    context.system = context.item.system;
    context.isWeapon = context.item.type === "weapon";
    context.isAbility = context.item.type === "ability";
    return context;
  }
}
