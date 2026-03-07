# Plan: Headless Overlay Lifecycle

> Claim: headless overlay = zone 자동 등록 + 자동 활성화 문제. OS 메커니즘(Escape/Tab/Enter)은 이미 동작.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `os-core/.../overlay.ts:OS_OVERLAY_OPEN` | stack push + focus save만. activeZoneId 변경 안 함 | stack push + focus save + `activeZoneId = overlay.id` + `focusedItemId = first/last item` | Clear | — | 기존 overlay 테스트 pass + 새 테스트 | Browser에서 Zone.tsx FocusGroup과 중복 설정 가능 (동일 값 → 무해) |
| 2 | `os-devtool/.../page.ts:goto()` | 모든 zone을 등록 + 마지막 zone이 activeZoneId | overlay zone 식별(TriggerOverlayRegistry) → 등록하되 activeZoneId 설정에서 제외 | Clear | — | 기존 APG 테스트 391 pass | overlay zone이 triggerConfig.overlay로 식별 가능해야 |
| 3 | `os-devtool/.../simulate.ts:simulateClick` | trigger onActivate 실행 후 끝 | trigger onActivate 실행 → overlay stack 변화 감지 → overlay zone auto-activate (activeZoneId + focusedItemId 설정) | Clear | #1 | 새 테스트: click(triggerId) → overlay zone active | onActivate가 OS_OVERLAY_OPEN을 dispatch해야 동작 |
| 4 | `tests/apg/dialog.apg.test.ts` | `@os-core` import + `dispatch(STACK_PUSH/POP)` + `setupZone()` workaround | `page.goto("/")` + `page.click("trigger")` + `page.keyboard.press("Escape")` — Playwright subset only | Clear | #1,#2,#3 | 6 tests pass, `@os-core` import 0건 | `createDialog` factory 전면 재작성 |
| 5 | `tests/apg/dropdown-menu.apg.test.ts` | `@os-core` import + `dispatch(STACK_PUSH/POP)` + `setupZone()` workaround | `page.goto("/")` + `page.click("locale-trigger")` — Playwright subset only | Clear | #1,#2,#3 | 8 tests pass, `@os-core` import 0건 | `openDropdown` factory 전면 재작성 |
| 6 | Regression | — | — | Clear | #1-#5 | `vitest run tests/apg/` 전수 pass (391+) | — |

## MECE 점검

1. CE: #1(OS command) + #2(goto overlay skip) + #3(click auto-activate) = overlay 전체 생명주기. #4-#5 = 검증. ✅
2. ME: #1과 #3이 겹칠 수 있음 — #1은 OS command 레벨, #3은 headless simulation 레벨. **역할 분리**: #1은 "activeZoneId를 overlay로 전환", #3은 "overlay zone에 focusedItemId 설정". → 분리 유지 OR #1에서 둘 다 처리. **제 판단: #1에서 둘 다 처리 (focusedItemId 포함).** #3은 overlay stack 변화 감지만 담당, 실제 state 변경은 #1의 OS_OVERLAY_OPEN이 수행. 이유: state 변경은 command에 집중시키는 것이 OS 원칙.
3. No-op: 없음.

## 라우팅

승인 후 → `/project` (headless-overlay) — OS 프로젝트, os-core + os-devtool 변경. Heavy TDD.
