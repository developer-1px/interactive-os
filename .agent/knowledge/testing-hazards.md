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
| **거짓 GREEN** | OS-only 테스트로 앱 기능 검증 → 커널만 검증 → browser에서 전부 실패 | 앱 테스트 = `createPage(app, Component)` + click/press만 | Red |
| **dispatch 우회** | 앱 통합 테스트에서 `dispatch(OS_OVERLAY_OPEN)` 직접 호출 → 브라우저의 Trigger click 경로를 안 탐 | click/press만 허용 | Red |
| **테스트 대상 레이어 오타겟** | 이미 동작하는 레이어를 테스트 → 진짜 문제 레이어 놓침 | Red 작성 전 "이 테스트가 실패해야 하는 이유"를 1문장으로 명시 | Red |
| **순수함수 PASS에서 멈춤** | Zone 태스크인데 UI 연결 없이 Done 처리 → 화면 동작 안 함 | /bind까지 가야 완성 | Green |
| **immer를 순수함수에 사용** | 테스트에서 draft 참조 이슈 | 순수함수 레이어는 spread/Object.assign | Green |
| **과잉 구현** | 테스트에 없는 edge case까지 미리 구현 → 테스트와 구현 괴리 | 테스트가 요구하는 것만 | Green |
| **standalone trigger click** | `page.click("trigger-id")`가 동작 안 함 → Zone에 속하지 않은 trigger는 findItemCallback에 없음 | beforeEach에서 `ZoneRegistry.setItemCallback("__standalone__", id, { onActivate })` 수동 등록 | Red |
| **accordion click = expand** | accordion/disclosure의 inputmap에 `click: [OS_EXPAND({action:"toggle"})]`이 있어 click()이 expand를 toggle함 → 테스트에서 click 후 Enter 시 expand 방향이 반대 | /red 작성 전 해당 role의 inputmap(특히 click 바인딩)을 확인 | Red |
| **Inspector panel goto** | Inspector 내부 panel은 URL route가 없어 `page.goto("zone-name")` 불가 → `page.goto("/")` 사용 | Inspector panel 테스트는 `page.goto("/")` (전체 zone 등록) 후 locator로 접근 | Red |
| **컴포넌트 교체 시 ...rest 누락** | 기존 컴포넌트가 `...rest` spread로 부모 asChild props를 전달하는데, 대체 컴포넌트에서 누락 → 프로젝션에서 id 미전파 → locator 실패 | 컴포넌트 교체 시 기존의 `...rest` spread 유무를 반드시 확인 | Green |
| **value.mode="continuous" ≠ slider** | spinbutton/meter/separator도 `value.mode="continuous"` — role 체크 없이 slider로 판정하면 click 시 포인터 좌표가 value로 변환되어 값 점프 발생 (예: 9→50) | `value.mode` 분기 시 반드시 `role === "slider"` 추가 체크 | Green |
| **trigger() prop-getter id 누락** | overlay trigger()가 HTML `id` attribute를 반환하지 않으면 브라우저 TestBot의 `aria-haspopup` 등 attribute assertion 실패 — headless는 OS state로 통과하지만 browser는 DOM 검증 | trigger() 반환 객체에 `id: triggerId` 포함 확인 | Green |
| **meter = 읽기전용 role** | meter는 value display 전용 — focus navigation, toggle, activate 모두 불가. toBeFocused/ArrowDown 등 focus nav 테스트는 browser에서 실패 | meter 테스트는 value attribute(aria-valuemin/max/now) 검증으로 작성 | Red |
| **Vite virtual module mock** | `vi.mock("virtual:*")` 불가 — Vite import analysis가 vitest mock보다 먼저 실행 | vitest.config.ts의 `resolve.alias`로 물리 mock 파일에 매핑 | Red |
| **import.meta.glob module mock** | `importOriginal` 불가 — glob import가 vitest에서 실행 안 됨. 전체 factory mock 필요 | `vi.mock(module, async () => ({ ...inlinedPureFunctions }))` — 실제 모듈의 **전체 export**를 mock에 포함 (부분 mock → SSR 크래시) | Red |
| **공유 mock은 `__mocks__/` 폴더** | 여러 테스트 파일이 같은 모듈을 mock → inline mock 중복 170줄+ | `__mocks__/moduleName.ts`로 추출, `vi.mock(path, () => import("./__mocks__/moduleName"))` 한 줄로 사용 | Red |
| **testbot 수동 getItems = drift** | testbot에서 `getSidebarItems()` 등 수동 items → headless/browser items 불일치 | `TestScenario.items`/`getItems` 필드 제거. `runScenarios`가 `getZoneItems(zoneId)` → ZoneRegistry 단일 경로 | Red |
| **biome vs tsc index signature** | biome가 `obj?.["run"]`을 `obj?.run`으로 자동 변환 → tsc `noPropertyAccessFromIndexSignature` 위반으로 빌드 실패 | `Record<string, unknown>` 대신 `{ run?: unknown }` 타입 단언으로 우회 | Green |
| **biome --write --unsafe ! → ?. 변환** | pre-commit hook의 `biome check --write --unsafe`가 non-null assertion(`!`)을 optional chaining(`?.`)으로 변환 → 반환 타입이 `T \| undefined`가 되어 tsc 에러 발생. 자기 코드가 아닌 **다른 파일**도 변환됨 | staged 파일만 lint되지만 tsc는 전체 프로젝트 검사 → 다른 파일의 pre-existing `!`가 `?.`로 변환되면 tsc 실패. commit 실패 시 원인이 자기 코드인지 lint 변환인지 먼저 확인 | Green |

## Precedents

| 선례 | 결정 | 이유 | 날짜 |
|------|------|------|------|
| locale-switcher.test.ts | DT #1,#2,#4 → 3개 테스트. OS 순수함수 검증 | 키보드(#5-#7)는 OS Zone 미구현으로 보류 | 2026-02-25 |
| localeState.ts | 순수함수(createLocaleState/openDropdown/closeDropdown/setLocale) + OS 커맨드(locale.ts) 분리 | 레이어 명확히 | 2026-02-25 |
| useLocalizedSectionFields | `field:locale` 키 패턴으로 하위호환 구현 | INITIAL_STATE 마이그레이션 비용 0 | 2026-02-25 |
| FocusGroup headless 등록 | `useMemo`에서 ZoneRegistry.register(element=null) + `useLayoutEffect`에서 element만 바인딩 | Phase 1(논리)/Phase 2(물리) 분리 | 2026-02-27 |
| DOM 스캔 위치 이동 | DOM querySelectorAll을 2-contexts(커널)에서 제거하고 FocusGroup.useLayoutEffect(뷰)로 이동 | "제거가 아니라 이동" | 2026-02-27 |
