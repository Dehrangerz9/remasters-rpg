import { SYSTEM_ID } from "../../constants.js";
import { buildActorContext } from "./context.js";
import { applyThemeClass } from "./theme.js";
import { activateActorListeners } from "./listeners.js";
export class RMRPGActorSheet extends ActorSheet {
    equipmentOpenState = {};
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["rmrpg", "sheet", "actor"],
            width: 1180,
            height: 780,
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: ".sheet-body",
                    initial: "main"
                }
            ]
        });
    }
    render(force = false, options = {}) {
        applyThemeClass(this);
        return super.render(force, options);
    }
    get template() {
        return `systems/${SYSTEM_ID}/templates/actors/actor-sheet.hbs`;
    }
    async getData(options = {}) {
        const context = await super.getData(options);
        return buildActorContext(this, context);
    }
    activateListeners(html) {
        super.activateListeners(html);
        applyThemeClass(this);
        activateActorListeners(this, html);
    }
}
