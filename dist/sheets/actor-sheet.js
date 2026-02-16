import { SYSTEM_ID } from "../constants.js";
export class RMRPGActorSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["rmrpg", "sheet", "actor"],
            width: 620,
            height: 700,
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: ".sheet-body",
                    initial: "attributes"
                }
            ]
        });
    }
    get template() {
        return `systems/${SYSTEM_ID}/templates/actors/actor-sheet.hbs`;
    }
    async getData(options = {}) {
        const context = await super.getData(options);
        context.system = context.actor.system;
        context.isCharacter = context.actor.type === "character";
        context.isNPC = context.actor.type === "npc";
        return context;
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find("[data-action='roll-attribute']").on("click", async (event) => {
            event.preventDefault();
            const attribute = event.currentTarget.dataset.attribute;
            await this.actor.rollAttribute(attribute);
        });
    }
}
