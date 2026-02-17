import { SYSTEM_ID } from "../../constants.js";

export const applyItemThemeClass = (sheet: any) => {
  const enabled = game.settings.get(SYSTEM_ID, "punkCityTheme");
  document.body?.classList.toggle("punk-city", Boolean(enabled));
  const classes = new Set(sheet.options.classes ?? []);
  if (enabled) {
    classes.add("punk-city");
  } else {
    classes.delete("punk-city");
  }
  sheet.options.classes = Array.from(classes);
  sheet.element?.toggleClass("punk-city", enabled);
};
