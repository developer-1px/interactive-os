/**
 * LocaleSwitcher — 툴바 다국어 전환 UI
 *
 * US-001: 언어 전환하여 콘텐츠 보기
 * UX Flow:
 *   [🌐 KO ▾] 클릭 → 드롭다운 → 언어 선택 → 전체 필드 전환
 *
 * OS 패턴: Trigger(role:"menu") + Trigger.Portal + Zone + FocusItem.
 * open/close, keyboard, backdrop 전부 OS가 관리 (OG-001).
 */


import { FocusItem } from "@/os/6-components/base/FocusItem";
import { Trigger } from "@/os/6-components/primitives/Trigger";
import { resolveFieldValue } from "./entities/i18n";
import {
  addLocaleCommand,
  setLocaleCommand,
  useLocaleState,
} from "./locale";

// 지원 언어 목록
const SUPPORTED_LOCALES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

export function LocaleSwitcher() {
  const { currentLocale, availableLocales } = useLocaleState();

  const unaddedLocales = SUPPORTED_LOCALES.filter(
    (l) => !availableLocales.includes(l.code),
  );

  return (
    <Trigger id="locale-switcher-trigger" role="menu" overlayId="locale-menu">
      {/* Trigger button */}
      <button
        aria-haspopup="true"
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

      {/* Dropdown menu — OS manages open/close, focus, keyboard, backdrop */}
      <Trigger.Portal>
        <ul
          role="listbox"
          aria-label="언어 선택"
          style={{
            minWidth: 160,
            padding: "4px 0",
            margin: 0,
            listStyle: "none",
          }}
        >
          {/* 등록된 언어 */}
          {availableLocales.map((code) => {
            const label =
              SUPPORTED_LOCALES.find((l) => l.code === code)?.label ?? code;
            const isActive = code === currentLocale;
            return (
              <FocusItem key={code} id={`locale-option-${code}`} asChild>
                <Trigger.Dismiss
                  id={`locale-option-${code}`}
                  {...(!isActive
                    ? { onActivate: setLocaleCommand({ locale: code }) }
                    : {})}
                >
                  <li
                    role="option"
                    aria-selected={isActive}
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
                </Trigger.Dismiss>
              </FocusItem>
            );
          })}

          {/* 구분선 + 언어 추가 */}
          {unaddedLocales.length > 0 && (
            <>
              <li
                style={{ borderTop: "1px solid #e2e8f0", margin: "4px 0" }}
              />
              {unaddedLocales.map((l) => (
                <FocusItem key={l.code} id={`locale-add-${l.code}`} asChild>
                  <Trigger.Dismiss
                    id={`locale-add-${l.code}`}
                    onActivate={addLocaleCommand({ locale: l.code })}
                  >
                    <li
                      role="option"
                      aria-selected={false}
                      style={{
                        padding: "6px 14px",
                        cursor: "pointer",
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      + {l.label} 추가
                    </li>
                  </Trigger.Dismiss>
                </FocusItem>
              ))}
            </>
          )}
        </ul>
      </Trigger.Portal>
    </Trigger>
  );
}

/**
 * useLocalizedField — locale에 따라 필드 값을 resolve하는 hook
 */
export function useLocalizedField(
  field: string | Record<string, string>,
): string {
  const { currentLocale } = useLocaleState();
  return resolveFieldValue({
    field,
    locale: currentLocale,
    defaultLocale: "ko",
  });
}
