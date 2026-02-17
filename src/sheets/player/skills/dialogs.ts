import { SKILL_DEFS } from "../../actor/config.js";
import { localize } from "../../global-functions/utils.js";
import { showDialog, readDialogRawValue } from "../../actor/dialog-utils.js";

export const openSkillSettings = async (sheet: any) => {
  if (sheet.actor.type !== "player") return;

  const skills = sheet.actor.system.player?.skills ?? {};
  const customSkills = Array.isArray(skills.custom) ? skills.custom : [];

  const dialog = await showDialog(
    localize("RMRPG.Actor.Skills.NamesTitle"),
    `
      <form class="rmrpg-dialog-form">
        <div class="form-group">
          <label>${localize("RMRPG.Actor.Skills.OficiosSpecialization")}</label>
          <input type="text" name="oficiosSpec" value="${String(skills.oficios?.specialization ?? "")}" />
        </div>
        <h3 class="dialog-section-title">${localize("RMRPG.Actor.Skills.NamesTitle")}</h3>
        <div class="skill-settings-list">
          ${SKILL_DEFS.map((definition) => {
            const stored = skills[definition.key] ?? {};
            const labelValue = String(stored.label ?? "");
            return `
              <div class="skill-settings-row">
                <label>${localize(definition.labelKey)}</label>
                <input type="text" name="label_${definition.key}" value="${labelValue}" />
              </div>
            `;
          }).join("")}
          ${customSkills.map((entry: any, index: number) => {
            const labelValue = String(entry.label ?? "");
            return `
              <div class="skill-settings-row">
                <label>${localize("RMRPG.Actor.Skills.CustomLabel")} ${index + 1}</label>
                <input type="text" name="label_custom_${index}" value="${labelValue}" />
                <label class="skill-remove-toggle" title="${localize("RMRPG.Actor.Advancements.Remove")}">
                  <input type="checkbox" name="remove_custom_${index}" />
                  <i class="fas fa-trash"></i>
                </label>
              </div>
            `;
          }).join("")}
        </div>
      </form>
      `
  );

  if (!dialog) return;

  const updates: Record<string, any> = {};
  updates["system.player.skills.oficios.specialization"] = readDialogRawValue(dialog, "oficiosSpec");

  for (const definition of SKILL_DEFS) {
    const label = readDialogRawValue(dialog, `label_${definition.key}`);
    updates[`system.player.skills.${definition.key}.label`] = label;
  }

  if (customSkills.length) {
    const nextCustom = customSkills.map((entry: any) => ({ ...entry }));
    const removeFlags = customSkills.map((_: any, index: number) => {
      return dialog.find(`[name='remove_custom_${index}']`).prop("checked");
    });

    nextCustom.forEach((entry: any, index: number) => {
      const label = readDialogRawValue(dialog, `label_custom_${index}`);
      entry.label = label;
    });

    updates["system.player.skills.custom"] = nextCustom.filter((_: any, index: number) => !removeFlags[index]);
  }

  await sheet.actor.update(updates);
};
