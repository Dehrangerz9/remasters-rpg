import { SYSTEM_ID } from "../constants.js";
export class RMRPGItemSheet extends ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["rmrpg", "sheet", "item"],
            width: 520,
            height: 560
        });
    }
    render(force = false, options = {}) {
        this.applyThemeClass();
        return super.render(force, options);
    }
    activateListeners(html) {
        super.activateListeners(html);
        this.applyThemeClass();
    }
    get template() {
        return `systems/${SYSTEM_ID}/templates/items/item-sheet.hbs`;
    }
    async getData(options = {}) {
        const context = await super.getData(options);
        context.system = context.item.system;
        context.isWeapon = context.item.type === "weapon";
        context.isAbility = context.item.type === "ability";
        context.isFeat = context.item.type === "feat";
        context.isEquipment = ["weapon", "mystic", "consumable", "misc", "item"].includes(context.item.type);
        context.statusOptions = [
            { value: "stowed", label: game.i18n.localize("RMRPG.Item.Status.Stowed") },
            { value: "hand", label: game.i18n.localize("RMRPG.Item.Status.InHand") },
            { value: "dropped", label: game.i18n.localize("RMRPG.Item.Status.Dropped") }
        ];
        const rankLabel = game.i18n.localize("RMRPG.Item.Feat.Rank");
        context.rankOptions = [
            { value: "D", label: `${rankLabel} D` },
            { value: "C", label: `${rankLabel} C` },
            { value: "B", label: `${rankLabel} B` },
            { value: "A", label: `${rankLabel} A` },
            { value: "S", label: `${rankLabel} S` }
        ];
        return context;
    }
    applyThemeClass() {
        const enabled = game.settings.get(SYSTEM_ID, "punkCityTheme");
        document.body?.classList.toggle("punk-city", Boolean(enabled));
        const classes = new Set(this.options.classes ?? []);
        if (enabled) {
            classes.add("punk-city");
        }
        else {
            classes.delete("punk-city");
        }
        this.options.classes = Array.from(classes);
        this.element?.toggleClass("punk-city", enabled);
    }
}
