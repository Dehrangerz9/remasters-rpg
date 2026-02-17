import { ATTRIBUTE_CONFIG } from "./config.js";
import { localize } from "../global-functions/utils.js";
export const getAttributeLabel = (attributeKey) => {
    const match = ATTRIBUTE_CONFIG.find((attribute) => attribute.key === attributeKey);
    return match ? localize(match.labelKey) : attributeKey;
};
