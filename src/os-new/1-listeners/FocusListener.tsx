/**
 * FocusListener - DOM Event → Kernel Command 변환기
 * Pipeline Phase 1: SENSE
 *
 * 책임: DOM 이벤트를 감지하고 Kernel Command로 변환하여 dispatch
 * 구조: 이벤트 타입별 전용 핸들러 (senseMouseDown, senseFocusIn)
 *
 * Handles: mousedown (pointer focus), focusin (DOM sync), MutationObserver (recovery)
 */

import { useEffect } from "react";
import { FOCUS, RECOVER, SELECT, SYNC_FOCUS } from "@os/3-commands";
import { kernel } from "@os/kernel";
import {
  findFocusableItem,
  resolveFocusTarget,
} from "./focusDOMQueries";
import { sensorGuard } from "./loopGuard";

let isMounted = false;

// ═══════════════════════════════════════════════════════════════════
// Re-entrance Guard
// ═══════════════════════════════════════════════════════════════════

/**
 * Tracks whether the kernel is executing a command that may trigger
 * DOM focus events (el.focus()). Prevents focusin → SYNC_FOCUS loop.
 */
let isDispatching = false;

export function setDispatching(value: boolean) {
  isDispatching = value;
}

// ═══════════════════════════════════════════════════════════════════
// Guards (공통)
// ═══════════════════════════════════════════════════════════════════

function shouldIgnoreEvent(e: Event): boolean {
  const target = e.target as HTMLElement;
  return !!target.closest("[data-inspector]") || !sensorGuard.check();
}

// ═══════════════════════════════════════════════════════════════════
// Label Handling (ZIFTL Extension)
// ═══════════════════════════════════════════════════════════════════

/** If clicked inside a Label, redirect focus to the target Field. Returns true if handled. */
function tryHandleLabelClick(e: MouseEvent): boolean {
  const target = e.target as HTMLElement;
  const label = target.closest("[data-label]") as HTMLElement | null;
  if (!label) return false;

  const targetId = label.getAttribute("data-for");
  const targetField = targetId
    ? document.getElementById(targetId)
    : (label.querySelector('[role="textbox"]') as HTMLElement | null);

  if (!targetField) return false;

  e.preventDefault();
  const fieldTarget = resolveFocusTarget(targetField);
  if (fieldTarget) {
    isDispatching = true;
    kernel.dispatch(
      FOCUS({ zoneId: fieldTarget.groupId, itemId: fieldTarget.itemId }),
      {
        meta: {
          input: { type: "MOUSE", key: e.type, elementId: fieldTarget.itemId },
        },
      },
    );
    isDispatching = false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// SELECT Dispatch (Modifier → Mode 번역)
// ═══════════════════════════════════════════════════════════════════

function dispatchSelectCommand(e: MouseEvent, itemId: string) {
  const mouseMeta = {
    meta: { input: { type: "MOUSE", key: e.type, elementId: itemId } },
  };
  if (e.shiftKey) {
    e.preventDefault();
    kernel.dispatch(
      SELECT({ targetId: itemId, mode: "range" } as any),
      mouseMeta,
    );
  } else if (e.metaKey || e.ctrlKey) {
    e.preventDefault();
    kernel.dispatch(
      SELECT({ targetId: itemId, mode: "toggle" } as any),
      mouseMeta,
    );
  } else {
    kernel.dispatch(
      SELECT({ targetId: itemId, mode: "replace" } as any),
      mouseMeta,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// Event Handlers
// ═══════════════════════════════════════════════════════════════════

/** MouseDown → FOCUS + SELECT */
function senseMouseDown(e: Event) {
  if (shouldIgnoreEvent(e)) return;
  const me = e as MouseEvent;

  // Label 처리 (ZIFTL 확장)
  if (tryHandleLabelClick(me)) return;

  // Focus Target 탐지
  const item = findFocusableItem(e.target as HTMLElement);
  if (!item) return;
  const target = resolveFocusTarget(item);
  if (!target) return;

  const { itemId, groupId } = target;

  // Always FOCUS first (ensures activeZone is set)
  isDispatching = true;
  kernel.dispatch(FOCUS({ zoneId: groupId, itemId }), {
    meta: { input: { type: "MOUSE", key: e.type, elementId: itemId } },
  });
  isDispatching = false;

  // Then SELECT based on modifiers
  dispatchSelectCommand(me, itemId);
}

/** FocusIn → SYNC_FOCUS (state sync only, no DOM effects) */
function senseFocusIn(e: Event) {
  if (shouldIgnoreEvent(e)) return;

  // Re-entrance guard: prevents focusin from kernel's el.focus() effect
  if (isDispatching) return;

  const item = findFocusableItem(e.target as HTMLElement);
  if (!item) return;
  const target = resolveFocusTarget(item);
  if (!target) return;

  kernel.dispatch(SYNC_FOCUS({ id: target.itemId, zoneId: target.groupId }), {
    meta: {
      input: { type: "FOCUS", key: e.type, elementId: target.itemId },
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function FocusListener() {
  useEffect(() => {
    if (isMounted) return;
    isMounted = true;

    // Register event handlers
    document.addEventListener("mousedown", senseMouseDown, { capture: true });
    document.addEventListener("focusin", senseFocusIn, { capture: true });

    // --- Focus Recovery via MutationObserver ---
    let lastFocusedElement: Element | null = null;

    const trackFocus = () => {
      if (document.activeElement && document.activeElement !== document.body) {
        lastFocusedElement = document.activeElement;
      }
    };
    document.addEventListener("focusin", trackFocus);

    const observer = new MutationObserver(() => {
      if (
        document.activeElement === document.body &&
        lastFocusedElement &&
        !document.body.contains(lastFocusedElement)
      ) {
        lastFocusedElement = null;
        kernel.dispatch(RECOVER(), {
          meta: { input: { type: "FOCUS", key: "Recovery" } },
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", senseMouseDown, {
        capture: true,
      });
      document.removeEventListener("focusin", senseFocusIn, { capture: true });
      document.removeEventListener("focusin", trackFocus);
      observer.disconnect();
    };
  }, []);

  return null;
}
