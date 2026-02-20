import { toPlainText } from "../item-summary.js";
export const applyPlayerFeatsContext = (context) => {
    const feats = context.actor.items?.filter((item) => item.type === "feat") ?? [];
    context.feats = feats.map((item) => ({
        id: item.id,
        name: item.name,
        img: item.img,
        requirements: String(item.system?.requirements ?? ""),
        requirementsText: toPlainText(item.system?.requirements ?? ""),
        rank: item.system?.rank ?? "",
        description: String(item.system?.description ?? ""),
        descriptionText: toPlainText(item.system?.description ?? "")
    }));
};
