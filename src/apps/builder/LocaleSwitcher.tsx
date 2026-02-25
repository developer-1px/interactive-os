/**
 * LocaleSwitcher — 툴바 다국어 전환 UI
 *
 * US-001: 언어 전환하여 콘텐츠 보기
 * UX Flow:
 *   [🌐 KO ▾] 클릭 → 드롭다운 → 언어 선택 → 전체 필드 전환
 *
 * OS 패턴: os.dispatch(커맨드). useState/onClick 없음.
 */

import React from "react";
import { os } from "@/os/kernel";
import {
    openLocaleDropdown,
    closeLocaleDropdown,
    setLocaleCommand,
    addLocaleCommand,
    useLocaleState,
} from "./locale";
import { resolveFieldValue } from "./entities/i18n";

// 지원 언어 목록
const SUPPORTED_LOCALES: { code: string; label: string }[] = [
    { code: "ko", label: "한국어" },
    { code: "en", label: "English" },
    { code: "ja", label: "日本語" },
    { code: "zh", label: "中文" },
];

export function LocaleSwitcher() {
    const { currentLocale, availableLocales, dropdownOpen } = useLocaleState();

    const currentLabel =
        SUPPORTED_LOCALES.find((l) => l.code === currentLocale)?.label ?? currentLocale.toUpperCase();

    const unaddedLocales = SUPPORTED_LOCALES.filter(
        (l) => !availableLocales.includes(l.code),
    );

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            {/* 트리거 버튼 */}
            <button
                id="locale-switcher-trigger"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                onClick={() => os.dispatch(dropdownOpen ? closeLocaleDropdown() : openLocaleDropdown())}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    background: "white",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#334155",
                }}
            >
                🌐 {currentLocale.toUpperCase()} ▾
            </button>

            {/* 드롭다운 */}
            {dropdownOpen && (
                <>
                    {/* backdrop */}
                    <div
                        style={{ position: "fixed", inset: 0, zIndex: 10 }}
                        onClick={() => os.dispatch(closeLocaleDropdown())}
                    />
                    <ul
                        role="listbox"
                        aria-label="언어 선택"
                        style={{
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            right: 0,
                            zIndex: 20,
                            minWidth: 160,
                            background: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                            padding: "4px 0",
                            margin: 0,
                            listStyle: "none",
                        }}
                    >
                        {/* 등록된 언어 */}
                        {availableLocales.map((code) => {
                            const label = SUPPORTED_LOCALES.find((l) => l.code === code)?.label ?? code;
                            const isActive = code === currentLocale;
                            return (
                                <li
                                    key={code}
                                    role="option"
                                    aria-selected={isActive}
                                    id={`locale-option-${code}`}
                                    onClick={() => !isActive && os.dispatch(setLocaleCommand({ locale: code }))}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "6px 14px",
                                        cursor: isActive ? "default" : "pointer",
                                        background: isActive ? "#f1f5f9" : "transparent",
                                        color: isActive ? "#6366f1" : "#334155",
                                        fontWeight: isActive ? 600 : 400,
                                        fontSize: 13,
                                    }}
                                >
                                    {label}
                                    {isActive && <span style={{ fontSize: 11 }}>✓</span>}
                                </li>
                            );
                        })}

                        {/* 구분선 + 언어 추가 */}
                        {unaddedLocales.length > 0 && (
                            <>
                                <li style={{ borderTop: "1px solid #e2e8f0", margin: "4px 0" }} />
                                {unaddedLocales.map((l) => (
                                    <li
                                        key={l.code}
                                        role="option"
                                        aria-selected={false}
                                        id={`locale-add-${l.code}`}
                                        onClick={() => os.dispatch(addLocaleCommand({ locale: l.code }))}
                                        style={{
                                            padding: "6px 14px",
                                            cursor: "pointer",
                                            color: "#64748b",
                                            fontSize: 13,
                                        }}
                                    >
                                        + {l.label} 추가
                                    </li>
                                ))}
                            </>
                        )}
                    </ul>
                </>
            )}
        </div>
    );
}

/**
 * useLocalizedField — locale에 따라 필드 값을 resolve하는 hook
 *
 * @example
 *   const title = useLocalizedField(fields["title"]);
 */
export function useLocalizedField(field: string | Record<string, string>): string {
    const { currentLocale } = useLocaleState();
    return resolveFieldValue({ field, locale: currentLocale, defaultLocale: "ko" });
}
