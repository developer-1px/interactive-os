# 🌌 Interactive OS

> 앱 개발자가 인터랙션을 신경 안 써도 되는 세상을 만들고 있다.

---

## Why — 브라우저는 운영체제가 아니다

브라우저는 문서 뷰어에서 출발했다. `<a>`, `<form>`, `<input>` — 전부 문서를 읽고 제출하는 도구다. 근데 지금 우리가 브라우저 위에서 만드는 건 Figma고, Notion이고, Linear다. **프로 도구**를 문서 뷰어 위에 올리고 있다.

그래서 매번 같은 문제를 겪는다. 포커스가 어디 있는지 브라우저에 물어봐야 하고, 키보드 내비게이션을 처음부터 짜야 하고, 드래그, 클립보드, 멀티셀렉션, Undo/Redo를 앱마다 다시 만든다. **이 프로젝트는 그 "매번"을 없앤다.**

### 왜 지금까지 없었나

있었다. 다만 방향이 달랐다.

React, Vue, Angular — 이것들은 **렌더링 엔진**이다. "화면에 뭘 그릴까"는 풀었지만, "사용자의 의도를 어떻게 해석할까"는 여전히 앱 개발자 몫이다.

Radix, Headless UI, Ark UI — 더 가까운 시도다. 하지만 이것들은 **개별 위젯 라이브러리**다. Dialog 하나, Listbox 하나. 각각은 잘 동작하는데, **위젯 간에 통신이 안 된다.** Listbox에서 선택한 걸 옆 Panel에서 알 수 없고, 포커스가 Dialog에서 뒤의 Tree로 돌아갈 때 어디로 가야 하는지 아무도 모른다. **앱 전체를 하나의 시스템으로 보는 레이어가 없기 때문이다.**

그리고 더 근본적인 이유 — 이걸 범용으로 만들어서 풀 비즈니스 인센티브가 없었다. Figma는 Figma의 인터랙션만 잘 되면 되고, Notion은 Notion 것만 잘 되면 된다.

**AI가 이걸 바꿨다.** AI가 코드를 짜는 시대에, 인터랙션 로직이 앱마다 다르면 AI는 매번 새로 배워야 한다. OS 레이어가 하나 있으면, AI는 그 규칙 하나만 알면 된다. 커맨드 하나 dispatch하면 포커스, 셀렉션, Undo가 다 따라온다.

### 기존과 다른 점

**관할권이 다르다.** 컴포넌트 라이브러리는 **"이 위젯을 어떻게 렌더링할까"**를 푼다. Interactive OS는 **"사용자가 뭘 하려는 건지 어떻게 해석할까"**를 푼다.

사용자가 `Enter`를 누른다:

| | Radix / Headless UI | Interactive OS |
|---|---|---|
| **누가 해석?** | 해당 컴포넌트의 `onKeyDown` | OS 커널의 5-Phase Pipeline |
| **무슨 일이?** | 컴포넌트마다 다름 | `OS_ACTIVATE` 커맨드 하나 |
| **Dialog에서는?** | Dialog 컴포넌트가 따로 처리 | 같은 `OS_ACTIVATE` |
| **Tree에서는?** | Tree 컴포넌트가 따로 처리 | 같은 `OS_ACTIVATE` |
| **Kanban에서는?** | 직접 구현 | 같은 `OS_ACTIVATE` |

**Enter 하나의 의미가 시스템 전체에서 동일하다.** 컨텍스트에 따라 *결과*가 달라질 뿐, *해석 경로*는 하나다. macOS에서 `⌘S`가 어디서든 "저장"인 것처럼.

같은 원리가 데이터에도 적용된다:

```
기존:  TodoList → flat CRUD      DocsSidebar → tree CRUD      Kanban → grouped CRUD
       (각자 구현)                (각자 구현)                    (각자 구현)

지금:  NormalizedCollection  →  toFlatList    (List View)
       CRUD는 한 벌          →  toVisibleTree (Tree View)
                             →  toGrouped     (Kanban View)
```

CRUD 로직을 한 번 짜면, 보는 방법만 갈아끼운다.

### 이걸로 뭘 할 것인가

**AI한테 "이런 앱 만들어"라고 말하면 진짜 만들어지게 하려고.**

지금 AI한테 앱을 시키면 버튼 누르면 동작하는 수준이 나온다. Tab 키로 이동 안 되고, 키보드만으로 쓸 수 없고, Undo 없고, 드래그 안 된다. **보이기만 하는 앱.** 인터랙션이 없으니 장난감이지 도구가 아니다.

```
AI가 할 일                          OS가 보장하는 것
─────────────                       ──────────────
1. 데이터 모델 정의                  키보드 내비게이션  ✅
2. defineApp으로 앱 선언             포커스 복원       ✅
3. createCollectionZone CRUD 연결    멀티 셀렉션      ✅
4. Zone/Item으로 UI 선언             클립보드          ✅
                                    Undo/Redo        ✅
                                    드래그 앤 드롭    ✅
                                    접근성 (ARIA)    ✅
```

AI는 **"뭘 보여줄까"만 결정**하면, **"어떻게 조작할까"는 OS가 보장**한다. 이게 되면 AI가 만든 앱이 장난감이 아니라 **진짜 프로 도구**가 된다. 이건 5년 뒤 이야기가 아니라 지금 이 코드베이스에서 Todo 앱이 이미 그렇게 동작하고 있다. 980개 테스트가 증명한다.

---

## How — 아키텍처

### 5-Phase Interaction Pipeline

```
1-listeners → 2-contexts → 3-commands → 4-effects → 5-hooks → 6-components
```

키보드/마우스 이벤트가 리스너에서 캡처되고, 컨텍스트를 주입받아, 커맨드로 변환되고, 이펙트로 실행되며, 훅을 통해 UI에 반영된다. **모든 상호작용이 이 단일 파이프라인을 통과한다.**

### ZIFT 프리미티브 (Zone-Item-Field-Trigger)

| 프리미티브 | 역할 |
|:---|:---|
| **Zone** | 관할권 정의. ARIA role preset으로 동작을 선언적으로 결정 |
| **Item** | 포커스 가능한 공간적 단위. Virtual Focus + Roving TabIndex |
| **Field** | 편집 가능한 텍스트 영역. IME 안전 + 커맨드 기반 커밋/취소 |
| **Trigger** | 클릭/키보드를 커맨드로 변환. asChild 패턴 |

### 커맨드 시스템 (13개 도메인)

`OS_NAVIGATE` (공간 이동) · `OS_TAB` (선형 탐색) · `OS_SELECT` (단일/다중/범위 선택) · `OS_ACTIVATE` · `OS_CHECK` · `OS_DELETE` · `OS_FIELD_START_EDIT` · `OS_FIELD_COMMIT` · `OS_COPY` · `OS_CUT` · `OS_PASTE` · `OS_ESCAPE` · `OS_EXPAND` · `OS_FOCUS` · `OS_STACK_PUSH/POP`

### 7축 포커스 모델

Direction (공간 이동) · Edge (경계 처리) · Tab (선형 탐색) · Target (직접 타겟팅) · Entry (Zone 간 진입점) · Restore (포커스 메모리) · Recovery (삭제 시 자동 복구)

### 데이터 아키텍처

```tsx
// 앱 정의
const TodoApp = defineApp<TodoState>("todo", INITIAL, { history: true });
const listZone = TodoApp.createZone("list");
const { Zone, Item, Field } = listZone.bind({ role: "listbox", onCheck: toggleTodo });

// 데이터: NormalizedCollection { entities, order }
// CRUD: fromEntities (flat) / fromNormalized (tree)
// Views: toFlatList · toVisibleTree · toGrouped
```

---

## What — 현재 동작하는 것

### 앱

| 앱 | 설명 |
|---|---|
| **Reference Todo** | SaaS 스타일 벤치마크. Kanban 2D Nav, 멀티셀렉션, Undo/Redo, Clipboard, BDD 테스트 |
| **Web Builder** | Visual CMS 빌더. Bento Grid, Block Preset, Seamless Section Navigation |
| **Docs Viewer** | 내장 문서 뷰어. Tree sidebar, 마크다운 렌더링 |

### 테스트 인프라

```ts
// Headless — DOM 없이 커맨드 파이프라인 검증
const page = createOsPage();
page.goto("list", { items: ["a", "b", "c"], role: "listbox" });
page.keyboard.press("ArrowDown");
expect(page.focusedItemId()).toBe("b");

// App-level — 격리된 커널 단위 테스트
const app = TodoApp.create();
app.dispatch(toggleTodo({ id: "task-1" }));
expect(app.state.todos["task-1"].completed).toBe(true);
```

Vitest (unit + integration) · Vitest Browser (component rendering) · Playwright (E2E + APG contract)

### 관찰 가능성

- **Command Inspector** (`Cmd+D`) — 실시간 이벤트 트레이싱, 상태 검사
- **Spatial Laboratory** — `/focus-showcase`, `/aria-showcase`에서 7축 탐색 벤치마킹
- **APG Contract Tests** — W3C WAI-ARIA Authoring Practices 준수 검증

---

## 기술 스택

React 19 · TypeScript 5.9 · Vite 7 · Custom Kernel (순수함수 + Transaction Log) · Tailwind CSS v4 · TanStack Router · Vitest + Playwright · Lucide React · Biome

---

## 시작하기

```bash
git clone https://github.com/developer-1px/interactive-os.git
npm install
npm run dev           # 앱 + 문서 동시 실행
npm test              # unit + integration (headless)
npm run test:browser  # browser component tests
npm run test:e2e      # playwright e2e
npm run typecheck     # 타입 체크
```

---

## 프로젝트 구조

```
src/
├── os/                    # OS 커널 + 파이프라인
│   ├── 1-listeners/       # 키보드/마우스/클립보드 이벤트 리스너
│   ├── 2-contexts/        # DI 컨텍스트 (ZoneRegistry 등)
│   ├── 3-commands/        # 13개 커맨드 도메인
│   ├── 4-effects/         # Side effects
│   ├── 5-hooks/           # React hooks
│   ├── 6-components/      # ZIFT 프리미티브 + Dialog/Toast/QuickPick
│   ├── collection/        # NormalizedCollection + collectionView + CRUD
│   ├── defineApp.ts       # 앱 정의 API
│   └── headless.ts        # Headless 테스트 인프라
├── apps/
│   ├── todo/              # Reference Todo 앱
│   └── builder/           # Web Builder 앱
├── pages/                 # 페이지 컴포넌트 + Showcase
└── docs-viewer/           # 내장 문서 뷰어

docs/                      # PARA 방법론 기반 문서
├── 0-inbox/               # 새로운 제안 및 작업 초안
├── 1-project/             # 활성 프로젝트
├── 3-resource/            # 연구 및 벤치마크
└── archive/               # 완료된 프로젝트 아카이브
```
