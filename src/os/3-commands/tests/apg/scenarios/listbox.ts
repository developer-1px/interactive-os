/**
 * Listbox Scenarios — Replayable test step sequences.
 *
 * Each scenario: setup() → kernel, steps(kernel) → actions.
 * ReplayPanel wraps kernel with withRecording between setup and steps.
 * Test files use the same scenarios but add expect() assertions.
 *
 * No Vitest dependency. No DI. No factory injection.
 */

import { createTestOsKernel } from "../../integration/helpers/createTestOsKernel";

type Kernel = ReturnType<typeof createTestOsKernel>;

const ITEMS = ["apple", "banana", "cherry", "date", "elderberry"];

const SINGLE_CFG = {
    navigate: { orientation: "vertical" as const, loop: false, seamless: false, typeahead: false, entry: "first" as const, recovery: "next" as const },
    select: { mode: "single" as const, followFocus: true, disallowEmpty: false, range: false, toggle: false },
};

const MULTI_CFG = {
    navigate: { ...SINGLE_CFG.navigate },
    select: { mode: "multiple" as const, followFocus: false, disallowEmpty: false, range: true, toggle: false },
};

function single(focused = "apple"): Kernel {
    const t = createTestOsKernel();
    t.setItems(ITEMS);
    t.setConfig(SINGLE_CFG);
    t.setActiveZone("listbox", focused);
    t.dispatch(t.OS_SELECT({ targetId: focused, mode: "replace" }));
    return t;
}

function multi(focused = "apple"): Kernel {
    const t = createTestOsKernel();
    t.setItems(ITEMS);
    t.setConfig(MULTI_CFG);
    t.setActiveZone("listbox", focused);
    return t;
}

// ── Scenario ──

export interface Scenario {
    name: string;
    suite: string;
    /** Creates configured kernel. No pressKey/click/attrs here. */
    setup: () => Kernel;
    /** Runs test actions. Only pressKey/click/attrs. */
    steps: (t: Kernel) => void;
}

export const listboxScenarios: Scenario[] = [
    {
        suite: "Navigation",
        name: "ArrowDown moves focus",
        setup: () => single("apple"),
        steps: (t) => { t.pressKey("ArrowDown"); t.attrs("banana"); },
    },
    {
        suite: "Navigation",
        name: "ArrowUp moves focus",
        setup: () => single("cherry"),
        steps: (t) => { t.pressKey("ArrowUp"); t.attrs("banana"); },
    },
    {
        suite: "Navigation",
        name: "Boundary clamp at bottom",
        setup: () => single("elderberry"),
        steps: (t) => { t.pressKey("ArrowDown"); t.attrs("elderberry"); },
    },
    {
        suite: "Single-Select",
        name: "followFocus selects on ArrowDown",
        setup: () => single("apple"),
        steps: (t) => { t.pressKey("ArrowDown"); t.attrs("banana"); t.attrs("apple"); },
    },
    {
        suite: "Multi-Select",
        name: "ArrowDown moves without selecting",
        setup: () => multi("apple"),
        steps: (t) => { t.pressKey("ArrowDown"); t.attrs("banana"); t.attrs("apple"); },
    },
    {
        suite: "Multi-Select",
        name: "Space toggles selection",
        setup: () => multi("banana"),
        steps: (t) => { t.pressKey("Space"); t.attrs("banana"); },
    },
    {
        suite: "Multi-Select",
        name: "Shift+Down extends range",
        setup: () => multi("banana"),
        steps: (t) => {
            t.dispatch(t.OS_SELECT({ targetId: "banana", mode: "replace" }));
            t.pressKey("Shift+ArrowDown");
            t.attrs("banana");
            t.attrs("cherry");
        },
    },
    {
        suite: "Multi-Select",
        name: "Shift+Down × 3 progressive",
        setup: () => multi("apple"),
        steps: (t) => {
            t.dispatch(t.OS_SELECT({ targetId: "apple", mode: "replace" }));
            t.pressKey("Shift+ArrowDown");
            t.pressKey("Shift+ArrowDown");
            t.pressKey("Shift+ArrowDown");
            t.attrs("apple");
            t.attrs("banana");
            t.attrs("cherry");
            t.attrs("date");
            t.attrs("elderberry");
        },
    },
];
