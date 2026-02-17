import { formatSigned, localize, sumModifiers } from "../../global-functions/utils.js";
export const openRollDialog = async (title, modifiers, allowCustom = true) => {
    const rollLabel = localize("RMRPG.Common.Roll");
    const typeOptions = [
        localize("RMRPG.Dialogs.Roll.Types.Attribute"),
        localize("RMRPG.Dialogs.Roll.Types.State"),
        localize("RMRPG.Dialogs.Roll.Types.Skill"),
        localize("RMRPG.Dialogs.Roll.Types.Situational"),
        localize("RMRPG.Dialogs.Roll.Types.Untyped")
    ];
    const state = modifiers.map((modifier) => ({
        ...modifier,
        value: Math.floor(Number(modifier.value) || 0),
        checked: Boolean(modifier.checked)
    }));
    const renderRows = () => state
        .map((modifier, index) => {
        const valueLabel = formatSigned(modifier.value);
        return `
            <tr>
              <td>${modifier.name}</td>
              <td>${modifier.type}</td>
              <td>${valueLabel}</td>
              <td><input type="checkbox" class="modifier-toggle" data-index="${index}" ${modifier.checked ? "checked" : ""} /></td>
            </tr>
          `;
    })
        .join("");
    const typeOptionsHtml = typeOptions.map((option) => `<option value="${option}">${option}</option>`).join("");
    const content = `
      <div class="rmrpg-roll-dialog">
        <table class="rmrpg-roll-table">
          <thead>
            <tr>
              <th>${localize("RMRPG.Dialogs.Roll.Modifier")}</th>
              <th>${localize("RMRPG.Dialogs.Roll.Type")}</th>
              <th>${localize("RMRPG.Dialogs.Roll.Value")}</th>
              <th>${localize("RMRPG.Dialogs.Roll.Include")}</th>
            </tr>
          </thead>
          <tbody id="modifier-table">
            ${renderRows()}
          </tbody>
        </table>
        ${allowCustom
        ? `
          <div class="rmrpg-roll-custom">
            <input type="text" data-role="modifier-name" placeholder="${localize("RMRPG.Dialogs.Roll.ModifierPlaceholder")}" />
            <input type="number" data-role="modifier-value" placeholder="1" />
            <select data-role="modifier-type">
              ${typeOptionsHtml}
            </select>
            <button type="button" data-role="modifier-add">${localize("RMRPG.Dialogs.Roll.Add")}</button>
          </div>
        `
        : ""}
      </div>
    `;
    return new Promise((resolve) => {
        let resolved = false;
        const updateRollLabel = (html) => {
            const total = sumModifiers(state);
            const label = `${rollLabel} (${formatSigned(total)})`;
            html.closest(".dialog").find(".dialog-button.roll").html(label);
        };
        const bindToggleEvents = (html) => {
            html.find(".modifier-toggle").on("change", (event) => {
                const index = Number(event.currentTarget.dataset.index);
                if (!Number.isFinite(index) || index < 0 || index >= state.length)
                    return;
                state[index].checked = Boolean(event.currentTarget.checked);
                updateRollLabel(html);
            });
        };
        const syncTable = (html) => {
            html.find("#modifier-table").html(renderRows());
            bindToggleEvents(html);
            updateRollLabel(html);
        };
        new Dialog({
            title,
            content,
            buttons: {
                cancel: {
                    icon: "<i class='fas fa-times'></i>",
                    label: game.i18n.localize("Cancel"),
                    callback: () => {
                        resolved = true;
                        resolve(null);
                    }
                },
                roll: {
                    icon: "<i class='fas fa-dice-d20'></i>",
                    label: rollLabel,
                    callback: () => {
                        resolved = true;
                        resolve({
                            total: sumModifiers(state),
                            modifiers: state.map((modifier) => ({ ...modifier }))
                        });
                    }
                }
            },
            default: "roll",
            render: (html) => {
                syncTable(html);
                if (!allowCustom)
                    return;
                const nameInput = html.find("[data-role='modifier-name']");
                const valueInput = html.find("[data-role='modifier-value']");
                const typeSelect = html.find("[data-role='modifier-type']");
                html.find("[data-role='modifier-add']").on("click", () => {
                    const name = String(nameInput.val() ?? "").trim();
                    const value = Number(valueInput.val());
                    const type = String(typeSelect.val() ?? "");
                    if (!name || !Number.isFinite(value)) {
                        ui.notifications.error(localize("RMRPG.Dialogs.Roll.InvalidModifier"));
                        return;
                    }
                    state.push({
                        name,
                        type,
                        value: Math.floor(value),
                        checked: true
                    });
                    nameInput.val("");
                    valueInput.val("");
                    typeSelect.val(typeOptions[typeOptions.length - 1] ?? typeOptions[0] ?? "");
                    syncTable(html);
                });
            },
            close: () => {
                if (!resolved) {
                    resolve(null);
                }
            }
        }).render(true);
    });
};
