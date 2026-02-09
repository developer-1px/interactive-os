/**
 * computeDiff — OSState 차이 계산 유틸리티
 *
 * 두 OSState 사이의 차이를 계산한다.
 * effects는 항상 transient이므로 diff에 포함하지 않는다.
 */

import type { OSState } from "./OSState.ts";
import type { StateDiff } from "./OSTransaction.ts";

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
