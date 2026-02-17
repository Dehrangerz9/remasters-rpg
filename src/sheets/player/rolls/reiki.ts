import { localize } from "../../global-functions/utils.js";

export const rollReikiSurge = async (sheet: any) => {
  const roll = await new Roll("1d6").evaluate();
  const total = Number(roll.total ?? 0);
  const speaker = ChatMessage.getSpeaker({ actor: sheet.actor });

  await roll.toMessage({
    speaker,
    flavor: localize("RMRPG.Actor.Player.ReikiRoll")
  });

  const reikiData = sheet.actor.system.player?.reiki ?? {};
  const current = Math.max(0, Math.floor(Number(reikiData.current ?? 0)));
  const max = Math.max(0, Math.floor(Number(reikiData.max ?? 0)));

  let next = current;
  let messageKey = "RMRPG.Chat.ReikiNoLoss";
  if (total < 3) {
    next = Math.max(0, current - 1);
    messageKey = "RMRPG.Chat.ReikiLoss";
  }

  if (sheet.actor.type === "player") {
    await sheet.actor.update({ "system.player.reiki.current": Math.min(next, max) });
  }

  await ChatMessage.create({
    speaker,
    content: localize(messageKey, { name: sheet.actor.name, total })
  });
};
