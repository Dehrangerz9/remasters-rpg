import { RollModifier } from "../../actor/config.js";
import { localize, normalizeBonusArray } from "../../global-functions/utils.js";
import { getAttributeLabel } from "../../actor/helpers.js";
import { openRollDialog } from "../rolls/dialog.js";
import { rollReikiSurge } from "../rolls/reiki.js";
import { rollDamageWithDialog } from "../rolls/damage.js";
import { rollSkillOrDerivedCheck } from "../rolls/check.js";

const ACTION_CREATE_MAP: Record<string, { tag: string; nameKey: string; cost: string }> = {
  attack: {
    tag: "ataque",
    nameKey: "RMRPG.Actor.Actions.NewAttack",
    cost: "1"
  },
  action: {
    tag: "acao",
    nameKey: "RMRPG.Actor.Actions.NewAction",
    cost: "1"
  },
  reaction: {
    tag: "reacao",
    nameKey: "RMRPG.Actor.Actions.NewReaction",
    cost: "reaction"
  }
};

export const bindPlayerActionListeners = (sheet: any, html: JQuery) => {
  const resolveTargetDc = () => {
    const targets = Array.from(game.user?.targets ?? []);
    const token: any = targets[0] ?? null;
    if (!token?.actor) return { dc: null, label: "" };
    const raw = Number(token.actor.system?.defense?.calculated ?? token.actor.system?.defense?.value);
    if (!Number.isFinite(raw)) return { dc: null, label: "" };
    const dc = Math.floor(raw);
    const targetLabel = String(token.actor?.name ?? token.name ?? "").trim();
    const defenseLabel = localize("RMRPG.Actor.Defense.Title");
    return {
      dc,
      label: targetLabel ? `${defenseLabel} ${targetLabel} ${dc}` : `${defenseLabel} ${dc}`
    };
  };

  html.find("[data-action='action-item-delete']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    await item.delete();
  });

  html.find("[data-action='action-item-draw']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    await item.update({ "system.status": "hand" });
  });

  html.find("[data-action='action-item-sheathe']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    await item.update({ "system.status": "stowed" });
  });

  html.find("[data-action='action-item-drop']").on("click", async (event: any) => {
    event.preventDefault();
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    const item = sheet.actor.items?.get(id);
    if (!item) return;
    await item.update({ "system.status": "dropped" });
  });

  html.find("[data-action='roll-attack']").on("click", async (event: any) => {
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const id = String(button.dataset.id ?? "");
    const isPra = String(button.dataset.pra ?? "") === "true";
    const damageFormula = String(button.dataset.damageFormula ?? "").trim();
    const item = id ? sheet.actor.items?.get(id) : null;
    const rankBonus = Number(sheet.actor.system.rank?.bonus ?? 0);
    const modifiers: RollModifier[] = [];

    if (item?.type === "weapon") {
      const hit = item.system?.weapon?.hit ?? {};
      const hitAttr = String(hit.attribute ?? "none");
      const hitAttrValue = hitAttr !== "none" ? Number(sheet.actor.system.attributes?.[hitAttr]?.value ?? 0) : 0;
      if (hitAttr !== "none") {
        modifiers.push({
          key: "attribute",
          name: getAttributeLabel(hitAttr),
          type: localize("RMRPG.Dialogs.Roll.Types.Attribute"),
          value: Math.floor(hitAttrValue),
          checked: true
        });
      }

      const hitBonuses = normalizeBonusArray(hit.bonuses);
      hitBonuses.forEach((bonus: any, index: number) => {
        const value = Number(bonus?.value ?? 0);
        const label = String(bonus?.label ?? "").trim();
        modifiers.push({
          key: `hit-bonus-${index}`,
          name: label || localize("RMRPG.Dialogs.Roll.BonusFallback", { index: index + 1 }),
          type: localize("RMRPG.Dialogs.Roll.Types.Untyped"),
          value: Math.floor(value),
          checked: value !== 0
        });
      });

      modifiers.push({
        key: "rank-bonus",
        name: localize("RMRPG.Actor.RankBonus"),
        type: localize("RMRPG.Dialogs.Roll.Types.Untyped"),
        value: Math.floor(rankBonus),
        checked: true
      });
    } else {
      const mod = Number(button.dataset.mod ?? 0);
      modifiers.push({
        key: "attack-mod",
        name: localize("RMRPG.Dialogs.Roll.AttackBonus"),
        type: localize("RMRPG.Dialogs.Roll.Types.Untyped"),
        value: Math.floor(mod),
        checked: true
      });
    }

    if (isPra) {
      modifiers.push({
        key: "pra",
        name: localize("RMRPG.Actor.Actions.PraPenalty"),
        type: localize("RMRPG.Dialogs.Roll.Types.Untyped"),
        value: -5,
        checked: true
      });
    }

    if (rankBonus !== 0) {
      modifiers.push({
        key: "reiki-surge",
        name: localize("RMRPG.Actor.Reiki.Surge"),
        type: localize("RMRPG.Dialogs.Roll.Types.State"),
        value: Math.floor(rankBonus),
        checked: false
      });
    }

    const title = localize("RMRPG.Dialogs.Roll.Title", {
      label: item?.name ?? localize("RMRPG.Actor.Actions.Attacks")
    });
    const result = await openRollDialog(title, modifiers);
    if (!result) return;

    const targetDc = resolveTargetDc();
    const breakdownTags = result.modifiers
      .filter((modifier) => modifier.checked)
      .map((modifier) => {
        const value = Math.floor(Number(modifier.value ?? 0));
        return `${modifier.name} ${value >= 0 ? `+${value}` : `${value}`}`;
      });
    if (targetDc.label) {
      breakdownTags.push(targetDc.label);
    }

    await rollSkillOrDerivedCheck({
      actor: sheet.actor,
      label: item ? `${item.name}` : localize("RMRPG.Actor.Actions.Attacks"),
      totalModifier: result.total,
      dc: targetDc.dc,
      breakdownTags,
      damageButton:
        damageFormula && damageFormula !== "0"
          ? {
              formula: damageFormula,
              itemName: String(item?.name ?? ""),
              itemId: String(item?.id ?? "")
            }
          : null
    });

    if (result.modifiers.some((modifier) => modifier.key === "reiki-surge" && modifier.checked)) {
      await rollReikiSurge(sheet);
    }
  });

  html.find("[data-action='roll-damage']").on("click", async (event: any) => {
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    const id = String(button.dataset.id ?? "");
    const formula = String(button.dataset.formula ?? "").trim();
    const multiplier = Number(button.dataset.damageMultiplier ?? 1);
    if (!formula) return;
    const item = id ? sheet.actor.items?.get(id) : null;
    await rollDamageWithDialog({
      actor: sheet.actor,
      item,
      fallbackFormula: formula,
      itemName: String(item?.name ?? ""),
      sourceLabel: item ? `${item.name}` : localize("RMRPG.Actor.Actions.Damage"),
      criticalMultiplier: Number.isFinite(multiplier) ? multiplier : 1
    });
  });

  html.find("[data-action='action-item-add']").on("click", async (event: any) => {
    event.preventDefault();
    if (sheet.actor.type !== "player") return;
    const group = String(event.currentTarget.dataset.group ?? "");
    const config = ACTION_CREATE_MAP[group];
    if (!config) return;

    const itemData: Record<string, any> = {
      name: localize(config.nameKey),
      type: "acao",
      system: {
        action: {
          cost: config.cost
        }
      }
    };

    if (config.tag && config.tag !== "acao") {
      itemData.system.tags = [config.tag];
    }

    const created = await sheet.actor.createEmbeddedDocuments("Item", [itemData]);
    const item = created?.[0];
    if (item) {
      item.sheet?.render(true);
    }
  });
};
