/**
 * Role Preset Verification — OS SPEC §7
 *
 * Verifies that resolveRole() output for each ARIA role preset
 * matches the SPEC §7 Role Preset Table exactly.
 *
 * Compressed from 163 individual assertions to data-driven table tests.
 * Same coverage, 1/10th the test count.
 */

import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import { describe, expect, it, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// SPEC §7 Table — each row encodes one role's expected config
// ═══════════════════════════════════════════════════════════════════

interface SpecRow {
  role: string;
  orient: "vertical" | "horizontal" | "both" | "linear-both";
  loop: boolean;
  typeahead: boolean;
  entry: "first" | "last" | "restore" | "selected";
  selectMode: "none" | "single" | "multiple";
  followFocus: boolean;
  tab: "trap" | "escape" | "flow" | "native";
  dismissEsc: "close" | "deselect" | "none";
  autoFocus: boolean;
}

// Defaults for "—" in the SPEC table
const D = {
  orient: "vertical" as const,
  loop: false,
  typeahead: false,
  entry: "first" as const,
  selectMode: "none" as const,
  followFocus: false,
  tab: "flow" as const,
  dismissEsc: "none" as const,
  autoFocus: false,
};

const specTable: SpecRow[] = [
  { role: "group", ...D },
  {
    role: "listbox",
    orient: "vertical",
    loop: false,
    typeahead: true,
    entry: "selected",
    selectMode: "single",
    followFocus: true,
    tab: "escape",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
  {
    role: "menu",
    orient: "vertical",
    loop: true,
    typeahead: D.typeahead,
    entry: "first",
    selectMode: "none",
    followFocus: D.followFocus,
    tab: "trap",

    dismissEsc: "close",
    autoFocus: true,
  },
  {
    role: "menubar",
    orient: "horizontal",
    loop: true,
    typeahead: D.typeahead,
    entry: "restore",
    selectMode: "none",
    followFocus: D.followFocus,
    tab: "escape",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
  {
    role: "radiogroup",
    orient: "linear-both",
    loop: true,
    typeahead: D.typeahead,
    entry: "selected",
    selectMode: "single",
    followFocus: true,
    tab: "escape",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
  {
    role: "tablist",
    orient: "horizontal",
    loop: true,
    typeahead: D.typeahead,
    entry: "selected",
    selectMode: "single",
    followFocus: true,
    tab: "escape",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
  {
    role: "toolbar",
    orient: "horizontal",
    loop: true,
    typeahead: D.typeahead,
    entry: "restore",
    selectMode: "none",
    followFocus: D.followFocus,
    tab: "escape",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
  {
    role: "grid",
    orient: "both",
    loop: false,
    typeahead: D.typeahead,
    entry: D.entry,
    selectMode: "multiple",
    followFocus: false,
    tab: "escape",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
  {
    role: "treegrid",
    orient: "vertical",
    loop: false,
    typeahead: D.typeahead,
    entry: D.entry,
    selectMode: "multiple",
    followFocus: false,
    tab: "escape",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
  {
    role: "tree",
    orient: "vertical",
    loop: false,
    typeahead: true,
    entry: "selected",
    selectMode: "single",
    followFocus: true,
    tab: "escape",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
  {
    role: "dialog",
    orient: D.orient,
    loop: D.loop,
    typeahead: D.typeahead,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: "trap",

    dismissEsc: "close",
    autoFocus: true,
  },
  {
    role: "alertdialog",
    orient: D.orient,
    loop: D.loop,
    typeahead: D.typeahead,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: "trap",

    dismissEsc: "close",
    autoFocus: true,
  },
  {
    role: "combobox",
    orient: "vertical",
    loop: false,
    typeahead: false,
    entry: D.entry,
    selectMode: "single",
    followFocus: true,
    tab: "escape",

    dismissEsc: "close",
    autoFocus: D.autoFocus,
  },
  {
    role: "feed",
    orient: "vertical",
    loop: false,
    typeahead: D.typeahead,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: "escape",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
  {
    role: "accordion",
    orient: "vertical",
    loop: false,
    typeahead: D.typeahead,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: "native",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
  {
    role: "disclosure",
    orient: D.orient,
    loop: D.loop,
    typeahead: D.typeahead,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: "flow",

    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
];

// ═══════════════════════════════════════════════════════════════════
// Tests — one test per role, verifying all 10 properties at once
// ═══════════════════════════════════════════════════════════════════

describe("Role Presets vs SPEC §7 Table", () => {
  it.each(
    specTable.map((row) => [row.role, row] as const),
  )('role="%s" matches SPEC §7', (_roleName, row) => {
    const config = resolveRole(row.role);

    expect(config.navigate.orientation).toBe(row.orient);
    expect(config.navigate.loop).toBe(row.loop);
    expect(config.navigate.typeahead).toBe(row.typeahead);
    expect(config.navigate.entry).toBe(row.entry);
    expect(config.select.mode).toBe(row.selectMode);
    expect(config.select.followFocus).toBe(row.followFocus);
    expect(config.tab.behavior).toBe(row.tab);
    expect(config.dismiss.escape).toBe(row.dismissEsc);
    expect(config.project.autoFocus).toBe(row.autoFocus);
  });
});

// ═══════════════════════════════════════════════════════════════════
// resolveRole helper behavior
// ═══════════════════════════════════════════════════════════════════

describe("resolveRole — override merging", () => {
  it("overrides merge on top of role preset", () => {
    const config = resolveRole("listbox", { navigate: { loop: true } });
    expect(config.navigate.loop).toBe(true);
    expect(config.navigate.orientation).toBe("vertical");
    expect(config.navigate.entry).toBe("selected");
  });

  it("unknown role warns and falls back to defaults", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config = resolveRole("unknownrole");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Unknown role"));
    expect(config.navigate.orientation).toBe("vertical");
    expect(config.tab.behavior).toBe("flow");
    warnSpy.mockRestore();
  });

  it("undefined role falls back to defaults", () => {
    const config = resolveRole(undefined);
    expect(config.navigate.orientation).toBe("vertical");
    expect(config.tab.behavior).toBe("flow");
  });
});
