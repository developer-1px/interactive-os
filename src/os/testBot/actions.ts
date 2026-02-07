/**
 * TestBot — Action Implementations
 *
 * Real DOM interaction actions: click, press, expect.
 * Each action dispatches real browser events and records step results.
 */

import type { BotCursor } from "./cursor";
import type { StepResult, TestActions, OnStep } from "./types";
import { BotError, KEY_LABELS, wait, getElementCenter } from "./types";

import { activeZoneGuard, sensorGuard, dispatchGuard } from "../lib/loopGuard";

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

    const resetGuards = () => {
        activeZoneGuard.reset();
        sensorGuard.reset();
        dispatchGuard.reset();
    };

    // ─────────────────────────────────────────────────────────────────
    // Click
    // ─────────────────────────────────────────────────────────────────

    const click = async (selector: string) => {
        stepCounter++;
        resetGuards();

        const el = document.querySelector(selector);
        if (!el) {
            steps.push({ action: "click", detail: selector, passed: false, error: `Element not found: ${selector}` });
            emitStep();
            throw new BotError(`Element not found: ${selector}`);
        }

        cursor.hideOffScreenPtr(); // Clear any previous indicator
        const { x, y } = getElementCenter(el);
        const rect = el.getBoundingClientRect();
        const outOfView = rect.top < 0 || rect.bottom > window.innerHeight || rect.left < 0 || rect.right > window.innerWidth;

        await cursor.moveTo(x, y, moveTime());
        cursor.trackElement(el);
        cursor.clearBubbles();
        cursor.showBubble("Click", "click"); // New explicit Click feedback
        cursor.ripple();

        const eventOpts: MouseEventInit = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 };
        el.dispatchEvent(new MouseEvent("mousedown", eventOpts));

        if (el instanceof HTMLElement) {
            el.focus();
        }

        await wait(50 / speed);
        el.dispatchEvent(new MouseEvent("mouseup", eventOpts));
        el.dispatchEvent(new MouseEvent("click", eventOpts));

        // If element was out of viewport, OS focus pipeline scrolls it in — wait and reposition cursor
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
        resetGuards();

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
        steps.push({ action, detail, passed, error: passed ? undefined : errorMsg });
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

    return { click, press, expect, wait: (ms: number) => wait(ms) };
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
        expect: (selector) => ({
            focused: async () => { steps.push({ action: "expect.focused", detail: selector, passed: true }); },
            toHaveAttr: async (attr, value) => { steps.push({ action: "expect.attr", detail: `${selector} [${attr}="${value}"]`, passed: true }); },
            toNotHaveAttr: async (attr, value) => { steps.push({ action: "expect.not_attr", detail: `${selector} [${attr}≠"${value}"]`, passed: true }); },
            toExist: async () => { steps.push({ action: "expect.exists", detail: selector, passed: true }); },
            toNotExist: async () => { steps.push({ action: "expect.not_exists", detail: selector, passed: true }); },
        }),
    };
}
