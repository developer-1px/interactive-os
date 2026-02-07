/**
 * TestBot — Core Orchestrator
 *
 * Lightweight visual test runner for in-app interaction testing.
 * Dispatches real DOM events while showing a virtual cursor.
 *
 * @example
 * const bot = testBot();
 * bot.describe("Navigation", async (t) => {
 *     await t.click("#start");
 *     await t.press("ArrowDown");
 *     await t.expect("#next").focused();
 * });
 * await bot.runAll();
 */

import { type BotCursor, createCursor } from "./cursor";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface StepResult {
    action: string;
    detail: string;
    passed: boolean;
    error?: string;
}

export interface SuiteResult {
    name: string;
    steps: StepResult[];
    passed: boolean;
}

export type OnProgress = (results: SuiteResult[]) => void;

export interface TestActions {
    click(selector: string): Promise<void>;
    press(key: string): Promise<void>;
    wait(ms: number): Promise<void>;
    expect(selector: string): {
        focused(): Promise<void>;
        toHaveAttr(attr: string, value: string): Promise<void>;
    };
}

export interface TestBot {
    describe(name: string, fn: (t: TestActions) => Promise<void>): void;
    runAll(onProgress?: OnProgress): Promise<SuiteResult[]>;
    destroy(): void;
}

// ═══════════════════════════════════════════════════════════════════
// Key Display Names
// ═══════════════════════════════════════════════════════════════════

const KEY_LABELS: Record<string, string> = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Tab: "⇥ Tab",
    Enter: "↵ Enter",
    Escape: "Esc",
    " ": "Space",
    Backspace: "⌫",
    Delete: "Del",
};

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function getElementCenter(el: Element): { x: number; y: number } {
    const rect = el.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
    };
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function testBot(opts?: { speed?: number }): TestBot {
    const speed = opts?.speed ?? 1;
    const suites: { name: string; fn: (t: TestActions) => Promise<void> }[] = [];

    let cursor: BotCursor | null = null;
    let aborted = false;

    // Time helpers adjusted by speed
    const moveTime = () => Math.round(300 / speed);
    const pauseTime = () => Math.round(120 / speed);

    // ─────────────────────────────────────────────────────────────────
    // Actions
    // ─────────────────────────────────────────────────────────────────

    function createActions(steps: StepResult[]): TestActions {
        const click = async (selector: string) => {
            const el = document.querySelector(selector);
            if (!el) {
                steps.push({
                    action: "click",
                    detail: selector,
                    passed: false,
                    error: `Element not found: ${selector}`,
                });
                throw new BotError(`Element not found: ${selector}`);
            }

            const { x, y } = getElementCenter(el);

            // Animate cursor
            await cursor!.moveTo(x, y, moveTime());
            cursor!.ripple();

            // Dispatch real mouse events
            const eventOpts: MouseEventInit = {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                button: 0,
            };
            el.dispatchEvent(new MouseEvent("mousedown", eventOpts));
            await wait(50 / speed);
            el.dispatchEvent(new MouseEvent("mouseup", eventOpts));
            el.dispatchEvent(new MouseEvent("click", eventOpts));

            steps.push({ action: "click", detail: selector, passed: true });
            await wait(pauseTime());
        };

        const press = async (key: string) => {
            const label = KEY_LABELS[key] ?? key;
            cursor!.showBadge(label);

            // Dispatch on currently focused element
            const target = document.activeElement ?? document.body;
            const eventOpts: KeyboardEventInit = {
                key,
                code: key.startsWith("Arrow") ? key : `Key${key.toUpperCase()}`,
                bubbles: true,
                cancelable: true,
            };
            target.dispatchEvent(new KeyboardEvent("keydown", eventOpts));
            await wait(50 / speed);
            target.dispatchEvent(new KeyboardEvent("keyup", eventOpts));

            steps.push({ action: "press", detail: label, passed: true });
            await wait(pauseTime());
        };

        const expect = (selector: string) => ({
            focused: async () => {
                await wait(60); // Let DOM settle

                const el = document.querySelector(selector);
                const activeEl = document.activeElement;
                const isFocused = el && activeEl === el;

                // Also check by ID as fallback (common pattern)
                const activeId = activeEl?.id;
                const targetId = selector.startsWith("#") ? selector.slice(1) : null;
                const idMatch = targetId && activeId === targetId;

                const passed = !!(isFocused || idMatch);

                steps.push({
                    action: "expect.focused",
                    detail: selector,
                    passed,
                    error: passed
                        ? undefined
                        : `Expected ${selector} focused, got ${activeId ? `#${activeId}` : activeEl?.tagName ?? "(none)"}`,
                });

                if (!passed) throw new BotError(steps[steps.length - 1].error!);
            },

            toHaveAttr: async (attr: string, value: string) => {
                await wait(60);

                const el = document.querySelector(selector);
                const actual = el?.getAttribute(attr);
                const passed = actual === value;

                steps.push({
                    action: "expect.attr",
                    detail: `${selector} [${attr}="${value}"]`,
                    passed,
                    error: passed
                        ? undefined
                        : `Expected ${attr}="${value}", got "${actual}"`,
                });

                if (!passed) throw new BotError(steps[steps.length - 1].error!);
            },
        });

        return { click, press, expect, wait };
    }

    // ─────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────

    const describe = (
        name: string,
        fn: (t: TestActions) => Promise<void>,
    ) => {
        suites.push({ name, fn });
    };

    const runAll = async (onProgress?: OnProgress): Promise<SuiteResult[]> => {
        cursor = createCursor();
        aborted = false;
        const results: SuiteResult[] = [];

        for (const suite of suites) {
            if (aborted) break;

            const steps: StepResult[] = [];
            const actions = createActions(steps);

            try {
                await suite.fn(actions);
            } catch (e) {
                // BotError is expected (assertion failure), other errors are bugs
                if (!(e instanceof BotError)) {
                    steps.push({
                        action: "error",
                        detail: String(e),
                        passed: false,
                        error: String(e),
                    });
                }
            }

            const passed = steps.length > 0 && steps.every((s) => s.passed);
            results.push({ name: suite.name, steps, passed });
            onProgress?.([...results]);

            await wait(200 / speed);
        }

        return results;
    };

    const destroy = () => {
        aborted = true;
        cursor?.destroy();
        cursor = null;
    };

    return { describe, runAll, destroy };
}

// ═══════════════════════════════════════════════════════════════════
// Internal Error (expected assertion failures)
// ═══════════════════════════════════════════════════════════════════

class BotError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BotError";
    }
}
