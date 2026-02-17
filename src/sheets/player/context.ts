import { applyPlayerReikiContext } from "./reiki/context.js";
import { applyPlayerSkillsContext } from "./skills/context.js";
import { applyPlayerAdvancementsContext } from "./advancements/context.js";
import { applyPlayerFeatsContext } from "./feats/context.js";
import { applyPlayerActionsContext } from "./actions/context.js";
import { applyPlayerInventoryContext } from "./inventory/context.js";

export const applyPlayerContext = (_sheet: any, context: any) => {
  applyPlayerReikiContext(context);
  applyPlayerSkillsContext(context);
  applyPlayerAdvancementsContext(context);
  applyPlayerFeatsContext(context);
  applyPlayerActionsContext(context);
  applyPlayerInventoryContext(context);
};
