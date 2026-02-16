export class RMRPGItem extends Item {
  get chatData() {
    const description = TextEditor.enrichHTML(this.system.description || "", {
      async: false
    });

    return {
      description
    };
  }
}
