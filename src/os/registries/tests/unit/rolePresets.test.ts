/**
 * Role Preset Verification — OS SPEC §7
 *
 * Verifies that resolveRole() output for each ARIA role preset
 * matches the SPEC §7 Role Preset Table exactly.
 *
 * Compressed from 163 individual assertions to data-driven table tests.
 * Same coverage, 1/10th the test count.
 */

import { resolveRole } from "@os/registries/roleRegistry";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// SPEC §7 Table — each row encodes one role's expected config
// ═══════════════════════════════════════════════════════════════════

interface SpecRow {
  role: string;
  orient: "vertical" | "horizontal" | "both";
  loop: boolean;
  typeahead: boolean;
  entry: "first" | "last" | "restore" | "selected";
  selectMode: "none" | "single" | "multiple";
  followFocus: boolean;
  tab: "trap" | "escape" | "flow";
  activate: "manual" | "automatic";
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
  activate: "manual" as const,
  dismissEsc: "none" as const,
  autoFocus: false,
};

const specTable: SpecRow[] = [
  { role: "group", ...D },
  { role: "listbox", orient: "vertical", loop: false, typeahead: true, entry: "selected", selectMode: "single", followFocus: true, tab: "escape", activate: D.activate, dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
  { role: "menu", orient: "vertical", loop: true, typeahead: D.typeahead, entry: "first", selectMode: "none", followFocus: D.followFocus, tab: "trap", activate: "automatic", dismissEsc: "close", autoFocus: true },
  { role: "menubar", orient: "horizontal", loop: true, typeahead: D.typeahead, entry: "restore", selectMode: "none", followFocus: D.followFocus, tab: "escape", activate: "automatic", dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
  { role: "radiogroup", orient: "vertical", loop: true, typeahead: D.typeahead, entry: "selected", selectMode: "single", followFocus: true, tab: "escape", activate: D.activate, dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
  { role: "tablist", orient: "horizontal", loop: true, typeahead: D.typeahead, entry: "selected", selectMode: "single", followFocus: true, tab: "escape", activate: "automatic", dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
  { role: "toolbar", orient: "horizontal", loop: true, typeahead: D.typeahead, entry: "restore", selectMode: "none", followFocus: D.followFocus, tab: "escape", activate: D.activate, dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
  { role: "grid", orient: "both", loop: false, typeahead: D.typeahead, entry: D.entry, selectMode: "multiple", followFocus: false, tab: "escape", activate: D.activate, dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
  { role: "treegrid", orient: "both", loop: false, typeahead: D.typeahead, entry: D.entry, selectMode: "multiple", followFocus: false, tab: "escape", activate: "manual", dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
  { role: "tree", orient: "vertical", loop: false, typeahead: true, entry: "selected", selectMode: "single", followFocus: false, tab: "escape", activate: "manual", dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
  { role: "dialog", orient: D.orient, loop: D.loop, typeahead: D.typeahead, entry: D.entry, selectMode: D.selectMode, followFocus: D.followFocus, tab: "trap", activate: D.activate, dismissEsc: "close", autoFocus: true },
  { role: "alertdialog", orient: D.orient, loop: D.loop, typeahead: D.typeahead, entry: D.entry, selectMode: D.selectMode, followFocus: D.followFocus, tab: "trap", activate: D.activate, dismissEsc: "close", autoFocus: true },
  { role: "combobox", orient: "vertical", loop: false, typeahead: false, entry: D.entry, selectMode: "single", followFocus: true, tab: "escape", activate: D.activate, dismissEsc: "close", autoFocus: D.autoFocus },
  { role: "feed", orient: "vertical", loop: false, typeahead: D.typeahead, entry: D.entry, selectMode: D.selectMode, followFocus: D.followFocus, tab: "escape", activate: D.activate, dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
  { role: "accordion", orient: "vertical", loop: false, typeahead: D.typeahead, entry: D.entry, selectMode: D.selectMode, followFocus: D.followFocus, tab: "escape", activate: "manual", dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
  { role: "disclosure", orient: D.orient, loop: D.loop, typeahead: D.typeahead, entry: D.entry, selectMode: D.selectMode, followFocus: D.followFocus, tab: "flow", activate: "manual", dismissEsc: D.dismissEsc, autoFocus: D.autoFocus },
];

// ═══════════════════════════════════════════════════════════════════
// Tests — one test per role, verifying all 10 properties at once
// ═══════════════════════════════════════════════════════════════════

describe("Role Presets vs SPEC §7 Table", () => {
  it.each(specTable.map((row) => [row.role, row] as const))(
    'role="%s" matches SPEC §7',
    (_roleName, row) => {
      const config = resolveRole(row.role);

      expect(config.navigate.orientation).toBe(row.orient);
      expect(config.navigate.loop).toBe(row.loop);
      expect(config.navigate.typeahead).toBe(row.typeahead);
      expect(config.navigate.entry).toBe(row.entry);
      expect(config.select.mode).toBe(row.selectMode);
      expect(config.select.followFocus).toBe(row.followFocus);
      expect(config.tab.behavior).toBe(row.tab);
      expect(config.activate.mode).toBe(row.activate);
      expect(config.dismiss.escape).toBe(row.dismissEsc);
      expect(config.project.autoFocus).toBe(row.autoFocus);
    },
  );
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

  it("unknown role falls back to defaults", () => {
    const config = resolveRole("unknownrole");
    expect(config.navigate.orientation).toBe("vertical");
    expect(config.navigate.loop).toBe(false);
    expect(config.tab.behavior).toBe("flow");
    expect(config.select.mode).toBe("none");
  });

  it("undefined role falls back to defaults", () => {
    const config = resolveRole(undefined);
    expect(config.navigate.orientation).toBe("vertical");
    expect(config.tab.behavior).toBe("flow");
  });
});
