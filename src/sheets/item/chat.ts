export const sendItemToChat = async (sheet: any) => {
  const description = await TextEditor.enrichHTML(String(sheet.item.system?.description ?? ""), { async: true });
  const content = `
      <div class="rmrpg-item-chat">
        <h2>${sheet.item.name}</h2>
        <div class="rmrpg-item-chat-body">${description}</div>
      </div>
    `;
  const speaker = ChatMessage.getSpeaker({ actor: sheet.item.parent ?? null });
  await ChatMessage.create({ speaker, content });
};
