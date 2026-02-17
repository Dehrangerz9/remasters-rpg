import { localize } from "../../global-functions/utils.js";
export const createDamageControls = async (sheet, baseDamage) => {
    const content = `
      <div class="rmrpg-damage-controls" data-total="${baseDamage}">
        <button type="button" data-action="damage-apply" data-mult="1">${localize("RMRPG.Actor.Damage.Normal")}</button>
        <button type="button" data-action="damage-apply" data-mult="2">${localize("RMRPG.Actor.Damage.Double")}</button>
        <button type="button" data-action="damage-apply" data-mult="0.5">${localize("RMRPG.Actor.Damage.Half")}</button>
        <button type="button" data-action="damage-soak">${localize("RMRPG.Actor.Damage.Soak")}</button>
      </div>
    `;
    const speaker = ChatMessage.getSpeaker({ actor: sheet.actor });
    const message = await ChatMessage.create({ speaker, content });
    const messageId = message?.id;
    if (!messageId)
        return;
    const hook = Hooks.on("renderChatMessage", (chatItem, html) => {
        if (chatItem.id !== messageId)
            return;
        Hooks.off("renderChatMessage", hook);
        let soakActive = false;
        const root = html.find(".rmrpg-damage-controls");
        const soakButton = root.find("[data-action='damage-soak']");
        soakButton.on("click", () => {
            soakActive = !soakActive;
            soakButton.toggleClass("is-active", soakActive);
        });
        root.find("[data-action='damage-apply']").on("click", async (event) => {
            const mult = Number(event.currentTarget.dataset.mult ?? 1);
            await applyDamageToTarget(sheet, baseDamage, mult, soakActive);
        });
    });
};
const applyDamageToTarget = async (sheet, baseDamage, multiplier, soakActive) => {
    const targets = Array.from(game.user?.targets ?? []);
    const controlled = canvas?.tokens?.controlled ?? [];
    const token = targets.length === 1 ? targets[0] : controlled.length === 1 ? controlled[0] : null;
    if (!token?.actor) {
        ui.notifications.error(localize("RMRPG.Errors.SelectSingleTarget"));
        return;
    }
    const safeBase = Number.isFinite(baseDamage) ? baseDamage : 0;
    const safeMultiplier = Number.isFinite(multiplier) ? multiplier : 1;
    const totalDamage = Math.max(0, Math.floor(safeBase * safeMultiplier));
    const soakValue = soakActive ? Math.max(0, Number(token.actor.system.rank?.bonus ?? 0) * 2) : 0;
    const finalDamage = Math.max(0, totalDamage - soakValue);
    const currentHp = Math.max(0, Math.floor(Number(token.actor.system.hp?.value ?? 0)));
    const nextHp = Math.max(0, currentHp - finalDamage);
    await token.actor.update({ "system.hp.value": nextHp });
    const messageKey = soakActive ? "RMRPG.Chat.DamageAbsorbed" : "RMRPG.Chat.DamageApplied";
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: sheet.actor }),
        content: localize(messageKey, {
            name: token.actor.name,
            damage: finalDamage,
            soak: soakValue
        })
    });
};
