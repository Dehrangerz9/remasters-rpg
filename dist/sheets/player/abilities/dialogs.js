import { ATTRIBUTE_CONFIG } from "../../actor/config.js";
import { localize } from "../../global-functions/utils.js";
import { showDialog, readDialogRawValue } from "../../actor/dialog-utils.js";
export const openCastingAttributeDialog = async (sheet) => {
    if (sheet.actor.type !== "player")
        return;
    const current = String(sheet.actor.system.player?.casting?.attribute ?? "mente");
    const dialog = await showDialog(localize("RMRPG.Actor.Abilities.CastingAttributeTitle"), `
      <form class="rmrpg-dialog-form">
        <div class="form-group">
          <label>${localize("RMRPG.Actor.Abilities.CastingAttribute")}</label>
          <select name="castingAttribute">
            ${ATTRIBUTE_CONFIG.map((entry) => {
        const selected = entry.key === current ? "selected" : "";
        return `<option value="${entry.key}" ${selected}>${localize(entry.labelKey)}</option>`;
    }).join("")}
          </select>
        </div>
      </form>
    `);
    if (!dialog)
        return;
    const nextAttribute = readDialogRawValue(dialog, "castingAttribute") || "mente";
    await sheet.actor.update({ "system.player.casting.attribute": nextAttribute });
};
