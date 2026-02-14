/**
 * CursorOverlay — React Portal for TestBot virtual cursor
 *
 * Renders the Mac-style pointer, spotlight, bubble tray, and ripple effects.
 * All visuals are driven by cursorState in the Zustand store.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  CursorBubble,
  CursorRipple,
  KeyPress,
} from "../entities/CursorState";
import {
  removeCursorBubble,
  removeCursorRipple,
  updateCursorFromTrackedEl,
  useTestBotStore,
} from "../features/TestBotStore";
import "./CursorOverlay.css";

// ═══════════════════════════════════════════════════════════════════
// SVG Assets
// ═══════════════════════════════════════════════════════════════════

const CursorSvg = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
  >
    <path
      d="M3.1 2.8C2.5 2.2 1.9 2.6 2.1 3.4L6.2 19.2C6.4 19.9 7.3 20.2 7.9 19.6L10.8 16.7L15.6 21.5C16.1 22.0 16.9 22.0 17.4 21.5L19.5 19.4C20.0 18.9 20.0 18.1 19.5 17.6L14.7 12.8L19.5 10.9C20.3 10.6 20.3 9.5 19.6 9.1L3.1 2.8Z"
      fill="#4F46E5"
      stroke="white"
      strokeWidth="1.5"
    />
  </svg>
);

const ArrowSvg = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className="testbot-cursor-body"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line
      x1="12"
      y1="5"
      x2="12"
      y2="19"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="19 12 12 19 5 12"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconCheck = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconExclamation = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="4" x2="12" y2="16" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const IconClick = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════
// Bubble Item
// ═══════════════════════════════════════════════════════════════════

function BubbleItem({ bubble }: { bubble: CursorBubble }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFading(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!fading) return;
    const timer = setTimeout(() => removeCursorBubble(bubble.id), 300);
    return () => clearTimeout(timer);
  }, [fading, bubble.id]);

  const renderContent = () => {
    if (bubble.label === "Click") {
      return (
        <>
          <IconClick />
          <span style={{ marginLeft: 4 }}>Click</span>
        </>
      );
    }
    if (bubble.label === "Check") return <IconCheck />;
    if (bubble.label === "Error") return <IconExclamation />;
    return bubble.label;
  };

  return (
    <div
      className={`testbot-bubble variant-${bubble.variant}${fading ? " fading" : ""}`}
    >
      {renderContent()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Ripple Item
// ═══════════════════════════════════════════════════════════════════

function RippleItem({ ripple }: { ripple: CursorRipple }) {
  useEffect(() => {
    const timer = setTimeout(() => removeCursorRipple(ripple.id), 600);
    return () => clearTimeout(timer);
  }, [ripple.id]);

  return (
    <div className="testbot-ripple" style={{ left: ripple.x, top: ripple.y }} />
  );
}

// ═══════════════════════════════════════════════════════════════════
// Key Press HUD
// ═══════════════════════════════════════════════════════════════════

function KeyPressHUD({ keys }: { keys: KeyPress[] }) {
  if (keys.length === 0) return null;

  return (
    <div className="testbot-key-hud">
      {keys.map((k) => (
        <div key={k.id} className="testbot-key-item">
          {k.key}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Cursor Tracker Hook
// ═══════════════════════════════════════════════════════════════════

function useCursorTracker() {
  const rafId = useRef(0);

  useEffect(() => {
    const scheduleUpdate = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        updateCursorFromTrackedEl();
      });
    };

    document.addEventListener("scroll", scheduleUpdate, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    const mo = new MutationObserver(scheduleUpdate);
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      cancelAnimationFrame(rafId.current);
      document.removeEventListener("scroll", scheduleUpdate, { capture: true });
      window.removeEventListener("resize", scheduleUpdate);
      mo.disconnect();
    };
  }, []);
}

// ═══════════════════════════════════════════════════════════════════
// Overlay (Portal)
// ═══════════════════════════════════════════════════════════════════

export function CursorOverlay() {
  const cursorState = useTestBotStore((s) => s.cursorState);

  useCursorTracker();

  if (!cursorState?.visible) return null;

  const { x, y, transitionMs, offScreen, offScreenRotation, bubbles, ripples } =
    cursorState;

  return createPortal(
    <>
      {/* Cursor */}
      <div
        className={`testbot-cursor${offScreen ? " off-screen" : ""}`}
        style={{
          left: x,
          top: y,
          transitionDuration: `${transitionMs}ms`,
        }}
      >
        <div className="testbot-spotlight" />
        <div
          className="testbot-cursor-svg"
          style={
            offScreen
              ? { transform: `rotate(${offScreenRotation}deg)` }
              : undefined
          }
        >
          {offScreen ? <ArrowSvg /> : <CursorSvg />}
        </div>

        {/* Bubble Tray */}
        <div className="testbot-bubble-tray">
          {bubbles.map((b) => (
            <BubbleItem key={b.id} bubble={b} />
          ))}
        </div>
      </div>

      {/* Ripples (absolute positioned, outside cursor) */}
      {ripples.map((r) => (
        <RippleItem key={r.id} ripple={r} />
      ))}

      {/* Key Press HUD */}
      <KeyPressHUD keys={cursorState.activeKeys} />
    </>,
    document.body,
  );
}
