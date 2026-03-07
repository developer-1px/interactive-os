# Diagnose: Headless Overlay Gap 유효성 검증

> 날짜: 2026-03-07
> 실행 명령: `vitest run tests/apg/dialog.apg.test.ts` + `vitest run tests/apg/dropdown-menu.apg.test.ts`
> 결과: 0개 실패 / 14개 통과 (dialog 6 + dropdown-menu 8)

## 증상

OG-015~017(headless overlay gap)을 기술한 blueprint의 전제를 검증.
테스트는 전부 통과하지만, **워크어라운드 3종**을 사용 중.

## 삽질 과정

처음엔 "테스트가 전부 pass면 gap이 해소된 건 아닌가?" 생각했다.
코드를 열어보니 dialog.apg.test.ts가 `@os-core` 직접 import + `page.dispatch(OS_STACK_PUSH/POP)` + `page.setupZone()`을 쓰고 있었다.

이것은 OS 메커니즘 증명(OS_TAB trap, OS_ESCAPE dismiss가 동작하는가)이지,
headless API 완전성 증명(page.click → page.press만으로 동작하는가)이 아니다.

Browser에서 overlay open은 `<TriggerPortal>` → `<Zone>` mount → ZoneRegistry 자동 등록.
Headless에서는 이 자동 등록이 없어서 `setupZone()` + `dispatch()` 수동 조립이 필요.

dropdown-menu.apg.test.ts도 동일 패턴: `setupZone("toolbar")` → `dispatch(STACK_PUSH)` → `setupZone("locale-menu")`.

## 원인 추정 - 5 Whys

1. 왜 테스트가 workaround를 쓰는가? → headless에서 overlay zone이 자동 등록되지 않으므로
2. 왜 자동 등록되지 않는가? → browser는 React TriggerPortal이 Zone mount → ZoneRegistry 등록하지만, headless에는 React가 없음
3. 왜 headless에 overlay 자동화가 없는가? → page.click(triggerId)이 trigger→overlay 연결을 모름. TriggerOverlayRegistry는 있지만 click이 그걸 조회하지 않음
4. 왜 click이 TriggerOverlayRegistry를 조회하지 않는가? → click은 ZoneRegistry의 item callback(findItemCallback)만 찾음. trigger overlay 경로는 별개 파이프라인

-> 근본 원인: headless click에 trigger→overlay 경로가 구현되지 않음. Browser에서 이 경로는 React 렌더링(TriggerPortal)이 담당하므로, headless가 이를 대체할 자체 메커니즘이 필요.

-> 확신도: 높음

## 워크어라운드 목록

| # | 패턴 | 파일:줄 | 이상적 대안 |
|---|------|---------|-----------|
| W1 | `import { OS_STACK_PUSH/POP } from "@os-core/..."` | dialog:13, dropdown:15 | facade에서 import 또는 불필요 |
| W2 | `page.dispatch(OS_STACK_PUSH())` | dialog:107, dropdown:69 | `page.click("trigger-id")` 자동 |
| W3 | `page.setupZone("dialog", {...})` | dialog:52, dropdown:72 | click 시 자동 overlay zone 등록 |
| W4 | `page.dispatch(OS_STACK_POP())` | dialog:110, dropdown:117 | Escape dismiss 시 자동 stack pop |

## Blueprint 수정 사항

Blueprint 핵심 진단은 정확함 — G1(overlay zone 자동 등록)이 유일한 실질 gap.

추가 발견:
- **Escape → STACK_POP 자동 체이닝**: dropdown-menu:114-119에서 Escape 후 별도 `dispatch(STACK_POP)` 필요. Browser에서는 `OS_ESCAPE → OS_OVERLAY_CLOSE → auto stack pop`이지만, headless에서는 overlay가 등록되지 않아 OS_ESCAPE가 단순 zone deactivate만 수행.
- G1 해결 시 overlay가 등록되면, `OS_ESCAPE → OS_OVERLAY_CLOSE → STACK_POP` 체인이 자동으로 동작할 것.

## 다음 액션 제안

1. Blueprint G1~G3은 유효. 실행 진행 가능.
2. 완료 후 dialog.apg.test.ts, dropdown-menu.apg.test.ts에서 workaround 제거 가능:
   - `dispatch(STACK_PUSH/POP)` → `page.click("trigger")` / `page.press("Escape")`
   - `setupZone("dialog")` → click 시 자동 등록
   - `@os-core` import → 제거
