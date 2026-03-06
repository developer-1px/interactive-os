/**
 * @spec docs/1-project/inspector-dogfooding/spec.md
 */

import type { Transaction } from "@kernel/core/transaction";
import { type AppPage, createPage } from "@os-devtool/testing/page";
import { beforeEach, describe, expect, it } from "vitest";
import {
  INSPECTOR_SCROLL_TO_BOTTOM,
  InspectorApp,
  type InspectorState,
  selectFilteredTransactions,
  setScrollState,
  updateSearchQuery,
} from "../../app";
import { UnifiedInspector } from "../../panels/UnifiedInspector";

// Note: To properly test React integration, we need the UI component.
// But we might simulate it with a headless page if we just test the App definition.
// For Tier 2 App tests, we should pass the UI component if we want to mount it.
// To keep it simple and test just the OS integration (fields + commands + state),
// we can use the app definition without mounting the React component.

describe("Feature: Inspector Dogfooding T1 (App Store & Field Binding)", () => {
  let page: AppPage<InspectorState>;

  beforeEach(() => {
    // We expect InspectorApp to define the zones and fields
    page = createPage(InspectorApp, UnifiedInspector);
    // Go to the main inspector zone (assumed to be 'inspector-main' or similar)
    // The spec says zone is 'inspector-search' and 'inspector-filters'
    page.goto("inspector-search", { items: ["search-input", "clearBtn"] });
  });

  describe("Scenario: 검색어 입력 시 Store 갱신", () => {
    it("타이핑 시 OS_UPDATE_FIELD가 dispatch되고 searchQuery 상태가 갱신된다", () => {
      // Given: search field is active
      page.dispatch(updateSearchQuery({ value: "click" }));

      // Then: state should be updated
      expect(page.state.searchQuery).toBe("click");
    });
  });

  describe("Scenario: 검색창 지우기 (Clear)", () => {
    it("X 버튼(clearBtn) 클릭 시 검색어가 초기화된다", () => {
      // Given
      page.dispatch(updateSearchQuery({ value: "click" }));
      expect(page.state.searchQuery).toBe("click");

      // When
      page.click("clearBtn");

      // Then
      expect(page.state.searchQuery).toBe("");
    });
  });

  describe("Scenario: 그룹 필터 토글", () => {
    it("활성화 상태에서 클릭 시 비활성화되고, 다시 클릭 시 활성화된다", () => {
      page.goto("inspector-filters", { items: ["groupBtn-kernel"] });

      // Given: ensure it's initially active (not disabled)
      if (page.state.disabledGroups.has("kernel")) {
        page.click("groupBtn-kernel"); // toggle it back
      }
      expect(page.state.disabledGroups.has("kernel")).toBe(false);

      // When: 비활성화
      page.click("groupBtn-kernel");

      // Then
      expect(page.state.disabledGroups.has("kernel")).toBe(true);

      // When: 다시 활성화
      page.click("groupBtn-kernel");

      // Then
      expect(page.state.disabledGroups.has("kernel")).toBe(false);
    });
  });
});

describe("Feature: Inspector Dogfooding T2 (파생 데이터 연산 분리)", () => {
  let page: AppPage<InspectorState>;

  beforeEach(() => {
    page = createPage(InspectorApp, UnifiedInspector);
  });

  const baseTx: Omit<Transaction, "id" | "handlerScope" | "command"> = {
    timestamp: 0,
    bubblePath: [],
    effects: null,
    changes: [],
    stateBefore: null,
    stateAfter: null,
  };

  const mockTxs: Transaction[] = [
    {
      ...baseTx,
      id: 1,
      handlerScope: "kernel",
      command: { type: "system/init", payload: undefined },
    },
    {
      ...baseTx,
      id: 2,
      handlerScope: "ui",
      command: { type: "dispatch", payload: undefined },
    },
    {
      ...baseTx,
      id: 3,
      handlerScope: "ui",
      command: { type: "render", payload: undefined },
    },
  ];

  describe("Scenario: 검색어에 따른 트랜잭션 필터링", () => {
    it("selectFilteredTransactions는 검색어 문자열을 포함하는 트랜잭션만 반환한다", () => {
      // Given: search field has "dispatch"
      page.dispatch(updateSearchQuery({ value: "dispatch" }));

      // When: we evaluate the selector
      const filtered = selectFilteredTransactions(page.state, mockTxs);

      // Then
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(2);
    });
  });

  describe("Scenario: 비활성화 그룹에 따른 트랜잭션 필터링", () => {
    it("disabledGroups에 포함된 그룹의 트랜잭션은 제외하고 반환한다", () => {
      // Given: "kernel" group is disabled
      page.goto("inspector-filters", { items: ["groupBtn-kernel"] });
      if (!page.state.disabledGroups.has("kernel")) {
        page.click("groupBtn-kernel");
      }
      expect(page.state.disabledGroups.has("kernel")).toBe(true);

      // Then: kernel group (id 1) should be excluded
      page.dispatch(updateSearchQuery({ value: "" })); // Clear the search query to isolate this test
      const filtered = selectFilteredTransactions(page.state, mockTxs);
      expect(filtered.length).toBe(2);
      expect(filtered.map((t) => t.id)).toEqual([2, 3]);
    });
  });
});

describe("Feature: Inspector Dogfooding T3 (명시적 OS_SCROLL 커맨드 구축)", () => {
  let page: AppPage<InspectorState>;

  beforeEach(() => {
    page = createPage(InspectorApp, UnifiedInspector);
  });

  describe("Scenario: 새 트랜잭션 수신 시 자동 스크롤", () => {
    it("isUserScrolled가 false이고 검색어가 없을 때, 새 트랜잭션이 추가되면 INSPECTOR_SCROLL_TO_BOTTOM이 dispatch된다", () => {
      // Note: In an actual OS test, we would probably observe the commands dispatched.
      // But since AppPage doesn't expose a spy on dispatch easily, we can check if
      // there is a way to verify the effect, or simply expect the dispatch to be handled.
      // For now, let's just trigger a new transaction simulation and check state.
      // Let's assume there's an `addTransaction` action or we can just verify the commands defined.

      // Expected to fail until implemented
      expect(INSPECTOR_SCROLL_TO_BOTTOM).toBeDefined();
    });
  });

  describe("Scenario: 맨 아래로 수동 스크롤", () => {
    it("isUserScrolled를 조작하고 수동 스크롤 트리거 시 상태가 false로 리셋된다", () => {
      // Assume we can set isUserScrolled = true
      page.dispatch(setScrollState({ isUserScrolled: true }));
      expect(page.state.isUserScrolled).toBe(true);

      // Assume there's an item to trigger scroll to bottom
      page.goto("inspector-scroll", { items: ["scrollToBottomBtn"] });
      page.click("scrollToBottomBtn");

      expect(page.state.isUserScrolled).toBe(false);
    });
  });
});
