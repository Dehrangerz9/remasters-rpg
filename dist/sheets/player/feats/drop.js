import { readItemDragData } from "../../actor/drag.js";
export const handleFeatDrop = async (sheet, event) => {
    event.preventDefault();
    if (!sheet.actor)
        return;
    const reorderData = readItemDragData(event);
    if (reorderData?.group === "feats")
        return;
    const data = TextEditor.getDragEventData(event);
    if (!data || data.type !== "Item")
        return;
    let itemData = data.data;
    if (!itemData && data.uuid) {
        const item = await fromUuid(data.uuid);
        if (item) {
            itemData = item.toObject();
        }
    }
    if (!itemData || itemData.type !== "feat")
        return;
    await sheet.actor.createEmbeddedDocuments("Item", [itemData]);
};
