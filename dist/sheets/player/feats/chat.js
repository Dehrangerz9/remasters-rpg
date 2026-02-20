import { escapeHtml } from "../item-summary.js";
export const sendFeatToChat = async (sheet, item) => {
    const actorName = String(sheet.actor?.name ?? "-");
    const actorImg = String(sheet.actor?.img ?? "icons/svg/mystery-man.svg");
    const createdBy = String(game.user?.name ?? "-");
    const requirements = String(item.system?.requirements ?? "").trim();
    const rank = String(item.system?.rank ?? "").trim();
    const description = await TextEditor.enrichHTML(String(item.system?.description ?? ""), { async: true });
    const content = `
    <article class="rmrpg-feat-card">
      <header class="rmrpg-feat-header">
        <img class="rmrpg-feat-avatar" src="${escapeHtml(actorImg)}" alt="${escapeHtml(actorName)}" />
        <div class="rmrpg-feat-meta">
          <div class="rmrpg-feat-name">${escapeHtml(actorName)}</div>
          <div class="rmrpg-feat-user">${escapeHtml(createdBy)}</div>
        </div>
      </header>
      <h3 class="rmrpg-feat-title">${escapeHtml(item.name)}</h3>
      <div class="rmrpg-feat-divider"></div>
      <div class="rmrpg-feat-tags">
        <span class="rmrpg-feat-tag">
          <span class="rmrpg-feat-tag-label">${escapeHtml(game.i18n.localize("RMRPG.Item.Feat.Rank"))}</span>
          <span class="rmrpg-feat-tag-value">${escapeHtml(rank || "-")}</span>
        </span>
      </div>
      <div class="rmrpg-feat-block">
        <div class="rmrpg-feat-block-title">${escapeHtml(game.i18n.localize("RMRPG.Item.Feat.Requirements"))}</div>
        <div class="rmrpg-feat-block-text">${escapeHtml(requirements || "-")}</div>
        <div class="rmrpg-feat-content-divider"></div>
        <div class="rmrpg-feat-block-title">${escapeHtml(game.i18n.localize("RMRPG.Item.Feat.Description"))}</div>
        <div class="rmrpg-feat-description">${description || "<p>-</p>"}</div>
      </div>
    </article>
  `;
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: sheet.actor }),
        content
    });
};
