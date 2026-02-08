/**
 * FocusData - WeakMap-based Zone Data Storage
 *
 * DOM Element를 key로 사용하여 Zone 데이터 저장
 * - Element GC 시 자동 삭제 (cleanup 불필요)
 * - 등록/해제 코드 불필요
 */

import type { BaseCommand } from "@os/entities/BaseCommand";
import { activeZoneGuard } from "@os/lib/loopGuard";
import type { FocusGroupStore } from "../store/focusGroupStore";
import type { FocusGroupConfig } from "../types";

export interface ZoneData {
  store: FocusGroupStore;
  config: FocusGroupConfig;
  parentId: string | null;
  // ARIA Standard Commands
  activateCommand?: BaseCommand;
  selectCommand?: BaseCommand;
  toggleCommand?: BaseCommand; // Space - checkbox/multi-select toggle
  // Clipboard Commands (Muscle Memory)
  copyCommand?: BaseCommand;
  cutCommand?: BaseCommand;
  pasteCommand?: BaseCommand;
  // Editing Commands (Muscle Memory)
  deleteCommand?: BaseCommand;
  undoCommand?: BaseCommand;
  redoCommand?: BaseCommand;
}

const zoneDataMap = new WeakMap<HTMLElement, ZoneData>();

// Active zone tracking (글로벌 상태)
let activeZoneId: string | null = null;
const activeZoneListeners = new Set<() => void>();

// ═══════════════════════════════════════════════════════════════════
// Focus Stack - Modal/Dialog Focus Restoration
// ═══════════════════════════════════════════════════════════════════

export interface FocusStackEntry {
  zoneId: string;
  itemId: string | null;
  /** Optional: Zone ID that triggered the push (for debugging) */
  triggeredBy?: string;
}

/**
 * Global focus stack for modal/dialog focus restoration.
 * Push when opening overlay, pop when closing to restore previous focus.
 */
const focusStack: FocusStackEntry[] = [];
const focusStackListeners = new Set<() => void>();

export const FocusData = {
  /**
   * Zone 데이터 저장 (FocusGroup 마운트 시)
   */
  set(el: HTMLElement, data: ZoneData): void {
    zoneDataMap.set(el, data);

    // If we are updating the active zone (e.g. remount or config change),
    // notify listeners so they refresh their data reference (store).
    if (activeZoneId && el.id === activeZoneId) {
      activeZoneListeners.forEach((fn) => {
        fn();
      });
    }
  },

  /**
   * Zone 데이터 조회 (element로)
   */
  get(el: HTMLElement | null): ZoneData | undefined {
    if (!el) return undefined;
    return zoneDataMap.get(el);
  },

  /**
   * Zone 데이터 조회 (zoneId로)
   */
  getById(zoneId: string): ZoneData | undefined {
    const el = document.getElementById(zoneId);
    if (!el) return undefined;
    return zoneDataMap.get(el);
  },

  /**
   * Active Zone 설정
   */
  setActiveZone(zoneId: string | null): void {
    if (activeZoneId !== zoneId) {
      // ── Loop Guard: prevent zone flip-flop ──
      if (!activeZoneGuard.check()) return;
      const prev = activeZoneId;
      activeZoneId = zoneId;
      activeZoneListeners.forEach((fn) => {
        fn();
      });

      // Inspector Stream
      import("../../inspector/InspectorLogStore").then(({ InspectorLog }) => {
        InspectorLog.log({
          type: "STATE",
          title: `Zone → ${zoneId ?? "(none)"}`,
          details: { from: prev, to: zoneId },
          icon: "cpu",
          source: "os",
        });
      });
    }
  },

  /**
   * Active Zone ID 조회
   */
  getActiveZoneId(): string | null {
    return activeZoneId;
  },

  /**
   * Active Zone 데이터 조회
   */
  getActiveZone(): ZoneData | undefined {
    if (!activeZoneId) return undefined;
    return this.getById(activeZoneId);
  },

  /**
   * Active Zone 변경 구독
   */
  subscribeActiveZone(listener: () => void): () => void {
    activeZoneListeners.add(listener);
    return () => activeZoneListeners.delete(listener);
  },

  /**
   * 형제 Zone 찾기 (Tab 이동용)
   */
  getSiblingZone(direction: "forward" | "backward"): string | null {
    if (!activeZoneId) return null;

    const currentEl = document.getElementById(activeZoneId);
    const currentData = currentEl ? zoneDataMap.get(currentEl) : undefined;
    if (!currentData) return null;

    // 같은 부모를 가진 형제들 찾기
    const allZones = document.querySelectorAll("[data-focus-group]");
    const siblings: HTMLElement[] = [];

    for (const el of allZones) {
      const data = zoneDataMap.get(el as HTMLElement);
      if (data?.parentId === currentData.parentId) {
        siblings.push(el as HTMLElement);
      }
    }

    if (siblings.length === 0) return null;

    // DOM 순서로 정렬
    siblings.sort((a, b) => {
      const pos = a.compareDocumentPosition(b);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    const currentIndex = siblings.findIndex((el) => el.id === activeZoneId);
    if (currentIndex === -1) return null;

    const delta = direction === "forward" ? 1 : -1;
    let nextIndex = currentIndex + delta;

    // Wrap around
    if (nextIndex < 0) nextIndex = siblings.length - 1;
    if (nextIndex >= siblings.length) nextIndex = 0;

    return siblings[nextIndex]?.id ?? null;
  },

  /**
   * 포커스 경로 (중첩 Zone용)
   */
  getFocusPath(): string[] {
    if (!activeZoneId) return [];

    const path: string[] = [];
    let currentId: string | null = activeZoneId;

    while (currentId) {
      path.unshift(currentId);
      const data = this.getById(currentId);
      currentId = data?.parentId ?? null;
      if (path.length > 100) break; // 무한루프 방지
    }
    return path;
  },

  /**
   * 모든 Zone ID 조회 (DOM 순서)
   */
  getOrderedZones(): string[] {
    const zones = document.querySelectorAll("[data-focus-group]");
    return Array.from(zones)
      .map((el) => el.id)
      .filter(Boolean);
  },

  // ═══════════════════════════════════════════════════════════════════
  // Focus Stack API - Modal/Dialog Focus Restoration
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Push current focus state onto the stack.
   * Call this BEFORE opening a modal/dialog.
   * @param triggeredBy - Optional ID of the zone that's being opened (for debugging)
   */
  pushFocusStack(triggeredBy?: string): void {
    const currentZoneId = activeZoneId;
    const currentData = currentZoneId ? this.getById(currentZoneId) : null;
    const currentItemId = currentData?.store.getState().focusedItemId ?? null;

    const entry: FocusStackEntry = {
      zoneId: currentZoneId ?? "",
      itemId: currentItemId,
      triggeredBy,
    };

    focusStack.push(entry);
    focusStackListeners.forEach((fn) => {
      fn();
    });

    // Inspector Stream
    import("../../inspector/InspectorLogStore").then(({ InspectorLog }) => {
      InspectorLog.log({
        type: "STATE",
        title: `FocusStack PUSH (depth: ${focusStack.length})`,
        details: entry,
        icon: "cpu",
        source: "os",
      });
    });
  },

  /**
   * Pop the top entry from the focus stack.
   * Call this AFTER closing a modal/dialog.
   * @returns The popped entry, or null if stack is empty
   */
  popFocusStack(): FocusStackEntry | null {
    const entry = focusStack.pop() ?? null;
    focusStackListeners.forEach((fn) => {
      fn();
    });

    // Inspector Stream
    import("../../inspector/InspectorLogStore").then(({ InspectorLog }) => {
      InspectorLog.log({
        type: "STATE",
        title: `FocusStack POP (depth: ${focusStack.length})`,
        details: entry,
        icon: "cpu",
        source: "os",
      });
    });
    return entry;
  },

  /**
   * Peek at the top entry without removing it.
   */
  peekFocusStack(): FocusStackEntry | null {
    return focusStack[focusStack.length - 1] ?? null;
  },

  /**
   * Get current stack depth.
   */
  getFocusStackDepth(): number {
    return focusStack.length;
  },

  /**
   * Subscribe to focus stack changes.
   */
  subscribeFocusStack(listener: () => void): () => void {
    focusStackListeners.add(listener);
    return () => focusStackListeners.delete(listener);
  },

  /**
   * Clear the entire focus stack.
   * Use with caution - typically only for app reset.
   */
  clearFocusStack(): void {
    focusStack.length = 0;
    focusStackListeners.forEach((fn) => {
      fn();
    });
    console.log("[FocusStack] CLEAR");
  },

  /**
   * Pop and restore focus to the previous state.
   * This is a convenience method that pops and dispatches FOCUS command.
   * @returns true if focus was restored, false if stack was empty
   */
  popAndRestoreFocus(): boolean {
    const entry = this.popFocusStack();
    if (!entry || !entry.zoneId) return false;

    // Delay restoration to allow current overlay to unmount
    setTimeout(() => {
      if (entry.itemId) {
        // Restore to specific item
        const targetEl = document.getElementById(entry.itemId);
        if (targetEl) {
          targetEl.focus();
          console.log("[FocusStack] RESTORE to:", entry.itemId);
        }
      } else if (entry.zoneId) {
        // Restore to zone (first focusable item)
        const zoneEl = document.getElementById(entry.zoneId);
        if (zoneEl) {
          const firstItem = zoneEl.querySelector(
            "[data-item-id]",
          ) as HTMLElement;
          if (firstItem) {
            firstItem.focus();
            console.log(
              "[FocusStack] RESTORE to zone first item:",
              firstItem.id,
            );
          }
        }
      }
    }, 50);

    return true;
  },
};
