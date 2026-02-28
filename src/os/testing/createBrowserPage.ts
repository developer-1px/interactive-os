/**
 * createBrowserPage — Browser implementation of Playwright Page interface.
 *
 * Dispatches REAL PointerEvents / KeyboardEvents to the live DOM.
 * Visual effects use the original CSS class system (testbot-overlays.css):
 *   - Fixed cursor portal with spotlight + bubble tray
 *   - CSS-animated ripple (.testbot-ripple)
 *   - Key badge (.testbot-key-badge)
 *   - PASS!/FAIL! stamps (.testbot-stamp) with pop + rotation
 *
 * This is the "Inspector" engine — human verification with animation.
 * Same Page interface as createHeadlessPage(), same code runs in both.
 */

import type { Locator, LocatorAssertions, Page } from "./types";
import { os } from "../kernel";
import { initialOSState } from "../state/initial";

// ═══════════════════════════════════════════════════════════════════
// Test Isolation — reset kernel focus state between tests
// ═══════════════════════════════════════════════════════════════════

/**
 * Reset OS focus/overlay state to initial values.
 * Ensures each test starts from a clean slate —
 * no residual focus, expanded items, selections, or overlays.
 */
export function resetFocusState(): void {
    os.setState((prev) => ({
        ...prev,
        os: {
            ...prev.os,
            focus: initialOSState.focus,
            overlays: initialOSState.overlays,
        },
    }));
}

// ═══════════════════════════════════════════════════════════════════
// Options
// ═══════════════════════════════════════════════════════════════════

export interface BrowserPageOptions {
    speed?: number;
    /** Called for each step (click, press, assert) */
    onStep?: (step: BrowserStep) => void;
    /** Skip all visual effects and delays — instant execution */
    headless?: boolean;
}

export interface BrowserStep {
    action: "click" | "press" | "assert";
    detail: string;
    result?: "pass" | "fail";
    error?: string;
    timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════
// Visual Effects — original CSS class system
// ═══════════════════════════════════════════════════════════════════

function wait(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
}

/** Original KEY_LABELS from testbot/features/actions/constants.ts */
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
    Home: "Home",
    End: "End",
    Shift: "⇧",
    Meta: "⌘",
    Control: "⌃",
    Alt: "⌥",
};

function displayKey(key: string): string {
    return KEY_LABELS[key] ?? key;
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

/** Inject testbot overlay CSS once via inline <style> */
function injectCss() {
    if (document.getElementById("testbot-overlay-css")) return;
    const style = document.createElement("style");
    style.id = "testbot-overlay-css";
    style.textContent = `
.testbot-cursor{position:fixed;z-index:2147483647;pointer-events:none;width:24px;height:24px;transition:left .1s cubic-bezier(.25,1,.5,1),top .1s cubic-bezier(.25,1,.5,1);will-change:left,top}
.testbot-cursor-svg{width:100%;height:100%;transition:transform .1s ease-out;transform-origin:center}
.testbot-spotlight{position:absolute;width:40px;height:40px;background:radial-gradient(circle,rgba(0,122,255,.3) 0%,rgba(0,122,255,0) 70%);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:-1;mix-blend-mode:multiply}
.testbot-ripple{position:fixed;z-index:2147483645;pointer-events:none;width:60px;height:60px;border-radius:50%;border:1.5px solid rgba(0,122,255,.6);transform:translate(-50%,-50%) scale(.5);animation:testbot-ripple-expand .4s ease-out forwards}
@keyframes testbot-ripple-expand{0%{transform:translate(-50%,-50%) scale(.5);opacity:1}100%{transform:translate(-50%,-50%) scale(1.6);opacity:0}}
.testbot-key-badge{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:4px;z-index:2147483647;pointer-events:none;transition:opacity .25s ease-out,transform .25s ease-out}
.testbot-key-badge.fading{opacity:0;transform:translateX(-50%) translateY(8px)}
.testbot-keycap{display:inline-flex;align-items:center;justify-content:min-content;min-width:32px;height:32px;padding:0 10px;background:#fff;border:1px solid #cbd5e1;border-bottom:4px solid #94a3b8;border-radius:7px;font-family:'SF Mono','Fira Code','Cascadia Code',monospace;font-size:13px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:.02em;box-shadow:0 2px 6px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.8);white-space:nowrap;animation:testbot-keycap-pop .15s cubic-bezier(.34,1.56,.64,1) both}
.testbot-keycap-plus{font-size:12px;font-weight:700;color:#64748b;padding:0 2px;user-select:none}
@keyframes testbot-keycap-pop{from{transform:scale(.7);opacity:0}to{transform:scale(1);opacity:1}}
.testbot-bubble-tray{position:absolute;left:20px;top:16px;display:flex;flex-direction:row;align-items:center;gap:4px;pointer-events:none}
.testbot-bubble{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter',system-ui,sans-serif;font-size:11px;font-weight:500;letter-spacing:.01em;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.04);background:rgba(255,255,255,.96);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transform-origin:top left;animation:testbot-bubble-fadein .2s ease-out forwards}
.testbot-bubble.variant-click{color:#007aff;font-weight:600}.testbot-bubble.variant-success{color:#34c759}.testbot-bubble.variant-error{color:#ff3b30}
.testbot-bubble.variant-key{background:transparent;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;padding:2px 0;gap:3px}
.testbot-cursor-keycap{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:20px;padding:0 5px;background:#fff;border:1px solid #cbd5e1;border-bottom:3px solid #94a3b8;border-radius:4px;font-family:'SF Mono','Fira Code',monospace;font-size:9px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:.02em;box-shadow:0 1px 3px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.8);white-space:nowrap}
.testbot-cursor-keycap-plus{font-size:8px;font-weight:700;color:#94a3b8;padding:0 1px}
.testbot-bubble.fading{animation:testbot-bubble-fadeout .2s ease-in forwards}
@keyframes testbot-bubble-fadein{from{transform:translateY(2px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes testbot-bubble-fadeout{to{transform:translateY(-2px);opacity:0}}
.testbot-stamp{position:fixed;z-index:2147483640;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter',system-ui,sans-serif;font-size:12px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;padding:4px 10px;border-radius:6px;white-space:nowrap;border:2px solid;box-shadow:0 4px 12px rgba(0,0,0,.1),0 2px 4px rgba(0,0,0,.05);transform-origin:center center;animation:testbot-stamp-pop .3s cubic-bezier(.175,.885,.32,1.275) forwards;translate:-50% -50%}
.testbot-stamp.pass{color:#1a7f37;background:#dafbe1;border-color:#2da44e}
.testbot-stamp.fail{color:#d1242f;background:#ffebe9;border-color:#cf222e;z-index:2147483641}
.testbot-stamp.fading{animation:testbot-stamp-fadeout 1s ease-in forwards}
@keyframes testbot-stamp-pop{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1) rotate(var(--rotation,-3deg))}}
@keyframes testbot-stamp-fadeout{0%{opacity:1;transform:scale(1) rotate(var(--rotation,-3deg))}100%{opacity:0;transform:scale(.9) rotate(var(--rotation,-3deg))}}
.testbot-cursor[popover],.testbot-key-badge[popover]{margin:0;padding:0;border:none;background:transparent;overflow:visible;inset:unset}
.testbot-stamp[popover]{margin:0;background:transparent;overflow:visible;inset:unset}
    `.trim();
    document.head.appendChild(style);
}

/** No-op visual effects for headless/quick mode */
function createHeadlessEffects(): VisualEffects {
    return {
        STEP_DELAY: 0,
        ANIM_DURATION: 0,
        moveCursorTo() { },
        showRipple() { },
        showKeyBadge() { },
        showStamp() { },
        hideCursor() { },
    };
}

function createVisualEffects(
    _container: HTMLElement,
    speed: number,
): VisualEffects {
    const STEP_DELAY = 400 / speed;
    const ANIM_DURATION = 200 / speed;

    injectCss();

    // ── Position Tracker (vanilla port of usePositionTracker) ─────
    // Tracks stamps and cursor so they follow scroll/resize/mutations.
    interface TrackedStamp { el: Element; stampDiv: HTMLElement }
    const trackedStamps: TrackedStamp[] = [];
    let cursorTrackedEl: Element | null = null;
    let rafId = 0;

    function updatePositions() {
        // Update stamps
        for (const entry of trackedStamps) {
            if (!entry.el.isConnected) continue;
            const rect = entry.el.getBoundingClientRect();
            entry.stampDiv.style.left = `${rect.right + 8}px`;
            entry.stampDiv.style.top = `${rect.top + rect.height / 2}px`;
        }
        // Update cursor
        if (cursorTrackedEl?.isConnected) {
            const rect = cursorTrackedEl.getBoundingClientRect();
            cursorEl.style.left = `${rect.left + rect.width / 2}px`;
            cursorEl.style.top = `${rect.top + rect.height / 2}px`;
        }
    }

    function scheduleUpdate() {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updatePositions);
    }

    // Scroll (capture for nested containers), resize, DOM mutations
    document.addEventListener("scroll", scheduleUpdate, { capture: true, passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    const mo = new MutationObserver(scheduleUpdate);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });

    function cleanup() {
        cancelAnimationFrame(rafId);
        document.removeEventListener("scroll", scheduleUpdate, { capture: true });
        window.removeEventListener("resize", scheduleUpdate);
        mo.disconnect();
        // Remove any remaining stamps
        for (const entry of trackedStamps) { try { entry.stampDiv.hidePopover(); } catch { } entry.stampDiv.remove(); }
        trackedStamps.length = 0;
    }

    // ── Cursor (top-layer via Popover API — above <dialog> modals) ──
    const cursorEl = document.createElement("div");
    cursorEl.className = "testbot-cursor";
    cursorEl.setAttribute("popover", "manual");
    cursorEl.style.opacity = "0";
    cursorEl.innerHTML = `
      <div class="testbot-spotlight"></div>
      <div class="testbot-cursor-svg">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z"
                fill="#6366f1" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="testbot-bubble-tray"></div>
    `;
    document.body.appendChild(cursorEl);
    cursorEl.showPopover();

    const bubbleTray = cursorEl.querySelector(".testbot-bubble-tray") as HTMLElement;

    // Original SVG icons for bubbles
    const ICON_CLICK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`;
    const ICON_ERROR = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="4" x2="12" y2="16"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`;

    function addBubble(label: string, variant: "click" | "success" | "error") {
        const b = document.createElement("div");
        b.className = `testbot-bubble variant-${variant}`;

        // Original BubbleItem rendering logic
        if (label === "Click") {
            b.innerHTML = `${ICON_CLICK}<span style="margin-left:4px">Click</span>`;
        } else if (label === "Error") {
            b.innerHTML = ICON_ERROR;
        } else {
            // Key names like "↓", "⇧+⇥ Tab" — plain text
            b.textContent = label;
        }

        bubbleTray.appendChild(b);
        setTimeout(() => b.classList.add("fading"), 1500);
        setTimeout(() => b.remove(), 1800);
    }

    return {
        STEP_DELAY,
        ANIM_DURATION,

        moveCursorTo(el: Element) {
            cursorTrackedEl = el; // Track for scroll updates
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            cursorEl.style.transition =
                `left ${ANIM_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1), ` +
                `top ${ANIM_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1)`;
            cursorEl.style.left = `${cx}px`;
            cursorEl.style.top = `${cy}px`;
            cursorEl.style.opacity = "1";
        },

        showRipple(el: Element) {
            const rect = el.getBoundingClientRect();
            const ripple = document.createElement("div");
            ripple.className = "testbot-ripple";
            ripple.style.left = `${rect.left + rect.width / 2}px`;
            ripple.style.top = `${rect.top + rect.height / 2}px`;
            document.body.appendChild(ripple);
            addBubble("Click", "click");
            setTimeout(() => ripple.remove(), 600);
        },

        showKeyBadge(combo: string) {
            // Split "Shift+Tab" → individual keycap chips with symbols
            const keys = combo.split("+");
            const inner = keys.map((k, i) =>
                `<kbd class="testbot-keycap">${displayKey(k)}</kbd>` +
                (i < keys.length - 1 ? `<span class="testbot-keycap-plus">+</span>` : "")
            ).join("");

            const badge = document.createElement("div");
            badge.className = "testbot-key-badge";
            badge.setAttribute("popover", "manual");
            badge.innerHTML = inner;
            document.body.appendChild(badge);
            badge.showPopover();
            setTimeout(() => badge.classList.add("fading"), STEP_DELAY * 0.8);
            setTimeout(() => { try { badge.hidePopover(); } catch { } badge.remove(); }, STEP_DELAY * 1.5);

            // Cursor-side: symbolized text bubble
            const label = keys.map(displayKey).join("+");
            addBubble(label, "click");
        },

        showStamp(el: Element, passed: boolean) {
            const rect = el.getBoundingClientRect();
            const rotation = (Math.random() - 0.5) * 10; // ±5°
            const stamp = document.createElement("div");
            stamp.className = `testbot-stamp ${passed ? "pass" : "fail"}`;
            stamp.setAttribute("popover", "manual");
            stamp.style.left = `${rect.right + 8}px`;
            stamp.style.top = `${rect.top + rect.height / 2}px`;
            stamp.style.setProperty("--rotation", `${rotation}deg`);
            stamp.textContent = passed ? "PASS!" : "FAIL!";
            document.body.appendChild(stamp);
            stamp.showPopover();

            // Register for position tracking (follows scroll)
            const entry: TrackedStamp = { el, stampDiv: stamp };
            trackedStamps.push(entry);

            // Only show error bubble, no "Check" bubble
            if (!passed) {
                addBubble("Error", "error");
            }

            if (passed) {
                setTimeout(() => stamp.classList.add("fading"), 1000);
                setTimeout(() => {
                    stamp.remove();
                    const idx = trackedStamps.indexOf(entry);
                    if (idx >= 0) trackedStamps.splice(idx, 1);
                }, 2200);
            } else {
                setTimeout(() => {
                    stamp.remove();
                    const idx = trackedStamps.indexOf(entry);
                    if (idx >= 0) trackedStamps.splice(idx, 1);
                }, 4000);
            }
        },

        hideCursor() {
            cursorEl.style.opacity = "0";
            cursorTrackedEl = null;
            cleanup();
            setTimeout(() => { try { cursorEl.hidePopover(); } catch { } cursorEl.remove(); }, 300);
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
    const headless = opts?.headless ?? false;
    const onStep = opts?.onStep;
    const fx = headless ? createHeadlessEffects() : createVisualEffects(container, speed);
    // Headless: one macrotask tick for React reconciliation
    const delay = headless
        ? () => new Promise<void>((r) => setTimeout(r, 0))
        : wait;
    const startTime = Date.now();

    function timestamp() {
        return Date.now() - startTime;
    }

    function report(step: BrowserStep) {
        onStep?.(step);
    }

    // ── Browser Locator ──

    function createBrowserLocator(elementId: string): Locator & LocatorAssertions {

        // ── Assertion logic (standalone, supports negation) ──────────
        async function assertAttribute(name: string, value: string | RegExp, negated: boolean) {
            await delay(50);

            const maxAttempts = headless ? 3 : 1;
            let actual: string | null = null;
            let rawMatch = false;

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const el = findEl(elementId);
                actual = el?.getAttribute(name) ?? null;
                rawMatch = typeof value === "string"
                    ? actual === value
                    : actual !== null && value.test(actual);
                const matched = negated ? !rawMatch : rawMatch;
                if (matched) break;
                if (attempt < maxAttempts - 1) {
                    await new Promise<void>((r) => setTimeout(r, 16));
                }
            }

            const el = findEl(elementId);
            const expected = typeof value === "string" ? value : undefined;
            const passed = negated ? !rawMatch : rawMatch;

            const displayActual = actual === null ? "(absent)" : `"${actual}"`;
            const displayExpected = expected === undefined
                ? String(value)
                : expected === null ? "(absent)" : `"${expected}"`;
            const op = negated
                ? (passed ? "!=" : "==")
                : (passed ? "==" : "!=");

            if (el) fx.showStamp(el, passed);
            report({
                action: "assert",
                detail: `${elementId}[${name}] = ${displayActual} ${op} ${displayExpected}`,
                result: passed ? "pass" : "fail",
                ...(passed ? {} : {
                    error: negated
                        ? `Expected NOT ${displayExpected}, but got ${displayActual}`
                        : `Expected ${displayExpected}, got ${displayActual}`
                }),
                timestamp: timestamp(),
            });
            await delay(fx.STEP_DELAY / 2);

            if (!passed) {
                throw new Error(negated
                    ? `Expected ${elementId}[${name}] NOT to be ${displayExpected} but it was`
                    : `Expected ${elementId}[${name}] = ${displayExpected} but got ${displayActual}`);
            }
        }

        async function assertFocused(negated: boolean) {
            await delay(50);
            const el = findEl(elementId);
            const activeEl = document.activeElement;
            const rawFocused = activeEl === el ||
                el?.getAttribute("data-focused") === "true" ||
                (el?.contains(activeEl) ?? false);
            const passed = negated ? !rawFocused : rawFocused;

            if (el) fx.showStamp(el, passed);
            report({
                action: "assert",
                detail: `${elementId} ${negated ? "not " : ""}focused: ${passed}`,
                result: passed ? "pass" : "fail",
                timestamp: timestamp(),
            });
            await delay(fx.STEP_DELAY / 2);

            if (!passed) {
                throw new Error(negated
                    ? `Expected ${elementId} NOT to be focused but it was`
                    : `Expected ${elementId} to be focused but it was not`);
            }
        }

        const loc: Locator & LocatorAssertions & {
            _toHaveAttribute: (name: string, value: string | RegExp, negated?: boolean) => Promise<void>;
            _toBeFocused: (negated?: boolean) => Promise<void>;
        } = {
            async click(clickOpts?) {
                const el = findEl(elementId);
                if (!el) {
                    report({ action: "click", detail: `${elementId} — NOT FOUND`, result: "fail", timestamp: timestamp() });
                    return;
                }
                fx.moveCursorTo(el);
                await delay(fx.ANIM_DURATION + 50);
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
                await delay(30);
                el.dispatchEvent(new PointerEvent("pointerup", { ...commonOpts, pointerId: 1, pointerType: "mouse" }));
                // Native click — required by React onClick handlers (Dialog.Trigger, etc.)
                el.dispatchEvent(new MouseEvent("click", commonOpts));

                report({ action: "click", detail: elementId, result: "pass", timestamp: timestamp() });
                await delay(fx.STEP_DELAY);
            },

            async getAttribute(name: string) {
                const el = findEl(elementId);
                return el?.getAttribute(name) ?? null;
            },

            // ── Assertion implementations ──

            async toHaveAttribute(name: string, value: string | RegExp) {
                return assertAttribute(name, value, false);
            },

            async toBeFocused() {
                return assertFocused(false);
            },

            // Internal assertion hooks for expect() wrapper (with negation support)
            _toHaveAttribute(name: string, value: string | RegExp, negated = false) {
                return assertAttribute(name, value, negated);
            },
            _toBeFocused(negated = false) {
                return assertFocused(negated);
            },

            // Playwright-compatible .not
            get not(): LocatorAssertions {
                return {
                    toHaveAttribute: (name: string, value: string | RegExp) => assertAttribute(name, value, true),
                    toBeFocused: () => assertFocused(true),
                    get not(): LocatorAssertions { return loc as LocatorAssertions; },
                };
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
            async press(combo: string) {
                // Parse "Shift+Tab" → key="Tab", shiftKey=true
                const parts = combo.split("+");
                const modifiers = parts.slice(0, -1);
                const key = parts[parts.length - 1] ?? combo;

                const shiftKey = modifiers.includes("Shift");
                const metaKey = modifiers.includes("Meta") || modifiers.includes("Control");
                const altKey = modifiers.includes("Alt");

                fx.showKeyBadge(combo);
                const target = document.activeElement || document.body;
                const eventOpts = { key, bubbles: true, cancelable: true, shiftKey, metaKey, altKey };
                target.dispatchEvent(new KeyboardEvent("keydown", eventOpts));
                await delay(30);
                target.dispatchEvent(new KeyboardEvent("keyup", eventOpts));
                report({ action: "press", detail: combo, result: "pass", timestamp: timestamp() });
                await delay(fx.STEP_DELAY);
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
