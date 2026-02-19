import { collectItemTags, escapeHtml } from "../item-summary.js";

export const sendCastAbilityToChat = async (sheet: any, item: any) => {
  const tags = collectItemTags(item);
  const description = await TextEditor.enrichHTML(String(item.system?.description ?? ""), { async: true });
  const cost = Number(item.system?.cost ?? 0);

  const tagsMarkup = tags.length
    ? tags.map((tag) => `<span class="ability-chat-tag">${escapeHtml(tag)}</span>`).join("")
    : `<span class="ability-chat-tag ability-chat-tag-empty">-</span>`;

  const content = `
    <div class="rmrpg-ability-chat">
      <h2>${escapeHtml(item.name)}</h2>
      <p><strong>${game.i18n.localize("RMRPG.Actor.Abilities.Columns.Cost")}:</strong> ${cost}</p>
      <p><strong>${game.i18n.localize("RMRPG.Common.Tags")}:</strong> ${tagsMarkup}</p>
      <div class="rmrpg-ability-chat-body">${description}</div>
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: sheet.actor }),
    content
  });
};
