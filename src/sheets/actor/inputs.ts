import { localize, parseNumericInput } from "../global-functions/utils.js";

export const bindInlineIntegerInput = (sheet: any, html: JQuery, selector: string, onCommit: (value: number) => Promise<void>) => {
  const commit = async (target: EventTarget | null) => {
    if (!target) return;
    const input = target as HTMLInputElement;
    const parsed = parseNumericInput(input.value);
    if (parsed === null) {
      ui.notifications.warn(localize("RMRPG.Dialogs.InvalidNumber"));
      sheet.render(false);
      return;
    }

    await onCommit(Math.floor(parsed));
  };

  html.find(selector).on("change", async (event: any) => {
    await commit(event.currentTarget);
  });

  html.find(selector).on("keydown", async (event: any) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await commit(event.currentTarget);
  });
};
