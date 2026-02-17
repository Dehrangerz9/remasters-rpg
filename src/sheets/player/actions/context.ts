import { normalizeBonusArray, formatSigned } from "../../global-functions/utils.js";

const getItemTags = (item: any) => {
  const tags = new Set<string>();
  const typeTag = String(item.type ?? "").trim().toLowerCase();
  if (typeTag) tags.add(typeTag);
  const rawTags = Array.isArray(item.system?.tags) ? item.system.tags : [];
  for (const entry of rawTags) {
    if (typeof entry === "string") {
      const name = entry.trim().toLowerCase();
      if (name) tags.add(name);
      continue;
    }
    const name = String(entry?.name ?? "").trim().toLowerCase();
    if (name) tags.add(name);
  }
  return tags;
};

const buildDamageFormula = (item: any, context: any) => {
  const damage = item.system?.weapon?.damage ?? {};
  const baseDice = Number(damage.base?.dice ?? 0);
  const baseDie = String(damage.base?.die ?? "d6");
  const parts: string[] = [];

  if (baseDice > 0) {
    parts.push(`${baseDice}${baseDie}`);
  } else {
    parts.push("0");
  }

  const attrKey = String(damage.attribute ?? "none");
  const attrValue = attrKey !== "none" ? Number(context.system.attributes?.[attrKey]?.value ?? 0) : 0;
  if (attrValue !== 0) {
    parts.push(formatSigned(Math.floor(attrValue)));
  }

  const bonusParts = normalizeBonusArray(damage.bonuses).map((bonus: any) => String(bonus?.formula ?? "").trim());
  for (const formula of bonusParts) {
    if (!formula) continue;
    if (formula.startsWith("+") || formula.startsWith("-")) {
      parts.push(formula);
    } else {
      parts.push(`+${formula}`);
    }
  }

  return parts.join(" ");
};

const buildActionList = (items: any[], tag: string, exclude: string[] = []) =>
  items
    .filter((item) => {
      const tags = getItemTags(item);
      if (!tags.has(tag)) return false;
      return !exclude.some((excluded) => tags.has(excluded));
    })
    .map((item) => ({
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      sort: Number(item.sort ?? 0)
    }))
    .filter((entry) => entry.id && entry.name)
    .sort((a, b) => {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return a.name.localeCompare(b.name);
    });

export const applyPlayerActionsContext = (context: any) => {
  const allItems = context.actor.items?.contents ?? [];
  const rawAttackItems = allItems.filter((item: any) => item.type === "weapon" || getItemTags(item).has("ataque"));

  context.attackItems = rawAttackItems
    .map((item: any) => {
      const isWeapon = item.type === "weapon";
      const hit = item.system?.weapon?.hit ?? {};
      const hitAttr = String(hit.attribute ?? "none");
      const hitAttrValue = hitAttr !== "none" ? Number(context.system.attributes?.[hitAttr]?.value ?? 0) : 0;
      const hitBonuses = normalizeBonusArray(hit.bonuses);
      const hitBonusTotal = hitBonuses.reduce((total: number, bonus: any) => total + Number(bonus?.value ?? 0), 0);
      const rankBonus = Number(context.rankBonus ?? 0);
      const attackMod = isWeapon ? Math.floor(hitAttrValue + hitBonusTotal + rankBonus) : 0;
      const praMod = attackMod - 5;

      const damageFormula = isWeapon ? buildDamageFormula(item, context) : "0";
      const critFormula = `(${damageFormula}) * 2`;

      const status = String(item.system?.status ?? "stowed");
      const isReady = !isWeapon || status === "hand";
      const isStowed = isWeapon && status !== "hand";
      const canDraw = isWeapon && status !== "hand";
      const canSheathe = isWeapon && status === "hand";
      const canDrop = isWeapon && status === "hand";

      return {
        id: String(item.id ?? ""),
        name: String(item.name ?? ""),
        img: item.img ?? "",
        sort: Number(item.sort ?? 0),
        isWeapon,
        canDelete: !isWeapon,
        isReady,
        isStowed,
        canDraw,
        canSheathe,
        canDrop,
        attackMod,
        praMod,
        attackModLabel: formatSigned(attackMod),
        praModLabel: formatSigned(praMod),
        damageFormula,
        critFormula
      };
    })
    .filter((entry: any) => entry.id && entry.name)
    .sort((a: any, b: any) => {
      if (a.sort !== b.sort) return a.sort - b.sort;
      return a.name.localeCompare(b.name);
    });

  context.actionItems = buildActionList(allItems, "acao", ["ataque", "reacao"]);
  context.reactionItems = buildActionList(allItems, "reacao");
};
