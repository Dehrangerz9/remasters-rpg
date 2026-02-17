import { ATTRIBUTE_CONFIG, DERIVED_CONFIG } from "./config.js";
import { clampInteger, parseNumericInput } from "../global-functions/utils.js";
import { showDialog, readDialogNumber, readDialogRawValue } from "./dialog-utils.js";

export const openAttributeDialog = async (sheet: any) => {
  const dialog = await showDialog(
    game.i18n.localize("RMRPG.Dialogs.Attributes.Title"),
    `
      <form class="rmrpg-dialog-form">
        ${ATTRIBUTE_CONFIG.map((attribute) => {
          const label = game.i18n.localize(attribute.labelKey);
          const current = Number(sheet.actor.system.attributes?.[attribute.key]?.value ?? 0);
          return `
            <div class="form-group">
              <label>${label}</label>
              <input type="number" name="${attribute.key}" value="${current}" step="1" />
            </div>
          `;
        }).join("")}
      </form>
      `
  );

  if (!dialog) return;

  const updateData: Record<string, number> = {};
  for (const attribute of ATTRIBUTE_CONFIG) {
    const fallback = Number(sheet.actor.system.attributes?.[attribute.key]?.value ?? 0);
    const parsed = readDialogNumber(dialog, attribute.key, fallback);
    if (parsed === null) return;
    updateData[`system.attributes.${attribute.key}.value`] = Math.floor(parsed);
  }

  await sheet.actor.update(updateData);
};

export const openHpDialog = async (sheet: any) => {
  const dialog = await showDialog(
    game.i18n.localize("RMRPG.Dialogs.HP.Title"),
    `
      <form class="rmrpg-dialog-form">
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.HP.Current")}</label>
          <input type="number" name="hpValue" value="${Number(sheet.actor.system.hp?.value ?? 0)}" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.HP.Max")}</label>
          <input type="number" name="hpMax" value="${Number(sheet.actor.system.hp?.max ?? 1)}" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.HP.Temp")}</label>
          <input type="number" name="hpTemp" value="${Number(sheet.actor.system.hp?.temp ?? 0)}" step="1" />
        </div>
      </form>
      `
  );

  if (!dialog) return;

  const hpValue = readDialogNumber(dialog, "hpValue", Number(sheet.actor.system.hp?.value ?? 0));
  const hpMax = readDialogNumber(dialog, "hpMax", Number(sheet.actor.system.hp?.max ?? 1));
  const hpTemp = readDialogNumber(dialog, "hpTemp", Number(sheet.actor.system.hp?.temp ?? 0));
  if (hpValue === null || hpMax === null || hpTemp === null) return;

  const safeMax = Math.max(1, Math.floor(hpMax));

  await sheet.actor.update({
    "system.hp.value": clampInteger(Math.floor(hpValue), 0, safeMax),
    "system.hp.max": safeMax,
    "system.hp.temp": Math.max(0, Math.floor(hpTemp))
  });
};

export const openDefenseDialog = async (sheet: any) => {
  const current = Number(sheet.actor.system.defense?.value ?? 0);
  const dialog = await showDialog(
    game.i18n.localize("RMRPG.Dialogs.Defense.Title"),
    `
      <form class="rmrpg-dialog-form">
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.Defense.Manual")}</label>
          <input type="number" name="defenseValue" value="${current > 0 ? current : ""}" step="1" placeholder="${game.i18n.localize(
            "RMRPG.Dialogs.Defense.BlankForAuto"
          )}" />
        </div>
      </form>
      `
  );

  if (!dialog) return;

  const input = readDialogRawValue(dialog, "defenseValue");
  if (input === "") {
    await sheet.actor.update({ "system.defense.value": 0 });
    return;
  }

  const parsed = parseNumericInput(input);
  if (parsed === null) {
    ui.notifications.warn(game.i18n.localize("RMRPG.Dialogs.InvalidNumber"));
    return;
  }

  await sheet.actor.update({ "system.defense.value": Math.max(0, Math.floor(parsed)) });
};

export const openDerivedDialog = async (sheet: any) => {
  const modifiers = sheet.actor.system.derived?.modifiers ?? {};
  const modifierLabel = game.i18n.localize("RMRPG.Dialogs.Derived.Modifier");

  const dialog = await showDialog(
    game.i18n.localize("RMRPG.Dialogs.Derived.Title"),
    `
      <form class="rmrpg-dialog-form">
        ${DERIVED_CONFIG.map((entry) => {
          const label = game.i18n.localize(entry.labelKey);
          const current = Number(modifiers?.[entry.key] ?? 0);
          return `
            <div class="form-group">
              <label>${label} (${modifierLabel})</label>
              <input type="number" name="mod_${entry.key}" value="${current}" step="1" />
            </div>
          `;
        }).join("")}
      </form>
      `
  );

  if (!dialog) return;

  const updates: Record<string, number> = {};
  for (const entry of DERIVED_CONFIG) {
    const fallback = Number(modifiers?.[entry.key] ?? 0);
    const parsed = readDialogNumber(dialog, `mod_${entry.key}`, fallback);
    if (parsed === null) return;
    updates[`system.derived.modifiers.${entry.key}`] = Math.floor(parsed);
  }

  await sheet.actor.update(updates);
};

export const openReikiDialog = async (sheet: any) => {
  if (sheet.actor.type !== "player") return;

  const current = Math.max(0, Math.floor(Number(sheet.actor.system.player?.reiki?.current ?? 0)));
  const max = Math.max(0, Math.floor(Number(sheet.actor.system.player?.reiki?.max ?? 0)));

  const dialog = await showDialog(
    game.i18n.localize("RMRPG.Dialogs.Reiki.Title"),
    `
      <form class="rmrpg-dialog-form">
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.Reiki.Current")}</label>
          <input type="number" name="reikiCurrent" value="${current}" min="0" step="1" />
        </div>
        <div class="form-group">
          <label>${game.i18n.localize("RMRPG.Dialogs.Reiki.Max")}</label>
          <input type="number" name="reikiMax" value="${max}" min="0" step="1" />
        </div>
      </form>
      `
  );

  if (!dialog) return;

  const parsedCurrent = readDialogNumber(dialog, "reikiCurrent", current);
  const parsedMax = readDialogNumber(dialog, "reikiMax", max);
  if (parsedCurrent === null || parsedMax === null) return;

  const safeMax = Math.max(0, Math.floor(parsedMax));
  const safeCurrent = clampInteger(Math.floor(parsedCurrent), 0, safeMax);

  await sheet.actor.update({
    "system.player.reiki.current": safeCurrent,
    "system.player.reiki.max": safeMax
  });
};
