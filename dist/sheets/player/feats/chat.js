export const sendFeatToChat = async (sheet, item) => {
    const requirements = String(item.system?.requirements ?? "");
    const rank = String(item.system?.rank ?? "");
    const description = await TextEditor.enrichHTML(String(item.system?.description ?? ""), { async: true });
    const content = `
      <div class="rmrpg-feat-chat">
        <h2>${item.name}</h2>
        <p><strong>${game.i18n.localize("RMRPG.Item.Feat.Requirements")}:</strong> ${requirements || "-"}</p>
        <p><strong>${game.i18n.localize("RMRPG.Item.Feat.Rank")}:</strong> ${rank || "-"}</p>
        <div class="rmrpg-feat-desc">${description}</div>
      </div>
    `;
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: sheet.actor }),
        content
    });
};
