import { bindPlayerSkillListeners } from "./skills/listeners.js";
import { bindPlayerActionListeners } from "./actions/listeners.js";
import { bindPlayerInventoryListeners } from "./inventory/listeners.js";
import { bindPlayerAdvancementListeners } from "./advancements/listeners.js";
import { bindPlayerFeatListeners } from "./feats/listeners.js";
import { bindPlayerReikiListeners } from "./reiki/listeners.js";
import { bindPlayerAbilityListeners } from "./abilities/listeners.js";

export const bindPlayerListeners = (sheet: any, html: JQuery) => {
  bindPlayerSkillListeners(sheet, html);
  bindPlayerActionListeners(sheet, html);
  bindPlayerInventoryListeners(sheet, html);
  bindPlayerAdvancementListeners(sheet, html);
  bindPlayerFeatListeners(sheet, html);
  bindPlayerReikiListeners(sheet, html);
  bindPlayerAbilityListeners(sheet, html);
};
