import { MAJOR_TAGS } from "../../data/major-tags.js";

const MAJOR_TAG_MAP = new Map(MAJOR_TAGS.map((tag) => [tag.name.toLowerCase(), tag.tooltip]));
const MAX_TAG_SUGGESTIONS = 8;

export const buildTagContext = (item: any, system: any) => {
  const typeTagName = String(item.type ?? "").trim();
  const rawTags = Array.isArray(system.tags) ? system.tags : [];
  const normalizedTags = rawTags
    .map((entry: any) => {
      if (typeof entry === "string") {
        return { name: entry, tooltip: "" };
      }
      return {
        name: String(entry?.name ?? ""),
        tooltip: String(entry?.tooltip ?? "")
      };
    })
    .map((entry: { name: string; tooltip: string }) => ({
      name: String(entry.name ?? "").trim(),
      tooltip: String(entry.tooltip ?? "").trim()
    }))
    .filter((entry) => entry.name)
    .filter((entry) => entry.name.toLowerCase() !== typeTagName.toLowerCase());

  const seenTags = new Set<string>();
  const dedupedTags = normalizedTags.filter((entry) => {
    const key = entry.name.toLowerCase();
    if (seenTags.has(key)) return false;
    seenTags.add(key);
    return true;
  });

  return {
    typeTag: {
      name: typeTagName,
      tooltip: MAJOR_TAG_MAP.get(typeTagName.toLowerCase()) ?? ""
    },
    tagEntries: dedupedTags.map((entry) => ({
      name: entry.name,
      tooltip: entry.tooltip || MAJOR_TAG_MAP.get(entry.name.toLowerCase()) || ""
    }))
  };
};

export const setupTagSystem = (sheet: any, html: JQuery) => {
  const tagRoot = html.find(".item-header-tags");
  if (!tagRoot.length) return;

  const addButton = tagRoot.find("[data-action='tag-add']");
  const editor = tagRoot.find(".tag-editor");
  const input = editor.find(".tag-input");
  const suggestions = editor.find(".tag-suggestions");

  if (!addButton.length || !editor.length || !input.length || !suggestions.length) return;

  const normalizeName = (value: unknown) => String(value ?? "").trim();
  const getTooltip = (name: string) => MAJOR_TAG_MAP.get(name.toLowerCase()) ?? "";

  const readTags = () => {
    const raw = Array.isArray(sheet.item.system?.tags) ? sheet.item.system.tags : [];
    const normalized = raw
      .map((entry: any) => {
        if (typeof entry === "string") {
          return { name: entry, tooltip: "" };
        }
        return {
          name: String(entry?.name ?? ""),
          tooltip: String(entry?.tooltip ?? "")
        };
      })
      .map((entry: { name: string; tooltip: string }) => ({
        name: normalizeName(entry.name),
        tooltip: normalizeName(entry.tooltip)
      }))
      .filter((entry) => entry.name)
      .filter((entry) => entry.name.toLowerCase() !== String(sheet.item.type ?? "").toLowerCase());

    const seen = new Set<string>();
    return normalized.filter((entry) => {
      const key = entry.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getEditIndex = () => {
    const raw = editor.attr("data-edit-index");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const showEditor = (value = "", editIndex: number | null = null) => {
    editor.addClass("is-active");
    addButton.addClass("is-hidden");
    if (editIndex === null) {
      editor.removeAttr("data-edit-index");
    } else {
      editor.attr("data-edit-index", String(editIndex));
    }
    input.val(value);
    input.trigger("focus");
    renderSuggestions(String(value ?? ""));
  };

  const hideEditor = () => {
    editor.removeClass("is-active");
    addButton.removeClass("is-hidden");
    editor.removeAttr("data-edit-index");
    input.val("");
    suggestions.empty().removeClass("is-visible");
  };

  const updateTags = async (event: Event | null, next: { name: string; tooltip: string }[]) => {
    if (event) {
      await sheet._onSubmit(event, { preventClose: true, preventRender: true });
    }
    await sheet.item.update({ "system.tags": next });
  };

  const commitTag = async (event: Event | null, rawValue: string) => {
    const name = normalizeName(rawValue);
    if (!name) {
      hideEditor();
      return;
    }

    const lower = name.toLowerCase();
    const typeLower = String(sheet.item.type ?? "").toLowerCase();
    if (lower === typeLower) {
      hideEditor();
      return;
    }

    const current = readTags();
    const editIndex = getEditIndex();
    const duplicateIndex = current.findIndex((tag) => tag.name.toLowerCase() === lower);
    if (duplicateIndex !== -1 && duplicateIndex !== editIndex) {
      hideEditor();
      return;
    }

    const tooltip = getTooltip(name) || (editIndex !== null ? current[editIndex]?.tooltip ?? "" : "");
    const next = [...current];

    if (editIndex !== null) {
      if (editIndex < 0 || editIndex >= next.length) {
        hideEditor();
        return;
      }
      next[editIndex] = { name, tooltip };
    } else if (duplicateIndex === -1) {
      next.push({ name, tooltip });
    }

    await updateTags(event, next);
    hideEditor();
  };

  const renderSuggestions = (rawQuery: string) => {
    const query = normalizeName(rawQuery).toLowerCase();
    suggestions.empty();

    if (!query) {
      suggestions.removeClass("is-visible");
      return;
    }

    const matches = MAJOR_TAGS.filter((tag) => tag.name.toLowerCase().includes(query)).slice(0, MAX_TAG_SUGGESTIONS);
    if (!matches.length) {
      suggestions.removeClass("is-visible");
      return;
    }

    for (const tag of matches) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tag-suggestion";
      button.dataset.name = tag.name;

      const nameSpan = document.createElement("span");
      nameSpan.className = "tag-suggestion-name";
      nameSpan.textContent = tag.name;

      const tipSpan = document.createElement("span");
      tipSpan.className = "tag-suggestion-tip";
      tipSpan.textContent = tag.tooltip;

      button.append(nameSpan, tipSpan);
      suggestions.append(button);
    }

    suggestions.addClass("is-visible");
  };

  addButton.on("click", (event) => {
    event.preventDefault();
    showEditor();
  });

  tagRoot.find("[data-action='tag-remove']").on("click", async (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;
    const current = readTags();
    if (index >= current.length) return;
    current.splice(index, 1);
    await updateTags(event, current);
  });

  tagRoot.find(".tag-pill[data-index]").on("dblclick", (event: any) => {
    const target = event.target as HTMLElement;
    if (target.closest(".tag-remove")) return;
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;
    const current = readTags();
    const tag = current[index];
    if (!tag) return;
    showEditor(tag.name, index);
  });

  input.on("keydown", async (event: any) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await commitTag(event, String(input.val() ?? ""));
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      hideEditor();
    }
  });

  input.on("input", (event: any) => {
    renderSuggestions(String(event.currentTarget.value ?? ""));
  });

  input.on("focus", (event: any) => {
    renderSuggestions(String(event.currentTarget.value ?? ""));
  });

  suggestions.on("mousedown", (event: any) => {
    event.preventDefault();
  });

  suggestions.on("click", ".tag-suggestion", async (event: any) => {
    event.preventDefault();
    const name = String(event.currentTarget.dataset.name ?? "");
    if (!name) return;
    await commitTag(event, name);
  });

  editor.on("focusout", () => {
    const editorEl = editor.get(0);
    window.setTimeout(() => {
      if (!editorEl) return;
      if (editorEl.contains(document.activeElement)) return;
      hideEditor();
    }, 0);
  });
};
