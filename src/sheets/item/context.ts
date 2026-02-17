import { clampInteger, normalizeBonusArray } from "../global-functions/utils.js";
import {
  buildAbilityOptions,
  calculateAbilityCost,
  collectAbilityModifiers,
  describeCharacteristicLimits,
  describeEnhancement,
  getCategoryLabel,
  getCategoryTooltip,
  normalizeAbilityData
} from "../../abilities/rules.js";
import { buildTagContext } from "./tags.js";

export const buildItemContext = async (sheet: any, context: any) => {
  context.system = context.item.system;
  context.isWeapon = context.item.type === "weapon";
  context.isAbility = context.item.type === "ability";
  context.isAbilityCategory = context.item.type === "ability-category";
  context.isFeat = context.item.type === "feat";
  context.isAction = context.item.type === "acao";
  context.isEquipment = ["weapon", "consumable", "misc", "item"].includes(context.item.type);

  const tagContext = buildTagContext(context.item, context.system);
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
    const modifiers = collectAbilityModifiers(ability.enhancements);
    const costInfo = calculateAbilityCost(ability);

    const characteristicLabels = new Map(abilityOptions.characteristics.map((entry) => [entry.value, entry.label]));

    const categories = ability.categories.map((entry) => {
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
      const limits = describeCharacteristicLimits(entry.id, modifiers);
      return {
        ...entry,
        level: clampInteger(Number(entry.level ?? limits.min), limits.min, limits.max),
        min: limits.min,
        max: limits.max
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
      ...ability,
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
    context.abilityCharacteristicOptions = abilityOptions.characteristics;
    context.abilityEnhancementOptions = abilityOptions.enhancements;
    context.abilityCategoryLimit = costInfo.limits.categories;
    context.abilityCategoriesMaxed =
      costInfo.limits.categories !== null && ability.categories.length >= costInfo.limits.categories;
    context.abilityRestrictionTargets = restrictionTargets;
  }

  return context;
};
