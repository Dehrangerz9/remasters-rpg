import { RollModifier } from "../../actor/config.js";
import { formatSigned, localize } from "../../global-functions/utils.js";
import { getAttributeLabel } from "../../actor/helpers.js";
import { openRollDialog } from "../rolls/dialog.js";
import { rollReikiSurge } from "../rolls/reiki.js";
import { openSkillSettings } from "./dialogs.js";
import { rollSkillOrDerivedCheck } from "../rolls/check.js";

export const bindPlayerSkillListeners = (sheet: any, html: JQuery) => {
  html.find("[data-action='roll-skill']").on("click", async (event: any) => {
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const label = String(button.dataset.label ?? "");
    const row = button.closest(".skill-row");
    const attribute = String(
      (row?.querySelector(".skill-attribute-select") as HTMLSelectElement | null)?.value ?? button.dataset.attr ?? ""
    );
    const bonus = Number(button.dataset.bonus ?? 0);
    if (!attribute) return;
    const trained = Boolean((row?.querySelector(".skill-trained-toggle") as HTMLInputElement | null)?.checked);
    const rankBonus = Number(sheet.actor.system.rank?.bonus ?? 0);
    const attributeValue = Number(sheet.actor.system.attributes?.[attribute]?.value ?? 0);

    const modifiers: RollModifier[] = [
      {
        key: "attribute",
        name: getAttributeLabel(attribute),
        type: localize("RMRPG.Dialogs.Roll.Types.Attribute"),
        value: Math.floor(attributeValue),
        checked: true
      },
      {
        key: "skill-bonus",
        name: localize("RMRPG.Dialogs.Roll.SkillBonus"),
        type: localize("RMRPG.Dialogs.Roll.Types.Skill"),
        value: Math.floor(bonus),
        checked: bonus !== 0
      },
      {
        key: "rank-bonus",
        name: localize("RMRPG.Actor.RankBonus"),
        type: localize("RMRPG.Dialogs.Roll.Types.Untyped"),
        value: Math.floor(rankBonus),
        checked: trained
      }
    ];

    const reikiValue = Math.floor(rankBonus / 2);
    if (reikiValue !== 0) {
      modifiers.push({
        key: "reiki-surge",
        name: localize("RMRPG.Actor.Reiki.Surge"),
        type: localize("RMRPG.Dialogs.Roll.Types.State"),
        value: reikiValue,
        checked: false
      });
    }

    const title = localize("RMRPG.Dialogs.Roll.Title", { label: label || localize("RMRPG.Actor.Skills.Title") });
    const result = await openRollDialog(title, modifiers);
    if (!result) return;

    await rollSkillOrDerivedCheck({
      actor: sheet.actor,
      label: label || localize("RMRPG.Actor.Skills.Title"),
      totalModifier: result.total,
      breakdownTags: result.modifiers
        .filter((modifier) => modifier.checked)
        .map((modifier) => `${modifier.name} ${formatSigned(Math.floor(Number(modifier.value ?? 0)))}`)
    });

    if (result.modifiers.some((modifier) => modifier.key === "reiki-surge" && modifier.checked)) {
      await rollReikiSurge(sheet);
    }
  });

  html.find("[data-action='edit-skills']").on("click", async (event: any) => {
    event.preventDefault();
    await openSkillSettings(sheet);
  });

  html.find("[data-action='add-skill']").on("click", async (event: any) => {
    event.preventDefault();
    if (sheet.actor.type !== "player") return;

    const skills = sheet.actor.system.player?.skills ?? {};
    const custom = Array.isArray(skills.custom) ? [...skills.custom] : [];
    const id = `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    custom.push({
      id,
      label: localize("RMRPG.Actor.Skills.CustomDefault"),
      attribute: "mente",
      trained: false,
      bonus: 0
    });

    await sheet.actor.update({ "system.player.skills.custom": custom });
  });

  html.find("[data-action='remove-skill']").on("click", async (event: any) => {
    event.preventDefault();
    if (sheet.actor.type !== "player") return;

    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;

    const skills = sheet.actor.system.player?.skills ?? {};
    const custom = Array.isArray(skills.custom) ? [...skills.custom] : [];
    if (index >= custom.length) return;

    custom.splice(index, 1);
    await sheet.actor.update({ "system.player.skills.custom": custom });
  });
};
