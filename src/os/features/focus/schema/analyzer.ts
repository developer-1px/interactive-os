/**
 * OS Focus State Analyzer
 *
 * 두 가지 방식으로 OSFocusState 스냅샷을 구성한다:
 *
 * 1. buildCurrentSnapshot() — 현재 런타임 상태를 직접 읽어 스냅샷 구성
 * 2. buildSnapshotFromLogs() — EventStream 로그를 순차 재생하여 스냅샷 재구성
 */

import type { LogEntry } from "@os/features/inspector/InspectorLogStore";
import { FocusData } from "../lib/focusData";
import { getLastInputSource } from "../pipeline/core/osCommand";
import {
  type EffectRecord,
  INITIAL_OS_FOCUS_STATE,
  type OSFocusState,
  type ZoneSnapshot,
} from "./OSFocusState";

// ═══════════════════════════════════════════════════════════════════
// 1. Live Snapshot — 현재 상태를 직접 읽기
// ═══════════════════════════════════════════════════════════════════

/**
 * 현재 OS 포커스 시스템의 상태를 읽어 스냅샷을 구성한다.
 * 로그와 무관하게 현재 시점의 진실.
 *
 * @param effects - 직전 커맨드에서 발생한 EffectRecord[] (선택)
 */
export function buildCurrentSnapshot(
  effects: EffectRecord[] = [],
): OSFocusState {
  const activeZoneId = FocusData.getActiveZoneId();
  const zoneData = activeZoneId ? FocusData.getById(activeZoneId) : null;
  const zoneStore = zoneData?.store;

  let zone: ZoneSnapshot | null = null;
  if (zoneStore && activeZoneId) {
    const s = zoneStore.getState();
    zone = {
      id: activeZoneId,
      focusedItemId: s.focusedItemId,
      selection: s.selection,
      selectionAnchor: s.selectionAnchor,
      expandedItems: s.expandedItems,
      stickyX: s.stickyX,
      stickyY: s.stickyY,
      recoveryTargetId: s.recoveryTargetId,
    };
  }

  return {
    activeZoneId,
    zone,
    focusStackDepth: FocusData.getFocusStackDepth(),
    inputSource: getLastInputSource(),
    effects,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 2. Log Replay — 로그에서 스냅샷 재구성
// ═══════════════════════════════════════════════════════════════════

/**
 * EventStream 로그를 순차 재생하여 특정 시점의 OSFocusState를 재구성한다.
 *
 * 로그에서 STATE/EFFECT 항목을 읽어 스냅샷 필드에 적용한다.
 * COMMAND가 나타나면 effects를 초기화한다 (커맨드 단위 lifecycle).
 *
 * @param logs - 시간순 정렬된 로그 배열 (oldest → newest)
 * @param upToId - 이 ID까지만 재생 (선택, 없으면 전체)
 */
export function buildSnapshotFromLogs(
  logs: LogEntry[],
  upToId?: number,
): OSFocusState {
  let state: OSFocusState = { ...INITIAL_OS_FOCUS_STATE, effects: [] };

  for (const log of logs) {
    if (upToId !== undefined && log.id > upToId) break;

    switch (log.type) {
      case "COMMAND":
        // 새 커맨드 시작 → effects 초기화
        state = { ...state, effects: [] };
        break;

      case "STATE":
        state = applyStateLog(state, log);
        break;

      case "EFFECT":
        state = applyEffectLog(state, log);
        break;

      case "INPUT":
        if (log.inputSource) {
          state = {
            ...state,
            inputSource: log.inputSource as OSFocusState["inputSource"],
          };
        }
        break;
    }
  }

  return state;
}

// ── Helpers ──

function applyStateLog(state: OSFocusState, log: LogEntry): OSFocusState {
  const details = log.details;
  if (!details || typeof details !== "object") return state;

  // Focus change: { from, to, zoneId }
  if ("from" in details && "to" in details) {
    const title = log.title;

    if (title.startsWith("Focus")) {
      const zone = state.zone
        ? { ...state.zone, focusedItemId: details.to ?? null }
        : null;
      return { ...state, zone };
    }

    if (title.startsWith("Selection")) {
      const zone = state.zone
        ? { ...state.zone, selection: details.to ?? [] }
        : null;
      return { ...state, zone };
    }

    if (title.startsWith("Zone")) {
      return {
        ...state,
        activeZoneId: details.to ?? null,
        // Zone changed → we don't know the new zone's state from logs alone
        zone: details.to ? { ...EMPTY_ZONE, id: details.to } : null,
      };
    }
  }

  // FocusStack
  if (title(log).includes("FocusStack")) {
    const depth = extractDepth(log.title);
    if (depth !== null) {
      return { ...state, focusStackDepth: depth };
    }
  }

  return state;
}

function applyEffectLog(state: OSFocusState, log: LogEntry): OSFocusState {
  const details = log.details;
  if (!details || typeof details !== "object") return state;

  const record: EffectRecord = {
    action: mapEffectAction(log.title),
    targetId: details.targetId ?? null,
    executed: details.executed ?? true,
    reason: details.reason,
  };

  return {
    ...state,
    effects: [...state.effects, record],
  };
}

function mapEffectAction(title: string): EffectRecord["action"] {
  const lower = title.toLowerCase();
  if (lower === "focus") return "focus";
  if (lower === "scroll_into_view") return "scrollIntoView";
  if (lower === "blur") return "blur";
  if (lower === "click") return "click";
  return "focus"; // fallback
}

function title(log: LogEntry): string {
  return log.title ?? "";
}

function extractDepth(title: string): number | null {
  const match = title.match(/depth:\s*(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

const EMPTY_ZONE: ZoneSnapshot = {
  id: "",
  focusedItemId: null,
  selection: [],
  selectionAnchor: null,
  expandedItems: [],
  stickyX: null,
  stickyY: null,
  recoveryTargetId: null,
};
