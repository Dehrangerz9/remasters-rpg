export class RMRPGActor extends Actor {
  async rollAttribute(attributeKey: string) {
    const value = Number(this.system.attributes?.[attributeKey]?.value ?? 0);
    const roll = await new Roll("1d20 + @value", { value }).roll({ async: true });

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${this.name} rolls ${attributeKey}`
    });

    return roll;
  }
}
