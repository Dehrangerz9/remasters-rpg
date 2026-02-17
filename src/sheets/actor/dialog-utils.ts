import { localize, parseNumericInput } from "../global-functions/utils.js";

export const showDialog = async (title: string, content: string): Promise<JQuery | null> =>
  new Promise((resolve) => {
    let resolved = false;

    new Dialog({
      title,
      content,
      buttons: {
        cancel: {
          icon: "<i class='fas fa-times'></i>",
          label: game.i18n.localize("Cancel"),
          callback: () => {
            resolved = true;
            resolve(null);
          }
        },
        save: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize("Save"),
          callback: (dialogHtml: JQuery) => {
            resolved = true;
            resolve(dialogHtml);
          }
        }
      },
      default: "save",
      close: () => {
        if (!resolved) resolve(null);
      }
    }).render(true);
  });

export const readDialogRawValue = (dialogHtml: JQuery, inputName: string) =>
  String(dialogHtml.find(`[name='${inputName}']`).val() ?? "").trim();

export const readDialogNumber = (dialogHtml: JQuery, inputName: string, fallback: number) => {
  const raw = readDialogRawValue(dialogHtml, inputName);
  if (raw === "") {
    return fallback;
  }

  const parsed = parseNumericInput(raw);
  if (parsed === null) {
    ui.notifications.warn(localize("RMRPG.Dialogs.InvalidNumber"));
    return null;
  }

  return parsed;
};
