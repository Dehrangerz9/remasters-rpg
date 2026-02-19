const HTML_ENTITY_REPLACEMENTS = [
    [/&nbsp;/gi, " "],
    [/&amp;/gi, "&"],
    [/&lt;/gi, "<"],
    [/&gt;/gi, ">"],
    [/&#39;/gi, "'"],
    [/&quot;/gi, '"']
];
const normalizeText = (value) => String(value ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .trim();
export const toPlainText = (value) => {
    let text = normalizeText(value);
    for (const [pattern, replacement] of HTML_ENTITY_REPLACEMENTS) {
        text = text.replace(pattern, replacement);
    }
    return text.replace(/\s+/g, " ").trim();
};
export const collectItemTags = (item) => {
    const tags = [];
    const seen = new Set();
    const pushTag = (raw) => {
        const name = String(raw ?? "").trim();
        if (!name)
            return;
        const key = name.toLowerCase();
        if (seen.has(key))
            return;
        seen.add(key);
        tags.push(name);
    };
    pushTag(item?.type);
    const rawTags = Array.isArray(item?.system?.tags) ? item.system.tags : [];
    for (const entry of rawTags) {
        if (typeof entry === "string") {
            pushTag(entry);
            continue;
        }
        pushTag(entry?.name);
    }
    return tags;
};
export const getItemDescriptionText = (item) => toPlainText(item?.system?.description);
export const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
