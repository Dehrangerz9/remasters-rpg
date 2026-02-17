export const localize = (key: string, data?: Record<string, any>) =>
  data ? game.i18n.format(key, data) : game.i18n.localize(key);

export const parseNumericInput = (rawValue: string) => {
  const trimmed = String(rawValue ?? "").trim();
  if (trimmed === "") {
    return 0;
  }

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

export const clampInteger = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
};

export const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

export const normalizeBonusArray = (bonuses: unknown) => {
  if (Array.isArray(bonuses)) return bonuses;
  if (bonuses && typeof bonuses === "object") {
    return Object.values(bonuses as Record<string, any>);
  }
  return [];
};

export const sumModifiers = (modifiers: { value: number; checked: boolean }[]) =>
  modifiers.reduce((total, modifier) => total + (modifier.checked ? modifier.value : 0), 0);
