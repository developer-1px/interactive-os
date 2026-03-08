/**
 * LocaleSwitcher — 툴바 다국어 전환 UI
 *
 * US-001: 언어 전환하여 콘텐츠 보기
 * UX Flow:
 *   [🌐 KO ▾] 클릭 → 드롭다운 → 언어 선택 → 전체 필드 전환
 *
 * OS 패턴: zone.overlay({ role: "menu" }) → OverlayHandle.trigger() prop-getter.
 * Zone renders inline (no PopoverPortal) so onAction can dispatch per-item commands.
 * open/close, keyboard, backdrop 전부 OS가 관리 (OG-001).
 */

import { localeMenu } from "./app";
import { Item, Zone } from "@os-react/internal";
import { OS_OVERLAY_CLOSE, os } from "@os-sdk/os";
import { resolveFieldValue } from "./entities/i18n";
import { addLocaleCommand, setLocaleCommand, useLocaleState } from "./locale";

// 지원 언어 목록
const SUPPORTED_LOCALES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

/**
 * Resolve per-item activation command based on focused item ID.
 * locale-option-* → setLocale, locale-add-* → addLocale.
 */
function resolveLocaleAction(focusId: string) {
  if (focusId.startsWith("locale-option-")) {
    const code = focusId.replace("locale-option-", "");
    return [setLocaleCommand({ locale: code }), OS_OVERLAY_CLOSE({ id: "locale-menu" })];
  }
  if (focusId.startsWith("locale-add-")) {
    const code = focusId.replace("locale-add-", "");
    return [addLocaleCommand({ locale: code }), OS_OVERLAY_CLOSE({ id: "locale-menu" })];
  }
  return OS_OVERLAY_CLOSE({ id: "locale-menu" });
}

export function LocaleSwitcher() {
  const { currentLocale, availableLocales } = useLocaleState();

  const isOpen = os.useComputed((s) =>
    s.os.overlays.stack.some((e) => e.id === "locale-menu"),
  );

  const unaddedLocales = SUPPORTED_LOCALES.filter(
    (l) => !availableLocales.includes(l.code),
  );

  return (
    <div className="relative">
      {/* Trigger button — prop-getter from OverlayHandle */}
      <button
        {...localeMenu.trigger()}
        type="button"
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

      {/* Dropdown menu — Zone renders when overlay is open */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] py-1 bg-white border border-slate-200 rounded-lg shadow-lg">
          <Zone
            id="locale-menu"
            role="menu"
            onAction={(cursor) => resolveLocaleAction(cursor.focusId)}
            onDismiss={OS_OVERLAY_CLOSE({ id: "locale-menu" })}
            aria-label="언어 선택"
          >
            {/* 등록된 언어 */}
            {availableLocales.map((code) => {
              const label =
                SUPPORTED_LOCALES.find((l) => l.code === code)?.label ?? code;
              const isActive = code === currentLocale;
              return (
                <Item
                  key={code}
                  id={`locale-option-${code}`}
                  className="flex items-center justify-between px-3.5 py-1.5 text-[13px] cursor-pointer select-none data-[focused=true]:bg-slate-100"
                  style={{
                    color: isActive ? "#6366f1" : "#334155",
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? "#f1f5f9" : undefined,
                  }}
                >
                  {label}
                  {isActive && <span style={{ fontSize: 11 }}>✓</span>}
                </Item>
              );
            })}

            {/* 구분선 + 언어 추가 */}
            {unaddedLocales.length > 0 && (
              <>
                <div
                  style={{ borderTop: "1px solid #e2e8f0", margin: "4px 0" }}
                />
                {unaddedLocales.map((l) => (
                  <Item
                    key={l.code}
                    id={`locale-add-${l.code}`}
                    className="px-3.5 py-1.5 text-[13px] cursor-pointer select-none text-slate-500 data-[focused=true]:bg-slate-100"
                  >
                    + {l.label} 추가
                  </Item>
                ))}
              </>
            )}
          </Zone>
        </div>
      )}
    </div>
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
