import { clampInteger, normalizeBonusArray } from "../global-functions/utils.js";
import {
  buildAbilityOptions,
  calculateAbilityCost,
  collectAbilityModifiers,
  describeCharacteristicLimits,
  describeEnhancement,
  getCategoryLabel,
  getCharacteristicLevelChoices,
  isOverRankingCharacteristicLevel,
  getCategoryTag,
  getCategoryTooltip,
  listCategoryTags,
  normalizeAbilityData
} from "../../abilities/rules.js";
import { resolveAbilityCategories } from "../../abilities/category-links.js";
import { buildTagContext } from "./tags.js";
import { RANK_BONUS_BY_RANK } from "../../constants.js";

const DESTRUCTION_DIE_BY_LEVEL: Record<number, string> = {
  1: "",
  2: "d4",
  3: "d6",
  4: "d8",
  5: "d10",
  6: "d12"
};

export const buildItemContext = async (sheet: any, context: any) => {
  const item = context.item ?? sheet.item ?? sheet.document ?? sheet.object;
  if (!item) return context;
  context.item = item;
  context.system = item.system ?? {};
  context.isWeapon = item.type === "weapon";
  context.isAbility = item.type === "ability";
  context.isAbilityCategory = item.type === "category-effect";
  context.isFeat = item.type === "feat";
  context.isAction = item.type === "acao";
  context.isEquipment = ["weapon", "consumable", "misc", "item"].includes(item.type);

  const tagContext = buildTagContext(item, context.system);
  context.typeTag = tagContext.typeTag;
  context.tagEntries = tagContext.tagEntries;

  context.statusOptions = [
    { value: "stowed", label: game.i18n.localize("RMRPG.Item.Status.Stowed") },
    { value: "hand", label: game.i18n.localize("RMRPG.Item.Status.InHand") },
    { value: "dropped", label: game.i18n.localize("RMRPG.Item.Status.Dropped") }
  ];
  const rankLabel = game.i18n.localize("RMRPG.Item.Feat.Rank");
  context.rankOptions = [
    { value: "D", label: `${rankLabel} D` },
    { value: "C", label: `${rankLabel} C` },
    { value: "B", label: `${rankLabel} B` },
    { value: "A", label: `${rankLabel} A` },
    { value: "S", label: `${rankLabel} S` }
  ];

  context.action = {
    cost: String(context.system.action?.cost ?? "1")
  };
  context.actionCostOptions = [
    { value: "free", label: game.i18n.localize("RMRPG.Item.Action.Cost.Free") },
    { value: "1", label: game.i18n.localize("RMRPG.Item.Action.Cost.One") },
    { value: "2", label: game.i18n.localize("RMRPG.Item.Action.Cost.Two") },
    { value: "3", label: game.i18n.localize("RMRPG.Item.Action.Cost.Three") },
    { value: "reaction", label: game.i18n.localize("RMRPG.Item.Action.Cost.Reaction") }
  ];

  const attributeOptions = [
    { value: "corpo", label: game.i18n.localize("RMRPG.Actor.Attributes.Corpo") },
    { value: "coordenacao", label: game.i18n.localize("RMRPG.Actor.Attributes.Coordenacao") },
    { value: "agilidade", label: game.i18n.localize("RMRPG.Actor.Attributes.Agilidade") },
    { value: "atencao", label: game.i18n.localize("RMRPG.Actor.Attributes.Atencao") },
    { value: "mente", label: game.i18n.localize("RMRPG.Actor.Attributes.Mente") },
    { value: "carisma", label: game.i18n.localize("RMRPG.Actor.Attributes.Carisma") }
  ];
  context.attributeOptions = attributeOptions;
  context.attributeOptionsWithNone = [
    { value: "none", label: game.i18n.localize("RMRPG.Item.Weapon.NoAttribute") },
    ...attributeOptions
  ];
  context.weaponCategoryOptions = [
    { value: "melee", label: game.i18n.localize("RMRPG.Item.Weapon.Category.Melee") },
    { value: "ranged", label: game.i18n.localize("RMRPG.Item.Weapon.Category.Ranged") },
    { value: "thrown", label: game.i18n.localize("RMRPG.Item.Weapon.Category.Thrown") }
  ];
  context.weaponRangeOptions = [
    { value: "melee", label: game.i18n.localize("RMRPG.Item.Weapon.Range.Melee") },
    { value: "5", label: "5" },
    { value: "10", label: "10" },
    { value: "15", label: "15" },
    { value: "20", label: "20" },
    { value: "25", label: "25" }
  ];
  context.weaponDieOptions = [
    { value: "d4", label: "d4" },
    { value: "d6", label: "d6" },
    { value: "d8", label: "d8" },
    { value: "d10", label: "d10" },
    { value: "d12", label: "d12" }
  ];
  context.weaponDamageTypeOptions = [
    { value: "physical", label: game.i18n.localize("RMRPG.Item.Weapon.DamageType.Physical") },
    { value: "elemental", label: game.i18n.localize("RMRPG.Item.Weapon.DamageType.Elemental") },
    { value: "mental", label: game.i18n.localize("RMRPG.Item.Weapon.DamageType.Mental") },
    { value: "deteriorating", label: game.i18n.localize("RMRPG.Item.Weapon.DamageType.Deteriorating") },
    { value: "none", label: game.i18n.localize("RMRPG.Item.Weapon.DamageType.None") }
  ];

  const rawWeapon = context.system.weapon ?? {};
  const rawHit = rawWeapon.hit ?? {};
  const rawDamage = rawWeapon.damage ?? {};
  context.weapon = {
    category: rawWeapon.category ?? "melee",
    range: rawWeapon.range ?? "melee",
    hit: {
      attribute: rawHit.attribute ?? "corpo",
      bonuses: normalizeBonusArray(rawHit.bonuses)
    },
    damage: {
      attribute: rawDamage.attribute ?? "none",
      base: {
        dice: Number(rawDamage.base?.dice ?? 1),
        die: String(rawDamage.base?.die ?? "d6"),
        type: String(rawDamage.base?.type ?? "physical")
      },
      bonuses: normalizeBonusArray(rawDamage.bonuses)
    }
  };

  if (context.isAbility || context.isAbilityCategory) {
    const localize = (key: string) => game.i18n.localize(key);
    const abilityOptions = buildAbilityOptions(localize);
    if (context.isAbilityCategory) {
      context.abilityCategoryOptions = abilityOptions.categories;
    }
    if (!context.isAbility) {
      return context;
    }
    const ability = normalizeAbilityData(context.system?.ability);
    const resolvedCategories = resolveAbilityCategories(item, ability);
    const resolvedAbility = {
      ...ability,
      categories: resolvedCategories
    };
    const modifiers = collectAbilityModifiers(ability.enhancements);
    const actorRank = item.parent?.documentName === "Actor" ? String(item.parent.system?.rank?.value ?? "") : null;
    const costInfo = calculateAbilityCost(resolvedAbility, { actorRank });

    const characteristicLabels = new Map(abilityOptions.characteristics.map((entry) => [entry.value, entry.label]));
    const pcLabel = localize("RMRPG.Item.Ability.TotalCostShort");
    const rankLabel = localize("RMRPG.Actor.Rank");
    const damageTypeOptions = [
      { value: "physical", label: game.i18n.localize("RMRPG.Item.Weapon.DamageType.Physical") },
      { value: "elemental", label: game.i18n.localize("RMRPG.Item.Weapon.DamageType.Elemental") },
      { value: "mental", label: game.i18n.localize("RMRPG.Item.Weapon.DamageType.Mental") },
      { value: "deteriorating", label: game.i18n.localize("RMRPG.Item.Weapon.DamageType.Deteriorating") }
    ];
    const areaTypeOptions = [
      { value: "emanacao", label: game.i18n.localize("RMRPG.Item.Ability.AreaType.Emanacao") },
      { value: "feixe", label: game.i18n.localize("RMRPG.Item.Ability.AreaType.Feixe") },
      { value: "explosao", label: game.i18n.localize("RMRPG.Item.Ability.AreaType.Explosao") },
      { value: "line", label: game.i18n.localize("RMRPG.Item.Ability.AreaType.Line") }
    ];
    const normalizedActorRank = String(actorRank ?? "").toUpperCase() as keyof typeof RANK_BONUS_BY_RANK;
    const rankBonusFromActor = Number(item.parent?.system?.rank?.bonus ?? NaN);
    const rankBonus = Number.isFinite(rankBonusFromActor)
      ? rankBonusFromActor
      : (RANK_BONUS_BY_RANK[normalizedActorRank] ?? RANK_BONUS_BY_RANK.D);
    const destructionDiceCount = Math.max(1, rankBonus - 1);

    const categories = resolvedCategories.map((entry) => {
      const categoryLabel = getCategoryLabel(entry.category, localize);
      return {
        ...entry,
        name: entry.name || categoryLabel,
        img: entry.img || "icons/svg/book.svg",
        cost: Number(entry.cost ?? 0),
        categoryLabel,
        tooltip: getCategoryTooltip(entry.category, localize)
      };
    });

    const characteristics = ability.characteristics.map((entry) => {
      const limits = describeCharacteristicLimits(entry.id, modifiers, { actorRank });
      const levelChoices = getCharacteristicLevelChoices(entry.id, localize);
      const level = clampInteger(Number(entry.level ?? limits.min), limits.min, limits.max);
      const selectedChoice = levelChoices.find((choice) => Number(choice.level) === level) ?? null;
      const fallbackOptions = [{ value: String(level), label: String(level) }];
      const levelOptions =
        levelChoices.length > 0
          ? levelChoices.map((choice) => ({
              value: choice.value,
              label: choice.label
            }))
          : fallbackOptions;
      const selectedLevelCostLabel = selectedChoice ? `${selectedChoice.cost} ${pcLabel}` : `0 ${pcLabel}`;
      const selectedLevelRankLabelBase = selectedChoice?.minRank ? `${rankLabel} ${selectedChoice.minRank}` : "-";
      const destructionDie = entry.id === "destruicao" ? DESTRUCTION_DIE_BY_LEVEL[level] ?? "" : "";
      const destructionPreviewLabel = destructionDie ? `${destructionDiceCount}${destructionDie}` : null;
      const selectedLevelRankLabel =
        entry.id === "destruicao" && destructionPreviewLabel
          ? `${selectedLevelRankLabelBase} | ${destructionPreviewLabel}`
          : selectedLevelRankLabelBase;
      const overRanking = selectedChoice
        ? isOverRankingCharacteristicLevel(entry.id, level, actorRank)
        : false;
      const showDamageType = entry.id === "destruicao";
      const showAreaType = entry.id === "area";
      return {
        ...entry,
        level,
        min: limits.min,
        max: limits.max,
        useLevelSelect: true,
        levelOptions,
        showTypeSelect: showDamageType || showAreaType,
        typeField: showDamageType ? "damageType" : showAreaType ? "areaType" : "",
        typeValue: showDamageType
          ? String((entry as any).damageType ?? "physical")
          : showAreaType
            ? String((entry as any).areaType ?? "emanacao")
            : "",
        typeOptions: showDamageType ? damageTypeOptions : showAreaType ? areaTypeOptions : [],
        selectedLevelCostLabel,
        selectedLevelRankLabel,
        overRanking
      };
    });

    const enhancements = ability.enhancements.map((entry) => ({
      ...entry,
      description: describeEnhancement(entry.id, localize)
    }));

    const restrictionTargets = characteristics.map((entry, index) => ({
      value: String(index),
      label: entry.id ? characteristicLabels.get(entry.id) ?? entry.id : localize("RMRPG.Item.Ability.Restrictions.TargetEmpty")
    }));

    const advancesTargetValue =
      ability.restrictions.advancesTarget === null || Number.isNaN(ability.restrictions.advancesTarget)
        ? ""
        : String(ability.restrictions.advancesTarget);

    context.ability = {
      ...resolvedAbility,
      restrictions: {
        ...ability.restrictions,
        advancesTarget: advancesTargetValue
      },
      categories,
      characteristics,
      enhancements
    };
    context.abilityCost = costInfo.totalCost;
    context.abilityCastingTimeOptions = abilityOptions.castingTimes;
    context.abilityCastingCostOptions = abilityOptions.castingCosts;
    context.abilityCharacteristicOptions = abilityOptions.characteristics;
    context.abilityEnhancementOptions = abilityOptions.enhancements;
    context.abilityCategoryLimit = costInfo.limits.categories;
    context.abilityCategoryLimitExceeded =
      costInfo.limits.categories !== null && resolvedCategories.length > costInfo.limits.categories;
    context.abilityCharacteristicLimitExceeded =
      costInfo.limits.characteristics !== null && ability.characteristics.length > costInfo.limits.characteristics;
    context.abilityRestrictionTargets = restrictionTargets;
    context.abilityHasOverRankingCharacteristics = characteristics.some((entry) => Boolean(entry.overRanking));

    const categoryTags = categories
      .map((entry) => ({
        name: getCategoryTag(entry.category, localize),
        tooltip: getCategoryTooltip(entry.category, localize)
      }))
      .filter((entry) => entry.name);

    if (categoryTags.length) {
      const categoryTagNames = new Set(listCategoryTags(localize).map((tag) => tag.toLowerCase()));
      const tagMap = new Map<string, { name: string; tooltip: string }>(
        categoryTags.map((entry) => [String(entry.name ?? "").toLowerCase(), entry])
      );
      const merged: any[] = [];
      const seen = new Set<string>();

      for (const entry of (context.tagEntries as any[]) ?? []) {
        const key = String(entry.name ?? "").toLowerCase();
        if (!key || seen.has(key)) continue;
        if (categoryTagNames.has(key)) continue;
        merged.push(entry);
        seen.add(key);
      }

      for (const [key, categoryTag] of tagMap.entries()) {
        if (seen.has(key)) continue;
        merged.push({
          name: categoryTag.name,
          tooltip: categoryTag.tooltip,
          locked: true,
          isCategory: true
        });
        seen.add(key);
      }

      context.tagEntries = merged;
    }
  }

  return context;
};
