import { localize, parseNumericInput } from "../global-functions/utils.js";
export const bindInlineIntegerInput = (sheet, html, selector, onCommit) => {
    const commit = async (target) => {
        if (!target)
            return;
        const input = target;
        const parsed = parseNumericInput(input.value);
        if (parsed === null) {
            ui.notifications.warn(localize("RMRPG.Dialogs.InvalidNumber"));
            sheet.render(false);
            return;
        }
        await onCommit(Math.floor(parsed));
    };
    html.find(selector).on("change", async (event) => {
        await commit(event.currentTarget);
    });
    html.find(selector).on("keydown", async (event) => {
        if (event.key !== "Enter")
            return;
        event.preventDefault();
        await commit(event.currentTarget);
    });
};
