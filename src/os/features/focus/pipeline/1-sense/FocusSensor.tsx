/**
 * FocusSensor - DOM Event → OS Command 변환기
 * Pipeline Phase 1: SENSE
 *
 * 책임: DOM 이벤트를 감지하고 OS Command로 변환하여 dispatch
 * 순수함수/로직 처리는 FocusIntent에서 담당
 */

import { useCommandEngineStore, CommandEngineStore } from "@os/features/command/store/CommandEngineStore";
import { InspectorLog } from "@os/features/inspector/InspectorLogStore";
import { sensorGuard } from "@os/lib/loopGuard";
import { useEffect } from "react";
import { OS_COMMANDS } from "../../../command/definitions/commandsShell";
import {
  findFocusableItem,
  resolveFocusTarget,
} from "../../lib/focusDOMQueries";

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
        CommandEngineStore.dispatch({
          type: OS_COMMANDS.FOCUS,
          payload: { id: fieldTarget.itemId, zoneId: fieldTarget.groupId },
        });
      }

      // Then perform DOM focus
      targetField.focus();
      return;
    }
  }

  // --- Standard Focus Detection ---
  const item = findFocusableItem(target);

  // --- Focus Loss Detection (OS Recovery) ---
  // If focus drops to body, try to recover
  if (
    !item &&
    e.type === "focusin" &&
    target === document.body
  ) {
    CommandEngineStore.dispatch({ type: OS_COMMANDS.RECOVER });
    return;
  }

  if (!item) return;

  const focusTarget = resolveFocusTarget(item);
  if (!focusTarget) return;

  const { itemId, groupId } = focusTarget;
  // MouseDown → FOCUS + SELECT (always FOCUS first to ensure activeZone is set)
  if (e instanceof MouseEvent && e.type === "mousedown") {
    // Always set focus first
    CommandEngineStore.dispatch({
      type: OS_COMMANDS.FOCUS,
      payload: { id: itemId, zoneId: groupId },
    });

    if (e.shiftKey) {
      e.preventDefault();
      CommandEngineStore.dispatch({
        type: OS_COMMANDS.SELECT,
        payload: { targetId: itemId, mode: "range", zoneId: groupId },
      });
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault();
      CommandEngineStore.dispatch({
        type: OS_COMMANDS.SELECT,
        payload: { targetId: itemId, mode: "toggle", zoneId: groupId },
      });
      return;
    }
    CommandEngineStore.dispatch({
      type: OS_COMMANDS.SELECT,
      payload: { targetId: itemId, mode: "replace", zoneId: groupId },
    });
    return;
  }

  // FocusIn → FOCUS
  if (e.type === "focusin") {
    CommandEngineStore.dispatch({
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
      InspectorLog.log({
        type: "INPUT",
        title: e.key,
        details: { code: e.code, modifiers: { shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey } },
        icon: "keyboard",
        source: "user",
        inputSource: "keyboard",
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      InspectorLog.log({
        type: "INPUT",
        title: "mousedown",
        details: {
          target: target.id || target.tagName.toLowerCase(),
          position: { x: e.clientX, y: e.clientY },
          button: e.button,
          modifiers: { shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey },
        },
        icon: "cursor",
        source: "user",
        inputSource: "mouse",
      });
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      InspectorLog.log({
        type: "INPUT",
        title: "focusin",
        details: {
          target: target.id || target.tagName.toLowerCase(),
          targetType: target.getAttribute("role") || target.nodeName,
        },
        icon: "eye",
        source: "browser",
      });
    };

    // 순서 중요: INPUT 로그를 먼저 기록한 후 sense(dispatch)가 실행되어야
    // COMMAND 로그가 올바른 INPUT 그룹에 포함된다.
    document.addEventListener("mousedown", handleMouseDown, { capture: true });
    document.addEventListener("mousedown", sense, { capture: true });
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusin", sense);
    document.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", handleMouseDown, { capture: true });
      document.removeEventListener("mousedown", sense, { capture: true });
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusin", sense);
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isInitialized]);

  return null;
}
