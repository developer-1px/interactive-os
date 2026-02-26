/**
 * builder-i18n locale 기능 — OS 커맨드 레이어
 *
 * BuilderApp의 locale 상태를 OS 커맨드로 관리한다.
 * localeState.ts의 순수함수를 OS 커맨드로 래핑.
 *
 * dropdownOpen 상태는 OS Zone activation으로 대체됨 (OG-001).
 * open/close 커맨드 삭제.
 */

import { produce } from "immer";
import { BuilderApp } from "./app";
import type { BuilderState } from "./model/appState";

// ── Locale 상태를 BuilderState에 주입 ──────────────────────────────

declare module "./model/appState" {
  interface BuilderStateData {
    locale?: {
      currentLocale: string;
      availableLocales: string[];
    };
  }
}

// locale 상태에서 읽는 헬퍼
function getLocaleState(s: BuilderState) {
  return s.data.locale;
}

const DEFAULT_LOCALE = {
  currentLocale: "ko",
  availableLocales: ["ko"],
};

// ── OS 커맨드 ────────────────────────────────────────────────────

export const setLocaleCommand = BuilderApp.command(
  "setLocale",
  (ctx, payload: { locale: string }) => ({
    state: produce(ctx.state, (draft) => {
      const locale = draft.data.locale ?? { ...DEFAULT_LOCALE };
      locale.currentLocale = payload.locale;
      draft.data.locale = locale;
    }),
  }),
);

export const addLocaleCommand = BuilderApp.command(
  "addLocale",
  (ctx, payload: { locale: string }) => ({
    state: produce(ctx.state, (draft) => {
      const locale = draft.data.locale ?? { ...DEFAULT_LOCALE };
      if (!locale.availableLocales.includes(payload.locale)) {
        locale.availableLocales.push(payload.locale);
      }
      locale.currentLocale = payload.locale;
      draft.data.locale = locale;
    }),
  }),
);

export function useLocaleState() {
  return BuilderApp.useComputed((s) => {
    return getLocaleState(s) ?? DEFAULT_LOCALE;
  });
}

/**
 * useLocalizedSectionFields — locale-aware field reader
 */
import { findBlock } from "./model/appState";

export function useLocalizedSectionFields(sectionId: string) {
  const { currentLocale } = useLocaleState();

  return BuilderApp.useComputed((s): Record<string, string> => {
    const block = findBlock(s.data.blocks, sectionId);
    if (!block) return {};

    const raw = block.fields;

    const resolved: Record<string, string> = {};
    for (const key of Object.keys(raw)) {
      if (key.includes(":")) continue;
      const localized = raw[`${key}:${currentLocale}`];
      resolved[key] = localized !== undefined ? localized : (raw[key] ?? "");
    }
    return resolved;
  });
}
