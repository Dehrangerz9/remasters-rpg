import { bindPlayerSkillListeners } from "./skills/listeners.js";
import { bindPlayerActionListeners } from "./actions/listeners.js";
import { bindPlayerInventoryListeners } from "./inventory/listeners.js";
import { bindPlayerAdvancementListeners } from "./advancements/listeners.js";
import { bindPlayerFeatListeners } from "./feats/listeners.js";
import { bindPlayerReikiListeners } from "./reiki/listeners.js";
export const bindPlayerListeners = (sheet, html) => {
    bindPlayerSkillListeners(sheet, html);
    bindPlayerActionListeners(sheet, html);
    bindPlayerInventoryListeners(sheet, html);
    bindPlayerAdvancementListeners(sheet, html);
    bindPlayerFeatListeners(sheet, html);
    bindPlayerReikiListeners(sheet, html);
};
