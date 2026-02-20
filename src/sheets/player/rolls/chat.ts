import { rollDamageWithDialog } from "./damage.js";

let hookRegistered = false;

export const setupCheckChatInteractions = () => {
  if (hookRegistered) return;
  hookRegistered = true;

  Hooks.on("renderChatMessage", (chatItem: any, html: JQuery) => {
    const card = html.find(".rmrpg-check-card, .rmrpg-feat-card");
    if (!card.length) return;
    if (!chatItem?.isOwner) return;
    if (card.find(".rmrpg-check-delete").length) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "rmrpg-check-delete";
    button.setAttribute("aria-label", game.i18n.localize("Delete"));
    button.setAttribute("title", game.i18n.localize("Delete"));
    button.innerHTML = `<i class="fas fa-trash"></i>`;
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await chatItem.delete();
    });

    const root = card.get(0);
    if (!root) return;
    root.append(button);

    const secretBlocks = card.find(".rmrpg-check-outcome-secret");
    if (secretBlocks.length) {
      if (game.user?.isGM) {
        secretBlocks.addClass("revealed");
      }
      card.find(".rmrpg-check-outcome .reveal, .rmrpg-check-outcome .secret-reveal").remove();
    }

    card.find("[data-action='check-roll-damage']").on("click", async (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      const trigger = event.currentTarget as HTMLElement;
      const formula = String(trigger.dataset.formula ?? "").trim();
      if (!formula) return;
      const actorId = String(trigger.dataset.actorId ?? "");
      const itemName = String(trigger.dataset.itemName ?? "").trim();
      const itemId = String(trigger.dataset.itemId ?? "").trim();
      const actor = actorId ? game.actors?.get(actorId) : null;
      const item = itemId && actor ? actor.items?.get(itemId) : null;
      await rollDamageWithDialog({
        actor,
        item,
        fallbackFormula: formula,
        itemName,
        sourceLabel: itemName || game.i18n.localize("RMRPG.Actor.Actions.Damage"),
        criticalMultiplier: 1
      });
    });
  });
};
