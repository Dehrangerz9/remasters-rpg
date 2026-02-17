import { RANKS } from "../../../constants.js";

export const getEvolutionLabel = (index: number) => {
  const rankIndex = Math.min(RANKS.length - 1, Math.floor((index - 1) / 4));
  const step = ((index - 1) % 4) + 1;
  return `${RANKS[rankIndex]}${step}`;
};

export const extractAdvancementIndex = (key: string) => {
  const match = key.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

export const sortAdvancementKeys = (keys: string[]) =>
  [...keys].sort((a, b) => {
    const aIndex = extractAdvancementIndex(a);
    const bIndex = extractAdvancementIndex(b);

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return a.localeCompare(b);
  });
