import { describe, expect, it } from "vitest";

/**
 * builder-i18n T1: 언어 전환하여 콘텐츠 보기 (US-001)
 *
 * Decision Table rows:
 * #1: Click [🌐 KO ▾] → 드롭다운 열림
 * #2: Click EN → SET_LOCALE(en) → 필드 en 콘텐츠
 * #4: Press Escape → 드롭다운 닫힘
 *
 * 이 테스트는 OS createOsPage 패턴이 아닌 순수 상태 테스트입니다.
 * 실제 OS 통합은 프로젝트가 builder-v2에 병합된 후 진행합니다.
 */

import { type LocalizedField, resolveFieldValue } from "../../entities/i18n";
import {
  closeDropdown,
  createLocaleState,
  openDropdown,
  setLocale,
} from "../../entities/localeState";

// --- Tests: DT rows → it() ---

describe("Feature: 언어 전환 (T1, US-001)", () => {
  // DT #1: Click [🌐 KO ▾] → 드롭다운 열림
  it("#1 locale 버튼 클릭 → 드롭다운 열림, 현재 locale에 ✓", () => {
    // Given
    const state = createLocaleState("ko", ["ko", "en"]);

    // When
    const next = openDropdown(state);

    // Then
    expect(next.dropdownOpen).toBe(true);
    expect(next.currentLocale).toBe("ko"); // 현재 locale 유지
    expect(next.availableLocales).toEqual(["ko", "en"]);
  });

  // DT #2: Click EN → SET_LOCALE(en) → 필드 en 콘텐츠
  it("#2 EN 선택 → locale 전환 + 드롭다운 닫힘 + 필드 전환", () => {
    // Given
    let state = createLocaleState("ko", ["ko", "en"]);
    state = openDropdown(state);

    const field: LocalizedField = { ko: "안녕", en: "Hello" };

    // When
    const next = setLocale(state, "en");

    // Then
    expect(next.currentLocale).toBe("en");
    expect(next.dropdownOpen).toBe(false); // 선택 시 닫힘
    expect(
      resolveFieldValue({
        field,
        locale: next.currentLocale,
        defaultLocale: "ko",
      }),
    ).toBe("Hello");
  });

  // DT #4: Press Escape → 드롭다운 닫힘
  it("#4 Escape → 드롭다운 닫힘, locale 변경 없음", () => {
    // Given
    let state = createLocaleState("ko", ["ko", "en"]);
    state = openDropdown(state);

    // When
    const next = closeDropdown(state);

    // Then
    expect(next.dropdownOpen).toBe(false);
    expect(next.currentLocale).toBe("ko"); // 변경 없음
  });
});
