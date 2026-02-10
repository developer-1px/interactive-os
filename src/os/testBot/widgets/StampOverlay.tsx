/**
 * StampOverlay — React Portal for PASS/FAIL stamp footprints
 *
 * Renders stamps as positioned fixed elements that track their
 * target elements through scroll, resize, and DOM mutations.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Stamp } from "../entities/Stamp";
import { removeStamp, useTestBotStore } from "../features/TestBotStore";
import "./StampOverlay.css";
import { usePositionTracker } from "./usePositionTracker";

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

/** How long PASS stamps stay fully visible before fading */
const PASS_VISIBLE_MS = 1000;

// ═══════════════════════════════════════════════════════════════════
// Individual Stamp
// ═══════════════════════════════════════════════════════════════════

function StampItem({ stamp }: { stamp: Stamp }) {
  const [fading, setFading] = useState(false);

  // Schedule fade-out for PASS stamps
  useEffect(() => {
    if (stamp.type !== "pass") return;
    const timer = setTimeout(() => setFading(true), PASS_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [stamp.type]);

  const handleAnimationEnd = (e: React.AnimationEvent) => {
    // Only handle the fade-out animation, not the initial pop
    if (e.animationName === "testbot-stamp-fadeout") {
      removeStamp(stamp.id);
    }
  };

  return (
    <div
      className={`testbot-stamp ${stamp.type}${fading ? " fading" : ""}`}
      style={{
        left: stamp.x,
        top: stamp.y,
        ["--rotation" as string]: `${stamp.rotation}deg`,
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      {stamp.type === "pass" ? "PASS!" : "FAIL!"}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Overlay (Portal)
// ═══════════════════════════════════════════════════════════════════

export function StampOverlay() {
  const stamps = useTestBotStore((s) => s.stamps);

  // Set up shared position tracking observers
  usePositionTracker();

  // Don't render portal if no stamps
  if (stamps.length === 0) return null;

  return createPortal(
    stamps.map((stamp) => <StampItem key={stamp.id} stamp={stamp} />),
    document.body,
  );
}
