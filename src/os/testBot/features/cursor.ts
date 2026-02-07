/**
 * TestBot — Cursor Module (Premium UI v5)
 *
 * Features:
 * - Large Mac-style pointer with spotlight
 * - Element tracking (re-positions on scroll/resize/mutation)
 * - Unified Bubble Tray (Horizontal) for Click/Key/Pass/Fail
 * - Side Status Label (Left) for "PASS!" / "FAIL!" textual feedback
 * - Visual ripple on click
 */

import type { BotCursor, BubbleVariant } from "../entities/BotCursor";

// Re-export for consumers that import from this module
export type { BotCursor, BubbleVariant } from "../entities/BotCursor";

// ═══════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════

const CURSOR_SIZE = 32;
const STYLES = `
  .testbot-cursor {
    position: fixed;
    z-index: 99999;
    pointer-events: none;
    width: ${CURSOR_SIZE}px;
    height: ${CURSOR_SIZE}px;
    transition: left 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
                top 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
    will-change: left, top;
  }
  .testbot-cursor svg { width: 100%; height: 100%; }

  .testbot-spotlight {
    position: absolute;
    width: 80px; height: 80px;
    background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: -1;
  }

  /* ── Status Label (Side: Left) ──────────────────────────────────── */
  .testbot-status-label {
    position: absolute;
    right: 36px; /* Left of cursor */
    top: 6px;
    font-family: 'SF Pro Rounded', 'Nunito', sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.5px;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    transform: translateX(10px);
    animation: testbot-status-pop 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
    text-shadow: 0 1px 0 rgba(255,255,255,0.5);
  }

  .testbot-status-label.pass {
    color: #15803d; 
    background: rgba(220, 252, 231, 0.9);
    border: 1px solid rgba(134, 239, 172, 0.5);
    box-shadow: 0 2px 4px rgba(21, 128, 61, 0.1);
  }

  .testbot-status-label.fail {
    color: #b91c1c;
    background: rgba(254, 226, 226, 0.9);
    border: 1px solid rgba(252, 165, 165, 0.5);
    box-shadow: 0 2px 4px rgba(185, 28, 28, 0.1);
  }

  @keyframes testbot-status-pop {
    0% { opacity: 0; transform: translateX(10px) scale(0.8); }
    15% { opacity: 1; transform: translateX(0) scale(1.1); }
    30% { transform: translateX(0) scale(1); }
    80% { opacity: 1; transform: translateX(0); }
    100% { opacity: 0; transform: translateX(-5px); }
  }

  /* ── Unified Bubble Tray (Horizontal) ───────────────────────────── */
  .testbot-bubble-tray {
    position: absolute;
    left: 16px;
    bottom: 32px; /* Above cursor */
    display: flex;
    flex-direction: row; /* Left to Right */
    flex-wrap: nowrap;
    align-items: flex-end;
    gap: 4px;
    pointer-events: none;
    z-index: 99999;
  }

  .testbot-bubble {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
    border: 1px solid #cbd5e1;
    border-bottom: 3px solid #94a3b8;
    border-radius: 6px;
    color: #1e293b;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8);
    animation: testbot-bubble-pop 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  /* Bubble Variants */
  .testbot-bubble.variant-click {
    background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
    border-color: #93c5fd;
    border-bottom-color: #60a5fa;
    color: #1e40af;
  }
  .testbot-bubble.variant-success {
    background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
    border-color: #86efac;
    border-bottom-color: #4ade80;
    color: #15803d;
  }
  .testbot-bubble.variant-error {
    background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%);
    border-color: #fca5a5;
    border-bottom-color: #f87171;
    color: #b91c1c;
  }

  @keyframes testbot-bubble-pop {
    0%   { transform: translateY(10px) scale(0.8); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }

  /* ── Ripple ─────────────────────────────────────────────────────── */
  .testbot-ripple {
    position: absolute;
    z-index: 99998;
    pointer-events: none;
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 2px solid rgba(59,130,246,0.8);
    background: rgba(59,130,246,0.15);
    transform: translate(-50%, -50%) scale(0);
    animation: testbot-ripple-anim 0.45s ease-out forwards;
  }
  @keyframes testbot-ripple-anim {
    0%   { transform: translate(-50%,-50%) scale(0); opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(3); opacity: 0; }
  }

  /* ── Off-screen State ───────────────────────────────────────────── */
  .testbot-cursor.off-screen .testbot-cursor-body {
    color: #3b82f6;
    filter: drop-shadow(0 2px 4px rgba(59,130,246,0.3));
    transform-origin: center;
    animation: testbot-ptr-pulse 1.5s infinite;
  }
  
  /* Hide spotlight when off-screen to reduce clutter */
  .testbot-cursor.off-screen .testbot-spotlight {
    opacity: 0;
  }
`;

let stylesInjected = false;
function injectStyles() {
    if (stylesInjected) return;
    const s = document.createElement("style");
    s.textContent = STYLES;
    document.head.appendChild(s);
    stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════
// SVG Assets
// ═══════════════════════════════════════════════════════════════════

const CURSOR_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 3L19.5 13.5L12.5 14.5L9 22L6 3Z" fill="black"/>
  <path d="M6 3L19.5 13.5L12.5 14.5L9 22L6 3Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
</svg>`;

const ARROW_SVG = `
<svg viewBox="0 0 24 24" fill="none" class="testbot-cursor-body" xmlns="http://www.w3.org/2000/svg">
  <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <polyline points="19 12 12 19 5 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const ICON_CHECK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_EXCLAMATION = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="4" x2="12" y2="16"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`;
const ICON_CLICK = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`;

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function createCursor(): BotCursor {
    injectStyles();

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let trackedEl: Element | null = null;
    let destroyed = false;

    // ── DOM: Cursor ──────────────────────────────────────────────────
    const cursorEl = document.createElement("div");
    cursorEl.className = "testbot-cursor";

    const spotlight = document.createElement("div");
    spotlight.className = "testbot-spotlight";
    cursorEl.appendChild(spotlight);

    const svgWrap = document.createElement("div");
    svgWrap.className = "testbot-cursor-svg";
    svgWrap.style.cssText = "width:100%;height:100%;transition:transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);";
    svgWrap.innerHTML = CURSOR_SVG;
    cursorEl.appendChild(svgWrap);

    // Unified Bubble Tray (Horizontal)
    const bubbleTray = document.createElement("div");
    bubbleTray.className = "testbot-bubble-tray";
    cursorEl.appendChild(bubbleTray);

    cursorEl.style.left = `${x}px`;
    cursorEl.style.top = `${y}px`;
    document.body.appendChild(cursorEl);

    // ── Element Tracking ─────────────────────────────────────────────
    let trackDebounce: ReturnType<typeof setTimeout> | null = null;

    const retrack = () => {
        if (!trackedEl || destroyed) return;
        if (trackDebounce) clearTimeout(trackDebounce);
        trackDebounce = setTimeout(() => {
            if (!trackedEl || destroyed) return;
            const rect = trackedEl.getBoundingClientRect();
            const nx = rect.left + rect.width / 2;
            const ny = rect.top + rect.height / 2;

            if (Math.abs(nx - x) > 2 || Math.abs(ny - y) > 2) {
                cursorEl.style.transitionDuration = "300ms";
                cursorEl.style.left = `${nx}px`;
                cursorEl.style.top = `${ny}px`;
                x = nx;
                y = ny;
            }
        }, 250);
    };

    document.addEventListener("scroll", retrack, { passive: true, capture: true });
    window.addEventListener("resize", retrack, { passive: true });

    const observer = new MutationObserver(retrack);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    // ── Methods ──────────────────────────────────────────────────────

    const moveTo = (targetX: number, targetY: number, durationMs: number): Promise<void> =>
        new Promise((resolve) => {
            cursorEl.style.transitionDuration = `${durationMs}ms`;
            cursorEl.style.left = `${targetX}px`;
            cursorEl.style.top = `${targetY}px`;
            x = targetX;
            y = targetY;
            setTimeout(resolve, durationMs + 20);
        });

    const trackElement = (el: Element | null) => {
        trackedEl = el;
    };

    const ripple = () => {
        const r = document.createElement("div");
        r.className = "testbot-ripple";
        r.style.position = "fixed";
        r.style.left = `${x}px`;
        r.style.top = `${y}px`;
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 600);
    };

    const showBubble = (label: string, variant: BubbleVariant = 'default') => {
        const bubble = document.createElement("div");
        bubble.className = `testbot-bubble variant-${variant}`;

        // Icon mapping
        let content = label;
        if (label === 'Click') content = `${ICON_CLICK}<span style="margin-left:4px">Click</span>`;
        if (label === 'Check') content = ICON_CHECK;
        if (label === 'Error') content = ICON_EXCLAMATION;

        bubble.innerHTML = content;
        bubbleTray.appendChild(bubble);

        // Remove after 1.5s
        setTimeout(() => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translateY(-10px)';
            setTimeout(() => bubble.remove(), 300);
        }, 1500);

        // Limit visible bubbles to 3
        while (bubbleTray.children.length > 3) bubbleTray.firstElementChild?.remove();
    };

    const showStatus = (type: 'pass' | 'fail') => {
        const label = document.createElement("div");
        label.className = `testbot-status-label ${type}`;
        label.textContent = type === 'pass' ? "PASS!" : "FAIL!";
        cursorEl.appendChild(label);
        setTimeout(() => label.remove(), 1500);
    };

    const showOffScreenPtr = (tx: number, ty: number) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const padding = 40;

        let cx = Math.max(padding, Math.min(w - padding, tx));
        let cy = Math.max(padding, Math.min(h - padding, ty));

        let rotation = 0;
        if (ty > h) { rotation = 0; cy = h - padding; }
        else if (ty < 0) { rotation = 180; cy = padding; }
        else if (tx > w) { rotation = -90; cx = w - padding; }
        else if (tx < 0) { rotation = 90; cx = padding; }

        cursorEl.style.transitionDuration = "300ms";
        cursorEl.style.left = `${cx}px`;
        cursorEl.style.top = `${cy}px`;
        x = cx;
        y = cy;

        cursorEl.classList.add('off-screen');
        svgWrap.innerHTML = ARROW_SVG;
        svgWrap.style.transform = `rotate(${rotation}deg)`;
    };

    const hideOffScreenPtr = () => {
        if (cursorEl.classList.contains('off-screen')) {
            cursorEl.classList.remove('off-screen');
            svgWrap.innerHTML = CURSOR_SVG;
            svgWrap.style.transform = 'none';
        }
    };

    const clearBubbles = () => {
        bubbleTray.innerHTML = '';
    };

    const destroy = () => {
        destroyed = true;
        hideOffScreenPtr();
        cursorEl.remove();
        document.removeEventListener("scroll", retrack);
        window.removeEventListener("resize", retrack);
        observer.disconnect();
        if (trackDebounce) clearTimeout(trackDebounce);
    };

    return {
        moveTo,
        trackElement,
        ripple,
        showBubble,
        showStatus,
        showOffScreenPtr,
        hideOffScreenPtr,
        clearBubbles,
        destroy,
        getPosition: () => ({ x, y }),
    };
}
