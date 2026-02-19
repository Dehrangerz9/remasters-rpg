const ABILITY_DEFAULT_IMG = "systems/remasters-rpg/assets/icons/spiky-explosion.png";

export class RMRPGItem extends Item {
  protected async _preCreate(data: any, options: any, user: any) {
    await super._preCreate(data, options, user);

    const itemType = String(data?.type ?? this.type ?? "");
    if (itemType !== "ability") return;

    const currentImg = String(data?.img ?? this.img ?? "").trim();
    if (currentImg && currentImg !== "icons/svg/item-bag.svg") return;

    this.updateSource({ img: ABILITY_DEFAULT_IMG });
  }

  get chatData() {
    const description = TextEditor.enrichHTML(this.system.description || "", {
      async: false
    });

    return {
      description
    };
  }
}
