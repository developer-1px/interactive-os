/**
 * @spec docs/1-project/headless-zone-registry/spec.md
 *
 * T1: FocusGroup Zone 논리 등록을 render-time으로 이동
 *
 * 핵심 증명: FocusGroup을 containerRef 없이 (headless=true) 렌더링해도
 * ZoneRegistry에 config + callbacks가 등록되어야 한다.
 *
 * 현재(Before): FocusGroup은 useLayoutEffect 안에서 containerRef.current 가드가 있어서
 * DOM element가 없으면 ZoneRegistry.register를 호출하지 않는다.
 * → 이 테스트는 🔴 FAIL해야 한다.
 *
 * 목표(After): render-time에 논리 등록 → element만 지연 바인딩
 * → 이 테스트가 🟢 PASS해야 한다.
 *
 * Tier 1: OS 커널 아키텍처 테스트
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { FocusGroup } from "@os/6-components/base/FocusGroup";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const ZONE_ID = "headless-test-zone";

function cleanup() {
  for (const key of [...ZoneRegistry.keys()]) {
    ZoneRegistry.unregister(key);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Tests — FocusGroup headless registration
//
// renderToString simulates SSR-like headless: React runs render
// (useMemo executes), but no DOM is created (useLayoutEffect does NOT run).
// This is the exact scenario of T1: "Zone should register at render-time,
// not at layout-effect-time."
// ═══════════════════════════════════════════════════════════════════

describe("T1: FocusGroup Headless Zone Registration", () => {
  afterEach(cleanup);

  // Scenario 1: Render-time 논리 등록
  it("S1: FocusGroup registers zone in ZoneRegistry at render-time (no DOM)", () => {
    // renderToString runs useMemo but NOT useLayoutEffect/useEffect
    renderToString(
      createElement(FocusGroup, {
        id: ZONE_ID,
        role: "listbox",
        children: null,
      }),
    );

    // This FAILS in current implementation because ZoneRegistry.register
    // is inside useLayoutEffect (which doesn't run in renderToString)
    expect(ZoneRegistry.has(ZONE_ID)).toBe(true);
  });

  // Scenario 3: Headless 환경에서 config가 등록
  it("S3: config is accessible in headless (renderToString) mode", () => {
    renderToString(
      createElement(FocusGroup, {
        id: ZONE_ID,
        role: "listbox",
        children: null,
      }),
    );

    const entry = ZoneRegistry.get(ZONE_ID);
    expect(entry).toBeDefined();
    expect(entry!.config).toBeDefined();
    expect(entry!.config.navigate).toBeDefined();
  });

  // Scenario 6: Callbacks 등록 (element 무관)
  it("S6: callbacks are registered at render-time in headless mode", () => {
    const onAction = () => ({ type: "TEST_ACTION" });
    const onDelete = () => ({ type: "TEST_DELETE" });

    renderToString(
      createElement(FocusGroup, {
        id: ZONE_ID,
        role: "listbox",
        onAction,
        onDelete,
        children: null,
      }),
    );

    const entry = ZoneRegistry.get(ZONE_ID);
    expect(entry).toBeDefined();
    expect(entry!.onAction).toBe(onAction);
    expect(entry!.onDelete).toBe(onDelete);
    // element should be null (no DOM in renderToString)
    expect(entry!.element).toBeNull();
  });

  // Scenario 5: Config 변경 시 재등록 (render-path)
  it("S5: re-render with different role updates config in registry", () => {
    // First render
    renderToString(
      createElement(FocusGroup, {
        id: ZONE_ID,
        role: "listbox",
        children: null,
      }),
    );

    const firstConfig = ZoneRegistry.get(ZONE_ID)?.config;
    expect(firstConfig).toBeDefined();

    // Second render with different role
    renderToString(
      createElement(FocusGroup, {
        id: ZONE_ID,
        role: "toolbar",
        children: null,
      }),
    );

    const secondConfig = ZoneRegistry.get(ZONE_ID)?.config;
    expect(secondConfig).toBeDefined();
    // Config should have been updated (toolbar has horizontal orientation)
    expect(secondConfig!.navigate.orientation).toBe("horizontal");
  });
});
