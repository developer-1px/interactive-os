# Plan: OG-001 Dropdown Zone → outsideClick + LocaleSwitcher

## Discussion Claim
OG-001 해결 = 새 Zone 타입 불필요. `outsideClick` 런타임 구현 1건 + LocaleSwitcher를 기존 `role:"menu"` Zone으로 리팩토링.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `PointerListener.ts` | outsideClick 타입만 존재, 런타임 미구현 | click 시 activeZone의 `dismiss.outsideClick === "close"` → OS_ESCAPE 발동 | Clear | — | +N tests (outsideClick dismiss 시나리오) | PointerListener 공통 코드 — 기존 click 동작에 영향 가능 |
| 2 | `locale.ts`:open/close | `openLocaleDropdown`, `closeLocaleDropdown` 커맨드 + `dropdownOpen` 상태 | 삭제. OS Zone activation이 open/close 대체 | Clear | →#1 | tsc 0, import 에러 없음 | — |
| 3 | `LocaleSwitcher.tsx` | onClick×4, backdrop div, os.dispatch(open/close), 178줄 | Zone(role:"menu", dismiss:{outsideClick:"close"}) + Item×N + onAction:setLocale. ~80줄 | Clear | →#1, →#2 | locale 전환 동작 유지, Escape 닫기, 바깥 클릭 닫기, Arrow 키보드 | EditorToolbar.tsx import |

## OS 인프라 현황 (discussion에서 확인)

| OS 기능 | 있나? | 비고 |
|---------|-------|------|
| Zone role:"menu" | ✅ | vertical, loop, autoFocus, escape:close, tab:trap |
| Item ARIA | ✅ | role:menuitem 자동 |
| Arrow ↑↓ | ✅ | keyboard pipeline |
| Enter/Space activate | ✅ | activate.mode:automatic |
| Escape close | ✅ | dismiss.escape:close |
| outsideClick close | ❌ 타입만 | **이번에 구현** |
| autoFocus | ✅ | project.autoFocus:true |
| restoreFocus | ✅ | tab.restoreFocus (dialog 선례) |

## 라우팅
승인 후 → `/project` — OS gap OG-001 해소 프로젝트 (Light)
