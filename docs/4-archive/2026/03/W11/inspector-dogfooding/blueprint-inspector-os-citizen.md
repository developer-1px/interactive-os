# Blueprint: Inspector OS Citizen — data-inspector 가드 제거 및 트랜잭션 스코프 필터

## 1. Goal

Inspector를 정상 OS 시민으로 복귀시킨다.
- `[data-inspector]` 이벤트 차단을 제거하여 Inspector 내부의 OS zone이 브라우저에서 정상 동작
- Inspector 트랜잭션이 앱 로그에 노이즈로 섞이지 않도록 scope 기반 필터링 제공
- ZiftMonitor의 수동 onClick 우회 제거 (OS pipeline이 직접 처리)

Done Criteria:
1. Inspector disclosure (ZiftMonitor) 클릭이 PointerListener를 통해 동작
2. Inspector 트랜잭션이 앱 트랜잭션 목록에서 자동 제외
3. 기존 앱 테스트 regression 0
4. ZiftMonitor의 handleClick 우회 코드 삭제

## 2. Why

근본 원인: `[data-inspector]` 가드는 "Inspector 트랜잭션이 앱 로그에 노이즈를 만든다"는 문제를 "모든 OS 이벤트 차단"이라는 과도한 수단으로 해결한 임시 조치.

결과:
- Inspector가 OS 앱(`defineApp`)이면서 OS 이벤트를 받지 못하는 모순
- disclosure/accordion 같은 OS 패턴이 브라우저에서 미작동
- 수동 onClick 우회 = rules.md "OS를 안 썼다는 뜻이므로 실패" 위반

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| Inspector 이벤트를 차단해야 로그 노이즈가 사라진다 | 무효. 로그는 이벤트가 아니라 트랜잭션 레벨의 문제 | 트랜잭션 scope 필터링 |
| 포커스 경쟁이 문제를 일으킨다 | 무효. DevTools 패턴과 동일한 자연스러운 동작 | 수용 (activeZoneId 전환, focusedItemId 보존) |
| Inspector용 별도 커널이 필요하다 | 무효. 단일 커널 + scope 격리로 충분 | handlerScope 기반 필터 |

## 4. Ideal

가드 제거 후:
- Inspector 내 Zone/Item 클릭 → PointerListener가 정상 감지 → OS_FOCUS + OS_EXPAND 디스패치
- Inspector 내 키보드 → resolveKeyboard가 정상 처리 → 화살표/Enter/Space 동작
- 앱 트랜잭션 로그 → Inspector scope 트랜잭션이 기본 제외 (group 필터)
- Inspector 자체 ZIFT 패널 → 수동 우회 없이 순수 OS disclosure로 동작

부정적 분기:
- Inspector 클릭 시 앱의 activeZoneId가 inspector zone으로 전환됨 → 허용 (DevTools 패턴)
- Inspector 키보드 이벤트가 OS에 전달됨 → search field는 `role: "textbox"` + field binding이 처리

## 5. Inputs

관련 파일:
- `packages/os-core/src/1-listen/_shared/senseMouse.ts` — isInspector 감지 + senseClickTarget inspector 분기
- `packages/os-core/src/1-listen/keyboard/senseKeyboard.ts:78` — isInspector 감지
- `packages/os-core/src/1-listen/keyboard/resolveKeyboard.ts:89` — isInspector guard
- `packages/os-react/src/1-listen/focus/FocusListener.tsx:38` — data-inspector guard
- `packages/os-react/src/1-listen/pointer/PointerListener.tsx:304` — "inspector" case break
- `src/routes/__root.tsx:79` — `data-inspector` 속성 부여
- `src/inspector/panels/ZiftMonitor.tsx` — 수동 onClick 우회
- `src/inspector/app.ts` — selectFilteredTransactions (기존 group 필터)
- `src/inspector/panels/InspectorAdapter.tsx` — getTransactions() 소비자

참조 지식:
- `Transaction.handlerScope`에 scope 이름이 이미 기록됨 (커널 createKernel.ts:254)
- `inferSignal(tx).group` = `tx.handlerScope` (inferSignal.ts:76)
- Inspector의 scope = `"inspector"`, zone scopes = `"inspector-search"`, `"inspector-zift"` 등
- 기존 `selectFilteredTransactions`에 `disabledGroups` 필터가 이미 존재

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | Inspector scope 트랜잭션이 앱 로그에서 기본 제외 | `disabledGroups` 필터는 수동 토글 (UI pill) | Inspector scope를 기본 필터에 추가 | High | - |
| G2 | senseMouse에서 isInspector 가드 제거 | `isInspector` 필드 + extractMouseInput bail | 필드 제거 또는 무시 | High | G1 |
| G3 | senseClickTarget에서 inspector 분기 제거 | `type: "inspector"` 반환 + PointerListener break | 정상 item/expand 분류로 통과 | High | G1 |
| G4 | resolveKeyboard에서 isInspector 가드 제거 | `isInspector` 필드 + EMPTY 반환 | 제거 | High | G1 |
| G5 | FocusListener에서 data-inspector 가드 제거 | `target.closest("[data-inspector]") return` | 제거 | High | G1 |
| G6 | ZiftMonitor 수동 onClick 우회 제거 | `handleClick` + OS_EXPAND/OS_FOCUS 직접 디스패치 | 삭제 | Med | G2, G3 |
| G7 | __root.tsx에서 data-inspector 속성 제거 | `<aside data-inspector>` | 속성 삭제 | Low | G2-G5 |
| G8 | docs-viewer의 data-inspector 속성 제거 | `<aside data-inspector>` in docs-viewer/main.tsx | 속성 삭제 | Low | G2-G5 |
| G9 | SPEC.md 규칙 갱신 | line 341: "Inspector 내부 -> 무시" | 규칙 업데이트 또는 삭제 | Low | G2-G5 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| 1 | Inspector scope 기본 제외 필터 | Clear | - | `selectFilteredTransactions`에서 `inspector`로 시작하는 handlerScope를 기본 제외. 기존 disabledGroups와 별개로 항상 적용 |
| 2 | senseMouse isInspector 제거 | Clear | 1 | `MouseDownSense.isInspector` 필드 삭제, `extractMouseInput`의 guard 삭제, `senseMouseDown`의 DOM 읽기 삭제 |
| 3 | senseClickTarget inspector 분기 제거 | Clear | 1 | `target.closest("[data-inspector]")` 분기 삭제 → 정상 item/trigger/expand 분류로 fall-through |
| 4 | resolveKeyboard isInspector 제거 | Clear | 1 | `KeyboardInput.isInspector` 필드 삭제, guard 삭제, senseKeyboard의 DOM 읽기 삭제 |
| 5 | FocusListener guard 제거 | Clear | 1 | `target.closest("[data-inspector]") return` 삭제 |
| 6 | PointerListener inspector case 제거 | Clear | 3 | `case "inspector": break` 삭제, `ClickTarget` union에서 `{ type: "inspector" }` 삭제 |
| 7 | data-inspector 속성 제거 | Clear | 2-6 | `__root.tsx`, `docs-viewer/main.tsx`에서 `data-inspector` 속성 삭제 |
| 8 | ZiftMonitor onClick 우회 제거 | Clear | 2-6 | `handleClick`, `OS_EXPAND`/`OS_FOCUS` import 삭제. onClick prop 제거 |
| 9 | SPEC.md 규칙 갱신 | Clear | 7 | line 341 "Inspector 내부 -> 무시" 규칙 삭제 또는 "scope 필터로 대체" 갱신 |
| 10 | Regression 검증 | Clear | 1-8 | 전체 테스트 실행 (tsc + vitest). ZiftMonitor disclosure 테스트 8/8 유지 확인 |
