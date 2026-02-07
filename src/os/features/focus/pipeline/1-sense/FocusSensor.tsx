/**
 * FocusSensor - DOM Event → OS Command 변환기
 * Pipeline Phase 1: SENSE
 *
 * 책임: DOM 이벤트를 감지하고 OS Command로 변환하여 dispatch
 * 구조: 이벤트 타입별 전용 핸들러 (senseMouseDown, senseFocusIn)
 */

import {
  CommandEngineStore,
  useCommandEngineStore,
} from "@os/features/command/store/CommandEngineStore";
import { sensorGuard } from "@os/lib/loopGuard";
import { useEffect } from "react";
import { OS_COMMANDS } from "../../../command/definitions/commandsShell";
import {
  findFocusableItem,
  resolveFocusTarget,
} from "../../lib/focusDOMQueries";
import { isOSCommandRunning, setCurrentInput } from "../../pipeline/core/osCommand";

let isMounted = false;

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
    CommandEngineStore.dispatch({
      type: OS_COMMANDS.FOCUS,
      payload: { id: fieldTarget.itemId, zoneId: fieldTarget.groupId },
    });
  }
  targetField.focus();
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// SELECT Dispatch (Modifier → Mode 번역)
// ═══════════════════════════════════════════════════════════════════

function dispatchSelectCommand(e: MouseEvent, itemId: string, groupId: string) {
  if (e.shiftKey) {
    e.preventDefault();
    CommandEngineStore.dispatch({
      type: OS_COMMANDS.SELECT,
      payload: { targetId: itemId, mode: "range", zoneId: groupId },
    });
  } else if (e.metaKey || e.ctrlKey) {
    e.preventDefault();
    CommandEngineStore.dispatch({
      type: OS_COMMANDS.SELECT,
      payload: { targetId: itemId, mode: "toggle", zoneId: groupId },
    });
  } else {
    CommandEngineStore.dispatch({
      type: OS_COMMANDS.SELECT,
      payload: { targetId: itemId, mode: "replace", zoneId: groupId },
    });
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

  // Ambient context → runOS auto-logs INPUT
  setCurrentInput(e);

  // Always FOCUS first (ensures activeZone is set)
  CommandEngineStore.dispatch({
    type: OS_COMMANDS.FOCUS,
    payload: { id: itemId, zoneId: groupId },
  });

  // Then SELECT based on modifiers
  dispatchSelectCommand(me, itemId, groupId);
}

/** FocusIn → SYNC_FOCUS (state sync only, no DOM effects) */
function senseFocusIn(e: Event) {
  if (shouldIgnoreEvent(e)) return;

  // Re-entrance guard: prevents focusin from OS command's el.focus()
  if (isOSCommandRunning()) return;

  const item = findFocusableItem(e.target as HTMLElement);
  if (!item) return;
  const target = resolveFocusTarget(item);
  if (!target) return;

  setCurrentInput(e);
  CommandEngineStore.dispatch({
    type: OS_COMMANDS.SYNC_FOCUS,
    payload: { id: target.itemId, zoneId: target.groupId },
  });
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export function FocusSensor() {
  const isInitialized = useCommandEngineStore((s) => s.isInitialized);

  useEffect(() => {
    if (isMounted || !isInitialized) return;
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
        CommandEngineStore.dispatch({ type: OS_COMMANDS.RECOVER });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", senseMouseDown, { capture: true });
      document.removeEventListener("focusin", senseFocusIn, { capture: true });
      document.removeEventListener("focusin", trackFocus);
      observer.disconnect();
    };
  }, [isInitialized]);

  return null;
}
