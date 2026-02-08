/**
 * OS State Analyzer
 *
 * 두 가지 방식으로 OSState 스냅샷을 구성한다:
 *
 * 1. buildCurrentSnapshot() — 현재 런타임 상태를 직접 읽어 구성
 * 2. buildSnapshotFromLogs() — EventStream 로그를 순차 재생하여 재구성
 */

import type { LogEntry } from "@os/features/inspector/InspectorLogStore";
import {
  createFocusEffect,
  type EffectRecord,
  type FocusState,
  INITIAL_OS_STATE,
  type OSState,
  type ZoneSnapshot,
} from "@os/schema";
import { FocusData } from "../lib/focusData";
import { getLastInputSource } from "../pipeline/core/osCommand";

// ═══════════════════════════════════════════════════════════════════
// 1. Live Snapshot — 현재 상태를 직접 읽기
// ═══════════════════════════════════════════════════════════════════

/**
 * 현재 OS 시스템의 상태를 읽어 스냅샷을 구성한다.
 * 로그와 무관하게 현재 시점의 진실.
 *
 * @param effects - 직전 커맨드에서 발생한 EffectRecord[] (선택)
 */
export function buildCurrentSnapshot(effects: EffectRecord[] = []): OSState {
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
    focus: {
      activeZoneId,
      zone,
      focusStackDepth: FocusData.getFocusStackDepth(),
    },
    inputSource: getLastInputSource(),
    effects,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 2. Log Replay — 로그에서 스냅샷 재구성
// ═══════════════════════════════════════════════════════════════════

/**
 * EventStream 로그를 순차 재생하여 특정 시점의 OSState를 재구성한다.
 *
 * @param logs - 시간순 정렬된 로그 배열 (oldest → newest)
 * @param upToId - 이 ID까지만 재생 (선택, 없으면 전체)
 */
export function buildSnapshotFromLogs(
  logs: LogEntry[],
  upToId?: number,
): OSState {
  let state: OSState = { ...INITIAL_OS_STATE, effects: [] };

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
            inputSource: log.inputSource as OSState["inputSource"],
          };
        }
        break;
    }
  }

  return state;
}

// ── Helpers ──

function applyStateLog(state: OSState, log: LogEntry): OSState {
  const details = log.details;
  if (!details || typeof details !== "object") return state;

  const logTitle = log.title ?? "";

  // Focus change: { from, to, zoneId }
  if ("from" in details && "to" in details) {
    if (logTitle.startsWith("Focus")) {
      return updateFocus(state, (f) => ({
        ...f,
        zone: f.zone ? { ...f.zone, focusedItemId: details.to ?? null } : null,
      }));
    }

    if (logTitle.startsWith("Selection")) {
      return updateFocus(state, (f) => ({
        ...f,
        zone: f.zone ? { ...f.zone, selection: details.to ?? [] } : null,
      }));
    }

    if (logTitle.startsWith("Zone")) {
      return updateFocus(state, (f) => ({
        ...f,
        activeZoneId: details.to ?? null,
        zone: details.to ? { ...EMPTY_ZONE, id: details.to } : null,
      }));
    }
  }

  // FocusStack
  if (logTitle.includes("FocusStack")) {
    const depth = extractDepth(logTitle);
    if (depth !== null) {
      return updateFocus(state, (f) => ({ ...f, focusStackDepth: depth }));
    }
  }

  return state;
}

function applyEffectLog(state: OSState, log: LogEntry): OSState {
  const details = log.details;
  if (!details || typeof details !== "object") return state;

  const record = createFocusEffect(
    details.action ?? "focus",
    details.targetId ?? null,
    details.executed ?? true,
    details.reason,
  );

  return {
    ...state,
    effects: [...state.effects, record],
  };
}

function updateFocus(
  state: OSState,
  updater: (focus: FocusState) => FocusState,
): OSState {
  return { ...state, focus: updater(state.focus) };
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
