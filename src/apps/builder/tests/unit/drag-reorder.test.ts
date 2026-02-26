/**
 * T5: 블록 드래그 정렬 — Red Tests
 *
 * DT 참조: docs/6-products/builder/stories.md US-004
 * Spec 참조: docs/1-project/builder-v2/specs/t5-drag-reorder-spec.md
 *
 * DT #1: 드래그 시작 → isDragging=true, dragItemId 설정
 * DT #4: 드롭 before → blocks 순서 변경
 * DT #5: 드롭 after → blocks 순서 변경
 * DT #6: 드래그 취소 → isDragging=false, 순서 변경 없음
 */
import { describe, expect, it } from "vitest";
import { reorderBlocks } from "@/apps/builder/model/reorderBlocks";

describe("T5: 블록 드래그 정렬 — reorderBlocks", () => {
  const blocks = [
    { id: "hero", label: "Hero", type: "hero", fields: {} },
    { id: "features", label: "Features", type: "features", fields: {} },
    { id: "footer", label: "Footer", type: "footer", fields: {} },
  ];

  // DT #4: 드롭 before — "features"를 "hero" 앞으로
  it("DT #4: before 위치에 드롭하면 해당 아이템 앞으로 이동한다", () => {
    const result = reorderBlocks(blocks, {
      itemId: "features",
      overItemId: "hero",
      position: "before",
    });

    expect(result.map((b) => b.id)).toEqual(["features", "hero", "footer"]);
  });

  // DT #5: 드롭 after — "hero"를 "footer" 뒤로
  it("DT #5: after 위치에 드롭하면 해당 아이템 뒤로 이동한다", () => {
    const result = reorderBlocks(blocks, {
      itemId: "hero",
      overItemId: "footer",
      position: "after",
    });

    expect(result.map((b) => b.id)).toEqual(["features", "footer", "hero"]);
  });

  // DT #6: 같은 위치에 드롭 → 순서 변경 없음
  it("DT #6: 같은 위치에 드롭하면 순서가 변하지 않는다", () => {
    const result = reorderBlocks(blocks, {
      itemId: "hero",
      overItemId: "hero",
      position: "before",
    });

    expect(result.map((b) => b.id)).toEqual(["hero", "features", "footer"]);
  });

  // 경계: 마지막 아이템을 첫 번째로
  it("경계: 마지막 아이템을 첫 번째 위치로 이동", () => {
    const result = reorderBlocks(blocks, {
      itemId: "footer",
      overItemId: "hero",
      position: "before",
    });

    expect(result.map((b) => b.id)).toEqual(["footer", "hero", "features"]);
  });
});
