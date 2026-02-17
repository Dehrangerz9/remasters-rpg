export const localize = (key, data) => data ? game.i18n.format(key, data) : game.i18n.localize(key);
export const parseNumericInput = (rawValue) => {
    const trimmed = String(rawValue ?? "").trim();
    if (trimmed === "") {
        return 0;
    }
    const parsed = Number(trimmed.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
};
export const clampInteger = (value, min, max) => {
    if (!Number.isFinite(value))
        return min;
    return Math.max(min, Math.min(max, Math.floor(value)));
};
export const formatSigned = (value) => (value >= 0 ? `+${value}` : `${value}`);
export const normalizeBonusArray = (bonuses) => {
    if (Array.isArray(bonuses))
        return bonuses;
    if (bonuses && typeof bonuses === "object") {
        return Object.values(bonuses);
    }
    return [];
};
export const sumModifiers = (modifiers) => modifiers.reduce((total, modifier) => total + (modifier.checked ? modifier.value : 0), 0);
