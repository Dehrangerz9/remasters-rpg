export const SYSTEM_ID = "remasters-rpg";

export const RANKS = ["D", "C", "B", "A", "S"] as const;
export const ADVANCEMENTS_PER_RANK = 4;

export const RANK_BONUS_BY_RANK: Record<(typeof RANKS)[number], number> = {
  D: 2,
  C: 3,
  B: 4,
  A: 5,
  S: 6
};

export const RMRPG = {
  actorTypes: ["player", "npc", "summon"],
  itemTypes: ["weapon", "ability", "category-effect", "feat", "acao", "item", "consumable", "misc"]
};
