import { ADVANCEMENTS_PER_RANK, RANKS } from "../../../constants.js";
export const getEvolutionLabel = (index) => {
    const zeroBasedIndex = index - 1;
    const lastRankIndex = RANKS.length - 1;
    const rankIndex = Math.min(lastRankIndex, Math.floor(zeroBasedIndex / ADVANCEMENTS_PER_RANK));
    if (rankIndex === lastRankIndex) {
        const sStartIndex = lastRankIndex * ADVANCEMENTS_PER_RANK + 1;
        const step = index - sStartIndex + 1;
        return `${RANKS[rankIndex]}${step}`;
    }
    const step = (zeroBasedIndex % ADVANCEMENTS_PER_RANK) + 1;
    return `${RANKS[rankIndex]}${step}`;
};
export const extractAdvancementIndex = (key) => {
    const match = key.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
};
export const sortAdvancementKeys = (keys) => [...keys].sort((a, b) => {
    const aIndex = extractAdvancementIndex(a);
    const bIndex = extractAdvancementIndex(b);
    if (aIndex !== bIndex) {
        return aIndex - bIndex;
    }
    return a.localeCompare(b);
});
