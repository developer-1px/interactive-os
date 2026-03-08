# 🌌 Interactive OS

> 웹을 위한 범용 상호작용 인프라. AI가 선언하면, OS가 보장한다.

---

## Why — AI 시대, 프론트엔드의 검증 문제

AI가 코드를 짜는 시대가 왔다. 백엔드는 순조롭다. 함수를 짜고, 테스트를 돌리고, `assert(output === expected)`로 맞는지 확인한다. 입력과 출력이 명확하니까 AI가 스스로 피드백 루프를 닫을 수 있다.

프론트엔드는 다르다. AI가 만든 UI는 스크린샷으로 보면 꽤 괜찮다. 랜딩 페이지, 대시보드, 마케팅 사이트 — 세상이 "프론트엔드도 AI가 대체할 것"이라고 말하는 이유다.

그런데 Tab 키를 눌러봐라.

키보드로 이동이 되나? 포커스가 어디 있는지 보이나? Dialog를 닫으면 포커스가 원래 자리로 돌아오나? Shift+ArrowDown으로 범위 선택이 되나? Undo가 되나? 스크린 리더를 켜면 뭐라고 읽나?

안 된다. **보이기만 하는 앱**이다. 클릭은 되는데 쓸 수는 없다.

"프론트엔드가 대체되어 보이는 것"은 그 이상의 수준이 필요 없는 것들이 대부분이기 때문이다. 진짜 프로 도구 — Figma, Notion, Linear, Excel — 이런 수준을 AI에게 시키면, 장난감이 나온다.

### 왜 이 갭이 존재하는가

AI의 지능 부족이 아니다. **프론트엔드의 구조적 특성** 때문이다.

AI가 코딩을 하려면, 짠 코드가 맞는지 스스로 검증할 수 있어야 한다. 프론트엔드의 결과물은 **시각(View)**과 **상호작용(Interaction)**, 두 축으로 이루어져 있다.

**시각은 검증 비용이 낮다.** AI는 눈이 없지만, 사람이 스크린샷 한 장 보고 "여기 틀어졌어" 하면 그만이다. 피드백 루프가 짧다.

**상호작용은 검증이 폭발한다.** 포커스 위치 × 선택 상태 × 확장 상태 × 오버레이 상태 × 입력 모드 — 상태 축들이 서로 의존하면서 조합이 기하급수적으로 늘어난다. 인간은 브라우저를 열고 직접 눌러보면서 몸으로 검증한다. AI는 눈도 손도 없다. 그리고 현재의 프론트엔드 테스팅 도구들(Playwright 등)은 인간이 시나리오를 작성해야 돌아간다. 추상화가 반쯤에서 멈춰 있다. **AI가 스스로 상호작용을 탐색하고 검증할 환경 자체가 없다.**

결과적으로 AI는 자신이 짠 상호작용 코드가 맞는지 확인할 수 없고, 검증을 포기한 껍데기 UI를 뱉어낸다.

---

## How — 검증 문제를 풀지 않고, 검증의 필요성을 없앤다

이 문제를 푸는 방법은 Playwright를 AI 친화적으로 고치는 것이 아니다. 발상을 뒤집는다.

**AI가 상호작용을 검증할 수 없다면, 상호작용을 AI가 짜지 않게 만들면 된다.**

기존 프론트엔드는 컴포넌트마다 `onKeyDown`, `useState(focusIndex)`, `useEffect`로 포커스 복원 — 상호작용을 파편적으로 흩뿌려왔다. 각 컴포넌트가 자기 인터랙션을 직접 구현하고, 앱 전체의 일관성은 개발자의 머릿속에만 있었다.

Interactive OS는 이 흩어진 상호작용 코드를 전부 앱에서 뜯어내서, **시스템 계층(OS)으로 올린다.** 앱은 "이 영역은 리스트다", "이건 트리다" — 역할(role)만 선언한다. 키보드 내비게이션, 포커스 관리, 선택 로직, 접근성 — 전부 OS가 한다.

AI는 상호작용 코드를 짜지 않는다. 짜지 않으니까 검증할 필요도 없다. **프론트엔드에서 가장 비싼 검증 축이 통째로 사라진다.**

이건 인간 개발자의 편의를 위해 만든 것이 아니다. 인간 개발자는 `onKeyDown`을 직접 짜는 게 오히려 이해가 되고 제어가 된다. **이 시스템은 LLM을 위한 인프라다.** LLM은 이해가 필요 없다. 선언하면 보장되는 것이 LLM에게는 이상적이다.

---

## What — Architecture

### ZIFT Primitives

UI를 상호작용 관점에서 추상화하는 4가지 프리미티브.

| 프리미티브 | 역할 | 예시 |
|:---|:---|:---|
| **Zone** | 상호작용의 관할 구역. 27개 ARIA role preset 중 하나를 선언하면, 해당 패턴의 키보드/접근성 규칙이 자동 적용 | `role: "listbox"`, `role: "dialog"`, `role: "treegrid"` |
| **Item** | 포커스의 최소 단위. 선택, 활성화, 확장의 대상 | 리스트의 각 항목, 트리의 각 노드 |
| **Field** | 편집 가능한 입력 영역. IME 안전, 커맨드 기반 commit/cancel | 인라인 에디터, 검색 입력 |
| **Trigger** | 커맨드를 발동하거나 오버레이를 여는 인터페이스 | 삭제 버튼, 드롭다운 메뉴 트리거 |

### 5-Phase Kernel Pipeline

사용자의 모든 물리적 입력이 통과하는 단일 파이프라인. 흩어진 `addEventListener`가 0개가 된다.

```
사용자 입력 (키보드/마우스/클립보드)
    │
    ▼
┌─ 1-listen ──── 이벤트 캡처 (전역 단일 리스너)
├─ 2-resolve ─── 물리 입력 → 논리 커맨드 변환 (포커스 위치·role에 따라)
├─ 3-inject ──── 커맨드에 맥락 주입 (선택 상태, 타겟 ID 등)
├─ 4-command ─── 순수 함수로 상태 트랜잭션 실행
└─ 5-effect ──── DOM 부수 효과 (focus(), scrollIntoView)
```

같은 `Enter` 키가 listbox에서는 "선택", dialog에서는 "확인", menu에서는 "실행 후 닫기"가 된다. 맥락에 따라 **결과**가 달라질 뿐, 해석 경로는 하나다. macOS에서 `⌘S`가 어디서든 "저장"인 것처럼.

### 28 Universal OS Commands

앱마다 다르게 구현되던 동작이 시스템 수준의 28개 커맨드로 통일된다.

```
공간:     OS_NAVIGATE · OS_TAB · OS_FOCUS · OS_STACK_PUSH · OS_STACK_POP
활성화:   OS_ACTIVATE · OS_CHECK · OS_PRESS · OS_EXPAND
선택:     OS_SELECT · OS_SELECT_ALL · OS_SELECTION_CLEAR
편집:     OS_FIELD_START_EDIT · OS_FIELD_COMMIT · OS_FIELD_CANCEL
CRUD:     OS_DELETE · OS_MOVE_UP · OS_MOVE_DOWN
히스토리:  OS_UNDO · OS_REDO
클립보드:  OS_COPY · OS_CUT · OS_PASTE
오버레이:  OS_OVERLAY_OPEN · OS_OVERLAY_CLOSE · OS_ESCAPE
값:       OS_VALUE_CHANGE
알림:     OS_NOTIFY · OS_NOTIFY_DISMISS
```

### 27 Role Presets (W3C APG 완전 준수)

Zone에 role을 선언하면, W3C ARIA Authoring Practices Guide의 해당 패턴 규칙이 자동 적용된다.

```
리스트:    listbox · menu · menubar · radiogroup · tablist · toolbar · feed
트리/그리드: tree · treegrid · grid
오버레이:  dialog · alertdialog · combobox
컨텐츠:   accordion · disclosure
값:       slider · spinbutton · meter · separator
토글:     switch · checkbox
기타:     group · application · textbox · builderBlock
```

각 preset은 방향(orientation), 루프(loop), 선택 모드(single/multiple/followFocus), 탭 동작(escape/trap/flow), 엔트리 전략(first/selected/restore) 등 8축의 설정을 내장한다.

---

## 실제 코드

### 앱 정의 (Todo App)

```typescript
// 앱 선언 — 상태 모델과 히스토리 모듈
const TodoApp = defineApp<TodoState>("todo", INITIAL_STATE, {
  modules: [history()],
});

// Zone에 role 선언 — 이 한 줄로 키보드, 선택, 접근성이 활성화됨
const TodoListUI = listCollection.bind({
  role: "listbox",
  options: {
    select: { mode: "multiple", range: true, toggle: true },
  },
  onCheck: (cursor) => toggleTodo({ id: cursor.focusId }),
  onAction: (cursor) => startEdit({ id: cursor.focusId }),
  onDelete: (cursor) => requestDeleteTodo({ ids: cursor.selection }),
  onUndo: undoCommand(),
  onRedo: redoCommand(),
});
```

`role: "listbox"` 한 줄로 ArrowUp/Down 내비게이션, Home/End, Shift+Arrow 범위 선택, Meta+Click 토글 선택, 경계 클램핑, roving tabindex, `aria-selected` 프로젝션이 전부 활성화된다. 앱 코드에 `onKeyDown`은 0줄이다.

### Headless 테스트 (DOM 없이 < 1ms)

```typescript
// Playwright-subset API — 브라우저 없이 동작
const page = createHeadlessPage(TodoApp, TodoPage);
page.goto("/");

// 내비게이션 검증
page.locator("#todo_1").click();
page.keyboard.press("ArrowDown");
expect(page.locator("#todo_2").toBeFocused()).toBe(true);

// 범위 선택 검증
page.keyboard.press("Shift+ArrowDown");
expect(page.locator("#todo_2").attrs["aria-selected"]).toBe(true);
expect(page.locator("#todo_3").attrs["aria-selected"]).toBe(true);

// Undo 검증
page.keyboard.press("Delete");
page.dispatch(confirmDeleteTodo());
expect(page.state.data.todoOrder.length).toBe(3);
page.keyboard.press("Meta+z");
expect(page.state.data.todoOrder.length).toBe(4);
```

OS 내부 상태가 브라우저 DOM에서 완전히 분리되어 있기 때문에, 모든 상호작용을 DOM 없이 순수한 상태 트랜잭션으로 검증할 수 있다. 571개 이상의 headless 테스트가 3.5초 안에 통과한다.

### APG Contract 테스트

24개 W3C APG 패턴에 대한 계약 테스트가 headless 환경에서 실행된다. 각 테스트는 W3C 스펙의 키보드 인터랙션 규칙을 1:1로 검증한다.

```typescript
// listbox.apg.test.ts — W3C APG Listbox 패턴 계약
it("ArrowDown: moves focus to next option", () => {
  const t = singleSelect("apple");
  t.keyboard.press("ArrowDown");
  expect(t.focusedItemId()).toBe("banana");
  expect(t.attrs("banana")["aria-selected"]).toBe(true); // followFocus
});

it("single-select invariant: exactly 1 item selected at all times", () => {
  const t = singleSelect("apple");
  t.keyboard.press("ArrowDown");
  expect(t.selection()).toHaveLength(1);
  t.keyboard.press("Home");
  expect(t.selection()).toHaveLength(1);
  t.keyboard.press("End");
  expect(t.selection()).toHaveLength(1);
});
```

---

## 동작하는 앱

| 앱 | 설명 |
|---|---|
| **Reference Todo** | 풀스펙 SaaS 벤치마크. Kanban 2D 내비게이션, 멀티셀렉션, Clipboard, Undo/Redo, 카테고리 사이드바, 인라인 에디팅, DnD |
| **Web Builder** | 비주얼 CMS 빌더. Bento Grid, Block Preset, Seamless Section Navigation |
| **Inspector** | OS 커맨드 트레이싱, 실시간 상태 검사 (`Cmd+D`) |
| **APG Showcase** | 28개 W3C APG 패턴의 인터랙티브 데모와 계약 테스트 |

---

## 프로젝트 구조

```
packages/
├── kernel/           # 순수 함수 상태 관리 코어 (UI 무관)
├── os-core/          # 5-Phase 파이프라인, 27 Role Preset 엔진
│   ├── 1-listen/     # 이벤트 캡처
│   ├── 2-resolve/    # 입력 → 커맨드 변환
│   ├── 3-inject/     # 맥락 주입
│   ├── 4-command/    # 28개 커맨드 도메인
│   └── 5-effect/     # DOM 부수효과
├── os-sdk/           # defineApp, createZone, createCollectionZone
├── os-react/         # React 바인딩 (Zone, Item, Field, Trigger)
├── os-devtool/       # Headless 테스트 인프라 (createHeadlessPage)
└── surface/          # 디자인 토큰, 테마, 타이포그래피

src/
├── apps/todo/        # Reference Todo 앱
├── apps/builder/     # Web Builder
├── inspector/        # Command Inspector
└── pages/apg-showcase/ # 28개 APG 패턴 데모

tests/
├── apg/              # 24개 APG 계약 테스트
├── headless/         # 앱 수준 통합 테스트
└── unit/             # OS 내부 단위 테스트
```

## 기술 스택

React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS v4 · Vitest · Playwright

## 시작하기

```bash
git clone https://github.com/developer-1px/interactive-os.git
cd interactive-os
npm install
npm run dev           # 앱 구동
npm test              # 571+ headless 테스트 (< 4초)
npm run test:e2e      # Playwright E2E
```
