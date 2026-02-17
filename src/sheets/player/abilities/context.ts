import { clampInteger, formatSigned } from "../../global-functions/utils.js";
import { calculateAbilityCost, normalizeAbilityData } from "../../../abilities/rules.js";
import { resolveAbilityCategories } from "../../../abilities/category-links.js";

export const applyPlayerAbilitiesContext = (context: any) => {
  const abilities = context.actor.items?.filter((item: any) => item.type === "ability") ?? [];
  abilities.sort((a: any, b: any) => {
    const aSort = Number(a.sort ?? 0);
    const bSort = Number(b.sort ?? 0);
    if (aSort !== bSort) return aSort - bSort;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });

  context.abilityItems = abilities.map((item: any) => {
    const rawAbility = item.system?.ability;
    let computedCost = Number(item.system?.cost ?? 0);
    if (rawAbility && typeof rawAbility === "object") {
      const ability = normalizeAbilityData(rawAbility);
      const resolvedCategories = resolveAbilityCategories(item, ability);
      computedCost = calculateAbilityCost({ ...ability, categories: resolvedCategories }).totalCost;
    }
    return {
      id: String(item.id ?? ""),
      name: String(item.name ?? ""),
      img: String(item.img ?? ""),
      cost: clampInteger(Number(computedCost ?? 0), 0, 9999)
    };
  });

  const pcTotal = clampInteger(Number(context.system.player?.pc?.total ?? 0), 0, 9999);
  const pcSpent = context.abilityItems.reduce((sum: number, item: any) => sum + Number(item.cost ?? 0), 0);
  context.pcTotal = pcTotal;
  context.pcSpent = pcSpent;
  context.pcRemaining = Math.max(0, pcTotal - pcSpent);

  const castingAttribute = String(context.system.player?.casting?.attribute ?? "mente");
  const attributeOptions = Array.isArray(context.attributeOptions) ? context.attributeOptions : [];
  const castingAttributeLabel =
    attributeOptions.find((option: any) => option.value === castingAttribute)?.label ?? "Mente";
  const castingAttributeValue = Number(context.system.attributes?.[castingAttribute]?.value ?? 0);
  const rankBonus = Number(context.rankBonus ?? 0);
  context.cdeValue = Math.floor(12 + castingAttributeValue + rankBonus);
  const castingAttackMod = Math.floor(castingAttributeValue + rankBonus);

  context.castingAttribute = castingAttribute;
  context.castingAttributeLabel = castingAttributeLabel;
  context.castingAttackMod = castingAttackMod;
  context.castingAttackModLabel = formatSigned(castingAttackMod);
  context.cdeBreakdown = [
    `12`,
    `${castingAttributeLabel}: ${castingAttributeValue}`,
    `BR: ${rankBonus}`,
    `Total: ${context.cdeValue}`
  ].join("\n");
  context.castingAttackBreakdown = [
    `${castingAttributeLabel}: ${castingAttributeValue}`,
    `BR: ${rankBonus}`,
    `Total: ${formatSigned(castingAttackMod)}`
  ].join("\n");
};
