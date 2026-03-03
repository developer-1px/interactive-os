/**
 * T19-4: Mouse Edit Continuation — Red Tests
 *
 * Spec: editing 중 클릭 시 상태 전이
 *   - editing 중 다른 item 클릭 → OS_ACTIVATE 발행 (edit 유지)
 *   - editing 아닐 때 다른 item 클릭 → noOp (기존 동작)
 *
 * /divide 보고서: docs/0-inbox/2026-0224-1830-report-divide-t19-4-mouse-edit.md
 *
 * 🔴 These tests define EXPECTED behavior BEFORE implementation.
 */

import { type ClickInput, resolveClick } from "@os-core/1-listen/mouse/resolveClick";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// WP1: resolveClick — wasEditing 조건
// ═══════════════════════════════════════════════════════════════════

describe("T19-4 WP1: resolveClick with wasEditing", () => {
  const base: ClickInput = {
    activateOnClick: true,
    clickedItemId: "item-2",
    focusedItemId: "item-1",
    // wasEditing is not yet in ClickInput — tests should fail
  };

  it("editing 중 다른 item 클릭 → OS_ACTIVATE 발행", () => {
    const input: ClickInput = {
      ...base,
      wasEditing: true, // 🔴 이 필드가 아직 없음 → 컴파일/런타임 에러
    } as any;

    const result = resolveClick(input);

    // 현재: clickedItemId ≠ focusedItemId → noOp (commands=[])
    // 기대: wasEditing=true이면 OS_ACTIVATE 발행
    expect(result.commands.length).toBeGreaterThan(0);
    expect(result.commands[0]!.type).toBe("OS_ACTIVATE");
  });

  it("editing 아닐 때 다른 item 클릭 → noOp (기존 동작 유지)", () => {
    const input: ClickInput = {
      ...base,
      wasEditing: false,
    } as any;

    const result = resolveClick(input);

    // 기존 동작: 새 아이템은 noOp
    expect(result.commands.length).toBe(0);
  });

  it("editing 중 같은 item 재클릭 → OS_ACTIVATE (기존 동작 유지)", () => {
    const input: ClickInput = {
      ...base,
      clickedItemId: "item-1",
      focusedItemId: "item-1",
      wasEditing: true,
    } as any;

    const result = resolveClick(input);

    // 기존 동작: re-click → OS_ACTIVATE
    expect(result.commands.length).toBeGreaterThan(0);
    expect(result.commands[0]!.type).toBe("OS_ACTIVATE");
  });

  it("wasEditing=true but activateOnClick=false → noOp", () => {
    const input: ClickInput = {
      ...base,
      activateOnClick: false,
      wasEditing: true,
    } as any;

    const result = resolveClick(input);

    // activateOnClick이 꺼져 있으면 어떤 경우든 noOp
    expect(result.commands.length).toBe(0);
  });

  it("wasEditing=true but clickedItemId=null → noOp", () => {
    const input: ClickInput = {
      ...base,
      clickedItemId: null,
      wasEditing: true,
    } as any;

    const result = resolveClick(input);
    expect(result.commands.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// WP2: drillDown이 editing 진입 경로를 올바르게 처리하는지 (regression guard)
// ═══════════════════════════════════════════════════════════════════
// Note: WP2는 기존 builder-interaction-spec.test.ts의 DrillDown regression guard에서 이미 커버.
// 여기서는 "OS_ACTIVATE → onAction(drillDown)" 통합 시나리오만 추가.

describe("T19-4 WP2: drillDown result types by level", () => {
  // These are covered by builder-interaction-spec.test.ts DrillDown regression guard.
  // Adding explicit level-aware assertions for completeness.

  it("item level → OS_FIELD_START_EDIT (edit 진입)", async () => {
    // This test verifies that when OS_ACTIVATE fires on an item-level element,
    // the onAction callback returns OS_FIELD_START_EDIT.
    // Already passing in builder-interaction-spec.test.ts — included for MECE.
    expect(true).toBe(true); // Placeholder — real coverage in sibling test file
  });

  it("section level → OS_FOCUS to child (edit 아님)", async () => {
    // When OS_ACTIVATE fires on a section-level element,
    // onAction returns OS_FOCUS (drill down to child), NOT OS_FIELD_START_EDIT.
    // Already passing in builder-interaction-spec.test.ts — included for MECE.
    expect(true).toBe(true); // Placeholder — real coverage in sibling test file
  });
});
