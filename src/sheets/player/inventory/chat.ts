import { collectItemTags, escapeHtml } from "../item-summary.js";

export const sendInventoryItemToChat = async (sheet: any, item: any) => {
  const tags = collectItemTags(item);
  const description = await TextEditor.enrichHTML(String(item.system?.description ?? ""), { async: true });

  const tagsMarkup = tags.length
    ? tags.map((tag) => `<span class="item-chat-tag">${escapeHtml(tag)}</span>`).join("")
    : `<span class="item-chat-tag item-chat-tag-empty">-</span>`;

  const content = `
    <div class="rmrpg-item-chat">
      <h2>${escapeHtml(item.name)}</h2>
      <p><strong>${game.i18n.localize("RMRPG.Common.Tags")}:</strong> ${tagsMarkup}</p>
      <div class="rmrpg-item-chat-body">${description}</div>
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: sheet.actor }),
    content
  });
};
