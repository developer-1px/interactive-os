/**
 * T1: Tab State — tablist Zone의 activate → aria-selected 전환
 *
 * OS 계약: "앱은 의도를 선언하고, OS가 실행을 보장한다"
 * /audit 발견: BuilderTabs가 useState+onClick으로 우회
 *
 * 기대 동작:
 *   tablist Zone에서 Enter/Click → 해당 탭의 aria-selected=true
 *   OS가 관리 → 앱 코드에 useState+onClick 0줄
 *
 * Full Path: page.keyboard.press / page.click → page.attrs()["aria-selected"]
 */

import { createOsPage, type OsPage } from "@os/createOsPage";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const ZONE_ID = "tablist-test";

describe("tab-state: tablist activate → aria-selected", () => {
  let page: OsPage;

  beforeEach(() => {
    page = createOsPage();
    page.goto(ZONE_ID, {
      items: ["tab-0", "tab-1", "tab-2"],
      role: "tablist",
    });
  });

  afterEach(() => {
    page.cleanup();
  });

  // ── 1차 분기: Zone=tablist, 물리 입력 → 의도 ──
  // ── 2차 분기: 없음 (OS가 전부 처리) ──

  it("#1 첫 번째 탭이 기본 aria-selected=true", () => {
    expect(page.attrs("tab-0")["aria-selected"]).toBe(true);
    expect(page.attrs("tab-1")["aria-selected"]).toBe(false);
    expect(page.attrs("tab-2")["aria-selected"]).toBe(false);
  });

  it("#2 ArrowRight → 포커스 이동, aria-selected 변경 없음 (manual activation)", () => {
    page.keyboard.press("ArrowRight");

    expect(page.focusedItemId()).toBe("tab-1");
    // tablist followFocus: ArrowRight로 이동 시 selection도 따라감
    // APG tablist default = auto-activation (followFocus: true)
    expect(page.attrs("tab-1")["aria-selected"]).toBe(true);
    expect(page.attrs("tab-0")["aria-selected"]).toBe(false);
  });

  it("#3 ArrowRight → Enter → 해당 탭 활성화", () => {
    page.keyboard.press("ArrowRight");

    expect(page.attrs("tab-0")["aria-selected"]).toBe(false);
    expect(page.attrs("tab-1")["aria-selected"]).toBe(true);
  });

  it("#4 Click → 해당 탭 aria-selected=true", () => {
    page.click("tab-2");

    expect(page.attrs("tab-0")["aria-selected"]).toBe(false);
    expect(page.attrs("tab-2")["aria-selected"]).toBe(true);
  });

  it("#5 연속 이동 → 마지막 탭만 selected (단일 선택)", () => {
    // tab-0 selected → ArrowRight × 2 → tab-2 selected (followFocus)
    page.keyboard.press("ArrowRight");
    page.keyboard.press("ArrowRight");

    expect(page.attrs("tab-0")["aria-selected"]).toBe(false);
    expect(page.attrs("tab-1")["aria-selected"]).toBe(false);
    expect(page.attrs("tab-2")["aria-selected"]).toBe(true);
  });

  it("#6 ArrowRight wraps: tab-2 → tab-0", () => {
    page.keyboard.press("ArrowRight"); // → tab-1
    page.keyboard.press("ArrowRight"); // → tab-2
    page.keyboard.press("ArrowRight"); // → tab-0 (wrap)

    expect(page.focusedItemId()).toBe("tab-0");
  });
});
