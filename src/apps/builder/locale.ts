/**
 * builder-i18n locale 기능 — OS 커맨드 레이어
 *
 * BuilderApp의 locale 상태를 OS 커맨드로 관리한다.
 * localeState.ts의 순수함수를 OS 커맨드로 래핑.
 */

import { produce } from "immer";
import { BuilderApp } from "./app";
import type { BuilderState } from "./model/appState";

// ── Locale 상태를 BuilderState에 주입 ──────────────────────────────
// BuilderState 타입 확장 없이 data에 optional 필드로 추가
// (기존 코드와 충돌 방지)

declare module "./model/appState" {
    interface BuilderStateData {
        locale?: {
            currentLocale: string;
            availableLocales: string[];
            dropdownOpen: boolean;
        };
    }
}

// locale 상태에서 읽는 헬퍼
function getLocaleState(s: BuilderState) {
    return (s.data as Record<string, unknown>)["locale"] as {
        currentLocale: string;
        availableLocales: string[];
        dropdownOpen: boolean;
    } | undefined;
}

const DEFAULT_LOCALE = {
    currentLocale: "ko",
    availableLocales: ["ko"],
    dropdownOpen: false,
};

// ── OS 커맨드 ────────────────────────────────────────────────────

export const openLocaleDropdown = BuilderApp.command(
    "openLocaleDropdown",
    (ctx) => ({
        state: produce(ctx.state, (draft) => {
            const data = draft.data as Record<string, unknown>;
            const locale = (data["locale"] as typeof DEFAULT_LOCALE) ?? { ...DEFAULT_LOCALE };
            locale.dropdownOpen = true;
            data["locale"] = locale;
        }),
    }),
);

export const closeLocaleDropdown = BuilderApp.command(
    "closeLocaleDropdown",
    (ctx) => ({
        state: produce(ctx.state, (draft) => {
            const data = draft.data as Record<string, unknown>;
            const locale = (data["locale"] as typeof DEFAULT_LOCALE) ?? { ...DEFAULT_LOCALE };
            locale.dropdownOpen = false;
            data["locale"] = locale;
        }),
    }),
);

export const setLocaleCommand = BuilderApp.command(
    "setLocale",
    (ctx, payload: { locale: string }) => ({
        state: produce(ctx.state, (draft) => {
            const data = draft.data as Record<string, unknown>;
            const locale = (data["locale"] as typeof DEFAULT_LOCALE) ?? { ...DEFAULT_LOCALE };
            locale.currentLocale = payload.locale;
            locale.dropdownOpen = false;
            data["locale"] = locale;
        }),
    }),
);

export const addLocaleCommand = BuilderApp.command(
    "addLocale",
    (ctx, payload: { locale: string }) => ({
        state: produce(ctx.state, (draft) => {
            const data = draft.data as Record<string, unknown>;
            const locale = (data["locale"] as typeof DEFAULT_LOCALE) ?? { ...DEFAULT_LOCALE };
            if (!locale.availableLocales.includes(payload.locale)) {
                locale.availableLocales.push(payload.locale);
            }
            locale.currentLocale = payload.locale;
            locale.dropdownOpen = false;
            data["locale"] = locale;
        }),
    }),
);

export function useLocaleState() {
    return BuilderApp.useComputed((s) => {
        return getLocaleState(s) ?? DEFAULT_LOCALE;
    }) as typeof DEFAULT_LOCALE;
}

/**
 * useLocalizedSectionFields — locale-aware field reader
 *
 * fields에 "fieldName:locale" 키가 있으면 locale 값 우선 반환.
 * 없으면 "fieldName" 기본값 반환.
 *
 * 데이터 포맷:
 *   "service-name": "CLOVA GreenEye"         ← ko 기본값
 *   "service-name:en": "CLOVA GreenEye"      ← en 번역
 *   "service-name:ja": "CLOVA グリーンアイ"  ← ja 번역
 */
import { findBlock } from "./model/appState";

export function useLocalizedSectionFields(sectionId: string): Record<string, string> {
    const { currentLocale } = useLocaleState();

    return BuilderApp.useComputed((s) => {
        const block = findBlock(s.data.blocks, sectionId);
        if (!block) return {} as Record<string, string>;

        const raw = block.fields as Record<string, string>;

        const resolved: Record<string, string> = {};
        for (const key of Object.keys(raw)) {
            if (key.includes(":")) continue; // locale 변형 키는 직접 노출 안 함
            const localized = raw[`${key}:${currentLocale}`];
            resolved[key] = localized !== undefined ? localized : (raw[key] ?? "");
        }
        return resolved;
    }) as Record<string, string>;
}
