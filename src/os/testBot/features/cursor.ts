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
    width: 60px; height: 60px;
    background: radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0) 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: -1;
    mix-blend-mode: screen;
    filter: blur(4px);
  }

  /* ── Status Stamps (Footprints) ─────────────────────────────────── */
  .testbot-stamp {
    position: absolute;
    z-index: 99990; /* Below cursor/bubbles but above content */
    pointer-events: none;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
    border: 2px solid;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transform-origin: center center;
    animation: testbot-stamp-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  .testbot-stamp.pass {
    color: #15803d;
    background: #dcfce7; /* Green-100 */
    border-color: #16a34a; /* Green-600 */
    transform: rotate(-5deg); /* Playful tilt */
  }

  .testbot-stamp.fail {
    color: #991b1b;
    background: #fee2e2; /* Red-100 */
    border-color: #dc2626; /* Red-600 */
    transform: rotate(5deg);
    z-index: 99991; /* Fail on top */
  }

  @keyframes testbot-stamp-pop {
    0% { opacity: 0; transform: scale(1.5) rotate(0deg); }
    100% { opacity: 1; transform: scale(1) rotate(var(--rotation)); }
  }

  /* ── Unified Bubble Tray (Horizontal) ───────────────────────────── */
  .testbot-bubble-tray {
    position: absolute;
    left: 20px;
    bottom: 34px; /* Above cursor */
    display: flex;
    flex-direction: row; /* Left to Right */
    flex-wrap: nowrap;
    align-items: center;
    gap: 6px;
    pointer-events: none;
    z-index: 99999;
  }
  
  .testbot-bubble {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 4px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-bottom: 3px solid #94a3b8;
    border-radius: 6px;
    color: #334155;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transform-origin: center bottom;
    animation: testbot-bubble-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  /* Bubble Variants */
  .testbot-bubble.variant-click {
    min-width: auto;
    height: 28px;
    padding: 0 10px;
    background: #2563eb;
    border: 1px solid #1d4ed8;
    border-bottom: 3px solid #1e3a8a;
    color: #ffffff;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
  }
  .testbot-bubble.variant-success {
    background: #dcfce7;
    border-color: #86efac;
    border-bottom-color: #22c55e;
    color: #15803d;
  }
  .testbot-bubble.variant-error {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    border-bottom-color: rgba(239, 68, 68, 0.4);
    color: #dc2626;
  }

  @keyframes testbot-bubble-pop {
    0%   { transform: translateY(10px) scale(0.8); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }

  @keyframes testbot-stamp-fadeout {
    0% { opacity: 1; transform: scale(1) rotate(var(--rotation)); }
    100% { opacity: 0; transform: scale(0.9) rotate(var(--rotation)); }
  }

  /* ── Ripple ─────────────────────────────────────────────────────── */
  .testbot-ripple {
    position: absolute;
    z-index: 99998;
    pointer-events: none;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.6) 0%, transparent 75%);
    border: 2px solid rgba(37, 99, 235, 0.5);
    transform: translate(-50%,-50%) scale(0);
    animation: testbot-ripple-anim 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  }
  @keyframes testbot-ripple-anim {
    0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.8; }
    100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
  }

  /* ── Off-screen State ───────────────────────────────────────────── */
  .testbot-cursor.off-screen .testbot-cursor-body {
    color: #3b82f6;
    filter: drop-shadow(0 2px 4px rgba(59,130,246,0.3));
    transform-origin: center;
    animation: testbot-ptr-pulse 0.5s infinite;
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
  <path d="M5.5 3.21V20.8L10.07 15.35H18.59L5.5 3.21Z" fill="black"/>
  <path d="M5.5 3.21V20.8L10.07 15.35H18.59L5.5 3.21Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
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
  svgWrap.style.cssText =
    "width:100%;height:100%;transition:transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);";
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

  document.addEventListener("scroll", retrack, {
    passive: true,
    capture: true,
  });
  window.addEventListener("resize", retrack, { passive: true });

  const observer = new MutationObserver(retrack);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  // ── Methods ──────────────────────────────────────────────────────

  const moveTo = (
    targetX: number,
    targetY: number,
    durationMs: number,
  ): Promise<void> =>
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

  const showBubble = (label: string, variant: BubbleVariant = "default") => {
    const bubble = document.createElement("div");
    bubble.className = `testbot-bubble variant-${variant}`;

    // Icon mapping
    let content = label;
    if (label === "Click")
      content = `${ICON_CLICK}<span style="margin-left:4px">Click</span>`;
    if (label === "Check") content = ICON_CHECK;
    if (label === "Error") content = ICON_EXCLAMATION;

    bubble.innerHTML = content;
    bubbleTray.appendChild(bubble);

    // Remove after 1.5s
    setTimeout(() => {
      bubble.style.opacity = "0";
      bubble.style.transform = "translateY(-10px)";
      setTimeout(() => bubble.remove(), 300);
    }, 1500);

    // Limit visible bubbles to 3
    while (bubbleTray.children.length > 3)
      bubbleTray.firstElementChild?.remove();
  };

  const showStatus = (type: "pass" | "fail", selector?: string) => {
    // 1. Determine Position
    let stampX = x; // Fallback to cursor pos
    let stampY = y;

    if (selector) {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Center of element (viewport coordinates)
        stampX = rect.left + rect.width / 2;
        stampY = rect.top + rect.height / 2;
      }
    }

    // 2. Create Stamp
    const stamp = document.createElement("div");
    stamp.className = `testbot-stamp ${type}`;
    stamp.textContent = type === "pass" ? "PASS!" : "FAIL!";

    // Random rotation for natural stamp look
    const rotation = Math.random() * 10 - 5 + (type === "fail" ? 5 : -5);
    stamp.style.setProperty("--rotation", `${rotation}deg`);

    // Position: FIXED relative to viewport
    // (User requested this approach for now due to limitations with absolute/child method)
    stamp.style.position = "fixed";
    stamp.style.left = `${stampX}px`;
    stamp.style.top = `${stampY}px`;

    // Center alignment
    stamp.style.marginLeft = "-20px";
    stamp.style.marginTop = "-12px";

    document.body.appendChild(stamp);

    // 3. Lifecycle
    if (type === "pass") {
      // Fade out PASS stamps using keyframe animation for reliability
      setTimeout(() => {
        // Apply animation class or inline style for keyframe
        stamp.style.animation = "testbot-stamp-fadeout 1.5s linear forwards";
        setTimeout(() => stamp.remove(), 1500);
      }, 1000); // Visible for 1s
    } else {
      // FAIL stamps stay forever (until destroyed or manually cleared)
      // Optional: Add a close button or clear on re-run?
      // For now, let's keep them as requested.
    }
  };

  const showOffScreenPtr = (tx: number, ty: number) => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const padding = 40;

    let cx = Math.max(padding, Math.min(w - padding, tx));
    let cy = Math.max(padding, Math.min(h - padding, ty));

    let rotation = 0;
    if (ty > h) {
      rotation = 0;
      cy = h - padding;
    } else if (ty < 0) {
      rotation = 180;
      cy = padding;
    } else if (tx > w) {
      rotation = -90;
      cx = w - padding;
    } else if (tx < 0) {
      rotation = 90;
      cx = padding;
    }

    cursorEl.style.transitionDuration = "300ms";
    cursorEl.style.left = `${cx}px`;
    cursorEl.style.top = `${cy}px`;
    x = cx;
    y = cy;

    cursorEl.classList.add("off-screen");
    svgWrap.innerHTML = ARROW_SVG;
    svgWrap.style.transform = `rotate(${rotation}deg)`;
  };

  const hideOffScreenPtr = () => {
    if (cursorEl.classList.contains("off-screen")) {
      cursorEl.classList.remove("off-screen");
      svgWrap.innerHTML = CURSOR_SVG;
      svgWrap.style.transform = "none";
    }
  };

  const clearBubbles = () => {
    bubbleTray.innerHTML = "";
  };

  const clearStamps = () => {
    document.querySelectorAll(".testbot-stamp").forEach((el) => {
      el.remove();
    });
  };

  const destroy = () => {
    destroyed = true;
    hideOffScreenPtr();
    cursorEl.remove();
    clearStamps();
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
    clearStamps,
    destroy,
    getPosition: () => ({ x, y }),
  };
}
