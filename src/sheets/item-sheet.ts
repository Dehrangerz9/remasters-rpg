import { SYSTEM_ID } from "../constants.js";
import { MAJOR_TAGS } from "../data/major-tags.js";

const MAJOR_TAG_MAP = new Map(MAJOR_TAGS.map((tag) => [tag.name.toLowerCase(), tag.tooltip]));
const MAX_TAG_SUGGESTIONS = 8;

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
      const bonuses = this.normalizeBonusArray(this.item.system?.weapon?.hit?.bonuses).map((bonus) => ({ ...bonus }));
      bonuses.push({ label: "", value: 0 });
      await this.item.update({ "system.weapon.hit.bonuses": bonuses });
    });

    html.find("[data-action='weapon-hit-bonus-remove']").on("click", async (event: any) => {
      event.preventDefault();
      const index = Number(event.currentTarget.dataset.index);
      if (!Number.isFinite(index) || index < 0) return;
      await this._onSubmit(event, { preventClose: true, preventRender: true });
      const bonuses = this.normalizeBonusArray(this.item.system?.weapon?.hit?.bonuses).map((bonus) => ({ ...bonus }));
      if (index >= bonuses.length) return;
      bonuses.splice(index, 1);
      await this.item.update({ "system.weapon.hit.bonuses": bonuses });
    });

    html.find("[data-action='weapon-damage-bonus-add']").on("click", async (event: any) => {
      event.preventDefault();
      await this._onSubmit(event, { preventClose: true, preventRender: true });
      const bonuses = this.normalizeBonusArray(this.item.system?.weapon?.damage?.bonuses).map((bonus) => ({ ...bonus }));
      bonuses.push({ formula: "", type: "physical" });
      await this.item.update({ "system.weapon.damage.bonuses": bonuses });
    });

    html.find("[data-action='weapon-damage-bonus-remove']").on("click", async (event: any) => {
      event.preventDefault();
      const index = Number(event.currentTarget.dataset.index);
      if (!Number.isFinite(index) || index < 0) return;
      await this._onSubmit(event, { preventClose: true, preventRender: true });
      const bonuses = this.normalizeBonusArray(this.item.system?.weapon?.damage?.bonuses).map((bonus) => ({ ...bonus }));
      if (index >= bonuses.length) return;
      bonuses.splice(index, 1);
      await this.item.update({ "system.weapon.damage.bonuses": bonuses });
    });

    this.setupTagSystem(html);
  }

  protected async _updateObject(event: Event, formData: Record<string, any>) {
    const expanded = foundry.utils.expandObject(formData);
    const weapon = expanded?.system?.weapon;
    if (weapon?.hit?.bonuses && !Array.isArray(weapon.hit.bonuses)) {
      weapon.hit.bonuses = this.normalizeBonusArray(weapon.hit.bonuses);
    }
    if (weapon?.damage?.bonuses && !Array.isArray(weapon.damage.bonuses)) {
      weapon.damage.bonuses = this.normalizeBonusArray(weapon.damage.bonuses);
    }
    return super._updateObject(event, expanded);
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
    context.isAction = context.item.type === "acao";
    context.isEquipment = ["weapon", "consumable", "misc", "item"].includes(context.item.type);

    const typeTagName = String(context.item.type ?? "").trim();
    const rawTags = Array.isArray(context.system.tags) ? context.system.tags : [];
    const normalizedTags = rawTags
      .map((entry: any) => {
        if (typeof entry === "string") {
          return { name: entry, tooltip: "" };
        }
        return {
          name: String(entry?.name ?? ""),
          tooltip: String(entry?.tooltip ?? "")
        };
      })
      .map((entry: { name: string; tooltip: string }) => ({
        name: String(entry.name ?? "").trim(),
        tooltip: String(entry.tooltip ?? "").trim()
      }))
      .filter((entry) => entry.name)
      .filter((entry) => entry.name.toLowerCase() !== typeTagName.toLowerCase());

    const seenTags = new Set<string>();
    const dedupedTags = normalizedTags.filter((entry) => {
      const key = entry.name.toLowerCase();
      if (seenTags.has(key)) return false;
      seenTags.add(key);
      return true;
    });

    context.typeTag = {
      name: typeTagName,
      tooltip: MAJOR_TAG_MAP.get(typeTagName.toLowerCase()) ?? ""
    };
    context.tagEntries = dedupedTags.map((entry) => ({
      name: entry.name,
      tooltip: entry.tooltip || MAJOR_TAG_MAP.get(entry.name.toLowerCase()) || ""
    }));
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
        bonuses: this.normalizeBonusArray(rawHit.bonuses)
      },
      damage: {
        attribute: rawDamage.attribute ?? "none",
        base: {
          dice: Number(rawDamage.base?.dice ?? 1),
          die: String(rawDamage.base?.die ?? "d6"),
          type: String(rawDamage.base?.type ?? "physical")
        },
        bonuses: this.normalizeBonusArray(rawDamage.bonuses)
      }
    };
    return context;
  }

  private setupTagSystem(html: JQuery) {
    const tagRoot = html.find(".item-header-tags");
    if (!tagRoot.length) return;

    const addButton = tagRoot.find("[data-action='tag-add']");
    const editor = tagRoot.find(".tag-editor");
    const input = editor.find(".tag-input");
    const suggestions = editor.find(".tag-suggestions");

    if (!addButton.length || !editor.length || !input.length || !suggestions.length) return;

    const normalizeName = (value: unknown) => String(value ?? "").trim();
    const getTooltip = (name: string) => MAJOR_TAG_MAP.get(name.toLowerCase()) ?? "";

    const readTags = () => {
      const raw = Array.isArray(this.item.system?.tags) ? this.item.system.tags : [];
      const normalized = raw
        .map((entry: any) => {
          if (typeof entry === "string") {
            return { name: entry, tooltip: "" };
          }
          return {
            name: String(entry?.name ?? ""),
            tooltip: String(entry?.tooltip ?? "")
          };
        })
        .map((entry: { name: string; tooltip: string }) => ({
          name: normalizeName(entry.name),
          tooltip: normalizeName(entry.tooltip)
        }))
        .filter((entry) => entry.name)
        .filter((entry) => entry.name.toLowerCase() !== String(this.item.type ?? "").toLowerCase());

      const seen = new Set<string>();
      return normalized.filter((entry) => {
        const key = entry.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const getEditIndex = () => {
      const raw = editor.attr("data-edit-index");
      if (!raw) return null;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const showEditor = (value = "", editIndex: number | null = null) => {
      editor.addClass("is-active");
      addButton.addClass("is-hidden");
      if (editIndex === null) {
        editor.removeAttr("data-edit-index");
      } else {
        editor.attr("data-edit-index", String(editIndex));
      }
      input.val(value);
      input.trigger("focus");
      renderSuggestions(String(value ?? ""));
    };

    const hideEditor = () => {
      editor.removeClass("is-active");
      addButton.removeClass("is-hidden");
      editor.removeAttr("data-edit-index");
      input.val("");
      suggestions.empty().removeClass("is-visible");
    };

    const updateTags = async (event: Event | null, next: { name: string; tooltip: string }[]) => {
      if (event) {
        await this._onSubmit(event, { preventClose: true, preventRender: true });
      }
      await this.item.update({ "system.tags": next });
    };

    const commitTag = async (event: Event | null, rawValue: string) => {
      const name = normalizeName(rawValue);
      if (!name) {
        hideEditor();
        return;
      }

      const lower = name.toLowerCase();
      const typeLower = String(this.item.type ?? "").toLowerCase();
      if (lower === typeLower) {
        hideEditor();
        return;
      }

      const current = readTags();
      const editIndex = getEditIndex();
      const duplicateIndex = current.findIndex((tag) => tag.name.toLowerCase() === lower);
      if (duplicateIndex !== -1 && duplicateIndex !== editIndex) {
        hideEditor();
        return;
      }

      const tooltip = getTooltip(name) || (editIndex !== null ? current[editIndex]?.tooltip ?? "" : "");
      const next = [...current];

      if (editIndex !== null) {
        if (editIndex < 0 || editIndex >= next.length) {
          hideEditor();
          return;
        }
        next[editIndex] = { name, tooltip };
      } else if (duplicateIndex === -1) {
        next.push({ name, tooltip });
      }

      await updateTags(event, next);
      hideEditor();
    };

    const renderSuggestions = (rawQuery: string) => {
      const query = normalizeName(rawQuery).toLowerCase();
      suggestions.empty();

      if (!query) {
        suggestions.removeClass("is-visible");
        return;
      }

      const matches = MAJOR_TAGS.filter((tag) => tag.name.toLowerCase().includes(query)).slice(0, MAX_TAG_SUGGESTIONS);
      if (!matches.length) {
        suggestions.removeClass("is-visible");
        return;
      }

      for (const tag of matches) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tag-suggestion";
        button.dataset.name = tag.name;

        const nameSpan = document.createElement("span");
        nameSpan.className = "tag-suggestion-name";
        nameSpan.textContent = tag.name;

        const tipSpan = document.createElement("span");
        tipSpan.className = "tag-suggestion-tip";
        tipSpan.textContent = tag.tooltip;

        button.append(nameSpan, tipSpan);
        suggestions.append(button);
      }

      suggestions.addClass("is-visible");
    };

    addButton.on("click", (event) => {
      event.preventDefault();
      showEditor();
    });

    tagRoot.find("[data-action='tag-remove']").on("click", async (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      const index = Number(event.currentTarget.dataset.index);
      if (!Number.isFinite(index) || index < 0) return;
      const current = readTags();
      if (index >= current.length) return;
      current.splice(index, 1);
      await updateTags(event, current);
    });

    tagRoot.find(".tag-pill[data-index]").on("dblclick", (event: any) => {
      const target = event.target as HTMLElement;
      if (target.closest(".tag-remove")) return;
      event.preventDefault();
      const index = Number(event.currentTarget.dataset.index);
      if (!Number.isFinite(index) || index < 0) return;
      const current = readTags();
      const tag = current[index];
      if (!tag) return;
      showEditor(tag.name, index);
    });

    input.on("keydown", async (event: any) => {
      if (event.key === "Enter") {
        event.preventDefault();
        await commitTag(event, String(input.val() ?? ""));
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        hideEditor();
      }
    });

    input.on("input", (event: any) => {
      renderSuggestions(String(event.currentTarget.value ?? ""));
    });

    input.on("focus", (event: any) => {
      renderSuggestions(String(event.currentTarget.value ?? ""));
    });

    suggestions.on("mousedown", (event: any) => {
      event.preventDefault();
    });

    suggestions.on("click", ".tag-suggestion", async (event: any) => {
      event.preventDefault();
      const name = String(event.currentTarget.dataset.name ?? "");
      if (!name) return;
      await commitTag(event, name);
    });

    editor.on("focusout", () => {
      const editorEl = editor.get(0);
      window.setTimeout(() => {
        if (!editorEl) return;
        if (editorEl.contains(document.activeElement)) return;
        hideEditor();
      }, 0);
    });
  }

  private normalizeBonusArray(bonuses: unknown) {
    if (Array.isArray(bonuses)) return bonuses;
    if (bonuses && typeof bonuses === "object") {
      return Object.values(bonuses as Record<string, any>);
    }
    return [];
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
