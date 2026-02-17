import { MAX_PROTAGONISM_POINTS } from "../../actor/config.js";
import { clampInteger } from "../../global-functions/utils.js";
export const applyPlayerReikiContext = (context) => {
    const reikiMax = Math.max(0, Math.floor(Number(context.system.player?.reiki?.max ?? 0)));
    const reikiCurrent = Math.max(0, Math.floor(Number(context.system.player?.reiki?.current ?? 0)));
    const reikiClamped = Math.min(reikiCurrent, reikiMax);
    context.reikiMax = reikiMax;
    context.reikiCurrent = reikiClamped;
    context.reikiPercent = reikiMax > 0 ? Math.max(0, Math.min(100, (reikiClamped / reikiMax) * 100)) : 0;
    const protagonismPoints = clampInteger(Number(context.system.player?.protagonismPoints ?? 1), 0, MAX_PROTAGONISM_POINTS);
    context.protagonismPoints = protagonismPoints;
    context.protagonismSlots = Array.from({ length: MAX_PROTAGONISM_POINTS }, (_, index) => {
        const value = index + 1;
        return {
            value,
            active: value <= protagonismPoints
        };
    });
};
