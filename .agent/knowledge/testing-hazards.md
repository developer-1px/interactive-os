# Testing Hazards — 테스트에서 반복되는 함정과 패턴

> 테스트 작성(/red)과 구현(/green)에서 축적된 경험. 함정을 미리 읽고 같은 실수를 방지한다.

---

## Config

(이 섹션은 워크플로우가 참조하는 프로젝트별 설정을 담는다)

---

## Patterns

| 패턴 | 설명 | 발견일 |
|------|------|--------|
| **헤드리스 테스트** | OS 상태 함수를 직접 호출하여 검증. DOM/이벤트 없음 | 2026-02-25 |
| **DT행 → 테스트 1:1** | DT 한 행 = 테스트 케이스 하나. 행 번호를 테스트 describe에 명시 | 2026-02-25 |
| **순수 함수 우선** | `createXxxState()` → 변환 함수 → 결과 단언. 상태 불변성 검증 | 2026-02-25 |
| **stub 로 시작** | 첫 Red는 "Not implemented" stub 반환으로 시작. 구현은 /green에서 | 2026-02-25 |
| **순수 함수 레이어** | `createXxxState()` + 변환 함수들. 불변 객체 반환. immer 사용 금지 (순수함수 레이어에서는) | 2026-02-25 |
| **OS 커맨드 래핑** | 순수함수 → `App.command()` 래핑 → state 반환. 이 순서 유지 | 2026-02-25 |
| **최소 구현** | Red 테스트가 요구하는 것만. 테스트 없는 로직 추가 금지 | 2026-02-25 |
| **Zone 태스크 체크** | Green 완료 후 "Zone이 있는가?" 확인. 있으면 /bind 필요. 여기서 멈추면 안 됨 | 2026-02-25 |

## Hazards

| 함정 | 결과 | 대응 | 출처 |
|------|------|------|------|
| **DOM 직접 검증** | `document.querySelector`로 UI 검증 → OS Hook 미사용 → /audit에서 🔴 | OS useComputed/상태 변화로 검증 | Red |
| **구현 포함** | Red 단계에서 실제 동작하는 코드 작성 → TDD 사이클 파괴 | stub만. 구현은 /green | Red |
| **상태 public 노출** | 내부 상태를 직접 검증하지 말고, 공개 API(함수 반환값)만 검증 | 캡슐화 유지 | Red |
| **거짓 GREEN** | OS-only 테스트로 앱 기능 검증 → 커널만 검증 → browser에서 전부 실패 | 앱 테스트 = `createHeadlessPage(App, Component)` + click/press만 | Red |
| **dispatch 우회** | 앱 통합 테스트에서 `dispatch(OS_OVERLAY_OPEN)` 직접 호출 → 브라우저의 Trigger click 경로를 안 탐 | click/press만 허용 | Red |
| **테스트 대상 레이어 오타겟** | 이미 동작하는 레이어를 테스트 → 진짜 문제 레이어 놓침 | Red 작성 전 "이 테스트가 실패해야 하는 이유"를 1문장으로 명시 | Red |
| **순수함수 PASS에서 멈춤** | Zone 태스크인데 UI 연결 없이 Done 처리 → 화면 동작 안 함 | /bind까지 가야 완성 | Green |
| **immer를 순수함수에 사용** | 테스트에서 draft 참조 이슈 | 순수함수 레이어는 spread/Object.assign | Green |
| **과잉 구현** | 테스트에 없는 edge case까지 미리 구현 → 테스트와 구현 괴리 | 테스트가 요구하는 것만 | Green |
| **standalone trigger click** | `page.click("trigger-id")`가 동작 안 함 → Zone에 속하지 않은 trigger는 findItemCallback에 없음 | beforeEach에서 `ZoneRegistry.setItemCallback("__standalone__", id, { onActivate })` 수동 등록 | Red |

## Precedents

| 선례 | 결정 | 이유 | 날짜 |
|------|------|------|------|
| locale-switcher.test.ts | DT #1,#2,#4 → 3개 테스트. OS 순수함수 검증 | 키보드(#5-#7)는 OS Zone 미구현으로 보류 | 2026-02-25 |
| localeState.ts | 순수함수(createLocaleState/openDropdown/closeDropdown/setLocale) + OS 커맨드(locale.ts) 분리 | 레이어 명확히 | 2026-02-25 |
| useLocalizedSectionFields | `field:locale` 키 패턴으로 하위호환 구현 | INITIAL_STATE 마이그레이션 비용 0 | 2026-02-25 |
| FocusGroup headless 등록 | `useMemo`에서 ZoneRegistry.register(element=null) + `useLayoutEffect`에서 element만 바인딩 | Phase 1(논리)/Phase 2(물리) 분리 | 2026-02-27 |
| DOM 스캔 위치 이동 | DOM querySelectorAll을 2-contexts(커널)에서 제거하고 FocusGroup.useLayoutEffect(뷰)로 이동 | "제거가 아니라 이동" | 2026-02-27 |
