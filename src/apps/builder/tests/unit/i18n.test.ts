import { describe, it, expect } from "vitest";

/**
 * builder-i18n T1: 다국어 데이터 모델
 *
 * spec.md 1.1 Scenarios:
 * - 기본 언어로 필드 표시
 * - 다국어 데이터가 없는 필드 (하위 호환)
 */

import { resolveFieldValue, type LocalizedField } from "../../entities/i18n";

describe("Feature: 다국어 데이터 모델 (T1)", () => {
    it("#1 기본 언어로 필드 표시 — ko locale에서 ko 콘텐츠 반환", () => {
        // Given
        const field: LocalizedField = { ko: "안녕", en: "Hello" };
        const locale = "ko";
        const defaultLocale = "ko";

        // When
        const result = resolveFieldValue({ field, locale, defaultLocale });

        // Then
        expect(result).toBe("안녕");
    });

    it("#2 다른 언어로 전환 — en locale에서 en 콘텐츠 반환", () => {
        // Given
        const field: LocalizedField = { ko: "안녕", en: "Hello" };
        const locale = "en";
        const defaultLocale = "ko";

        // When
        const result = resolveFieldValue({ field, locale, defaultLocale });

        // Then
        expect(result).toBe("Hello");
    });

    it("#3 없는 언어로 전환 — 빈 문자열 반환", () => {
        // Given
        const field: LocalizedField = { ko: "안녕" };
        const locale = "en";
        const defaultLocale = "ko";

        // When
        const result = resolveFieldValue({ field, locale, defaultLocale });

        // Then
        expect(result).toBe("");
    });

    it("#4 하위 호환 — 단일 string은 locale 무관하게 그대로 반환", () => {
        // Given
        const field = "안녕"; // 기존 string 데이터
        const locale = "en";
        const defaultLocale = "ko";

        // When
        const result = resolveFieldValue({ field, locale, defaultLocale });

        // Then
        expect(result).toBe("안녕");
    });
});
