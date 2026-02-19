import { localize } from "../../global-functions/utils.js";
import { escapeHtml } from "../item-summary.js";

const buildReikiChatContent = (params: {
  actor: any;
  total: number;
  messageKey: string;
  current: number;
  next: number;
  max: number;
  updated: boolean;
}) => {
  const { actor, total, messageKey, current, next, max, updated } = params;
  const actorName = String(actor?.name ?? "-");
  const actorImg = String(actor?.img ?? "icons/svg/mystery-man.svg");
  const createdBy = String(game.user?.name ?? "-");
  const resultLabel = localize(messageKey, { name: actorName, total });
  const resourceLabel = updated ? `${current} -> ${next}/${max}` : "-";
  const stateClass = messageKey === "RMRPG.Chat.ReikiLoss" ? "is-loss" : "is-safe";

  return `
    <article class="rmrpg-reiki-card">
      <header class="rmrpg-reiki-header">
        <img class="rmrpg-reiki-avatar" src="${escapeHtml(actorImg)}" alt="${escapeHtml(actorName)}" />
        <div class="rmrpg-reiki-meta">
          <div class="rmrpg-reiki-name">${escapeHtml(actorName)}</div>
          <div class="rmrpg-reiki-user">${escapeHtml(createdBy)}</div>
        </div>
      </header>
      <h3 class="rmrpg-reiki-title">${escapeHtml(localize("RMRPG.Actor.Player.ReikiRoll"))}</h3>
      <div class="rmrpg-reiki-formula">1d6</div>
      <div class="rmrpg-reiki-total">${total}</div>
      <div class="rmrpg-reiki-result ${stateClass}">${escapeHtml(resultLabel)}</div>
      <div class="rmrpg-reiki-resource">${escapeHtml(localize("RMRPG.Actor.Player.ReikiCharges"))}: ${escapeHtml(resourceLabel)}</div>
    </article>
  `;
};

export const rollReikiSurge = async (sheet: any) => {
  const roll = await new Roll("1d6").evaluate();
  const total = Number(roll.total ?? 0);
  const speaker = ChatMessage.getSpeaker({ actor: sheet.actor });

  const reikiData = sheet.actor.system.player?.reiki ?? {};
  const current = Math.max(0, Math.floor(Number(reikiData.current ?? 0)));
  const max = Math.max(0, Math.floor(Number(reikiData.max ?? 0)));

  let next = current;
  let messageKey = "RMRPG.Chat.ReikiNoLoss";
  if (total < 3) {
    next = Math.max(0, current - 1);
    messageKey = "RMRPG.Chat.ReikiLoss";
  }

  let updated = false;
  if (sheet.actor.type === "player") {
    await sheet.actor.update({ "system.player.reiki.current": Math.min(next, max) });
    updated = true;
  }

  await ChatMessage.create({
    speaker,
    content: buildReikiChatContent({
      actor: sheet.actor,
      total,
      messageKey,
      current,
      next: Math.min(next, max),
      max,
      updated
    })
  });
};
