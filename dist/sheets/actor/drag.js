export const setItemDragData = (sheet, event, data) => {
    if (!event.dataTransfer)
        return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-rmrpg-item", JSON.stringify(data));
    const item = sheet.actor.items?.get(data.id);
    if (item && typeof item.toDragData === "function") {
        event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
    }
};
export const readItemDragData = (event) => {
    const raw = event.dataTransfer?.getData("application/x-rmrpg-item");
    if (!raw)
        return null;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed?.id || !parsed?.group)
            return null;
        return parsed;
    }
    catch {
        return null;
    }
};
export const updateItemSortOrder = async (sheet, ids) => {
    if (!ids.length)
        return;
    const updates = ids.map((id, index) => ({
        _id: id,
        sort: (index + 1) * 10
    }));
    await sheet.actor.updateEmbeddedDocuments("Item", updates);
};
export const bindReorderList = (sheet, listElement, rowSelector, group) => {
    listElement.addEventListener("dragover", (event) => {
        const dragEvent = event;
        const data = readItemDragData(dragEvent);
        if (!data || data.group !== group)
            return;
        event.preventDefault();
    });
    listElement.addEventListener("drop", async (event) => {
        const dragEvent = event;
        const data = readItemDragData(dragEvent);
        if (!data || data.group !== group)
            return;
        event.preventDefault();
        const rows = Array.from(listElement.querySelectorAll(rowSelector));
        const draggedIndex = rows.findIndex((row) => row.dataset.id === data.id);
        if (draggedIndex === -1)
            return;
        const targetRow = dragEvent.target?.closest(rowSelector);
        let insertIndex = rows.length;
        if (targetRow) {
            const targetIndex = rows.findIndex((row) => row === targetRow);
            const rect = targetRow.getBoundingClientRect();
            const isAfter = dragEvent.clientY > rect.top + rect.height / 2;
            insertIndex = targetIndex + (isAfter ? 1 : 0);
        }
        const ordered = rows.map((row) => row.dataset.id ?? "").filter(Boolean);
        const [moved] = ordered.splice(draggedIndex, 1);
        let normalizedIndex = insertIndex;
        if (normalizedIndex > draggedIndex)
            normalizedIndex -= 1;
        normalizedIndex = Math.max(0, Math.min(ordered.length, normalizedIndex));
        ordered.splice(normalizedIndex, 0, moved);
        await updateItemSortOrder(sheet, ordered);
    });
};
