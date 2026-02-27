/**
 * @spec docs/1-project/headless-zone-registry/spec.md
 *
 * T1: Zone 논리 등록을 render-time으로 이동
 *
 * 핵심 증명: Zone을 renderToString으로 렌더링해도
 * ZoneRegistry에 config + callbacks가 등록되어야 한다.
 *
 * Tier 1: OS 커널 아키텍처 테스트
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { Zone } from "@os/6-components/primitives/Zone";
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
// Tests — Zone headless registration
// ═══════════════════════════════════════════════════════════════════

describe("T1: Zone Headless Registration", () => {
  afterEach(cleanup);

  it("S1: Zone registers in ZoneRegistry at render-time (no DOM)", () => {
    renderToString(
      createElement(Zone, {
        id: ZONE_ID,
        role: "listbox",
        children: null,
      }),
    );

    expect(ZoneRegistry.has(ZONE_ID)).toBe(true);
  });

  it("S3: config is accessible in headless (renderToString) mode", () => {
    renderToString(
      createElement(Zone, {
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

  it("S6: callbacks are registered at render-time in headless mode", () => {
    const onAction = () => ({ type: "TEST_ACTION" });
    const onDelete = () => ({ type: "TEST_DELETE" });

    renderToString(
      createElement(Zone, {
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
    expect(entry!.element).toBeNull();
  });

  it("S5: re-render with different role updates config in registry", () => {
    renderToString(
      createElement(Zone, {
        id: ZONE_ID,
        role: "listbox",
        children: null,
      }),
    );

    const firstConfig = ZoneRegistry.get(ZONE_ID)?.config;
    expect(firstConfig).toBeDefined();

    renderToString(
      createElement(Zone, {
        id: ZONE_ID,
        role: "toolbar",
        children: null,
      }),
    );

    const secondConfig = ZoneRegistry.get(ZONE_ID)?.config;
    expect(secondConfig).toBeDefined();
    expect(secondConfig!.navigate.orientation).toBe("horizontal");
  });
});
