/**
 * FocusSensor - DOM Event → OS Command 변환기
 * Pipeline Phase 1: SENSE
 *
 * 책임: DOM 이벤트를 감지하고 OS Command로 변환하여 dispatch
 * 순수함수/로직 처리는 FocusIntent에서 담당
 */

import { useCommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { sensorGuard } from "@os/lib/loopGuard";
import { useEffect } from "react";
import { OS_COMMANDS } from "../../../command/definitions/commandsShell";
import {
  findFocusableItem,
  resolveFocusTarget,
} from "../../lib/focusDOMQueries";
import { isProgrammaticFocus, setProgrammaticFocus } from "../5-sync/FocusSync";

let isMounted = false;

function sense(e: Event) {
  // ── Loop Guard: prevent event storm ──
  if (!sensorGuard.check()) return;

  const target = e.target as HTMLElement;

  // --- Label Recognition (ZIFTL Extension) ---
  // If clicked inside a Label, redirect focus to the target Field
  const label = target.closest("[data-label]") as HTMLElement | null;
  if (label && e.type === "mousedown") {
    // Explicit target via data-for, or auto-detect first Field inside
    const targetId = label.getAttribute("data-for");
    const targetField = targetId
      ? document.getElementById(targetId)
      : (label.querySelector('[role="textbox"]') as HTMLElement | null);

    if (targetField) {
      e.preventDefault();

      // Dispatch FOCUS command FIRST to update store state before DOM focus
      const fieldTarget = resolveFocusTarget(targetField as HTMLElement);
      if (fieldTarget) {
        const dispatch = useCommandEngineStore.getState().getActiveDispatch();
        dispatch?.({
          type: OS_COMMANDS.FOCUS,
          payload: { id: fieldTarget.itemId, zoneId: fieldTarget.groupId },
        });
      }

      // Then perform DOM focus (mark as programmatic to prevent FocusSync interference)
      setProgrammaticFocus(true);
      targetField.focus();
      setTimeout(() => setProgrammaticFocus(false), 100);
      return;
    }
  }

  // --- Standard Focus Detection ---
  const item = findFocusableItem(target);
  // --- Focus Loss Detection (OS Recovery) ---
  // If focus drops to body (and not programmatic), try to recover
  if (
    !item &&
    e.type === "focusin" &&
    target === document.body &&
    !isProgrammaticFocus
  ) {
    const dispatch = useCommandEngineStore.getState().getActiveDispatch();
    dispatch?.({ type: OS_COMMANDS.RECOVER });
    return;
  }

  if (!item) return;

  const focusTarget = resolveFocusTarget(item);
  if (!focusTarget) return;

  const { itemId, groupId } = focusTarget;
  const dispatch = useCommandEngineStore.getState().getActiveDispatch();
  if (!dispatch) return;

  // MouseDown → FOCUS + SELECT (always FOCUS first to ensure activeZone is set)
  if (e instanceof MouseEvent && e.type === "mousedown") {
    // Always set focus first
    dispatch({
      type: OS_COMMANDS.FOCUS,
      payload: { id: itemId, zoneId: groupId },
    });

    if (e.shiftKey) {
      e.preventDefault();
      dispatch({
        type: OS_COMMANDS.SELECT,
        payload: { targetId: itemId, mode: "range", zoneId: groupId },
      });
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      dispatch({
        type: OS_COMMANDS.SELECT,
        payload: { targetId: itemId, mode: "toggle", zoneId: groupId },
      });
      return;
    }
    dispatch({
      type: OS_COMMANDS.SELECT,
      payload: { targetId: itemId, mode: "replace", zoneId: groupId },
    });
    return;
  }

  // FocusIn → FOCUS
  if (e.type === "focusin" && !isProgrammaticFocus) {
    dispatch({
      type: OS_COMMANDS.FOCUS,
      payload: { id: itemId, zoneId: groupId },
    });
  }
}

export function FocusSensor() {
  const isInitialized = useCommandEngineStore((s) => s.isInitialized);

  useEffect(() => {
    if (isMounted || !isInitialized) return;
    isMounted = true;

    // --- Inspector Logging ---
    const handleKeyDown = (e: KeyboardEvent) => {
      import("@os/features/inspector/InspectorLogStore").then(({ InspectorLog }) => {
        InspectorLog.log({
          type: "INPUT",
          title: e.key,
          details: { code: e.code, modifiers: { shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey } },
          icon: "keyboard",
          source: "user",
        });
      });
    };

    document.addEventListener("focusin", sense);
    document.addEventListener("mousedown", sense, { capture: true });
    // Capture phase to ensuring logging before application prevents default
    document.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      isMounted = false;
      document.removeEventListener("focusin", sense);
      document.removeEventListener("mousedown", sense, { capture: true });
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isInitialized]);

  return null;
}
