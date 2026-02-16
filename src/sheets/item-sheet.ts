import { SYSTEM_ID } from "../constants.js";

export class RMRPGItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["rmrpg", "sheet", "item"],
      width: 620,
      height: 620,
      tabs: [
        {
          navSelector: ".weapon-tabs",
          contentSelector: ".weapon-tab-content",
          initial: "description"
        }
      ]
    });
  }

  render(force = false, options = {}) {
    this.applyThemeClass();
    return super.render(force, options);
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html);
    this.applyThemeClass();

    html.find("[data-action='weapon-hit-bonus-add']").on("click", async (event: any) => {
      event.preventDefault();
      await this._onSubmit(event, { preventClose: true, preventRender: true });
      const bonuses = Array.isArray(this.item.system?.weapon?.hit?.bonuses)
        ? [...this.item.system.weapon.hit.bonuses]
        : [];
      bonuses.push({ label: "", value: 0 });
      await this.item.update({ "system.weapon.hit.bonuses": bonuses });
    });

    html.find("[data-action='weapon-hit-bonus-remove']").on("click", async (event: any) => {
      event.preventDefault();
      const index = Number(event.currentTarget.dataset.index);
      if (!Number.isFinite(index) || index < 0) return;
      await this._onSubmit(event, { preventClose: true, preventRender: true });
      const bonuses = Array.isArray(this.item.system?.weapon?.hit?.bonuses)
        ? [...this.item.system.weapon.hit.bonuses]
        : [];
      if (index >= bonuses.length) return;
      bonuses.splice(index, 1);
      await this.item.update({ "system.weapon.hit.bonuses": bonuses });
    });

    html.find("[data-action='weapon-damage-bonus-add']").on("click", async (event: any) => {
      event.preventDefault();
      await this._onSubmit(event, { preventClose: true, preventRender: true });
      const bonuses = Array.isArray(this.item.system?.weapon?.damage?.bonuses)
        ? [...this.item.system.weapon.damage.bonuses]
        : [];
      bonuses.push({ formula: "", type: "physical" });
      await this.item.update({ "system.weapon.damage.bonuses": bonuses });
    });

    html.find("[data-action='weapon-damage-bonus-remove']").on("click", async (event: any) => {
      event.preventDefault();
      const index = Number(event.currentTarget.dataset.index);
      if (!Number.isFinite(index) || index < 0) return;
      await this._onSubmit(event, { preventClose: true, preventRender: true });
      const bonuses = Array.isArray(this.item.system?.weapon?.damage?.bonuses)
        ? [...this.item.system.weapon.damage.bonuses]
        : [];
      if (index >= bonuses.length) return;
      bonuses.splice(index, 1);
      await this.item.update({ "system.weapon.damage.bonuses": bonuses });
    });
  }

  get template() {
    return `systems/${SYSTEM_ID}/templates/items/item-sheet.hbs`;
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    context.system = context.item.system;
    context.isWeapon = context.item.type === "weapon";
    context.isAbility = context.item.type === "ability";
    context.isFeat = context.item.type === "feat";
    context.isEquipment = ["weapon", "mystic", "consumable", "misc", "item"].includes(context.item.type);
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
        bonuses: Array.isArray(rawHit.bonuses) ? rawHit.bonuses : []
      },
      damage: {
        attribute: rawDamage.attribute ?? "none",
        base: {
          dice: Number(rawDamage.base?.dice ?? 1),
          die: String(rawDamage.base?.die ?? "d6"),
          type: String(rawDamage.base?.type ?? "physical")
        },
        bonuses: Array.isArray(rawDamage.bonuses) ? rawDamage.bonuses : []
      }
    };
    return context;
  }

  private applyThemeClass() {
    const enabled = game.settings.get(SYSTEM_ID, "punkCityTheme");
    document.body?.classList.toggle("punk-city", Boolean(enabled));
    const classes = new Set(this.options.classes ?? []);
    if (enabled) {
      classes.add("punk-city");
    } else {
      classes.delete("punk-city");
    }
    this.options.classes = Array.from(classes);
    this.element?.toggleClass("punk-city", enabled);
  }
}
