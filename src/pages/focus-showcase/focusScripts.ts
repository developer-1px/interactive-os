/**
 * focus-showcase TestBot scripts
 *
 * 29 E2E tests → TestBot scripts, organized by spec section.
 * Zone IDs match exactly what each TestBox component renders.
 * Ported 1:1 from focus-showcase.spec.ts.
 */

import type { TestScript } from "@os/testing";

// ═══════════════════════════════════════════════════════════════════
// §3.2 ENTRY / AUTOFOCUS  (AutofocusTest)
// ═══════════════════════════════════════════════════════════════════

const entryFirstLastScript: TestScript = {
    name: "Entry: first/last — click transfers aria-current",
    async run(page, expect) {
        await page.locator("#af-auto-1").click();
        await expect(page.locator("#af-auto-1")).toHaveAttribute("aria-current", "true");

        await page.locator("#af-auto-2").click();
        await expect(page.locator("#af-auto-2")).toHaveAttribute("aria-current", "true");
        await expect(page.locator("#af-auto-1")).not.toHaveAttribute("aria-current", "true");

        await page.locator("#af-last-top").click();
        await expect(page.locator("#af-last-top")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#af-last-middle")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#af-last-bottom")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#af-last-middle")).toHaveAttribute("aria-current", "true");
    },
};

const entryRestoreScript: TestScript = {
    name: "Entry: restore — re-entering zone restores last focused item",
    async run(page, expect) {
        await page.locator("#af-restore-2").click();
        await expect(page.locator("#af-restore-2")).toHaveAttribute("aria-current", "true");

        await page.locator("#af-auto-1").click();
        await expect(page.locator("#af-auto-1")).toHaveAttribute("aria-current", "true");
        await expect(page.locator("#af-restore-2")).not.toHaveAttribute("aria-current", "true");

        await page.locator("#af-restore").click();
        await expect(page.locator("#af-restore-2")).toHaveAttribute("aria-current", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.2 NAVIGATE  (NavigateTest)
// ═══════════════════════════════════════════════════════════════════

const navVerticalLoopScript: TestScript = {
    name: "Navigate: Vertical Loop — wraps at boundaries",
    async run(page, expect) {
        await page.locator("#nav-apple").click();
        await expect(page.locator("#nav-apple")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#nav-cherry")).toHaveAttribute("aria-current", "true");
        await expect(page.locator("#nav-apple")).not.toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#nav-apple")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#nav-banana")).toHaveAttribute("aria-current", "true");
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#nav-cherry")).toHaveAttribute("aria-current", "true");
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#nav-apple")).toHaveAttribute("aria-current", "true");
    },
};

const navHorizontalClampedScript: TestScript = {
    name: "Navigate: Horizontal Clamped — stops at boundaries",
    async run(page, expect) {
        await page.locator("#nav-bold").click();
        await expect(page.locator("#nav-bold")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowLeft");
        await expect(page.locator("#nav-bold")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#nav-italic")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#nav-underline")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#nav-underline")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowLeft");
        await expect(page.locator("#nav-italic")).toHaveAttribute("aria-current", "true");
    },
};

const navGridScript: TestScript = {
    name: "Navigate: 2D Grid — spatial movement in 3×3",
    async run(page, expect) {
        await page.locator("#nav-cell-0").click();
        await expect(page.locator("#nav-cell-0")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#nav-cell-1")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#nav-cell-2")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#nav-cell-5")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#nav-cell-8")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowLeft");
        await expect(page.locator("#nav-cell-7")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowLeft");
        await expect(page.locator("#nav-cell-6")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#nav-cell-3")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#nav-cell-0")).toHaveAttribute("aria-current", "true");
    },
};

const navHomeEndScript: TestScript = {
    name: "Navigate: Home/End — jumps to first/last item",
    async run(page, expect) {
        await page.locator("#nav-banana").click();
        await expect(page.locator("#nav-banana")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("Home");
        await expect(page.locator("#nav-apple")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("End");
        await expect(page.locator("#nav-cherry")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("Home");
        await expect(page.locator("#nav-apple")).toHaveAttribute("aria-current", "true");

        await page.locator("#nav-italic").click();
        await page.keyboard.press("Home");
        await expect(page.locator("#nav-bold")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("End");
        await expect(page.locator("#nav-underline")).toHaveAttribute("aria-current", "true");
    },
};

const navOrthogonalScript: TestScript = {
    name: "Navigate: orthogonal direction ignored",
    async run(page, expect) {
        await page.locator("#nav-banana").click();
        await page.keyboard.press("ArrowLeft");
        await expect(page.locator("#nav-banana")).toHaveAttribute("aria-current", "true");
        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#nav-banana")).toHaveAttribute("aria-current", "true");

        await page.locator("#nav-italic").click();
        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#nav-italic")).toHaveAttribute("aria-current", "true");
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#nav-italic")).toHaveAttribute("aria-current", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.4 SELECTION  (SelectTest)
// ═══════════════════════════════════════════════════════════════════

const selMultiCmdClickScript: TestScript = {
    name: "Select: Multi — Cmd+Click toggles individual items",
    async run(page, expect) {
        await page.locator("#sel-range-0").click();
        await expect(page.locator("#sel-range-0")).toHaveAttribute("aria-selected", "true");

        await page.locator("#sel-range-2").click({ modifiers: ["Meta"] });
        await expect(page.locator("#sel-range-2")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#sel-range-0")).toHaveAttribute("aria-selected", "true");

        await page.locator("#sel-range-1").click({ modifiers: ["Meta"] });
        await expect(page.locator("#sel-range-1")).toHaveAttribute("aria-selected", "true");

        await page.locator("#sel-range-1").click({ modifiers: ["Meta"] });
        await expect(page.locator("#sel-range-1")).not.toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#sel-range-0")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#sel-range-2")).toHaveAttribute("aria-selected", "true");
    },
};

const selShiftClickRangeScript: TestScript = {
    name: "Select: Multi — Shift+Click selects range",
    async run(page, expect) {
        await page.locator("#sel-range-0").click();
        await expect(page.locator("#sel-range-0")).toHaveAttribute("aria-selected", "true");

        await page.locator("#sel-range-3").click({ modifiers: ["Shift"] });
        await expect(page.locator("#sel-range-0")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#sel-range-1")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#sel-range-2")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#sel-range-3")).toHaveAttribute("aria-selected", "true");
    },
};

const selSingleToggleScript: TestScript = {
    name: "Select: Single Toggle — only one item selected at a time",
    async run(page, expect) {
        await page.locator("#sel-toggle-0").click();
        await expect(page.locator("#sel-toggle-0")).toHaveAttribute("aria-selected", "true");

        await page.locator("#sel-toggle-1").click();
        await expect(page.locator("#sel-toggle-1")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#sel-toggle-0")).not.toHaveAttribute("aria-selected", "true");

        await page.locator("#sel-toggle-0").click();
        await expect(page.locator("#sel-toggle-0")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#sel-toggle-1")).not.toHaveAttribute("aria-selected", "true");
    },
};

const selFollowFocusScript: TestScript = {
    name: "Select: Follow Focus — arrow key moves selection",
    async run(page, expect) {
        await page.locator("#sel-radio-a").click();
        // role="radio" items use aria-checked (per ZIFT roleRegistry CHECKED_ROLES)
        await expect(page.locator("#sel-radio-a")).toHaveAttribute("aria-checked", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#sel-radio-b")).toHaveAttribute("aria-checked", "true");
        await expect(page.locator("#sel-radio-a")).not.toHaveAttribute("aria-checked", "true");

        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#sel-radio-a")).toHaveAttribute("aria-checked", "true");
        await expect(page.locator("#sel-radio-b")).not.toHaveAttribute("aria-checked", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.3 TAB  (TabTest)
// ═══════════════════════════════════════════════════════════════════

const tabTrapScript: TestScript = {
    name: "Tab: Trap — cycles within zone in both directions",
    async run(page, expect) {
        await page.locator("#tab-trap-0").click();
        await expect(page.locator("#tab-trap-0")).toBeFocused();

        await page.keyboard.press("Tab");
        await expect(page.locator("#tab-trap-1")).toBeFocused();

        await page.keyboard.press("Tab");
        await expect(page.locator("#tab-trap-2")).toBeFocused();

        await page.keyboard.press("Tab");
        await expect(page.locator("#tab-trap-0")).toBeFocused();

        await page.keyboard.press("Shift+Tab");
        await expect(page.locator("#tab-trap-2")).toBeFocused();

        await page.keyboard.press("Shift+Tab");
        await expect(page.locator("#tab-trap-1")).toBeFocused();
    },
};

const tabEscapeScript: TestScript = {
    name: "Tab: Escape — exits zone immediately on Tab",
    async run(page, expect) {
        await page.locator("#tab-escape-0").click();
        await expect(page.locator("#tab-escape-0")).toBeFocused();

        await page.keyboard.press("Tab");
        await expect(page.locator("#tab-escape-0")).not.toBeFocused();
        await expect(page.locator("#tab-escape-1")).not.toBeFocused();
        await expect(page.locator("#tab-escape-2")).not.toBeFocused();

        await page.locator("#tab-escape-1").click();
        await page.keyboard.press("Shift+Tab");
        await expect(page.locator("#tab-escape-1")).not.toBeFocused();
    },
};

const tabFlowScript: TestScript = {
    name: "Tab: Flow — walks through items then exits at boundary",
    async run(page, expect) {
        await page.locator("#tab-flow-0").click();
        await expect(page.locator("#tab-flow-0")).toBeFocused();

        await page.keyboard.press("Tab");
        await expect(page.locator("#tab-flow-1")).toBeFocused();

        await page.keyboard.press("Tab");
        await expect(page.locator("#tab-flow-2")).toBeFocused();

        await page.keyboard.press("Tab");
        await expect(page.locator("#tab-flow-0")).not.toBeFocused();
        await expect(page.locator("#tab-flow-2")).not.toBeFocused();

        await page.locator("#tab-flow-0").click();
        await page.keyboard.press("Shift+Tab");
        await expect(page.locator("#tab-flow-0")).not.toBeFocused();
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.5 INTERACTION — Activate  (ActivateTest)
// ═══════════════════════════════════════════════════════════════════

const activateAutoScript: TestScript = {
    name: "Activate: Automatic — focus triggers immediate selection",
    async run(page, expect) {
        await page.locator("#act-auto-a").click();
        await expect(page.locator("#act-auto-a")).toBeFocused();
        await expect(page.locator("#act-auto-a")).toHaveAttribute("aria-selected", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#act-auto-b")).toBeFocused();
        await expect(page.locator("#act-auto-b")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#act-auto-a")).not.toHaveAttribute("aria-selected", "true");

        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#act-auto-a")).toBeFocused();
        await expect(page.locator("#act-auto-a")).toHaveAttribute("aria-selected", "true");
    },
};

const activateManualScript: TestScript = {
    name: "Activate: Manual — listbox followFocus still selects on move",
    async run(page, expect) {
        await page.locator("#act-manual-1").click();
        await expect(page.locator("#act-manual-1")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#act-manual-2")).toHaveAttribute("aria-current", "true");
        await expect(page.locator("#act-manual-2")).toHaveAttribute("aria-selected", "true");
        await expect(page.locator("#act-manual-1")).not.toHaveAttribute("aria-selected", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.5 INTERACTION — Dismiss  (DismissTest)
// ═══════════════════════════════════════════════════════════════════

const dismissDeselect: TestScript = {
    name: "Dismiss: Escape=deselect — clears selection on Escape",
    async run(page, expect) {
        await page.locator("#dis-esc-1").click();
        await expect(page.locator("#dis-esc-1")).toHaveAttribute("aria-selected", "true");

        await page.keyboard.press("Escape");
        await expect(page.locator("#dis-esc-1")).not.toHaveAttribute("aria-selected", "true");

        await page.locator("#dis-esc-2").click();
        await expect(page.locator("#dis-esc-2")).toHaveAttribute("aria-selected", "true");

        await page.keyboard.press("Escape");
        await expect(page.locator("#dis-esc-2")).not.toHaveAttribute("aria-selected", "true");
    },
};

const dismissCloseScript: TestScript = {
    name: "Dismiss: Escape=close — menu navigation still works",
    async run(page, expect) {
        await page.locator("#dis-close-A").click();
        await expect(page.locator("#dis-close-A")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#dis-close-B")).toHaveAttribute("aria-current", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.7 EXPAND  (ExpandTest)
// ═══════════════════════════════════════════════════════════════════

const expandToggleScript: TestScript = {
    name: "Expand: Tree Toggle — expand/collapse via arrows and Enter",
    async run(page, expect) {
        await page.locator("#tree-parent-1").click();
        await expect(page.locator("#tree-parent-1")).toHaveAttribute("aria-expanded", "true");

        await page.keyboard.press("ArrowLeft");
        await expect(page.locator("#tree-parent-1")).toHaveAttribute("aria-expanded", "false");

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#tree-parent-1")).toHaveAttribute("aria-expanded", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#tree-child-1-1")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#tree-child-1-2")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#tree-child-1-1")).toHaveAttribute("aria-current", "true");
        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#tree-parent-1")).toHaveAttribute("aria-current", "true");
    },
};

const expandSkipHiddenScript: TestScript = {
    name: "Expand: collapsed parent — ArrowDown skips hidden children",
    async run(page, expect) {
        await page.locator("#tree-parent-1").click();
        await expect(page.locator("#tree-parent-1")).toHaveAttribute("aria-expanded", "true");

        await page.keyboard.press("ArrowLeft");
        await expect(page.locator("#tree-parent-1")).toHaveAttribute("aria-expanded", "false");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#tree-parent-2")).toHaveAttribute("aria-current", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.1 FOCUS STACK  (FocusStackTest)
// ═══════════════════════════════════════════════════════════════════

const focusStackSingleScript: TestScript = {
    name: "Focus Stack: single modal — restore on close",
    async run(page, expect) {
        await page.locator("#fs-open-modal").click();
        await expect(page.locator("#fs-modal1-1")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#fs-modal1-2")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("Escape");
        await expect(page.locator("#fs-base-1")).toHaveAttribute("aria-current", "true");
    },
};

const focusStackNestedScript: TestScript = {
    name: "Focus Stack: nested modals — double push/pop restores correctly",
    async run(page, expect) {
        await page.locator("#fs-open-modal").click();
        await expect(page.locator("#fs-modal1-1")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#fs-modal1-2")).toHaveAttribute("aria-current", "true");

        await page.locator("#fs-open-sub-modal").click();
        await expect(page.locator("#fs-modal2-1")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#fs-modal2-2")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("Escape");
        await expect(page.locator("#fs-modal1-2")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("Escape");
        await expect(page.locator("#fs-base-1")).toHaveAttribute("aria-current", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §9 ARIA VERIFICATION  (AriaFacadeTest + AriaInteractionTest)
// ═══════════════════════════════════════════════════════════════════

const ariaTabIndexScript: TestScript = {
    name: "ARIA: tabIndex roving — focused item gets 0, others -1",
    async run(page, expect) {
        await page.locator("#nav-apple").click();
        await expect(page.locator("#nav-apple")).toHaveAttribute("tabindex", "0");
        await expect(page.locator("#nav-banana")).toHaveAttribute("tabindex", "-1");
        await expect(page.locator("#nav-cherry")).toHaveAttribute("tabindex", "-1");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#nav-banana")).toHaveAttribute("tabindex", "0");
        await expect(page.locator("#nav-apple")).toHaveAttribute("tabindex", "-1");
    },
};

const ariaDataFocusedScript: TestScript = {
    name: "ARIA: data-focused reflects visual focus state",
    async run(page, expect) {
        await page.locator("#nav-apple").click();
        await expect(page.locator("#nav-apple")).toHaveAttribute("data-focused", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#nav-banana")).toHaveAttribute("data-focused", "true");
        await expect(page.locator("#nav-apple")).not.toHaveAttribute("data-focused", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.2 TYPEAHEAD  (TypeaheadTest)
// ═══════════════════════════════════════════════════════════════════

const typeaheadJumpScript: TestScript = {
    name: "Typeahead: pressing 'c' jumps to Cherry",
    async run(page, expect) {
        await page.locator("#ta-apple").click();
        await expect(page.locator("#ta-apple")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("c");
        await expect(page.locator("#ta-cherry")).toHaveAttribute("aria-current", "true");
    },
};

const typeaheadWrapScript: TestScript = {
    name: "Typeahead: pressing 'b' from Date wraps to Banana",
    async run(page, expect) {
        await page.locator("#ta-date").click();
        await expect(page.locator("#ta-date")).toHaveAttribute("aria-current", "true");

        await page.keyboard.press("b");
        await expect(page.locator("#ta-banana")).toHaveAttribute("aria-current", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.2 DISABLED ITEMS  (DisabledTest)
// ═══════════════════════════════════════════════════════════════════

const disabledSkipScript: TestScript = {
    name: "Disabled: ArrowDown skips disabled items",
    async run(page, expect) {
        await page.locator("#dis-1").click();
        await expect(page.locator("#dis-1")).toHaveAttribute("aria-current", "true");

        // ArrowDown should skip dis-2 (disabled) and dis-3 (disabled) → land on dis-4
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#dis-4")).toHaveAttribute("aria-current", "true");

        // ArrowDown once more → dis-5
        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#dis-5")).toHaveAttribute("aria-current", "true");
    },
};

const disabledSkipUpScript: TestScript = {
    name: "Disabled: ArrowUp skips disabled items backwards",
    async run(page, expect) {
        await page.locator("#dis-4").click();
        await expect(page.locator("#dis-4")).toHaveAttribute("aria-current", "true");

        // ArrowUp should skip dis-3 and dis-2 → land on dis-1
        await page.keyboard.press("ArrowUp");
        await expect(page.locator("#dis-1")).toHaveAttribute("aria-current", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.6 TABLIST  (TablistTest)
// ═══════════════════════════════════════════════════════════════════

const tablistNavigateScript: TestScript = {
    name: "Tablist: ArrowRight moves to next tab with selection",
    async run(page, expect) {
        await page.locator("#tl-tab-1").click();
        await expect(page.locator("#tl-tab-1")).toHaveAttribute("aria-selected", "true");

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#tl-tab-2")).toHaveAttribute("aria-current", "true");
        await expect(page.locator("#tl-tab-2")).toHaveAttribute("aria-selected", "true");

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#tl-tab-3")).toHaveAttribute("aria-selected", "true");
    },
};

const tablistLoopScript: TestScript = {
    name: "Tablist: ArrowRight loops from last to first",
    async run(page, expect) {
        await page.locator("#tl-tab-3").click();
        await expect(page.locator("#tl-tab-3")).toHaveAttribute("aria-selected", "true");

        await page.keyboard.press("ArrowRight");
        await expect(page.locator("#tl-tab-1")).toHaveAttribute("aria-selected", "true");
    },
};

// ═══════════════════════════════════════════════════════════════════
// §3.4 RADIOGROUP  (RadiogroupTest)
// ═══════════════════════════════════════════════════════════════════

const radiogroupCheckedScript: TestScript = {
    name: "Radiogroup: ArrowDown moves focus and checks item",
    async run(page, expect) {
        await page.locator("#rg-small").click();
        await expect(page.locator("#rg-small")).toHaveAttribute("aria-checked", "true");

        await page.keyboard.press("ArrowDown");
        await expect(page.locator("#rg-medium")).toHaveAttribute("aria-checked", "true");
        await expect(page.locator("#rg-small")).toHaveAttribute("aria-checked", "false");
    },
};

// ═══════════════════════════════════════════════════════════════════
// Bundle — ordered by spec section
// ═══════════════════════════════════════════════════════════════════

export const focusShowcaseScripts: TestScript[] = [
    // §3.2 Entry
    entryFirstLastScript,
    entryRestoreScript,
    // §3.2 Navigate
    navVerticalLoopScript,
    navHorizontalClampedScript,
    navGridScript,
    navHomeEndScript,
    navOrthogonalScript,
    // §3.2 Typeahead
    typeaheadJumpScript,
    typeaheadWrapScript,
    // §3.2 Disabled
    disabledSkipScript,
    disabledSkipUpScript,
    // §3.3 Tab
    tabTrapScript,
    tabEscapeScript,
    tabFlowScript,
    // §3.4 Selection
    selMultiCmdClickScript,
    selShiftClickRangeScript,
    selSingleToggleScript,
    selFollowFocusScript,
    // §3.4 Radiogroup
    radiogroupCheckedScript,
    // §3.5 Activate
    activateAutoScript,
    activateManualScript,
    // §3.5 Dismiss
    dismissDeselect,
    dismissCloseScript,
    // §3.6 Tablist
    tablistNavigateScript,
    tablistLoopScript,
    // §3.7 Expand
    expandToggleScript,
    expandSkipHiddenScript,
    // §3.1 Focus Stack
    focusStackSingleScript,
    focusStackNestedScript,
    // §9 ARIA
    ariaTabIndexScript,
    ariaDataFocusedScript,
];
