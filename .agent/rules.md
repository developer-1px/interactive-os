# Interactive OS 선언문

## Why — 이 규칙이 존재하는 이유

너는 매 세션 컨텍스트가 리셋되는 에이전트다.
이전 세션의 패턴을 기억하지 못하므로, 같은 문제를 다른 방식으로 풀게 된다.
이 OS의 구조가 그 문제를 해결한다. 구조를 따르면 세션 간 일관성이 보장된다.


## How — 세 가지 원칙

### 1. Pit of Success — 잘못 만들기가 더 어려운 구조

- 기존 메커니즘이 있으면 그것을 사용한다. 새로 만들지 않는다.
- 같은 문제를 푸는 선택지가 여럿이면, 이 프로젝트에서는 하나만 열려 있다.
- 새로운 고유 패턴이 필요하다면, 아직 올바른 추상화를 못 찾았다는 신호다. 멈추고 보고한다.
- `eslint-disable`, `as any`, `document.querySelector` — 구조를 우회하는 코드는 금지다.

### 2. 100% Observable — 모든 행동이 검증 가능

- 에이전트는 **headless page**로 DOM 없이 검증한다. 브라우저를 열 필요가 없다.
- "브라우저에서 확인해주세요"는 금지다. 그것은 OS로 검증할 수 없다는 고백이다.
- 테스트는 코드 수정 전에 쓴다(TDD). 테스트가 스펙이고, 통과가 증명이다.

### 3. Pre-trained Habit 금지 — 너의 관성을 경계하라

너는 범용 패턴(useState, @testing-library, any 캐스팅)을 무의식적으로 쓰려는 관성이 있다.
**아래 Domain Map을 먼저 읽고, 이 프로젝트에 이미 존재하는 것을 파악한 뒤 코딩하라.**

- 코드 작성 전 `.agent/knowledge/`의 관련 표준을 먼저 읽는다.
- `as any` 무관용. 소스를 추적하여 정확한 타입을 찾는다.
- God Object 금지. 관심사가 다른 lifecycle이면 새 파일을 만든다.
- `src/`(앱)에서 `@os-core/*` 직접 import 금지. `@os-sdk/os` facade를 통해 접근한다.
- Dead code 검색 범위 = 프로젝트 루트(`./`). `packages/`만 grep하면 사용처를 놓친다.


## What — Domain Map (이 프로젝트에 존재하는 것들)

> **이 섹션이 핵심이다.** 여기 없는 것을 만들기 전에, 여기 있는 것을 먼저 찾아라.

### Kernel (`packages/kernel/`)
상태 관리의 유일한 경로. 모든 상태 변경은 Command(데이터)를 통과한다.
- `createKernel` → `defineCommand`, `defineEffect`, `defineContext`, `defineQuery`
- `group(scope)` → 스코프 격리. Command는 스코프 체인을 따라 버블링. **Command Scoping으로 앱별 격리** — 여러 앱이 같은 OS 위에서 충돌 없이 공존
- `Middleware` = `{ before?, after? }` — dispatch 전후 가로채기
- `Preview mode` — 비파괴 상태 오버라이드 (Inspector/replay용)

### Pipeline (`packages/os-core/`) — 5단계
입력이 화면까지 가는 경로. 각 단계는 하나의 책임만 진다.

```
1-listen (이벤트 캡처) → 2-resolve (입력→Command 변환) → 3-inject (headless 상태 계산)
→ 4-command (상태 변경 실행) → 5-effect (DOM 부수효과 — 유일한 DOM 접촉점)
```

### ZIFT — 4개 개념으로 모든 UI를 선언
- **Zone** = 상호작용 영역. **27개 role preset**: listbox, menu, menubar, radiogroup, tablist, toolbar, grid, treegrid, tree, dialog, alertdialog, combobox, feed, accordion, disclosure, slider, meter, spinbutton, switch, checkbox, separator, textbox, group, application, builderBlock
- **Item** = Zone 안의 개별 요소. 포커스·선택·확장 상태를 가짐
- **Field** = 편집 가능한 속성. **8개 type**: inline, tokens, block, editor, number, boolean, enum, enum[]
- **Trigger** = 포인터 액션 발동기. `bind({ triggers: { Name: (payload) => BaseCommand } })` → prop-getter `(payload?: string) => data-attributes`. Focus와 독립 — 키보드는 keybinding, 포인터는 trigger. Overlay는 `zone.overlay()`로 분리.

### OS Commands — 17개 모듈
`OS_NAVIGATE`, `OS_ACTIVATE`, `OS_CHECK`, `OS_PRESS`, `OS_ESCAPE`, `OS_TAB`,
`OS_SELECT`, `OS_SELECT_ALL`, `OS_SELECTION_CLEAR`, `OS_EXPAND`,
`OS_FOCUS`, `OS_STACK_PUSH`, `OS_STACK_POP`,
`OS_FIELD_START_EDIT`, `OS_FIELD_COMMIT`, `OS_FIELD_CANCEL`,
`OS_UNDO`, `OS_REDO`, `OS_COPY`, `OS_CUT`, `OS_PASTE`,
`OS_DELETE`, `OS_MOVE_UP`, `OS_MOVE_DOWN`,
`OS_OVERLAY_OPEN`, `OS_OVERLAY_CLOSE`, `OS_VALUE_CHANGE`,
`OS_NOTIFY`, `OS_NOTIFY_DISMISS`

### App SDK (`packages/os-sdk/`)
- `defineApp(id, initialState, options?)` → condition, selector, createZone, createCommand, createKeybinding
- `ZoneHandle.bind(bindings)` → role, callbacks(onAction/onDelete/onCopy...), getItems, triggers
- **App Modules**: `history()`, `persistence()`, `router()`, `deleteToast()`
- **Collection Library**: `createCollectionZone()` + `collectionBindings()` + `fromEntities()` — 4 패턴 CRUD
- **상태 변경은 Immer `produce()`** — 모든 커맨드 핸들러가 사용. spread 대신 draft 직접 수정
- **네이밍 2-tier**: OS 커맨드 = `SCREAMING_CASE` (`OS_DELETE`), 앱 커맨드 = `camelCase` (`toggleTodo`)

### Testing (`packages/os-devtool/`)
- `createHeadlessPage(app?, component?)` — Playwright subset API, DOM 없이 <1ms 실행
- `createTestBench()` — OS 내부 테스트용 (앱 테스트는 headlessPage)
- **Zero Drift**: headless 테스트 통과 = DOM 동일 동작. 이것이 아키텍처 보장
- **테스트 setup**: `const page = createHeadlessPage(App, Component)` → `page.goto("/")` → `page.keyboard.press()` / `page.click()`
- **TestBot + Inspector**: 인간용 시각 검증 도구. 에이전트는 headless, 인간은 시각화로 검증
- **28개 APG showcase 패턴** 구현 완료 (accordion ~ window-splitter)

### React Bindings (`packages/os-react/`)
- `<Zone>`, `<Item>`, `<Field>`, `<Trigger>` — ZIFT의 React 투영
- Event listeners: keyboard, pointer, focus, clipboard, input

### App 구조
- 앱 폴더 = **feature 기반** (`model/`, `widgets/`, `features/`). FSD 아님
- 패턴: `app.ts`(defineApp + zones + commands) → `model/`(타입) → `widgets/`(React)


## 참조 — 필요할 때 읽는다

| 상황 | 참조 |
|------|------|
| 설계 판단·새 패턴 | `.agent/knowledge/design-principles.md` |
| ZIFT 개념·ARIA 매핑 | `.agent/knowledge/domain-glossary.md` |
| headless/DOM 경계 | `.agent/knowledge/zero-drift.md` |
| 파일/폴더 위치 | `.agent/knowledge/folder-structure.md` |
| 이름 짓기 (동사·접미사) | `.agent/knowledge/naming.md`, `naming-conventions.md` |
| 테스트 도구 선택 | `.agent/knowledge/verification-standards.md` |
| 테스트 함정 회피 | `.agent/knowledge/testing-hazards.md` |
| 테스트 구조 (TestScript ONE) | `.agent/knowledge/testing-tools.md` |
| 성능 패턴·코딩 함정 | `.agent/knowledge/coding-rules.md` |
| 계약 위반 자가 점검 | `.agent/knowledge/contract-checklist.md` |
| 스코프·가설 검증 | `.agent/knowledge/working-standards.md` |
| OS 전체 비전 | `docs/2-area/official/VISION.md` |
| OS 스펙 | `docs/2-area/official/os/SPEC.md` |
| ZIFT 상세 스펙 | `docs/2-area/official/os/zift-spec.md` |
| 커맨드 아키텍처 | `docs/2-area/official/os/commands-architecture.md` |
| 포커스 시스템 | `docs/2-area/official/os/focus-overview.md` |
| headless page 가이드 | `docs/2-area/official/os/headless-page.md` |
| Zone 데이터 모델 | `docs/2-area/official/os/zone-data-model.md` |
| Kernel API 레퍼런스 | `docs/2-area/official/kernel/03-api-reference.md` |


## Cynefin — 코드 전에 도메인을 판단한다

| 도메인 | 판단 기준 | 전략 |
|--------|----------|------|
| **Clear** | 정답이 있다. 기존 패턴이 있다. | 즉시 실행 |
| **Complicated** | 분석하면 좁혀진다. | 분석 후 실행 |
| **Complex** | 정답이 없다. 맥락에 따라 다르다. | 멈추고 묻는다 |

모르면 묻는다. 잘못된 방향으로 100줄 쓰는 것보다 질문 하나가 낫다.

> **정확성**: 수치를 보고하기 전에 반드시 `view_file`이나 `grep`으로 직접 확인한다.
