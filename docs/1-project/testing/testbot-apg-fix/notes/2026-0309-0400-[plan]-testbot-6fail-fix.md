# Plan — TestBot APG 6 FAIL → 0 FAIL

> Date: 2026-03-09
> Source: /discussion → /divide → /plan

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `AccordionPattern.tsx:70` | `expand: { initial: [SECTIONS[0]!.id] }` | `expand: { initial: [] }` | Clear | — | TestBot accordion PASS + unit test 수정 | 없음 |
| 2 | `accordion.apg.test.ts:46-52` | initial expanded=true 기대 | initial collapsed=false 기대 | Clear | →#1 | vitest accordion PASS | 없음 |
| 3 | `checkbox.ts:25-37` | Enter → aria-checked toggle 기대 (6줄) | 해당 6줄 제거 | Clear | — | TestBot checkbox PASS | 없음 |
| 4 | `roleRegistry.ts:197-201` | `click: [OS_ACTIVATE(), OS_OVERLAY_CLOSE()]` | `click: [OS_ACTIVATE()]` (Space, Enter도 동일) | Clear | — | vitest menu PASS | menu.apg.test.ts 확인 |
| 5 | `MenuPattern.tsx:75-81` | onAction returns `[]` | menuitem → `[OS_OVERLAY_CLOSE()]`, check/radio → `[]` | Clear | →#4 | TestBot menu PASS | 앱 책임으로 이동 |
| 6 | `defineApp/index.ts:287-300` | trigger() returns no `id` | 추가: `id: triggerId` | Clear | — | trigger.test.ts + overlay-handle.test.ts PASS | spread 무해 |
| 7 | `meter.ts:1-20` | focus nav 테스트 | value display 테스트로 재작성 | Clear | — | TestBot meter PASS | nav headless에서 커버 |
| 8 | `SpinbuttonPattern.tsx` + seeding | focus 시 9→50 점프 | initial=9 유지 | Complicated | — | TestBot spinbutton PASS | 50 출처 디버깅 필요 |

## 라우팅

승인 후 → `/project` (testbot-apg-fix) — testing 도메인, Light 규모
