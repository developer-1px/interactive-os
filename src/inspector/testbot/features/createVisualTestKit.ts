/**
 * createVisualTestKit — Browser adapter for integration tests.
 *
 * Same pressKey/click/attrs API as createOsPage,
 * but dispatches REAL DOM events on the REAL app in preview sandbox.
 *
 * Vitest: createOsPage (headless, fast, no visual)
 * Browser: createVisualTestKit (real DOM, visual feedback, preview sandbox)
 */

import { os } from "@/os/kernel";
import type { AppState } from "@/os/kernel";

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface VisualStep {
    type: "pressKey" | "click" | "check" | "setup" | "assert";
    label: string;
    passed?: boolean;
    error?: string;
    snapshot: unknown;
    timestamp: number;
}

export interface VisualTestKit {
    enter(): void;
    exit(): void;
    getSteps(): VisualStep[];
}

// ═══════════════════════════════════════════════════════════════════
// Visual feedback helpers
// ═══════════════════════════════════════════════════════════════════

let badgeEl: HTMLElement | null = null;

function showKeyBadge(label: string) {
    if (!badgeEl) {
        badgeEl = document.createElement("div");
        badgeEl.id = "visual-test-badge";
        Object.assign(badgeEl.style, {
            position: "fixed",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: "99999",
            pointerEvents: "none",
            transition: "opacity 0.3s, transform 0.3s",
        });
        document.body.appendChild(badgeEl);
    }

    badgeEl.innerHTML = `
    <div style="
      background: #1e293b;
      color: white;
      padding: 6px 16px;
      border-radius: 8px;
      font-family: 'SF Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 8px;
    ">
      <span style="opacity: 0.5; font-size: 10px;">⌨</span>
      ${label}
    </div>
  `;
    badgeEl.style.opacity = "1";
    badgeEl.style.transform = "translateX(-50%) translateY(0)";

    setTimeout(() => {
        if (badgeEl) {
            badgeEl.style.opacity = "0";
            badgeEl.style.transform = "translateX(-50%) translateY(10px)";
        }
    }, 800);
}

function showClickRipple(el: Element) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const ripple = document.createElement("div");
    Object.assign(ripple.style, {
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        width: "0",
        height: "0",
        border: "2px solid #6366f1",
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: "99999",
        transition: "all 0.4s ease-out",
    });
    document.body.appendChild(ripple);

    requestAnimationFrame(() => {
        ripple.style.width = "30px";
        ripple.style.height = "30px";
        ripple.style.opacity = "0";
    });

    setTimeout(() => ripple.remove(), 500);
}

function cleanupBadge() {
    badgeEl?.remove();
    badgeEl = null;
}

// ═══════════════════════════════════════════════════════════════════
// Key parsing
// ═══════════════════════════════════════════════════════════════════

function parseKey(combo: string) {
    const parts = combo.split("+");
    const key = parts.pop()!;
    return {
        key,
        shiftKey: parts.includes("Shift"),
        ctrlKey: parts.includes("Ctrl") || parts.includes("Control"),
        altKey: parts.includes("Alt"),
        metaKey: parts.includes("Meta"),
    };
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

const STEP_DELAY = 300;

export function createVisualTestKit(): VisualTestKit {
    const steps: VisualStep[] = [];
    let active = false;

    function snapshot(): unknown {
        return JSON.parse(JSON.stringify(os.getState()));
    }

    function enter() {
        os.enterPreview(os.getState() as any);
        active = true;
        steps.length = 0;
        steps.push({
            type: "setup",
            label: "Initial state",
            snapshot: snapshot(),
            timestamp: Date.now(),
        });
    }

    function exit() {
        os.exitPreview();
        active = false;
        cleanupBadge();
    }

    return {
        enter,
        exit,
        getSteps: () => steps,
    };
}

// ═══════════════════════════════════════════════════════════════════
// TestActions bridge — used by vitest shim test runner
// ═══════════════════════════════════════════════════════════════════

export async function visualPressKey(combo: string, steps: VisualStep[]) {
    const { key, shiftKey, ctrlKey, altKey, metaKey } = parseKey(combo);
    showKeyBadge(combo);

    const target = document.activeElement || document.body;
    const eventInit: KeyboardEventInit = {
        key,
        bubbles: true,
        cancelable: true,
        shiftKey,
        ctrlKey,
        altKey,
        metaKey,
    };

    target.dispatchEvent(new KeyboardEvent("keydown", eventInit));
    target.dispatchEvent(new KeyboardEvent("keyup", eventInit));

    await new Promise((r) => setTimeout(r, 50));

    steps.push({
        type: "pressKey",
        label: combo,
        snapshot: JSON.parse(JSON.stringify(os.getState())),
        timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, STEP_DELAY));
}

export async function visualClick(
    selector: string,
    steps: VisualStep[],
    opts?: { shift?: boolean; meta?: boolean },
) {
    const el =
        document.querySelector(`[data-item-id="${selector}"]`) ??
        document.getElementById(selector) ??
        document.querySelector(selector);

    if (!el) {
        steps.push({
            type: "click",
            label: `click(${selector}) — NOT FOUND`,
            passed: false,
            snapshot: JSON.parse(JSON.stringify(os.getState())),
            timestamp: Date.now(),
        });
        return;
    }

    showClickRipple(el);

    const rect = el.getBoundingClientRect();
    const eventOpts: MouseEventInit = {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        button: 0,
        shiftKey: opts?.shift ?? false,
        metaKey: opts?.meta ?? false,
    };

    el.dispatchEvent(new MouseEvent("mousedown", eventOpts));
    if (el instanceof HTMLElement) el.focus();
    await new Promise((r) => setTimeout(r, 30));
    el.dispatchEvent(new MouseEvent("mouseup", eventOpts));
    el.dispatchEvent(new MouseEvent("click", eventOpts));

    await new Promise((r) => setTimeout(r, 50));

    steps.push({
        type: "click",
        label: `click(${selector})`,
        passed: true,
        snapshot: JSON.parse(JSON.stringify(os.getState())),
        timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, STEP_DELAY));
}

export function recordAssert(label: string, passed: boolean, error: string | undefined, steps: VisualStep[]) {
    steps.push({
        type: "assert",
        label,
        passed,
        error,
        snapshot: JSON.parse(JSON.stringify(os.getState())),
        timestamp: Date.now(),
    });
}
