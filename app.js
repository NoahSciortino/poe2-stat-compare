(function () {
  const STORAGE_KEY = "poe2-stat-compare-v1";

  const SLOTS = [
    "Arme",
    "Bouclier / focus",
    "Casque",
    "Armure",
    "Gants",
    "Bottes",
    "Ceinture",
    "Amulette",
    "Anneau 1",
    "Anneau 2",
    "Charme",
    "Autre",
  ];

  const CATEGORIES = [
    { id: "all", label: "Tout" },
    { id: "defense", label: "Defense" },
    { id: "resistance", label: "Resist." },
    { id: "offense", label: "Degats" },
    { id: "attributes", label: "Attributs" },
    { id: "utility", label: "Utilitaire" },
  ];

  const UNIT_OPTIONS = ["", "%", "x", "sec"];
  const CATEGORY_LABELS = {
    defense: "Defense",
    resistance: "Resistance",
    offense: "Degats",
    attributes: "Attributs",
    utility: "Utilitaire",
  };

  let state = loadState() || createInitialState();
  let saveTimer = 0;

  const dom = {
    addItemButton: document.getElementById("addItemButton"),
    deleteItemButton: document.getElementById("deleteItemButton"),
    parseItemButton: document.getElementById("parseItemButton"),
    addItemStatButton: document.getElementById("addItemStatButton"),
    parseTargetButton: document.getElementById("parseTargetButton"),
    addTargetStatButton: document.getElementById("addTargetStatButton"),
    importBuildButton: document.getElementById("importBuildButton"),
    targetBuildFile: document.getElementById("targetBuildFile"),
    copyMissingButton: document.getElementById("copyMissingButton"),
    loadSampleButton: document.getElementById("loadSampleButton"),
    exportButton: document.getElementById("exportButton"),
    importButton: document.getElementById("importButton"),
    importFile: document.getElementById("importFile"),
    resetButton: document.getElementById("resetButton"),
    slotFilter: document.getElementById("slotFilter"),
    categoryFilter: document.getElementById("categoryFilter"),
    itemList: document.getElementById("itemList"),
    itemName: document.getElementById("itemName"),
    itemSlot: document.getElementById("itemSlot"),
    itemRarity: document.getElementById("itemRarity"),
    itemRaw: document.getElementById("itemRaw"),
    itemStatsBody: document.getElementById("itemStatsBody"),
    targetName: document.getElementById("targetName"),
    targetClass: document.getElementById("targetClass"),
    targetUrl: document.getElementById("targetUrl"),
    targetRaw: document.getElementById("targetRaw"),
    targetStatsBody: document.getElementById("targetStatsBody"),
    summaryLine: document.getElementById("summaryLine"),
    summaryCards: document.getElementById("summaryCards"),
    comparisonBody: document.getElementById("comparisonBody"),
    toast: document.getElementById("toast"),
  };

  bindEvents();
  render();

  function bindEvents() {
    dom.addItemButton.addEventListener("click", () => {
      const item = createItem({ name: "Nouvel objet", slot: "Autre" });
      state.items.unshift(item);
      state.selectedItemId = item.id;
      state.slotFilter = "all";
      persistAndRender("Objet ajoute");
    });

    dom.deleteItemButton.addEventListener("click", () => {
      const selected = getSelectedItem();
      if (!selected) return;
      state.items = state.items.filter((item) => item.id !== selected.id);
      state.selectedItemId = state.items[0] ? state.items[0].id : null;
      persistAndRender("Objet retire");
    });

    dom.parseItemButton.addEventListener("click", () => {
      const selected = getSelectedItem();
      if (!selected) return;
      const stats = parseTextToStats(selected.raw);
      selected.stats = stats;
      persistAndRender(stats.length ? "Stats de l'objet analysees" : "Aucune stat detectee");
    });

    dom.addItemStatButton.addEventListener("click", () => {
      const selected = getSelectedItem();
      if (!selected) return;
      selected.stats.push(createStat({ label: "Nouvelle stat", value: 0, unit: "" }));
      persistAndRender("Stat ajoutee");
    });

    dom.parseTargetButton.addEventListener("click", () => {
      const stats = parseTextToStats(state.target.raw);
      state.target.stats = stats;
      persistAndRender(stats.length ? "Stats cible analysees" : "Aucune stat detectee");
    });

    dom.addTargetStatButton.addEventListener("click", () => {
      state.target.stats.push(createStat({ label: "Nouvelle stat", value: 0, unit: "" }));
      persistAndRender("Stat cible ajoutee");
    });

    dom.importBuildButton.addEventListener("click", () => dom.targetBuildFile.click());
    dom.targetBuildFile.addEventListener("change", importBuildTarget);
    dom.copyMissingButton.addEventListener("click", copyMissingStats);
    dom.loadSampleButton.addEventListener("click", () => {
      state = createSampleState();
      persistAndRender("Exemple charge");
    });
    dom.exportButton.addEventListener("click", exportState);
    dom.importButton.addEventListener("click", () => dom.importFile.click());
    dom.importFile.addEventListener("change", importState);
    dom.resetButton.addEventListener("click", () => {
      if (!window.confirm("Reinitialiser toutes les donnees de comparaison ?")) return;
      state = createInitialState();
      persistAndRender("Donnees reinitialisees");
    });

    dom.itemName.addEventListener("input", () => updateSelectedItem("name", dom.itemName.value));
    dom.itemSlot.addEventListener("change", () => updateSelectedItem("slot", dom.itemSlot.value));
    dom.itemRarity.addEventListener("change", () => updateSelectedItem("rarity", dom.itemRarity.value));
    dom.itemRaw.addEventListener("input", () => updateSelectedItem("raw", dom.itemRaw.value));

    dom.targetName.addEventListener("input", () => updateTarget("name", dom.targetName.value));
    dom.targetClass.addEventListener("input", () => updateTarget("className", dom.targetClass.value));
    dom.targetUrl.addEventListener("input", () => updateTarget("url", dom.targetUrl.value));
    dom.targetRaw.addEventListener("input", () => updateTarget("raw", dom.targetRaw.value));
  }

  function createInitialState() {
    const firstItem = createItem({ name: "Nouvel objet", slot: "Arme" });
    return {
      version: 1,
      items: [firstItem],
      selectedItemId: firstItem.id,
      slotFilter: "all",
      categoryFilter: "all",
      target: {
        name: "",
        className: "",
        url: "",
        raw: "",
        stats: [],
      },
    };
  }

  function createSampleState() {
    const items = [
      createItem({
        name: "Cowl of the First Flame",
        slot: "Casque",
        rarity: "Rare",
        raw: [
          "Rarity: Rare",
          "Cowl of the First Flame",
          "--------",
          "Armour: 128",
          "Energy Shield: 42",
          "--------",
          "+67 to maximum Life",
          "+31% to Fire Resistance",
          "+28% to Lightning Resistance",
          "+18 to Intelligence",
        ].join("\n"),
      }),
      createItem({
        name: "Ashen Pace",
        slot: "Bottes",
        rarity: "Rare",
        raw: [
          "Rarity: Rare",
          "Ashen Pace",
          "--------",
          "Evasion Rating: 94",
          "--------",
          "26% increased Movement Speed",
          "+39 to maximum Life",
          "+24% to Cold Resistance",
          "+15% to Lightning Resistance",
        ].join("\n"),
      }),
      createItem({
        name: "Rune Etched Wand",
        slot: "Arme",
        rarity: "Rare",
        raw: [
          "Rarity: Rare",
          "Rune Etched Wand",
          "--------",
          "Adds 12 to 22 Fire Damage",
          "72% increased Spell Damage",
          "14% increased Cast Speed",
          "+28 to Intelligence",
        ].join("\n"),
      }),
    ];

    items.forEach((item) => {
      item.stats = parseTextToStats(item.raw);
    });

    return {
      version: 1,
      items,
      selectedItemId: items[0].id,
      slotFilter: "all",
      categoryFilter: "all",
      target: {
        name: "Exemple Mobalytics",
        className: "Sorceress",
        url: "https://mobalytics.gg/poe-2",
        raw: [
          "Maximum Life 180",
          "Fire Resistance 75%",
          "Cold Resistance 75%",
          "Lightning Resistance 75%",
          "Increased Spell Damage 120%",
          "Increased Cast Speed 18%",
          "Increased Movement Speed 30%",
          "Intelligence 80",
        ].join("\n"),
        stats: [
          createStat({ label: "Maximum Life", value: 180, unit: "" }),
          createStat({ label: "Fire Resistance", value: 75, unit: "%" }),
          createStat({ label: "Cold Resistance", value: 75, unit: "%" }),
          createStat({ label: "Lightning Resistance", value: 75, unit: "%" }),
          createStat({ label: "Increased Spell Damage", value: 120, unit: "%" }),
          createStat({ label: "Increased Cast Speed", value: 18, unit: "%" }),
          createStat({ label: "Increased Movement Speed", value: 30, unit: "%" }),
          createStat({ label: "Intelligence", value: 80, unit: "" }),
        ],
      },
    };
  }

  function createItem(partial = {}) {
    return {
      id: createId(),
      name: partial.name || "Nouvel objet",
      slot: partial.slot || "Autre",
      rarity: partial.rarity || "Rare",
      raw: partial.raw || "",
      stats: partial.stats || [],
    };
  }

  function createStat(partial = {}) {
    const label = cleanLabel(partial.label || "");
    return {
      id: createId(),
      label,
      value: Number(partial.value) || 0,
      unit: partial.unit || "",
      category: categoryFor(label),
    };
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return null;
      return normalizeState(parsed);
    } catch (error) {
      return null;
    }
  }

  function normalizeState(input) {
    const normalized = {
      version: 1,
      items: Array.isArray(input.items) ? input.items.map(normalizeItem) : [],
      selectedItemId: input.selectedItemId || null,
      slotFilter: input.slotFilter || "all",
      categoryFilter: input.categoryFilter || "all",
      target: normalizeTarget(input.target || {}),
    };

    if (!normalized.items.length) {
      const firstItem = createItem({ name: "Nouvel objet", slot: "Arme" });
      normalized.items.push(firstItem);
      normalized.selectedItemId = firstItem.id;
    }

    if (!normalized.items.some((item) => item.id === normalized.selectedItemId)) {
      normalized.selectedItemId = normalized.items[0].id;
    }

    return normalized;
  }

  function normalizeItem(item) {
    return {
      id: item.id || createId(),
      name: item.name || "Objet",
      slot: SLOTS.includes(item.slot) ? item.slot : "Autre",
      rarity: item.rarity || "Rare",
      raw: item.raw || "",
      stats: Array.isArray(item.stats) ? item.stats.map(normalizeStat) : [],
    };
  }

  function normalizeTarget(target) {
    return {
      name: target.name || "",
      className: target.className || target.class || "",
      url: target.url || "",
      raw: target.raw || "",
      stats: Array.isArray(target.stats) ? target.stats.map(normalizeStat) : [],
    };
  }

  function normalizeStat(stat) {
    const label = cleanLabel(stat.label || "");
    return {
      id: stat.id || createId(),
      label,
      value: Number(stat.value) || 0,
      unit: stat.unit || "",
      category: categoryFor(label),
    };
  }

  function saveState() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveState, 120);
  }

  function persistAndRender(message) {
    saveState();
    render();
    if (message) showToast(message);
  }

  function updateSelectedItem(field, value) {
    const selected = getSelectedItem();
    if (!selected) return;
    selected[field] = value;
    renderItemList();
    renderComparison();
    scheduleSave();
  }

  function updateTarget(field, value) {
    state.target[field] = value;
    renderComparison();
    scheduleSave();
  }

  function getSelectedItem() {
    return state.items.find((item) => item.id === state.selectedItemId) || null;
  }

  function render() {
    renderSlotOptions();
    renderSlotFilter();
    renderCategoryFilter();
    renderItemList();
    renderSelectedItem();
    renderTarget();
    renderComparison();
  }

  function renderSlotOptions() {
    if (dom.itemSlot.options.length === SLOTS.length) return;
    dom.itemSlot.replaceChildren(
      ...SLOTS.map((slot) => {
        const option = document.createElement("option");
        option.value = slot;
        option.textContent = slot;
        return option;
      }),
    );
  }

  function renderSlotFilter() {
    const filters = [{ id: "all", label: "Tous" }, ...SLOTS.map((slot) => ({ id: slot, label: slot }))];
    dom.slotFilter.replaceChildren(
      ...filters.map((filter) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = filter.label;
        button.className = state.slotFilter === filter.id ? "active" : "";
        button.addEventListener("click", () => {
          state.slotFilter = filter.id;
          renderSlotFilter();
          renderItemList();
          scheduleSave();
        });
        return button;
      }),
    );
  }

  function renderCategoryFilter() {
    dom.categoryFilter.replaceChildren(
      ...CATEGORIES.map((category) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = category.label;
        button.className = state.categoryFilter === category.id ? "active" : "";
        button.addEventListener("click", () => {
          state.categoryFilter = category.id;
          renderCategoryFilter();
          renderComparison();
          scheduleSave();
        });
        return button;
      }),
    );
  }

  function renderItemList() {
    const items =
      state.slotFilter === "all" ? state.items : state.items.filter((item) => item.slot === state.slotFilter);

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Aucun objet";
      dom.itemList.replaceChildren(empty);
      return;
    }

    dom.itemList.replaceChildren(
      ...items.map((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `item-card${item.id === state.selectedItemId ? " active" : ""}`;
        button.addEventListener("click", () => {
          state.selectedItemId = item.id;
          renderItemList();
          renderSelectedItem();
          scheduleSave();
        });

        const name = document.createElement("strong");
        name.textContent = item.name || "Objet";

        const meta = document.createElement("div");
        meta.className = "item-meta";
        const left = document.createElement("span");
        left.textContent = `${item.slot} · ${item.rarity}`;
        const count = document.createElement("span");
        count.className = "stat-count";
        count.textContent = `${item.stats.length}`;
        meta.append(left, count);

        button.append(name, meta);
        return button;
      }),
    );
  }

  function renderSelectedItem() {
    const selected = getSelectedItem();
    const hasSelected = Boolean(selected);

    dom.deleteItemButton.disabled = !hasSelected;
    dom.parseItemButton.disabled = !hasSelected;
    dom.addItemStatButton.disabled = !hasSelected;
    dom.itemName.disabled = !hasSelected;
    dom.itemSlot.disabled = !hasSelected;
    dom.itemRarity.disabled = !hasSelected;
    dom.itemRaw.disabled = !hasSelected;

    if (!selected) {
      dom.itemName.value = "";
      dom.itemSlot.value = "Autre";
      dom.itemRarity.value = "Rare";
      dom.itemRaw.value = "";
      dom.itemStatsBody.replaceChildren(createEmptyRow("Aucune stat"));
      return;
    }

    dom.itemName.value = selected.name;
    dom.itemSlot.value = selected.slot;
    dom.itemRarity.value = selected.rarity;
    dom.itemRaw.value = selected.raw;
    renderStatsEditor(dom.itemStatsBody, selected.stats, (nextStats) => {
      selected.stats = nextStats;
      renderItemList();
      renderComparison();
      scheduleSave();
    });
  }

  function renderTarget() {
    dom.targetName.value = state.target.name;
    dom.targetClass.value = state.target.className;
    dom.targetUrl.value = state.target.url;
    dom.targetRaw.value = state.target.raw;
    renderStatsEditor(dom.targetStatsBody, state.target.stats, (nextStats) => {
      state.target.stats = nextStats;
      renderComparison();
      scheduleSave();
    });
  }

  function renderStatsEditor(container, stats, onChange) {
    if (!stats.length) {
      container.replaceChildren(createEmptyRow("Aucune stat"));
      return;
    }

    container.replaceChildren(
      ...stats.map((stat, index) => {
        const row = document.createElement("tr");

        const labelCell = document.createElement("td");
        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.value = stat.label;
        labelInput.addEventListener("input", () => {
          stats[index] = normalizeStat({ ...stat, label: labelInput.value });
          onChange([...stats]);
        });
        labelCell.append(labelInput);

        const valueCell = document.createElement("td");
        const valueInput = document.createElement("input");
        valueInput.type = "number";
        valueInput.step = "any";
        valueInput.value = String(stat.value);
        valueInput.addEventListener("input", () => {
          stats[index] = normalizeStat({ ...stat, value: valueInput.value });
          onChange([...stats]);
        });
        valueCell.append(valueInput);

        const unitCell = document.createElement("td");
        const unitSelect = document.createElement("select");
        UNIT_OPTIONS.forEach((unit) => {
          const option = document.createElement("option");
          option.value = unit;
          option.textContent = unit || "flat";
          unitSelect.append(option);
        });
        unitSelect.value = UNIT_OPTIONS.includes(stat.unit) ? stat.unit : "";
        unitSelect.addEventListener("change", () => {
          stats[index] = normalizeStat({ ...stat, unit: unitSelect.value });
          onChange([...stats]);
        });
        unitCell.append(unitSelect);

        const actionCell = document.createElement("td");
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "small-icon-button";
        removeButton.title = "Retirer";
        removeButton.setAttribute("aria-label", "Retirer la stat");
        removeButton.textContent = "×";
        removeButton.addEventListener("click", () => {
          const nextStats = stats.filter((_, statIndex) => statIndex !== index);
          onChange(nextStats);
        });
        actionCell.append(removeButton);

        row.append(labelCell, valueCell, unitCell, actionCell);
        return row;
      }),
    );
  }

  function createEmptyRow(label) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.className = "empty-state";
    cell.textContent = label;
    row.append(cell);
    return row;
  }

  function renderComparison() {
    const gearTotals = aggregateStats(state.items.flatMap((item) => item.stats));
    const targetTotals = aggregateStats(state.target.stats);
    const rows = buildComparisonRows(gearTotals, targetTotals);
    const visibleRows =
      state.categoryFilter === "all" ? rows : rows.filter((row) => row.category === state.categoryFilter);

    const comparedRows = rows.filter((row) => row.hasTarget);
    const reachedRows = comparedRows.filter((row) => row.delta >= 0);
    const missingRows = comparedRows.filter((row) => row.delta < 0);

    dom.summaryLine.textContent = `${state.items.length} objets · ${gearTotals.size} stats equipement · ${targetTotals.size} stats cible`;
    renderSummaryCards(comparedRows, reachedRows, missingRows, gearTotals.size);

    if (!visibleRows.length) {
      const empty = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 5;
      cell.className = "empty-state";
      cell.textContent = "Aucune comparaison";
      empty.append(cell);
      dom.comparisonBody.replaceChildren(empty);
      return;
    }

    dom.comparisonBody.replaceChildren(...visibleRows.map(createComparisonRow));
  }

  function renderSummaryCards(comparedRows, reachedRows, missingRows, gearStatCount) {
    const coverage = comparedRows.length ? Math.round((reachedRows.length / comparedRows.length) * 100) : 0;
    const biggestMissing = missingRows.length
      ? missingRows.slice().sort((a, b) => missingSeverity(b) - missingSeverity(a))[0]
      : null;

    const cards = [
      { label: "Stats comparees", value: comparedRows.length, tone: "" },
      { label: "Atteintes", value: `${coverage}%`, tone: coverage >= 80 ? "good" : coverage >= 50 ? "warn" : "bad" },
      { label: "A combler", value: missingRows.length, tone: missingRows.length ? "bad" : "good" },
      {
        label: biggestMissing ? biggestMissing.label : "Stats equipement",
        value: biggestMissing ? formatDelta(biggestMissing.delta, biggestMissing.unit) : gearStatCount,
        tone: biggestMissing ? "bad" : "",
      },
    ];

    dom.summaryCards.replaceChildren(
      ...cards.map((card) => {
        const element = document.createElement("div");
        element.className = `summary-card ${card.tone}`.trim();
        const label = document.createElement("span");
        label.textContent = card.label;
        const value = document.createElement("strong");
        value.textContent = String(card.value);
        element.append(label, value);
        return element;
      }),
    );
  }

  function createComparisonRow(rowData) {
    const row = document.createElement("tr");

    const labelCell = document.createElement("td");
    const label = document.createElement("strong");
    label.textContent = rowData.label;
    const category = document.createElement("div");
    category.className = "item-meta";
    const categoryText = document.createElement("span");
    categoryText.textContent = CATEGORY_LABELS[rowData.category] || "Stat";
    category.append(categoryText);
    labelCell.append(label, category);

    const gearCell = document.createElement("td");
    gearCell.textContent = formatValue(rowData.gear, rowData.unit);

    const targetCell = document.createElement("td");
    targetCell.textContent = rowData.hasTarget ? formatValue(rowData.target, rowData.unit) : "—";

    const deltaCell = document.createElement("td");
    deltaCell.className = `delta ${deltaTone(rowData)}`;
    deltaCell.textContent = rowData.hasTarget ? formatDelta(rowData.delta, rowData.unit) : formatValue(rowData.gear, rowData.unit);

    const progressCell = document.createElement("td");
    progressCell.append(createProgress(rowData));

    row.append(labelCell, gearCell, targetCell, deltaCell, progressCell);
    return row;
  }

  function createProgress(rowData) {
    const track = document.createElement("div");
    track.className = "progress-track";
    const bar = document.createElement("div");
    const ratio = rowData.hasTarget && rowData.target > 0 ? rowData.gear / rowData.target : rowData.gear > 0 ? 1 : 0;
    const width = Math.max(0, Math.min(100, ratio * 100));
    bar.className = `progress-bar ${ratio >= 1 ? "good" : ratio >= 0.75 ? "warn" : ""}`;
    bar.style.width = `${width}%`;
    track.title = rowData.hasTarget ? `${Math.round(width)}%` : "Stat hors cible";
    track.append(bar);
    return track;
  }

  function aggregateStats(stats) {
    const map = new Map();
    stats.forEach((stat) => {
      const normalized = normalizeStat(stat);
      if (!normalized.label || !Number.isFinite(normalized.value)) return;
      const key = canonicalKey(normalized.label, normalized.unit);
      const current = map.get(key);
      if (current) {
        current.value += normalized.value;
      } else {
        map.set(key, { ...normalized });
      }
    });
    return map;
  }

  function buildComparisonRows(gearTotals, targetTotals) {
    const keys = new Set([...gearTotals.keys(), ...targetTotals.keys()]);
    return [...keys]
      .map((key) => {
        const gear = gearTotals.get(key);
        const target = targetTotals.get(key);
        const label = (target && target.label) || (gear && gear.label) || "Stat";
        const unit = (target && target.unit) || (gear && gear.unit) || "";
        const gearValue = gear ? gear.value : 0;
        const targetValue = target ? target.value : 0;
        return {
          key,
          label,
          unit,
          gear: gearValue,
          target: targetValue,
          delta: gearValue - targetValue,
          hasTarget: Boolean(target),
          category: categoryFor(label),
        };
      })
      .sort(compareRows);
  }

  function compareRows(a, b) {
    const aMissing = a.hasTarget && a.delta < 0;
    const bMissing = b.hasTarget && b.delta < 0;
    if (aMissing !== bMissing) return aMissing ? -1 : 1;
    if (a.hasTarget !== b.hasTarget) return a.hasTarget ? -1 : 1;
    if (aMissing && bMissing) return missingSeverity(b) - missingSeverity(a);
    return a.label.localeCompare(b.label, "fr");
  }

  function missingSeverity(row) {
    if (!row.hasTarget || row.delta >= 0) return 0;
    return Math.abs(row.delta) / Math.max(Math.abs(row.target), 1);
  }

  function deltaTone(row) {
    if (!row.hasTarget) return "neutral";
    if (row.delta >= 0) return "good";
    return "bad";
  }

  function parseTextToStats(text) {
    const stats = String(text || "")
      .split(/\r?\n/)
      .map((line) => parseStatLine(line))
      .filter(Boolean);
    return compressStats(stats);
  }

  function parseStatLine(input) {
    let line = String(input || "").trim();
    if (!line) return null;
    line = line
      .replace(/[{}[\]]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s+\(augmented\)$/i, "")
      .replace(/^\d+[.)]\s+/, "")
      .trim();

    if (shouldSkipLine(line)) return null;

    const addsMatch = line.match(/^Adds\s+([+-]?\d[\d\s,.]*)(%)?\s+to\s+([+-]?\d[\d\s,.]*)(%)?\s+(.+)$/i);
    if (addsMatch) {
      const low = parseNumberToken(addsMatch[1]);
      const high = parseNumberToken(addsMatch[3]);
      const label = cleanLabel(`Adds ${addsMatch[5]} avg`);
      return createStat({ label, value: (low + high) / 2, unit: addsMatch[2] || addsMatch[4] || "" });
    }

    const labelRangeMatch = line.match(/^(.+?):\s*([+-]?\d[\d\s,.]*)(%)?\s*(?:-|to|a)\s*([+-]?\d[\d\s,.]*)(%)?/i);
    if (labelRangeMatch) {
      const low = parseNumberToken(labelRangeMatch[2]);
      const high = parseNumberToken(labelRangeMatch[4]);
      const label = cleanLabel(`${labelRangeMatch[1]} avg`);
      return createStat({ label, value: (low + high) / 2, unit: labelRangeMatch[3] || labelRangeMatch[5] || "" });
    }

    const labelFirstMatch = line.match(/^(.+?):\s*([+-]?\d[\d\s,.]*[kKmM]?)(%)?\b/);
    if (labelFirstMatch) {
      return createStat({
        label: cleanLabel(labelFirstMatch[1]),
        value: parseNumberToken(labelFirstMatch[2]),
        unit: labelFirstMatch[3] || "",
      });
    }

    const numberFirstMatch = line.match(/^([+-]?\d[\d\s,.]*[kKmM]?)(%)?\s+(.+)$/);
    if (numberFirstMatch) {
      return createStat({
        label: cleanLabel(numberFirstMatch[3]),
        value: parseNumberToken(numberFirstMatch[1]),
        unit: numberFirstMatch[2] || "",
      });
    }

    const labelTrailingMatch = line.match(/^(.+?)\s+([+-]?\d[\d\s,.]*[kKmM]?)(%)?$/);
    if (labelTrailingMatch) {
      return createStat({
        label: cleanLabel(labelTrailingMatch[1]),
        value: parseNumberToken(labelTrailingMatch[2]),
        unit: labelTrailingMatch[3] || "",
      });
    }

    return null;
  }

  function shouldSkipLine(line) {
    return [
      /^[-–—]+$/,
      /^Rarity:/i,
      /^Item Class:/i,
      /^Item Level:/i,
      /^Level:/i,
      /^Requires\s/i,
      /^Requirements:/i,
      /^Sockets:/i,
      /^Quality:/i,
      /^Corrupted$/i,
      /^Mirrored$/i,
      /^Unidentified$/i,
      /^Place into/i,
      /^Right click/i,
      /^Shift click/i,
    ].some((pattern) => pattern.test(line));
  }

  function compressStats(stats) {
    const map = new Map();
    stats.forEach((stat) => {
      const normalized = normalizeStat(stat);
      if (!normalized.label || !Number.isFinite(normalized.value)) return;
      const key = canonicalKey(normalized.label, normalized.unit);
      const current = map.get(key);
      if (current) {
        current.value += normalized.value;
      } else {
        map.set(key, normalized);
      }
    });
    return [...map.values()].sort((a, b) => {
      const categorySort = CATEGORIES.findIndex((category) => category.id === a.category) - CATEGORIES.findIndex((category) => category.id === b.category);
      return categorySort || a.label.localeCompare(b.label, "fr");
    });
  }

  function parseNumberToken(token) {
    let raw = String(token || "").trim().replace(/\s+/g, "");
    let multiplier = 1;

    if (/k$/i.test(raw)) {
      multiplier = 1000;
      raw = raw.slice(0, -1);
    } else if (/m$/i.test(raw)) {
      multiplier = 1000000;
      raw = raw.slice(0, -1);
    }

    raw = raw.replace(/^\+/, "");

    if (raw.includes(",") && raw.includes(".")) {
      raw = raw.replace(/,/g, "");
    } else if (raw.includes(",")) {
      const parts = raw.split(",");
      if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
        raw = `${parts[0]}${parts[1]}`;
      } else {
        raw = raw.replace(",", ".");
      }
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value * multiplier : 0;
  }

  function cleanLabel(label) {
    return titleCase(
      String(label || "")
        .replace(/\([^)]*\)/g, "")
        .replace(/\b(total|gear|sum)\b/gi, "")
        .replace(/^(to|of)\s+/i, "")
        .replace(/\s+as\s+an?\s+extra\s+/i, " extra ")
        .replace(/\s+/g, " ")
        .trim(),
    );
  }

  function titleCase(label) {
    const acronyms = new Set(["dps", "aoe"]);
    return label
      .split(" ")
      .filter(Boolean)
      .map((word) => {
        const lower = word.toLowerCase();
        if (acronyms.has(lower)) return lower.toUpperCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      })
      .join(" ");
  }

  function canonicalKey(label, unit) {
    return `${normalizeForSearch(label)}|${unit || ""}`;
  }

  function normalizeForSearch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function categoryFor(label) {
    const text = normalizeForSearch(label);
    if (/\b(resistance|resistances|resist)\b/.test(text)) return "resistance";
    if (/\b(strength|dexterity|intelligence|attribute|attributes)\b/.test(text)) return "attributes";
    if (/\b(damage|attack|spell|cast|critical|crit|dps|accuracy|projectile|melee|physical|fire|cold|lightning|chaos|poison|ignite|bleed)\b/.test(text)) {
      return "offense";
    }
    if (/\b(life|energy shield|armour|armor|evasion|block|ward|stun|defence|defense|recovery|regeneration|regen)\b/.test(text)) {
      return "defense";
    }
    if (/\b(movement|speed|mana|spirit|flask|charm|rarity|quantity|gold|duration|cooldown)\b/.test(text)) {
      return "utility";
    }
    return "utility";
  }

  function formatValue(value, unit) {
    const number = Number(value) || 0;
    const absolute = Math.abs(number);
    let display;

    if (absolute >= 1000000) {
      display = `${trimNumber(number / 1000000)}M`;
    } else if (absolute >= 10000) {
      display = `${trimNumber(number / 1000)}k`;
    } else {
      display = trimNumber(number);
    }

    return `${display}${unit || ""}`;
  }

  function formatDelta(value, unit) {
    const number = Number(value) || 0;
    return `${number > 0 ? "+" : ""}${formatValue(number, unit)}`;
  }

  function trimNumber(value) {
    if (Number.isInteger(value)) return String(value);
    return String(Math.round(value * 10) / 10);
  }

  async function importBuildTarget(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      const builds = await readBuildsFromFile(file);
      const selectedBuild = chooseBuild(builds);
      if (!selectedBuild) return;

      const buildTarget = parseBuildTarget(selectedBuild);
      state.target = {
        ...state.target,
        name: buildTarget.name,
        className: buildTarget.className,
        raw: buildTarget.raw,
        stats: buildTarget.stats,
      };
      persistAndRender(`BUILD importe: ${buildTarget.stats.length} stats`);
    } catch (error) {
      console.error(error);
      showToast(error.message === "ZIP_UNSUPPORTED" ? "Zip non supporte, importe un .build" : "BUILD impossible");
    } finally {
      dom.targetBuildFile.value = "";
    }
  }

  async function readBuildsFromFile(file) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (isZip(bytes)) {
      return readBuildsFromZip(buffer);
    }

    return [{ name: file.name, text: new TextDecoder().decode(bytes) }];
  }

  function isZip(bytes) {
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  }

  async function readBuildsFromZip(buffer) {
    const entries = findZipEntries(buffer).filter((entry) => /\.build$/i.test(entry.name) || /\.json$/i.test(entry.name));
    const builds = [];

    for (const entry of entries) {
      const bytes = await readZipEntry(buffer, entry);
      builds.push({ name: entry.name.split(/[\\/]/).pop(), text: new TextDecoder().decode(bytes) });
    }

    if (!builds.length) {
      throw new Error("Aucun fichier BUILD");
    }

    return builds;
  }

  function findZipEntries(buffer) {
    const view = new DataView(buffer);
    const eocdOffset = findEndOfCentralDirectory(view);
    if (eocdOffset < 0) throw new Error("Zip invalide");

    const entryCount = view.getUint16(eocdOffset + 10, true);
    let offset = view.getUint32(eocdOffset + 16, true);
    const entries = [];

    for (let index = 0; index < entryCount; index += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("Zip invalide");

      const flags = view.getUint16(offset + 8, true);
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const fileNameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const nameBytes = new Uint8Array(buffer, offset + 46, fileNameLength);
      const name = decodeZipName(nameBytes, flags);

      entries.push({ name, method, compressedSize, localOffset });
      offset += 46 + fileNameLength + extraLength + commentLength;
    }

    return entries;
  }

  function findEndOfCentralDirectory(view) {
    const minOffset = Math.max(0, view.byteLength - 66000);
    for (let offset = view.byteLength - 22; offset >= minOffset; offset -= 1) {
      if (view.getUint32(offset, true) === 0x06054b50) return offset;
    }
    return -1;
  }

  function decodeZipName(bytes) {
    return new TextDecoder().decode(bytes);
  }

  async function readZipEntry(buffer, entry) {
    const view = new DataView(buffer);
    if (view.getUint32(entry.localOffset, true) !== 0x04034b50) throw new Error("Zip invalide");

    const fileNameLength = view.getUint16(entry.localOffset + 26, true);
    const extraLength = view.getUint16(entry.localOffset + 28, true);
    const dataOffset = entry.localOffset + 30 + fileNameLength + extraLength;
    const compressedBytes = new Uint8Array(buffer, dataOffset, entry.compressedSize);

    if (entry.method === 0) return compressedBytes;
    if (entry.method !== 8 || typeof DecompressionStream !== "function") {
      throw new Error("ZIP_UNSUPPORTED");
    }

    try {
      const stream = new Blob([compressedBytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch (error) {
      throw new Error("ZIP_UNSUPPORTED");
    }
  }

  function chooseBuild(builds) {
    if (!builds.length) throw new Error("Aucun BUILD");
    if (builds.length === 1) return builds[0];

    const defaultIndex = Math.max(
      builds.findIndex((build) => /crit.*endgame|endgame.*crit/i.test(build.name)),
      builds.findIndex((build) => /endgame/i.test(build.name)),
      builds.length - 1,
    );
    const choices = builds.map((build, index) => `${index + 1}. ${stripBuildExtension(build.name)}`).join("\n");
    const answer = window.prompt(`Ce zip contient plusieurs builds:\n${choices}\n\nNumero a importer:`, String(defaultIndex + 1));
    if (answer === null) return null;

    const selectedIndex = Number.parseInt(answer, 10) - 1;
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= builds.length) {
      showToast("Choix invalide");
      return null;
    }

    return builds[selectedIndex];
  }

  function parseBuildTarget(build) {
    const parsed = JSON.parse(build.text);
    if (!parsed || !Array.isArray(parsed.inventory_slots)) {
      throw new Error("BUILD invalide");
    }

    const inventorySlots = parsed.inventory_slots.filter((slot) => slot && slot.additional_text);
    const raw = buildRawText(parsed, inventorySlots, build.name);
    const stats = compressStats(inventorySlots.flatMap((slot) => parseTextToStats(slot.additional_text)));

    return {
      name: parsed.name || stripBuildExtension(build.name),
      className: inferBuildClass(parsed, build.name),
      raw,
      stats,
    };
  }

  function buildRawText(build, inventorySlots, fileName) {
    const title = build.name || stripBuildExtension(fileName);
    const details = [`Build: ${title}`];
    if (build.author) details.push(`Auteur: ${build.author}`);
    if (build.ascendancy) details.push(`Ascendance: ${inferBuildClass(build, fileName)}`);

    const items = inventorySlots.map((slot) => {
      const slotName = inventorySlotLabel(slot.inventory_id);
      return `[${slotName}]\n${slot.additional_text}`;
    });

    return `${details.join("\n")}\n\n${items.join("\n\n")}`;
  }

  function inferBuildClass(build, fileName) {
    const text = `${build.name || ""} ${fileName || ""}`;
    const classMatch = text.match(/\b(Deadeye|Pathfinder|Stormweaver|Chronomancer|Infernalist|Blood Mage|Titan|Warbringer|Witchhunter|Gemling|Invoker|Acolyte)\b/i);
    if (classMatch) return titleCase(classMatch[1]);

    const ascendancyMap = {
      Ranger1: "Deadeye",
      Ranger2: "Pathfinder",
    };

    return ascendancyMap[build.ascendancy] || build.ascendancy || "";
  }

  function inventorySlotLabel(inventoryId) {
    const id = String(inventoryId || "");
    const slotMap = [
      [/Weapon/i, "Arme"],
      [/Offhand/i, "Carquois / offhand"],
      [/Helm/i, "Casque"],
      [/BodyArmour/i, "Armure"],
      [/Gloves/i, "Gants"],
      [/Boots/i, "Bottes"],
      [/Belt/i, "Ceinture"],
      [/Amulet/i, "Amulette"],
      [/Ring1/i, "Anneau 1"],
      [/Ring2/i, "Anneau 2"],
      [/Ring/i, "Anneau"],
      [/Charm/i, "Charme"],
      [/Flask/i, "Flasque"],
    ];
    const match = slotMap.find(([pattern]) => pattern.test(id));
    return match ? match[1] : id || "Objet";
  }

  function stripBuildExtension(name) {
    return String(name || "Build cible").replace(/\.(build|json)$/i, "");
  }

  async function copyMissingStats() {
    const rows = buildComparisonRows(
      aggregateStats(state.items.flatMap((item) => item.stats)),
      aggregateStats(state.target.stats),
    ).filter((row) => row.hasTarget && row.delta < 0);

    if (!rows.length) {
      showToast("Aucun manque a copier");
      return;
    }

    const text = rows.map((row) => `${row.label}: ${formatDelta(row.delta, row.unit)}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast("Manques copies");
    } catch (error) {
      fallbackCopy(text);
      showToast("Manques copies");
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `poe2-stat-compare-${date}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Export cree");
  }

  function importState(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        state = normalizeState(JSON.parse(String(reader.result || "{}")));
        persistAndRender("Import termine");
      } catch (error) {
        showToast("Import impossible");
      } finally {
        dom.importFile.value = "";
      }
    });
    reader.readAsText(file);
  }

  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => dom.toast.classList.remove("show"), 1800);
  }
})();
