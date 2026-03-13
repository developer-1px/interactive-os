# Spec — Projection v2.2 (pit-of-success)

> defineApp2 + Projection React 4컴포넌트 + Todo v2 end-to-end 검증.
> Two-track Big Bang: 기존 defineApp/bind() 유지, defineApp2 병렬 추가.

---

## T8: defineApp2 SDK 팩토리

> Zone 없음 — 아키텍처 태스크. DT 스킵.

### Story

SDK 개발자로서, `defineApp2(id, initialState)` → `AppHandle2<S>`를 원한다.
그래야 `createZone(name, ZoneConfig<E,C>)` → `ZoneHandle<E,C>`로
asChild projection 컴포넌트를 type-safe하게 생성할 수 있기 때문이다.

### Use Case — 주 흐름

1. `defineApp2<S>(id, initialState)` 호출
2. `AppHandle2<S>` 반환됨 — command(), createZone(), useComputed() 메서드 포함
3. `app.command(type, handler)` → CommandFactory (기존 defineApp과 동일)
4. `app.createZone(name, { role, entity, commands, data })` → `ZoneHandle<E,C>`
5. `ZoneHandle<E,C>.Zone` = React FC (render prop 패턴)
6. headless page factory가 `app.__zoneBindings`로 zone을 재구성

### Scenarios

```
Scenario: S1 — defineApp2가 AppHandle2를 반환한다
  Given defineApp2<TodoState>("todo-v2", INITIAL_STATE) 호출
  When 반환값을 검사
  Then command, createZone, useComputed 메서드가 존재한다
  Then __appId === "todo-v2"
  Then __zoneBindings는 Map이다

Scenario: S2 — command()가 CommandFactory를 반환한다
  Given defineApp2로 생성된 app
  When app.command("TOGGLE", handler) 호출
  Then CommandFactory가 반환된다
  Then factory() 호출 시 { type: "TOGGLE" } 형태의 BaseCommand 생성

Scenario: S3 — createZone이 ZoneHandle<E,C>를 반환한다
  Given defineApp2로 생성된 app
  And deleteTodo, toggleTodo 커맨드가 등록됨
  When app.createZone("list", { role: listboxRole, entity: phantom<Todo>(), commands: { deleteTodo, toggleTodo }, data: accessor }) 호출
  Then ZoneHandle<E,C>가 반환된다
  Then ZoneHandle.Zone은 React FC이다

Scenario: S4 — ZoneConfig의 data accessor가 전달된다
  Given ZoneConfig에 data: (state) => Todo[] 지정
  When createZone 호출
  Then 내부적으로 data accessor가 보존되어 Items 컴포넌트에서 사용 가능

Scenario: S5 — __zoneBindings에 zone 정보가 등록된다
  Given defineApp2로 생성된 app
  When createZone("list", config) 호출
  Then app.__zoneBindings.has("list") === true
  Then entry에 role, commands, data 정보 포함

Scenario: S6 — 기존 defineApp은 영향 없음 (Two-track)
  Given defineApp과 defineApp2가 같은 모듈에서 export됨
  When 기존 앱이 defineApp을 사용
  Then 기존 동작 100% 유지 (기존 테스트 전체 PASS)

Scenario: S7 — Entity 타입이 ZoneHandle 제네릭으로 전파된다
  Given Todo interface { id, text, completed, dueDate }
  When createZone<Todo, Commands>("list", config) 호출
  Then ZoneHandle<Todo, Commands> 타입이 정확히 추론된다
  Then Zone render prop의 zone.Items callback에서 item.text: string 접근 가능 (tsc 0)
```

### State Inventory

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| AppHandle2 생성됨 | kernel에 app slice 등록 완료 | defineApp2() 호출 | — (singleton) |
| Zone 등록됨 | __zoneBindings에 entry 추가 | createZone() 호출 | — |

### Out of Scope (T8)

- React 렌더링 (→ T9)
- asChild cloneElement 구현 (→ T9)
- headless page.goto() 호환성 (→ T10)
- 기존 앱 codemod 마이그레이션 (→ 별도 프로젝트)

---

## T9: Projection React 4컴포넌트

> Zone 있음 — 인터랙션 태스크.

### Story

앱 개발자(LLM)로서, `<zone.Items>{(item, Item) => ...}</zone.Items>` 패턴으로
entity 데이터와 ARIA를 분리하여 렌더링하고 싶다.
그래야 ARIA를 몰라도 접근성이 보장되기 때문이다.

### Use Case — 주 흐름

1. `<TodoList.Zone>{(zone) => <ul>...</ul>}</TodoList.Zone>` 렌더링
2. Zone이 container ARIA attrs를 `<ul>`에 cloneElement로 주입
3. `<zone.Items>{(item, Item) => <li>...</li>}</zone.Items>` — item별 iterate
4. `item.text`, `item.completed` — entity 데이터 직접 접근
5. `<Item.text><span>{item.text}</span></Item.text>` — asChild field wrapper
6. `<zone.Trigger onPress={cmd => cmd.deleteTodo(item.id)}><button>×</button></zone.Trigger>`
7. 모든 ARIA attrs는 framework가 cloneElement로 주입 — 개발자 코드에 ARIA 없음

### Scenarios

```
Scenario: S8 — ProjectionZone이 container ARIA를 asChild로 주입한다
  Given TodoList.Zone이 listbox role로 생성됨
  When <TodoList.Zone>{(zone) => <ul className="my-list">...</ul>}</TodoList.Zone> 렌더링
  Then <ul>에 role="listbox", tabindex 등 ARIA attrs가 cloneElement로 주입됨
  Then Framework가 생성한 wrapper div = 0개

Scenario: S9 — zone.Items가 entity 데이터를 (item, Item) callback으로 전달한다
  Given data accessor가 [{ id: "1", text: "Buy milk", completed: false }] 반환
  When <zone.Items>{(item, Item) => ...}</zone.Items> 렌더링
  Then callback이 1번 호출됨
  Then item.id === "1", item.text === "Buy milk", item.completed === false

Scenario: S10 — Items가 각 item root element에 ARIA attrs를 asChild로 주입한다
  Given item callback이 <li>를 root element로 반환
  When 렌더링
  Then <li>에 id, role="option", tabindex, data-item, aria-selected 등이 cloneElement로 주입됨

Scenario: S11 — Item.fieldName이 asChild field wrapper로 동작한다
  Given Todo entity에 text, completed 필드 존재
  When <Item.text><span>hello</span></Item.text> 렌더링
  Then <span>에 data-field="text" attr가 cloneElement로 주입됨

Scenario: S12 — zone.Trigger가 onPress로 command dispatch한다
  Given zone에 deleteTodo command 등록됨
  When <zone.Trigger onPress={cmd => cmd.deleteTodo("1")}><button>×</button></zone.Trigger> 렌더링
  Then <button>에 data-trigger-id attr가 주입됨
  Then 클릭 시 deleteTodo("1") command가 dispatch됨

Scenario: S13 — Trigger의 cmd 객체는 등록된 commands만 노출한다
  Given zone에 { deleteTodo, toggleTodo } 등록됨
  When onPress callback에서 cmd 접근
  Then cmd.deleteTodo, cmd.toggleTodo만 존재 (tsc 레벨)
  Then cmd.renameTodo는 타입 에러 (tsc)

Scenario: S14 — Item.Children으로 Tree 재귀 가능하다
  Given treegrid role zone에 FileNode entity
  When <Item.Children>{(child, Child) => <div>{child.name}</div>}</Item.Children> 렌더링
  Then child는 같은 FileNode 타입
  Then Child.Children으로 재귀 가능
```

### Decision Table — Zone Projection

| # | Zone Role | Items Data | Field Usage | Trigger Usage | Expected DOM |
|---|-----------|-----------|-------------|---------------|-------------|
| DT1 | listbox | flat E[] | `<Item.text>` | `cmd.toggle()` | `<ul role=listbox><li role=option>` |
| DT2 | treegrid | nested E[] | `<Item.name>` | `cmd.delete()` | `<div role=treegrid><div role=row>` + Children 재귀 |
| DT3 | listbox | empty [] | — | — | container만 렌더링, items 없음 |
| DT4 | listbox | 1 item | Item.field 없이 item.text만 | — | ARIA 주입된 `<li>`, data-field 없음 |

### State Inventory

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| Zone mounted | ZoneRegistry 등록됨 | ProjectionZone mount | unmount |
| Item focused | computeItem().state.isFocused | OS_NAVIGATE | 다른 item focus |
| Item selected | aria-selected=true | OS_SELECT | OS_SELECTION_CLEAR |
| Field editing | data-field 활성 | OS_FIELD_START_EDIT | OS_FIELD_COMMIT |

### Out of Scope (T9)

- headless 테스트 호환 (→ T10)
- 기존 Zone.tsx/Item.tsx 수정 (유지)
- Grid column(gridcell) 경계 (→ Unresolved #4)
- cross-zone keyboard navigation (→ Unresolved #3)
- S14 Item.Children Tree 재귀 (→ Unresolved #4, K8 — treegrid 설계 미해소)
- DT2 treegrid nested + Children (→ Unresolved #4)

---

## T10: Todo v2 + Headless 검증

> Zone 있음 — 인터랙션 태스크.

### Story

프레임워크 개발자로서, Todo v2 앱이 defineApp2 + projection API로 end-to-end 동작함을 검증하고 싶다.
그래야 기존 앱 마이그레이션 전에 새 API의 완전성을 증명할 수 있기 때문이다.

### Use Case — 주 흐름

1. Todo v2 앱: defineApp2 + fromEntities + listbox zone
2. ListView widget: ProjectionZone + Items + Trigger로 렌더링
3. headless createPage(todoV2App) → page.goto("/")
4. keyboard navigation (ArrowDown/Up) → focus 이동
5. Space → toggleTodo → item checked
6. Delete → deleteTodo → item 제거

### Scenarios

```
Scenario: S15 — Todo v2 앱이 defineApp2로 생성된다
  Given defineApp2<TodoState>("todo-v2", INITIAL_STATE)
  And fromEntities로 entity accessor 구성
  When createZone("list", config) 호출
  Then ZoneHandle<Todo, Commands>가 반환된다
  Then tsc 0 errors

Scenario: S16 — headless에서 keyboard navigation 동작한다
  Given Todo v2 앱에 3개 todo 존재
  And createPage(todoV2App) → page.goto("/")
  When page.keyboard.press("ArrowDown")
  Then focus가 두 번째 todo로 이동

Scenario: S17 — headless에서 item check 동작한다
  Given focus가 첫 번째 todo에 있음
  When page.keyboard.press("Space")
  Then 해당 todo의 aria-checked === true

Scenario: S18 — headless에서 item delete 동작한다
  Given focus가 첫 번째 todo에 있음
  And 3개 todo 존재
  When page.keyboard.press("Delete")
  Then todo가 삭제되어 2개 남음
  Then focus가 다음 item으로 이동

Scenario: S19 — __zoneBindings가 headless registerZones와 호환된다
  Given defineApp2로 생성된 app
  When app.__zoneBindings를 registerZones에 전달
  Then ZoneRegistry에 zone이 등록됨
  Then getItems()가 todo ID 목록 반환
```

### Decision Table — Todo v2 Headless

| # | Initial State | Action | Expected |
|---|--------------|--------|----------|
| DT5 | 3 todos, focus=first | ArrowDown | focus=second |
| DT6 | 3 todos, focus=last | ArrowDown | focus=last (wrap 안 함) |
| DT7 | 3 todos, focus=first | Space | first.checked=true |
| DT8 | 3 todos, focus=first, checked | Space | first.checked=false |
| DT9 | 3 todos, focus=first | Delete | 2 todos, focus=second(was) |
| DT10 | 1 todo, focus=first | Delete | 0 todos |

### Out of Scope (T10)

- 브라우저 렌더링 검증 (headless만)
- Draft zone (텍스트 입력)
- Edit zone (인라인 편집)
- Category sidebar
- 기존 Todo v1 수정

---

## 변경 이력

| 날짜 | 변경 | 사유 |
|------|------|------|
| 2026-03-13 | 초판 작성 | /divide → /plan → /spec |
