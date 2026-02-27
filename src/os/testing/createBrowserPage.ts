/**
 * createBrowserPage — Browser implementation of Playwright Page interface.
 *
 * Dispatches REAL PointerEvents / KeyboardEvents to the live DOM.
 * Includes visual animation (cursor movement, ripple, key badge, pass/fail stamps).
 *
 * Usage:
 *   const page = createBrowserPage(containerEl, { speed: 2 });
 *   await page.locator("apple").click();
 *   await expect(page.locator("apple")).toBeFocused();
 *
 * This is the "Inspector" engine — human verification with animation.
 * Same Page interface as createHeadlessPage(), same code runs in both.
 */

import type { Locator, LocatorAssertions, Page } from "./types";

// ═══════════════════════════════════════════════════════════════════
// Options
// ═══════════════════════════════════════════════════════════════════

export interface BrowserPageOptions {
    speed?: number;
    /** Called for each step (click, press, assert) */
    onStep?: (step: BrowserStep) => void;
}

export interface BrowserStep {
    action: "click" | "press" | "assert";
    detail: string;
    result?: "pass" | "fail";
    error?: string;
    timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════
// Visual Effects
// ═══════════════════════════════════════════════════════════════════

function wait(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
}

function findEl(id: string): Element | null {
    return (
        document.querySelector(`[data-item-id="${id}"]`) ??
        document.getElementById(id) ??
        document.querySelector(`[data-zone="${id}"]`)
    );
}

interface VisualEffects {
    readonly STEP_DELAY: number;
    readonly ANIM_DURATION: number;
    moveCursorTo(el: Element): void;
    showRipple(el: Element): void;
    showKeyBadge(key: string): void;
    showStamp(el: Element, passed: boolean): void;
    hideCursor(): void;
}

function createVisualEffects(
    container: HTMLElement,
    speed: number,
): VisualEffects {
    const STEP_DELAY = 400 / speed;
    const ANIM_DURATION = 200 / speed;

    // Create cursor element
    const cursor = document.createElement("div");
    Object.assign(cursor.style, {
        position: "absolute",
        left: "0px", top: "0px",
        width: "20px", height: "20px",
        pointerEvents: "none",
        zIndex: "99999",
        opacity: "0",
    });
    cursor.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 3l14 8-6 2-4 6z" fill="#6366f1" stroke="#fff" stroke-width="1.5"/></svg>`;
    container.style.position = "relative";
    container.appendChild(cursor);

    return {
        STEP_DELAY,
        ANIM_DURATION,

        moveCursorTo(el: Element) {
            const rect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const x = rect.left - containerRect.left + rect.width / 2;
            const y = rect.top - containerRect.top + rect.height / 2;

            cursor.style.transition = `all ${ANIM_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
            cursor.style.opacity = "1";
        },

        showRipple(el: Element) {
            const rect = el.getBoundingClientRect();
            const ripple = document.createElement("div");
            Object.assign(ripple.style, {
                position: "fixed",
                left: `${rect.left + rect.width / 2}px`,
                top: `${rect.top + rect.height / 2}px`,
                width: "0", height: "0",
                border: "3px solid #6366f1",
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: "99999",
                transition: `all ${ANIM_DURATION * 2}ms ease-out`,
            });
            document.body.appendChild(ripple);
            requestAnimationFrame(() => {
                ripple.style.width = "40px";
                ripple.style.height = "40px";
                ripple.style.opacity = "0";
            });
            setTimeout(() => ripple.remove(), ANIM_DURATION * 3);
        },

        showKeyBadge(key: string) {
            const badge = document.createElement("div");
            badge.innerHTML = `<div style="
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: #1e293b; color: white; padding: 8px 20px; border-radius: 10px;
        font-family: 'SF Mono', monospace; font-size: 14px; font-weight: 700;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 99999;
        display: flex; align-items: center; gap: 8px;
        transition: all ${ANIM_DURATION * 2}ms ease-out;
      "><span style="opacity:0.5;font-size:11px">⌨</span> ${key}</div>`;
            document.body.appendChild(badge);
            setTimeout(() => {
                const inner = badge.firstElementChild as HTMLElement;
                if (inner) { inner.style.opacity = "0"; inner.style.transform = "translateX(-50%) translateY(10px)"; }
            }, STEP_DELAY);
            setTimeout(() => badge.remove(), STEP_DELAY * 2);
        },

        showStamp(el: Element, passed: boolean) {
            const rect = el.getBoundingClientRect();
            const stamp = document.createElement("div");
            stamp.innerHTML = `<div style="
        position: fixed;
        left: ${rect.right + 8}px; top: ${rect.top + rect.height / 2 - 12}px;
        font-size: 13px; font-weight: 800; letter-spacing: 0.5px;
        color: ${passed ? "#10b981" : "#ef4444"};
        background: ${passed ? "#ecfdf5" : "#fef2f2"};
        border: 1.5px solid ${passed ? "#a7f3d0" : "#fecaca"};
        padding: 2px 10px; border-radius: 6px;
        transform: scale(0); transition: transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 99999; pointer-events: none;
      ">${passed ? "✓ PASS" : "✗ FAIL"}</div>`;
            document.body.appendChild(stamp);
            requestAnimationFrame(() => {
                const inner = stamp.firstElementChild as HTMLElement;
                if (inner) inner.style.transform = "scale(1)";
            });
            setTimeout(() => {
                const inner = stamp.firstElementChild as HTMLElement;
                if (inner) inner.style.opacity = "0";
            }, 2000);
            setTimeout(() => stamp.remove(), 2500);
        },

        hideCursor() {
            cursor.style.opacity = "0";
        },
    };
}

// ═══════════════════════════════════════════════════════════════════
// Browser Page Factory
// ═══════════════════════════════════════════════════════════════════

export interface BrowserPage extends Page {
    /** Hide the animated cursor */
    hideCursor(): void;
    /** Destroy and clean up */
    destroy(): void;
}

export function createBrowserPage(
    container: HTMLElement,
    opts?: BrowserPageOptions,
): BrowserPage {
    const speed = opts?.speed ?? 1;
    const onStep = opts?.onStep;
    const fx = createVisualEffects(container, speed);
    const startTime = Date.now();

    function timestamp() {
        return Date.now() - startTime;
    }

    function report(step: BrowserStep) {
        onStep?.(step);
    }

    // ── Browser Locator ──

    function createBrowserLocator(elementId: string): Locator & LocatorAssertions {
        const loc: Locator & LocatorAssertions & {
            _toHaveAttribute: (name: string, value: string | RegExp) => Promise<void>;
            _toBeFocused: () => Promise<void>;
        } = {
            async click(clickOpts?) {
                const el = findEl(elementId);
                if (!el) {
                    report({ action: "click", detail: `${elementId} — NOT FOUND`, result: "fail", timestamp: timestamp() });
                    return;
                }
                fx.moveCursorTo(el);
                await wait(fx.ANIM_DURATION + 50);
                fx.showRipple(el);

                const rect = el.getBoundingClientRect();
                const mods = clickOpts?.modifiers ?? [];
                const commonOpts = {
                    bubbles: true, cancelable: true, button: 0,
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2,
                    shiftKey: mods.includes("Shift"),
                    metaKey: mods.includes("Meta"),
                };

                // OS PointerListener uses pointerdown/pointerup
                el.dispatchEvent(new PointerEvent("pointerdown", { ...commonOpts, pointerId: 1, pointerType: "mouse" }));
                if (el instanceof HTMLElement) el.focus();
                await wait(30);
                el.dispatchEvent(new PointerEvent("pointerup", { ...commonOpts, pointerId: 1, pointerType: "mouse" }));

                report({ action: "click", detail: elementId, timestamp: timestamp() });
                await wait(fx.STEP_DELAY);
            },

            async getAttribute(name: string) {
                const el = findEl(elementId);
                return el?.getAttribute(name) ?? null;
            },

            // Assertions
            async toHaveAttribute(name: string, value: string | RegExp) {
                await wait(50); // let React flush
                const el = findEl(elementId);
                const actual = el?.getAttribute(name) ?? null;
                const expected = typeof value === "string" ? value : undefined;
                const passed = typeof value === "string"
                    ? actual === value
                    : actual !== null && value.test(actual);

                const displayActual = actual === null ? "(absent)" : `"${actual}"`;
                const displayExpected = expected === undefined
                    ? String(value)
                    : expected === null ? "(absent)" : `"${expected}"`;

                if (el) fx.showStamp(el, passed);
                report({
                    action: "assert",
                    detail: `${elementId}[${name}] = ${displayActual} ${passed ? "==" : "!="} ${displayExpected}`,
                    result: passed ? "pass" : "fail",
                    ...(passed ? {} : { error: `Expected ${displayExpected}, got ${displayActual}` }),
                    timestamp: timestamp(),
                });
                await wait(fx.STEP_DELAY / 2);

                if (!passed) {
                    throw new Error(`Expected ${elementId}[${name}] = ${displayExpected} but got ${displayActual}`);
                }
            },

            async toBeFocused() {
                await wait(50);
                const el = findEl(elementId);
                const activeEl = document.activeElement;
                const passed = activeEl === el ||
                    el?.getAttribute("data-focused") === "true" ||
                    (el?.contains(activeEl) ?? false);

                if (el) fx.showStamp(el, passed);
                report({
                    action: "assert",
                    detail: `${elementId} focused: ${passed}`,
                    result: passed ? "pass" : "fail",
                    timestamp: timestamp(),
                });
                await wait(fx.STEP_DELAY / 2);

                if (!passed) {
                    throw new Error(`Expected ${elementId} to be focused but it was not`);
                }
            },

            // Internal assertion hooks for expect() wrapper
            _toHaveAttribute(name: string, value: string | RegExp) {
                return loc.toHaveAttribute(name, value);
            },
            _toBeFocused() {
                return loc.toBeFocused();
            },
        };

        return loc;
    }

    // ── Page interface ──

    return {
        locator(selector: string): Locator {
            const id = selector.startsWith("#") ? selector.slice(1) : selector;
            return createBrowserLocator(id);
        },

        keyboard: {
            async press(key: string) {
                fx.showKeyBadge(key);
                const target = document.activeElement || document.body;
                target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
                target.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true, cancelable: true }));
                report({ action: "press", detail: key, timestamp: timestamp() });
                await wait(fx.STEP_DELAY);
            },
        },

        hideCursor() {
            fx.hideCursor();
        },

        destroy() {
            fx.hideCursor();
        },
    };
}
