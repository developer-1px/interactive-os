/**
 * Role Preset Verification — OS SPEC §7
 *
 * Verifies that resolveRole() output for each ARIA role preset
 * matches the SPEC §7 Role Preset Table exactly.
 *
 * This is the automated version of the BOARD Ideas item:
 * "Role Preset 검증: roleRegistry.ts의 preset이 SPEC 7번 표와 일치하는지 자동 검증"
 *
 * Legend from SPEC §7:
 *   V=vertical, H=horizontal, 2D=both
 *   ✓=true, ✗=false, —=default
 */

import { resolveRole } from "@os/registry/roleRegistry";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// SPEC §7 Table — encoded as assertions
// ═══════════════════════════════════════════════════════════════════

/**
 * Each entry encodes one row of the SPEC §7 table.
 * "—" means "uses DEFAULT" (we verify the default value applies).
 */
interface SpecRow {
  role: string;
  orient: "vertical" | "horizontal" | "both";
  loop: boolean;
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
  entry: "first" as const,
  selectMode: "none" as const,
  followFocus: false,
  tab: "flow" as const,
  activate: "manual" as const,
  dismissEsc: "none" as const,
  autoFocus: false,
};

const specTable: SpecRow[] = [
  // | group        | V  | — | — | none     | — | flow   | —      | —     | — |
  {
    role: "group",
    orient: D.orient,
    loop: D.loop,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: D.tab,
    activate: D.activate,
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | listbox      | V  | ✗ | selected | single | ✓ | escape | —      | —     | — |
  {
    role: "listbox",
    orient: "vertical",
    loop: false,
    entry: "selected",
    selectMode: "single",
    followFocus: true,
    tab: "escape",
    activate: D.activate,
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | menu         | V  | ✓ | first    | none   | — | trap   | auto   | close | ✓ |
  {
    role: "menu",
    orient: "vertical",
    loop: true,
    entry: "first",
    selectMode: "none",
    followFocus: D.followFocus,
    tab: "trap",
    activate: "automatic",
    dismissEsc: "close",
    autoFocus: true,
  },

  // | menubar      | H  | ✓ | restore  | none   | — | escape | auto   | —     | — |
  {
    role: "menubar",
    orient: "horizontal",
    loop: true,
    entry: "restore",
    selectMode: "none",
    followFocus: D.followFocus,
    tab: "escape",
    activate: "automatic",
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | radiogroup   | V  | ✓ | selected | single | ✓ | escape | —      | —     | — |
  {
    role: "radiogroup",
    orient: "vertical",
    loop: true,
    entry: "selected",
    selectMode: "single",
    followFocus: true,
    tab: "escape",
    activate: D.activate,
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | tablist      | H  | ✓ | selected | single | ✓ | escape | auto   | —     | — |
  {
    role: "tablist",
    orient: "horizontal",
    loop: true,
    entry: "selected",
    selectMode: "single",
    followFocus: true,
    tab: "escape",
    activate: "automatic",
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | toolbar      | H  | ✓ | restore  | none   | — | escape | —      | —     | — |
  {
    role: "toolbar",
    orient: "horizontal",
    loop: true,
    entry: "restore",
    selectMode: "none",
    followFocus: D.followFocus,
    tab: "escape",
    activate: D.activate,
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | grid         | 2D | ✗ | —        | multiple | ✗ | escape | —    | —     | — |
  {
    role: "grid",
    orient: "both",
    loop: false,
    entry: D.entry,
    selectMode: "multiple",
    followFocus: false,
    tab: "escape",
    activate: D.activate,
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | treegrid     | 2D | ✗ | —        | multiple | ✗ | escape | manual | —   | — |
  {
    role: "treegrid",
    orient: "both",
    loop: false,
    entry: D.entry,
    selectMode: "multiple",
    followFocus: false,
    tab: "escape",
    activate: "manual",
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | tree         | V  | ✗ | selected | single   | ✗ | escape | manual | —   | — |
  {
    role: "tree",
    orient: "vertical",
    loop: false,
    entry: "selected",
    selectMode: "single",
    followFocus: false,
    tab: "escape",
    activate: "manual",
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | dialog       | V  | — | —        | —        | — | trap   | —      | close | ✓ |
  {
    role: "dialog",
    orient: D.orient,
    loop: D.loop,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: "trap",
    activate: D.activate,
    dismissEsc: "close",
    autoFocus: true,
  },

  // | alertdialog  | V  | — | —        | —        | — | trap   | —      | close | ✓ |
  {
    role: "alertdialog",
    orient: D.orient,
    loop: D.loop,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: "trap",
    activate: D.activate,
    dismissEsc: "close",
    autoFocus: true,
  },

  // | combobox     | V  | ✗ | —        | single   | ✓ | escape | —      | close | — |
  {
    role: "combobox",
    orient: "vertical",
    loop: false,
    entry: D.entry,
    selectMode: "single",
    followFocus: true,
    tab: "escape",
    activate: D.activate,
    dismissEsc: "close",
    autoFocus: D.autoFocus,
  },

  // | feed         | V  | ✗ | —        | —        | — | escape | —      | —     | — |
  {
    role: "feed",
    orient: "vertical",
    loop: false,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: "escape",
    activate: D.activate,
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | accordion    | V  | ✗ | —        | —        | — | escape | manual | —     | — |
  {
    role: "accordion",
    orient: "vertical",
    loop: false,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: "escape",
    activate: "manual",
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },

  // | disclosure   | — (V default) | — | — | — | — | flow | manual | — | — |
  {
    role: "disclosure",
    orient: D.orient,
    loop: D.loop,
    entry: D.entry,
    selectMode: D.selectMode,
    followFocus: D.followFocus,
    tab: "flow",
    activate: "manual",
    dismissEsc: D.dismissEsc,
    autoFocus: D.autoFocus,
  },
];

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("Role Presets vs SPEC §7 Table", () => {
  for (const row of specTable) {
    describe(`role="${row.role}"`, () => {
      const config = resolveRole(row.role);

      it(`orientation = ${row.orient}`, () => {
        expect(config.navigate.orientation).toBe(row.orient);
      });

      it(`loop = ${row.loop}`, () => {
        expect(config.navigate.loop).toBe(row.loop);
      });

      it(`entry = ${row.entry}`, () => {
        expect(config.navigate.entry).toBe(row.entry);
      });

      it(`select.mode = ${row.selectMode}`, () => {
        expect(config.select.mode).toBe(row.selectMode);
      });

      it(`select.followFocus = ${row.followFocus}`, () => {
        expect(config.select.followFocus).toBe(row.followFocus);
      });

      it(`tab.behavior = ${row.tab}`, () => {
        expect(config.tab.behavior).toBe(row.tab);
      });

      it(`activate.mode = ${row.activate}`, () => {
        expect(config.activate.mode).toBe(row.activate);
      });

      it(`dismiss.escape = ${row.dismissEsc}`, () => {
        expect(config.dismiss.escape).toBe(row.dismissEsc);
      });

      it(`project.autoFocus = ${row.autoFocus}`, () => {
        expect(config.project.autoFocus).toBe(row.autoFocus);
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// resolveRole helper behavior
// ═══════════════════════════════════════════════════════════════════

describe("resolveRole — override merging", () => {
  it("overrides merge on top of role preset", () => {
    const config = resolveRole("listbox", { navigate: { loop: true } });
    // Role says loop: false, override says loop: true → override wins
    expect(config.navigate.loop).toBe(true);
    // Other preset values preserved
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
