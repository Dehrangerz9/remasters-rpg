import { localize } from "../../global-functions/utils.js";
import { SYSTEM_ID } from "../../../constants.js";
const OUTCOME_LEVELS = ["critical-failure", "failure", "success", "critical-success"];
const OUTCOME_TO_LEVEL = new Map(OUTCOME_LEVELS.map((outcome, index) => [outcome, index]));
const OUTCOME_LABEL_KEY = {
    "critical-success": "RMRPG.Dialogs.Roll.Outcomes.CriticalSuccess",
    success: "RMRPG.Dialogs.Roll.Outcomes.Success",
    failure: "RMRPG.Dialogs.Roll.Outcomes.Failure",
    "critical-failure": "RMRPG.Dialogs.Roll.Outcomes.CriticalFailure"
};
const clampOutcomeLevel = (value) => {
    if (!Number.isFinite(value))
        return 0;
    return Math.max(0, Math.min(OUTCOME_LEVELS.length - 1, Math.floor(value)));
};
const toStepValue = (value) => {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed))
        return 0;
    return Math.max(0, Math.floor(parsed));
};
const normalizeOptionalDc = (value) => {
    if (value === null || value === undefined)
        return null;
    if (typeof value === "string" && value.trim() === "")
        return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.floor(parsed) : null;
};
const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const formatSigned = (value) => (value >= 0 ? `+${value}` : `${value}`);
const extractNaturalD20 = (roll) => {
    const d20 = Array.isArray(roll?.dice) ? roll.dice.find((die) => Number(die?.faces) === 20) : null;
    if (!d20)
        return null;
    const activeResult = Array.isArray(d20.results) ? d20.results.find((entry) => entry?.active !== false) : null;
    const value = Number(activeResult?.result ?? d20.total);
    return Number.isFinite(value) ? Math.floor(value) : null;
};
const resolveBaseOutcome = (total, dc, naturalD20) => {
    if (naturalD20 === 1)
        return "critical-failure";
    if (naturalD20 === 20 || total >= dc + 5)
        return "critical-success";
    if (total >= dc)
        return "success";
    return "failure";
};
const applyOutcomeSteps = (base, passosDeSucessos, passosDeFalha, naturalD20) => {
    // Natural 1 and natural 20 always lock the extreme result.
    if (naturalD20 === 1 || naturalD20 === 20)
        return base;
    const baseLevel = OUTCOME_TO_LEVEL.get(base) ?? 0;
    const shiftedLevel = clampOutcomeLevel(baseLevel + passosDeSucessos - passosDeFalha);
    return OUTCOME_LEVELS[shiftedLevel];
};
const buildFormulaLabel = (totalModifier) => {
    if (totalModifier === 0)
        return "1d20";
    return `1d20 ${totalModifier > 0 ? "+" : "-"} ${Math.abs(totalModifier)}`;
};
const getDiceRows = (roll) => {
    const rows = [];
    const dice = Array.isArray(roll?.dice) ? roll.dice : [];
    for (const die of dice) {
        const faces = Number(die?.faces ?? 0);
        if (!Number.isFinite(faces) || faces <= 0)
            continue;
        const values = Array.isArray(die?.results)
            ? die.results
                .filter((entry) => entry?.active !== false)
                .map((entry) => Number(entry?.result))
                .filter((value) => Number.isFinite(value))
                .map((value) => Math.floor(value))
            : [];
        rows.push({
            formula: `${Math.max(1, values.length)}d${faces}`,
            values,
            total: Number.isFinite(Number(die?.total)) ? Math.floor(Number(die.total)) : values.reduce((sum, value) => sum + value, 0)
        });
    }
    return rows;
};
const buildCheckChatContent = (params) => {
    const { actor, label, rollTotal, totalModifier, roll, outcome, dc, targetInfoLabel, breakdownTags, damageButton } = params;
    const actorName = String(actor?.name ?? "-");
    const actorImg = String(actor?.img ?? "icons/svg/mystery-man.svg");
    const createdBy = String(game.user?.name ?? "-");
    const formulaLabel = buildFormulaLabel(totalModifier);
    const diceRows = getDiceRows(roll);
    const safeTags = breakdownTags.map((entry) => String(entry ?? "").trim()).filter(Boolean);
    const tagsMarkup = safeTags.length
        ? safeTags.map((tag) => `<span class="rmrpg-check-tag">${escapeHtml(tag)}</span>`).join("")
        : `<span class="rmrpg-check-tag rmrpg-check-tag-muted">${escapeHtml(localize("RMRPG.Dialogs.Roll.Value"))} ${formatSigned(totalModifier)}</span>`;
    const diceMarkup = diceRows.length
        ? diceRows
            .map((row) => {
            const valueMarkup = row.values.length
                ? row.values.map((value) => `<span class="rmrpg-check-die">${value}</span>`).join("")
                : `<span class="rmrpg-check-die">-</span>`;
            return `
            <div class="rmrpg-check-dice-row">
              <span class="rmrpg-check-dice-formula">${escapeHtml(row.formula)}</span>
              <span class="rmrpg-check-dice-values">${valueMarkup}</span>
              <span class="rmrpg-check-dice-total">${row.total}</span>
            </div>
          `;
        })
            .join("")
        : `
      <div class="rmrpg-check-dice-row">
        <span class="rmrpg-check-dice-formula">${escapeHtml(formulaLabel)}</span>
        <span class="rmrpg-check-dice-values"><span class="rmrpg-check-die">-</span></span>
        <span class="rmrpg-check-dice-total">${rollTotal}</span>
      </div>
    `;
    const hideTargetInfoAsSecret = (() => {
        try {
            return Boolean(game.settings?.get?.(SYSTEM_ID, "gmSecretTargetInfo"));
        }
        catch (_error) {
            return false;
        }
    })();
    const outcomeMarkup = dc !== null && outcome
        ? `
        <div class="rmrpg-check-outcome ${outcome === "success" || outcome === "critical-success" ? "is-success" : "is-failure"}">
          <span class="rmrpg-check-outcome-value">${escapeHtml(localize(OUTCOME_LABEL_KEY[outcome]))}</span>
          ${hideTargetInfoAsSecret && targetInfoLabel
            ? `<section class="secret rmrpg-check-outcome-secret"><span class="rmrpg-check-outcome-dc">(${escapeHtml(targetInfoLabel)})</span></section>`
            : `<span class="rmrpg-check-outcome-dc">(${escapeHtml(targetInfoLabel || `DC ${dc}`)})</span>`}
        </div>
      `
        : "";
    const damageButtonMarkup = damageButton && String(damageButton.formula ?? "").trim()
        ? `
        <div class="rmrpg-check-actions">
          <button
            type="button"
            class="rmrpg-check-damage-btn"
            data-action="check-roll-damage"
            data-formula="${escapeHtml(damageButton.formula)}"
            data-actor-id="${escapeHtml(String(actor?.id ?? ""))}"
            data-item-name="${escapeHtml(String(damageButton.itemName ?? ""))}"
            data-item-id="${escapeHtml(String(damageButton.itemId ?? ""))}"
          >
            ${escapeHtml(localize("RMRPG.Actor.Actions.Damage"))}
          </button>
        </div>
      `
        : "";
    return `
    <article class="rmrpg-check-card">
      <header class="rmrpg-check-header">
        <img class="rmrpg-check-avatar" src="${escapeHtml(actorImg)}" alt="${escapeHtml(actorName)}" />
        <div class="rmrpg-check-meta">
          <div class="rmrpg-check-name">${escapeHtml(actorName)}</div>
          <div class="rmrpg-check-user">${escapeHtml(createdBy)}</div>
        </div>
      </header>
      <h3 class="rmrpg-check-title">${escapeHtml(label)}</h3>
      ${outcomeMarkup}
      <div class="rmrpg-check-divider"></div>
      <div class="rmrpg-check-tags">${tagsMarkup}</div>
      <details class="rmrpg-check-breakdown">
        <summary class="rmrpg-check-formula">
          <span class="rmrpg-check-formula-text">${escapeHtml(formulaLabel)}</span>
        </summary>
        <div class="rmrpg-check-dice-list">${diceMarkup}</div>
      </details>
      <div class="rmrpg-check-total">${rollTotal}</div>
      ${damageButtonMarkup}
    </article>
  `;
};
export const rollSkillOrDerivedCheck = async ({ actor, label, totalModifier, dc = null, targetInfoLabel = "", passosDeSucessos = 0, passosDeFalha = 0, breakdownTags = [], damageButton = null }) => {
    const total = Number.isFinite(Number(totalModifier)) ? Math.floor(Number(totalModifier)) : 0;
    const roll = await new Roll("1d20 + @total", { total }).evaluate();
    const rollTotal = Math.floor(Number(roll.total ?? 0));
    const naturalD20 = extractNaturalD20(roll);
    const normalizedDc = normalizeOptionalDc(dc);
    const successSteps = toStepValue(passosDeSucessos);
    const failureSteps = toStepValue(passosDeFalha);
    let outcome = null;
    if (normalizedDc !== null) {
        const baseOutcome = resolveBaseOutcome(rollTotal, normalizedDc, naturalD20);
        outcome = applyOutcomeSteps(baseOutcome, successSteps, failureSteps, naturalD20);
    }
    const content = buildCheckChatContent({
        actor,
        label,
        rollTotal,
        totalModifier: total,
        roll,
        outcome,
        dc: normalizedDc,
        naturalD20,
        targetInfoLabel: String(targetInfoLabel ?? "").trim(),
        breakdownTags,
        damageButton
    });
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content
    });
    return {
        roll,
        total: rollTotal,
        dc: normalizedDc,
        naturalD20,
        outcome
    };
};
