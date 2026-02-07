/**
 * TestBot — Cursor Module
 *
 * Renders a virtual cursor overlay that visually moves across the page.
 * Includes click ripple and key badge animations.
 */

// ═══════════════════════════════════════════════════════════════════
// Styles (injected once)
// ═══════════════════════════════════════════════════════════════════

const CURSOR_SIZE = 20;
const STYLES = `
  .testbot-cursor {
    position: fixed;
    z-index: 99999;
    pointer-events: none;
    width: ${CURSOR_SIZE}px;
    height: ${CURSOR_SIZE}px;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
    will-change: left, top;
  }

  .testbot-cursor svg {
    width: 100%;
    height: 100%;
  }

  .testbot-ripple {
    position: fixed;
    z-index: 99998;
    pointer-events: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.4);
    transform: translate(-50%, -50%) scale(0);
    animation: testbot-ripple-anim 0.5s ease-out forwards;
  }

  @keyframes testbot-ripple-anim {
    0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
  }

  .testbot-badge {
    position: fixed;
    z-index: 99999;
    pointer-events: none;
    background: #1e293b;
    color: #f1f5f9;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    transform: translateY(0);
    animation: testbot-badge-anim 0.8s ease-out forwards;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  @keyframes testbot-badge-anim {
    0%   { opacity: 1; transform: translateY(0); }
    70%  { opacity: 1; transform: translateY(-8px); }
    100% { opacity: 0; transform: translateY(-16px); }
  }
`;

let stylesInjected = false;
function injectStyles() {
    if (stylesInjected) return;
    const style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);
    stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════
// Cursor SVG
// ═══════════════════════════════════════════════════════════════════

const CURSOR_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#3b82f6" stroke="#1e3a5f" stroke-width="1.5" stroke-linejoin="round"/>
</svg>
`;

// ═══════════════════════════════════════════════════════════════════
// Cursor Interface
// ═══════════════════════════════════════════════════════════════════

export interface BotCursor {
    /** Move cursor to target coordinates with animation */
    moveTo(x: number, y: number, durationMs: number): Promise<void>;
    /** Show click ripple effect at current position */
    ripple(): void;
    /** Show key badge near cursor */
    showBadge(text: string): void;
    /** Remove cursor from DOM */
    destroy(): void;
    /** Current cursor position */
    getPosition(): { x: number; y: number };
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

export function createCursor(): BotCursor {
    injectStyles();

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    // Create cursor element
    const el = document.createElement("div");
    el.className = "testbot-cursor";
    el.innerHTML = CURSOR_SVG;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);

    const moveTo = (targetX: number, targetY: number, durationMs: number): Promise<void> => {
        return new Promise((resolve) => {
            el.style.transitionDuration = `${durationMs}ms`;
            el.style.left = `${targetX}px`;
            el.style.top = `${targetY}px`;
            x = targetX;
            y = targetY;
            setTimeout(resolve, durationMs + 30);
        });
    };

    const ripple = () => {
        const r = document.createElement("div");
        r.className = "testbot-ripple";
        r.style.left = `${x + 2}px`;
        r.style.top = `${y + 2}px`;
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 600);
    };

    const showBadge = (text: string) => {
        const badge = document.createElement("div");
        badge.className = "testbot-badge";
        badge.textContent = text;
        badge.style.left = `${x + CURSOR_SIZE + 8}px`;
        badge.style.top = `${y - 4}px`;
        document.body.appendChild(badge);
        setTimeout(() => badge.remove(), 900);
    };

    const destroy = () => {
        el.remove();
    };

    return {
        moveTo,
        ripple,
        showBadge,
        destroy,
        getPosition: () => ({ x, y }),
    };
}
