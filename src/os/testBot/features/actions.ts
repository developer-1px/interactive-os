/**
 * TestBot — Action Implementations
 *
 * Real DOM interaction actions: click, press, expect.
 * Each action dispatches real browser events and records step results.
 */

import type { BotCursor } from "../entities/BotCursor";
import type { StepResult } from "../entities/StepResult";
import type { TestActions } from "../entities/TestActions";
import type { OnStep } from "../entities/SuiteResult";

// ═══════════════════════════════════════════════════════════════════
// Constants & Helpers
// ═══════════════════════════════════════════════════════════════════

export const KEY_LABELS: Record<string, string> = {
    ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
    Tab: "⇥ Tab", Enter: "↵ Enter", Escape: "Esc",
    " ": "Space", Backspace: "⌫", Delete: "Del",
};

export class BotError extends Error {
    constructor(message: string) { super(message); this.name = "BotError"; }
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function getElementCenter(el: Element) {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Capture useful debugging context when an error occurs.
 * Reports active element and parent HTML structure.
 */
function captureFailureContext(): string {
    const active = document.activeElement;
    let context = "\n\n[Failure Context]";

    if (active) {
        const id = active.id ? `#${active.id}` : "";
        const cls = active.className ? `.${active.className.split(" ").join(".")}` : "";
        context += `\n→ Active Element: <${active.tagName.toLowerCase()}${id}${cls}>`;
        if (active.textContent) {
            const text = active.textContent.slice(0, 50).trim().replace(/\s+/g, " ");
            context += ` "${text}${active.textContent.length > 50 ? "..." : ""}"`;
        }
    } else {
        context += "\n→ Active Element: (none)";
    }

    // Capture surrounding HTML of the active element or body if nothing active
    const target = active || document.body;
    if (target) {
        // Simple outerHTML snippet
        const html = target.outerHTML;
        const snippet = html.length > 300 ? html.slice(0, 300) + "..." : html;
        context += `\n→ Target Snippet: ${snippet}`;
    }

    return context;
}

/**
 * Helper to generate a unique selector for an element.
 * 1. ID
 * 2. Data attributes
 * 3. Tag + nth-of-type fallback
 */
function getUniqueSelector(el: Element): string {
    if (el.id) return `#${el.id}`;

    // Try data attributes common in this app
    const testId = el.getAttribute("data-testid");
    if (testId) return `[data-testid="${testId}"]`;

    // Fallback path generation
    const path: string[] = [];
    let current: Element | null = el;
    while (current && current !== document.body) {
        let qs = current.tagName.toLowerCase();

        // Add classes if unique in parent
        if (current.className) {
            const cls = `.${current.className.split(" ").join(".")}`;
            if (current.parentElement?.querySelectorAll(qs + cls).length === 1) {
                qs += cls;
            }
        }

        path.unshift(qs);
        current = current.parentElement;
    }
    return path.join(" > ");
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

interface ActionContext {
    cursor: BotCursor;
    speed: number;
    onStep?: OnStep;
    suiteIndex: number;
}

export function createActions(steps: StepResult[], ctx: ActionContext): TestActions {
    const { cursor, speed } = ctx;
    let stepCounter = 0;

    const moveTime = () => Math.round(300 / speed);
    const pauseTime = () => Math.round(120 / speed);

    const emitStep = () => {
        ctx.onStep?.(ctx.suiteIndex, steps[steps.length - 1]);
    };

    // ─────────────────────────────────────────────────────────────────
    // Semantic Selectors (LLM Helpers)
    // ─────────────────────────────────────────────────────────────────

    const getByText = async (text: string): Promise<string> => {
        // Simple inefficient text search for now
        // In real impl, use TreeWalker or XPath for better performance
        const elements = Array.from(document.querySelectorAll("*"));
        const match = elements.find(el =>
            el.children.length === 0 && el.textContent?.trim() === text
        );

        if (!match) throw new BotError(`Element with text "${text}" not found`);
        return getUniqueSelector(match);
    };

    const getByRole = async (role: string, name?: string): Promise<string> => {
        const selector = name
            ? `[role="${role}"][aria-label="${name}"], [role="${role}"][name="${name}"]`
            : `[role="${role}"]`;

        const el = document.querySelector(selector);
        if (!el) throw new BotError(`Element with role="${role}"${name ? ` name="${name}"` : ""} not found`);
        return getUniqueSelector(el);
    };

    // ─────────────────────────────────────────────────────────────────
    // Click
    // ─────────────────────────────────────────────────────────────────

    const click = async (selector: string) => {
        stepCounter++;

        const el = document.querySelector(selector);
        if (!el) {
            const context = captureFailureContext();
            steps.push({
                action: "click",
                detail: selector,
                passed: false,
                error: `Element not found: ${selector}${context}`
            });
            emitStep();
            throw new BotError(`Element not found: ${selector}`);
        }

        cursor.hideOffScreenPtr();
        const { x, y } = getElementCenter(el);
        const rect = el.getBoundingClientRect();
        const outOfView = rect.top < 0 || rect.bottom > window.innerHeight || rect.left < 0 || rect.right > window.innerWidth;

        await cursor.moveTo(x, y, moveTime());
        cursor.trackElement(el);
        cursor.clearBubbles();
        cursor.showBubble("Click", "click");
        cursor.ripple();

        const eventOpts: MouseEventInit = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 };
        el.dispatchEvent(new MouseEvent("mousedown", eventOpts));

        if (el instanceof HTMLElement) {
            el.focus();
        }

        await wait(50 / speed);
        el.dispatchEvent(new MouseEvent("mouseup", eventOpts));
        el.dispatchEvent(new MouseEvent("click", eventOpts));

        if (outOfView) {
            await wait(300 / speed);
            const newPos = getElementCenter(el);
            const newRect = el.getBoundingClientRect();
            const stillOutOfView = newRect.top < 0 || newRect.bottom > window.innerHeight || newRect.left < 0 || newRect.right > window.innerWidth;

            if (stillOutOfView) {
                cursor.showOffScreenPtr(newPos.x, newPos.y);
            } else {
                await cursor.moveTo(newPos.x, newPos.y, 200);
            }
        }

        steps.push({ action: "click", detail: selector, passed: true });
        emitStep();
        await wait(pauseTime());
    };

    // ─────────────────────────────────────────────────────────────────
    // Press
    // ─────────────────────────────────────────────────────────────────

    const press = async (key: string, modifiers?: { shift?: boolean; ctrl?: boolean; alt?: boolean; meta?: boolean }) => {
        stepCounter++;

        const label = KEY_LABELS[key] ?? key;
        const modLabel = [
            modifiers?.ctrl ? 'Ctrl+' : '',
            modifiers?.shift ? 'Shift+' : '',
            modifiers?.alt ? 'Alt+' : '',
            modifiers?.meta ? 'Meta+' : '',
        ].join('') + label;

        cursor.showBubble(modLabel, "default");
        const target = document.activeElement || document.body;
        const eventInit: KeyboardEventInit = {
            key, bubbles: true, cancelable: true,
            shiftKey: modifiers?.shift, ctrlKey: modifiers?.ctrl,
            altKey: modifiers?.alt, metaKey: modifiers?.meta,
        };
        target.dispatchEvent(new KeyboardEvent("keydown", eventInit));
        target.dispatchEvent(new KeyboardEvent("keyup", eventInit));

        steps.push({ action: "press", detail: modLabel, passed: true });
        emitStep();
        await wait(pauseTime());
    };

    // ─────────────────────────────────────────────────────────────────
    // Expect
    // ─────────────────────────────────────────────────────────────────

    const assertStep = (action: string, detail: string, passed: boolean, errorMsg?: string) => {
        stepCounter++;
        cursor.showStatus(passed ? "pass" : "fail");

        let finalError = errorMsg;
        if (!passed && errorMsg) {
            finalError += captureFailureContext();
        }

        steps.push({ action, detail, passed, error: passed ? undefined : finalError });
        emitStep();
        if (!passed) throw new BotError(errorMsg!);
    };

    const expect = (selector: string) => ({
        focused: async () => {
            await wait(60);
            const el = document.querySelector(selector);
            const activeEl = document.activeElement;
            const isFocused = el && activeEl === el;
            const activeId = activeEl?.id;
            const targetId = selector.startsWith("#") ? selector.slice(1) : null;
            const idMatch = targetId && activeId === targetId;
            const passed = !!(isFocused || idMatch);

            assertStep("expect.focused", selector, passed,
                `Expected ${selector} focused, got ${activeId ? `#${activeId}` : activeEl?.tagName ?? "(none)"}`);
        },

        toHaveAttr: async (attr: string, value: string) => {
            await wait(150);
            const el = document.querySelector(selector);
            const actual = el?.getAttribute(attr);
            assertStep("expect.attr", `${selector} [${attr}="${value}"]`, actual === value,
                `Expected ${attr}="${value}", got "${actual}"`);
        },

        toNotHaveAttr: async (attr: string, value: string) => {
            await wait(150);
            const el = document.querySelector(selector);
            const actual = el?.getAttribute(attr);
            assertStep("expect.not_attr", `${selector} [${attr}≠"${value}"]`, actual !== value,
                `Expected ${attr} to NOT be "${value}", but it was`);
        },

        toExist: async () => {
            await wait(150);
            const passed = !!document.querySelector(selector);
            assertStep("expect.exists", selector, passed,
                `Expected ${selector} to exist in DOM`);
        },

        toNotExist: async () => {
            await wait(150);
            const passed = !document.querySelector(selector);
            assertStep("expect.not_exists", selector, passed,
                `Expected ${selector} to NOT exist in DOM`);
        },
    });

    return { click, press, expect, getByText, getByRole, wait: (ms: number) => wait(ms) };
}

// ═══════════════════════════════════════════════════════════════════
// Mock Actions (for dryRun)
// ═══════════════════════════════════════════════════════════════════

export function formatModLabel(key: string, modifiers?: { shift?: boolean; ctrl?: boolean; alt?: boolean; meta?: boolean }): string {
    const label = KEY_LABELS[key] ?? key;
    return [
        modifiers?.ctrl ? 'Ctrl+' : '',
        modifiers?.shift ? 'Shift+' : '',
        modifiers?.alt ? 'Alt+' : '',
        modifiers?.meta ? 'Meta+' : '',
    ].join('') + label;
}

export function createMockActions(steps: StepResult[]): TestActions {
    return {
        click: async (selector) => { steps.push({ action: "click", detail: selector, passed: true }); },
        press: async (key, modifiers) => { steps.push({ action: "press", detail: formatModLabel(key, modifiers), passed: true }); },
        wait: async () => { },
        getByText: async (text) => `[text="${text}"]`,
        getByRole: async (role, name) => `[role="${role}"]${name ? `[name="${name}"]` : ""}`,
        expect: (selector) => ({
            focused: async () => { steps.push({ action: "expect.focused", detail: selector, passed: true }); },
            toHaveAttr: async (attr, value) => { steps.push({ action: "expect.attr", detail: `${selector} [${attr}="${value}"]`, passed: true }); },
            toNotHaveAttr: async (attr, value) => { steps.push({ action: "expect.not_attr", detail: `${selector} [${attr}≠"${value}"]`, passed: true }); },
            toExist: async () => { steps.push({ action: "expect.exists", detail: selector, passed: true }); },
            toNotExist: async () => { steps.push({ action: "expect.not_exists", detail: selector, passed: true }); },
        }),
    };
}
