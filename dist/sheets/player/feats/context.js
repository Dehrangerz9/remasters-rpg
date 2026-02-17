export const applyPlayerFeatsContext = (context) => {
    const feats = context.actor.items?.filter((item) => item.type === "feat") ?? [];
    context.feats = feats.map((item) => ({
        id: item.id,
        name: item.name,
        img: item.img,
        requirements: item.system?.requirements ?? "",
        rank: item.system?.rank ?? "",
        description: item.system?.description ?? ""
    }));
};
