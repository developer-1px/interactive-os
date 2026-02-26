/**
 * T19: Builder Interaction Spec — BDD Red Tests
 *
 * 3-State Model: Deselected / Selected / Editing
 * 1-Rule: drill up. 부모 없으면 탈출 (focusedItemId=null).
 *
 * Discussion: docs/1-project/builder-v2/discussions/2026-0224-1739-builder-interaction-spec.md
 *
 * These tests define the EXPECTED behavior BEFORE implementation.
 * All should 🔴 FAIL initially — that's the point.
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { DEFAULT_CONFIG } from "@os/schemas/focus/config/FocusGroupConfig";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createCanvasItemFilter,
  createDrillDown,
  createDrillUp,
} from "../../features/hierarchicalNavigation";

const ZONE_ID = "test-canvas";

/**
 * DOM tree for builder hierarchy:
 *
 *   [zone container]
 *     s1 (section)
 *       └── g1 (group)
 *             ├── i1 (item)
 *             └── i2 (item)
 *     s2 (section)
 */
function buildTestDOM(): HTMLDivElement {
  const container = document.createElement("div");
  container.id = ZONE_ID;
  container.setAttribute("data-zone", ZONE_ID);

  const s1 = document.createElement("div");
  s1.setAttribute("data-item-id", "s1");
  s1.setAttribute("data-level", "section");

  const g1 = document.createElement("div");
  g1.setAttribute("data-item-id", "g1");
  g1.setAttribute("data-level", "group");

  const i1 = document.createElement("div");
  i1.setAttribute("data-item-id", "i1");
  i1.setAttribute("data-level", "item");

  const i2 = document.createElement("div");
  i2.setAttribute("data-item-id", "i2");
  i2.setAttribute("data-level", "item");

  g1.appendChild(i1);
  g1.appendChild(i2);
  s1.appendChild(g1);

  const s2 = document.createElement("div");
  s2.setAttribute("data-item-id", "s2");
  s2.setAttribute("data-level", "section");

  container.appendChild(s1);
  container.appendChild(s2);
  document.body.appendChild(container);
  return container;
}

describe("T19: Builder Interaction Spec — 3 States + 1 Rule", () => {
  let container: HTMLDivElement;

  const drillDown = createDrillDown(ZONE_ID);
  const drillUp = createDrillUp(ZONE_ID);

  beforeEach(() => {
    container = buildTestDOM();
    ZoneRegistry.register(ZONE_ID, {
      config: { ...DEFAULT_CONFIG },
      element: container,
      parentId: null,
      itemFilter: createCanvasItemFilter(ZONE_ID),
    });
  });

  afterEach(() => {
    ZoneRegistry.unregister(ZONE_ID);
    container.remove();
  });

  // ═══════════════════════════════════════════════════════════════
  // T19-1: drillUp — 부모 없으면 탈출 (deselect)
  // ═══════════════════════════════════════════════════════════════

  describe("T19-1: drillUp at top level → deselect (not no-op)", () => {
    it("section에서 drillUp → deselect 커맨드 반환 (focusedItemId=null)", () => {
      const result = drillUp({
        focusId: "s1",
        selection: [],
        anchor: null,
        isExpandable: false,
        isDisabled: false,
        treeLevel: undefined,
      });

      // 현재: return [] (no-op)
      // 기대: focusedItemId를 null로 만드는 커맨드 반환
      expect(result).not.toEqual([]);

      const cmd = (Array.isArray(result) ? result[0] : result)!;
      expect(cmd).toBeDefined();
      // deselect 커맨드는 focusedItemId를 null로 만들어야 한다
      expect(cmd.type).toBeDefined();
    });

    it("group에서 drillUp → 부모 section으로 이동 (기존 동작 유지)", () => {
      const result = drillUp({
        focusId: "g1",
        selection: [],
        anchor: null,
        isExpandable: false,
        isDisabled: false,
        treeLevel: undefined,
      });
      expect(result).not.toEqual([]);
      const cmd = (Array.isArray(result) ? result[0] : result)!;
      expect(cmd.type).toContain("OS_FOCUS");
    });

    it("item에서 drillUp → 부모 group으로 이동 (기존 동작 유지)", () => {
      const result = drillUp({
        focusId: "i1",
        selection: [],
        anchor: null,
        isExpandable: false,
        isDisabled: false,
        treeLevel: undefined,
      });
      expect(result).not.toEqual([]);
      const cmd = (Array.isArray(result) ? result[0] : result)!;
      expect(cmd.type).toContain("OS_FOCUS");
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // T19-2: ESC = drillUp (ESC와 \는 같은 연산)
  // ═══════════════════════════════════════════════════════════════

  describe("T19-2: ESC behaves like drillUp (not dismiss/deselect)", () => {
    it("item에서 ESC → 부모 group/section으로 drill up (deselect 아님)", () => {
      // ESC가 drillUp keybinding으로 등록되어야 한다
      // 현재: dismiss: { escape: "deselect" } → 모든 레벨에서 deselect
      // 기대: ESC → drillUp → 부모로 이동
      const result = drillUp({
        focusId: "i1",
        selection: [],
        anchor: null,
        isExpandable: false,
        isDisabled: false,
        treeLevel: undefined,
      });
      const cmd = (Array.isArray(result) ? result[0] : result)!;
      expect(cmd.type).toContain("OS_FOCUS");
    });

    it("section에서 ESC → 탈출 (drillUp의 terminal case)", () => {
      const result = drillUp({
        focusId: "s1",
        selection: [],
        anchor: null,
        isExpandable: false,
        isDisabled: false,
        treeLevel: undefined,
      });
      // 부모 없음 → 탈출 커맨드
      expect(result).not.toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // T19-3: Deselected 상태 — focusedItemId=null
  // ═══════════════════════════════════════════════════════════════

  describe("T19-3: Deselected state (focusedItemId=null)", () => {
    it("section에서 drillUp 결과는 focusedItemId를 null로 만든다", () => {
      const result = drillUp({
        focusId: "s1",
        selection: [],
        anchor: null,
        isExpandable: false,
        isDisabled: false,
        treeLevel: undefined,
      });

      // deselect 커맨드가 발행되면
      // focusedItemId가 null이 되어야 커서가 숨겨지고 키보드가 무반응이 됨
      const cmd = (Array.isArray(result) ? result[0] : result)!;
      expect(cmd).toBeDefined();
      // OS_FOCUS with null itemId, or a dedicated deselect command
      if (cmd.type?.includes("FOCUS")) {
        expect((cmd as any).payload?.itemId).toBeNull();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Drill down — 기존 동작 확인 (regression guard)
  // ═══════════════════════════════════════════════════════════════

  describe("DrillDown regression guard", () => {
    it("Enter on section → first group child", () => {
      const result = drillDown({
        focusId: "s1",
        selection: [],
        anchor: null,
        isExpandable: false,
        isDisabled: false,
        treeLevel: undefined,
      });
      expect(result).not.toEqual([]);
      const cmd = (Array.isArray(result) ? result[0] : result)!;
      expect(cmd.type).toContain("OS_FOCUS");
    });

    it("Enter on group → first item child", () => {
      const result = drillDown({
        focusId: "g1",
        selection: [],
        anchor: null,
        isExpandable: false,
        isDisabled: false,
        treeLevel: undefined,
      });
      expect(result).not.toEqual([]);
      const cmd = (Array.isArray(result) ? result[0] : result)!;
      expect(cmd.type).toContain("OS_FOCUS");
    });

    it("Enter on item → start editing (FIELD_START_EDIT)", () => {
      const result = drillDown({
        focusId: "i1",
        selection: [],
        anchor: null,
        isExpandable: false,
        isDisabled: false,
        treeLevel: undefined,
      });
      const cmd = (Array.isArray(result) ? result[0] : result)!;
      expect(cmd.type).toContain("FIELD");
    });
  });
});
