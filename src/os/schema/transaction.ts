/**
 * Transaction — OS 트랜잭션 로그 스키마
 *
 * 하나의 입력 = 하나의 트랜잭션 = 하나의 스냅샷.
 * 모든 정보가 자기 완결적(self-contained)이다.
 */

import type { InputSource } from "./effects";
import type { OSState } from "./OSState";

// ═══════════════════════════════════════════════════════════════════
// Transaction
// ═══════════════════════════════════════════════════════════════════

export interface Transaction {
    id: number;
    timestamp: number;

    // ── Cause: 원인 ──

    /** 입력 정보 */
    input: TransactionInput;

    /** 실행된 커맨드 (없으면 null) */
    command: TransactionCommand | null;

    // ── Result: 결과 ──

    /** 실행 후 전체 상태 스냅샷 */
    snapshot: OSState;

    /** 이전 스냅샷과의 차이 */
    diff: StateDiff[];
}

export interface TransactionInput {
    source: InputSource;
    /** 사람이 읽을 수 있는 입력 설명 (e.g. "ArrowDown", "mousedown") */
    raw: string;
}

export interface TransactionCommand {
    type: string;
    payload?: unknown;
}

// ═══════════════════════════════════════════════════════════════════
// State Diff
// ═══════════════════════════════════════════════════════════════════

export interface StateDiff {
    /** dot-path (e.g. "focus.zone.focusedItemId") */
    path: string;
    from: unknown;
    to: unknown;
}

// ═══════════════════════════════════════════════════════════════════
// Diff Computation
// ═══════════════════════════════════════════════════════════════════

/**
 * 두 OSState 사이의 차이를 계산한다.
 * effects는 항상 transient이므로 diff에 포함하지 않는다.
 */
export function computeDiff(before: OSState, after: OSState): StateDiff[] {
    const diffs: StateDiff[] = [];

    diffScalar(diffs, "inputSource", before.inputSource, after.inputSource);
    diffFocusRoot(diffs, before, after);
    diffZone(diffs, before.focus.zone, after.focus.zone);

    return diffs;
}

// ── Diff Helpers ──

function diffScalar(
    diffs: StateDiff[],
    path: string,
    from: unknown,
    to: unknown,
): void {
    if (from !== to) {
        diffs.push({ path, from, to });
    }
}

function diffJSON(
    diffs: StateDiff[],
    path: string,
    from: unknown,
    to: unknown,
): void {
    if (JSON.stringify(from) !== JSON.stringify(to)) {
        diffs.push({ path, from, to });
    }
}

function diffFocusRoot(
    diffs: StateDiff[],
    before: OSState,
    after: OSState,
): void {
    diffScalar(
        diffs,
        "focus.activeZoneId",
        before.focus.activeZoneId,
        after.focus.activeZoneId,
    );
    diffScalar(
        diffs,
        "focus.focusStackDepth",
        before.focus.focusStackDepth,
        after.focus.focusStackDepth,
    );
}

function diffZone(
    diffs: StateDiff[],
    bz: OSState["focus"]["zone"],
    az: OSState["focus"]["zone"],
): void {
    diffZoneScalars(diffs, bz, az);
    diffZoneArrays(diffs, bz, az);
}

function diffZoneScalars(
    diffs: StateDiff[],
    bz: OSState["focus"]["zone"],
    az: OSState["focus"]["zone"],
): void {
    diffScalar(diffs, "focus.zone.id", bz?.id ?? null, az?.id ?? null);
    diffScalar(
        diffs,
        "focus.zone.focusedItemId",
        bz?.focusedItemId ?? null,
        az?.focusedItemId ?? null,
    );
    diffScalar(
        diffs,
        "focus.zone.selectionAnchor",
        bz?.selectionAnchor ?? null,
        az?.selectionAnchor ?? null,
    );
    diffScalar(
        diffs,
        "focus.zone.recoveryTargetId",
        bz?.recoveryTargetId ?? null,
        az?.recoveryTargetId ?? null,
    );
}

function diffZoneArrays(
    diffs: StateDiff[],
    bz: OSState["focus"]["zone"],
    az: OSState["focus"]["zone"],
): void {
    diffJSON(diffs, "focus.zone.selection", bz?.selection ?? [], az?.selection ?? []);
    diffJSON(
        diffs,
        "focus.zone.expandedItems",
        bz?.expandedItems ?? [],
        az?.expandedItems ?? [],
    );
    const stickyFrom = { x: bz?.stickyX ?? null, y: bz?.stickyY ?? null };
    const stickyTo = { x: az?.stickyX ?? null, y: az?.stickyY ?? null };
    diffJSON(diffs, "focus.zone.sticky", stickyFrom, stickyTo);
}
