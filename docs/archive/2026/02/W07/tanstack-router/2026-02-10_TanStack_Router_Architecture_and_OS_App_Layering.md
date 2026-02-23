# TanStack Router 아키텍처와 OS.App 레이어링

## 1. 개요 (Overview)

프로젝트의 라우팅이 TanStack Router의 **File-based Routing**으로 구성되어 있으며, 이 위에 자체 OS 레이어(`OS.Root`, `OS.App`)가 올라가 있다. 이 보고서는 두 레이어의 역할 차이, TanStack Router의 핵심 개념, 그리고 현재 레이아웃 구조가 어떻게 형성되었는지를 정리한다.

---

## 2. TanStack Router의 핵심 개념

### 2.1 File-based Routing

`src/routes/` 폴더 구조가 곧 라우트 트리가 된다. Vite 플러그인(`@tanstack/router-plugin`)이 빌드 시 `routeTree.gen.ts`를 자동 생성하며, 이 파일이 모든 라우트 간의 부모-자식 관계를 정의한다.

```
src/routes/
├── __root.tsx          ← createRootRoute    (모든 라우트의 최상위)
├── _minimal.tsx        ← Layout Route       (pathless, UI wrapper)
├── _minimal/
│   ├── builder.tsx     ← /builder
│   ├── focus-showcase.tsx ← /focus-showcase
│   ├── docs.tsx        ← /docs (nested layout)
│   └── ...
├── _todo.tsx           ← Layout Route       (pathless, UI wrapper)
├── _todo/
│   ├── index.tsx       ← /
│   ├── settings.tsx    ← /settings
│   └── ...
├── _kanban.tsx         ← Layout Route       (pathless, UI wrapper)
└── _kanban/
    └── kanban.tsx      ← /kanban
```

### 2.2 Layout Route (`_` prefix)

TanStack Router에서 **`_` prefix**를 가진 파일은 **Layout Route**이다.

- **URL에 나타나지 않는다** — `_minimal`은 URL segment를 만들지 않음
- **UI wrapper로만 동작한다** — `<Outlet />`을 렌더하여 자식 라우트를 감싼다
- **같은 Layout을 공유하는 라우트를 그룹화한다**

```tsx
// _minimal.tsx — Layout Route (URL: 없음)
function MinimalLayout() {
  return (
    <OS.App isAppShell={isAppShell}>   // ← OS 레이어를 끼움
      <Outlet />                        // ← 자식 라우트가 여기에 렌더
    </OS.App>
  );
}
```

따라서 `/builder`, `/focus-showcase`, `/kernel-lab` 등은 URL에 `_minimal`이 없지만, 모두 `MinimalLayout` 안에서 렌더된다.

### 2.3 `staticData` — 라우트 메타데이터

각 라우트 파일에서 `staticData`를 정의하면, 런타임에 라우트 트리를 순회하며 메타데이터를 읽을 수 있다. GlobalNav의 메뉴 아이템, 아이콘, 정렬 순서 등을 라우트 파일 자체에서 선언적으로 관리할 수 있는 것이 핵심 이점이다.

```tsx
// _minimal/builder.tsx
export const Route = createFileRoute("/_minimal/builder")({
  component: BuilderPage,
  staticData: {
    title: "Web Builder",
    icon: Layout,
    location: "global-nav",
    order: 3,
    isAppShell: true,  // ← 라우트별 스크롤 제어
  },
});
```

### 2.4 Route Nesting과 `<Outlet />`

라우트가 중첩될 때, 각 레벨의 `component`가 `<Outlet />`으로 자식을 받는다. `/builder` 접속 시 렌더 순서:

```
__root.tsx (RootComponent)
  └─ .app-viewport
       ├─ GlobalNav
       ├─ .app-main > .app-content
       │    └─ <Outlet /> ← _minimal.tsx (MinimalLayout)
       │         └─ <OS.App>
       │              └─ <Zone>
       │                   └─ <Outlet /> ← builder.tsx (BuilderPage)
       └─ Inspector (conditional)
```

---

## 3. OS.App vs Layout Route (`_minimal`) — 역할 차이

이 두 개념은 **서로 다른 레이어**에서 작동한다.

| 구분 | Layout Route (`_minimal.tsx`) | `OS.App` 컴포넌트 |
|------|------|------|
| **소속** | TanStack Router (라우팅 레이어) | Interactive OS (OS 레이어) |
| **역할** | URL 매칭 없이 자식 라우트를 감싸는 UI wrapper | 앱 엔진 초기화, 커맨드 등록, 상태 관리 |
| **담당** | "어떤 라우트들을 하나의 그룹으로 묶을 것인가" | "이 그룹에 어떤 앱 기능(키맵, 커맨드, 포커스)을 부여할 것인가" |
| **렌더링** | `<Outlet />`으로 자식 라우트를 전달 | `<Zone>`으로 포커스/커맨드 영역을 구성 |
| **스크롤 제어** | 자식 route의 `staticData.isAppShell`을 읽어 `OS.App`에 전달 | `isAppShell` prop에 따라 Zone의 overflow 제어 |

### 결합 구조

```
Layout Route (라우팅 관심사)
  └─ OS.App (OS 관심사: 엔진, 커맨드, 상태)
       └─ OS.Zone (포커스/접근성 관심사)
            └─ 실제 페이지 컴포넌트
```

- **`_minimal`**: 별도의 AppDefinition 없이 기본 `os-shell` 앱을 사용. 대부분의 showcase/lab 페이지용.
- **`_todo`**: `TodoApp` AppDefinition을 주입하여 Todo 전용 커맨드와 키맵을 활성화.
- **`_kanban`**: `KanbanApp` AppDefinition을 주입하여 Kanban 전용 커맨드를 활성화.

---

## 4. 3-Column 고정 레이아웃과 스크롤 제어

### 4.1 레이아웃 구조

```
┌──────────────────────────────────────────────────┐
│                  .app-viewport (100vh, flex)       │
│ ┌──────┐  ┌────────────────────────┐  ┌────────┐ │
│ │Global│  │     .app-main          │  │Inspector│ │
│ │ Nav  │  │ ┌────────────────────┐ │  │ (조건부) │ │
│ │      │  │ │   .app-content     │ │  │        │ │
│ │      │  │ │  (overflow-y:auto) │ │  │        │ │
│ │      │  │ │                    │ │  │        │ │
│ │      │  │ │  ┌──────────────┐  │ │  │        │ │
│ │      │  │ │  │  OS.App Zone │  │ │  │        │ │
│ │      │  │ │  │              │  │ │  │        │ │
│ │      │  │ │  └──────────────┘  │ │  │        │ │
│ │      │  │ └────────────────────┘ │  │        │ │
│ └──────┘  └────────────────────────┘  └────────┘ │
└──────────────────────────────────────────────────┘
```

### 4.2 스크롤 제어 메커니즘

`.app-viewport`와 `.app-main`은 **항상** `overflow: hidden`으로 고정된다. 스크롤은 `.app-content`의 `overflow-y: auto`에 의해 발생하며, 실제 스크롤 여부는 **내부 Zone의 높이**가 결정한다:

| `isAppShell` | Zone className | 결과 |
|---|---|---|
| `false` (기본) | `min-h-full flex flex-col` | 컨텐츠가 뷰포트보다 크면 **스크롤** |
| `true` | `h-full flex flex-col overflow-hidden` | 뷰포트에 고정, **스크롤 없음** (내부 자체 관리) |

`_minimal` 레이아웃은 현재 매칭된 리프 라우트의 `staticData.isAppShell`을 읽어 `OS.App`에 동적으로 전달한다:

```tsx
function MinimalLayout() {
  const matches = useMatches();
  const leaf = matches[matches.length - 1];
  const isAppShell =
    (leaf?.staticData as Record<string, unknown>)?.isAppShell === true;
  // ...
}
```

---

## 5. 왜 TanStack Router로 옮겼는가

### 5.1 기존 문제점 (react-router-dom)

1. **이중 관리**: 페이지 추가 시 `App.tsx`의 `<Routes>`와 `GlobalNav`의 배열을 **동시에** 수정해야 했다.
2. **Type Safety 부재**: 문자열 기반 경로 이동은 오타 → 404로 이어졌다.
3. **Layout 재사용 어려움**: 특정 라우트 그룹에만 적용하는 Layout wrapper를 만들기 위해 수동 중첩이 필요했다.

### 5.2 TanStack Router가 해결한 것

| 문제 | 해결 |
|------|------|
| 이중 관리 | `staticData`로 라우트 파일 안에서 nav 메타데이터를 선언 |
| Type Safety | `routeTree.gen.ts`가 모든 경로를 타입으로 생성 → `<Link to=...>`에서 자동 완성 |
| Layout 재사용 | `_` prefix Layout Route로 pathless 그룹화 가능 |
| 스크롤 제어 | `staticData`에 `isAppShell` 플래그 → Layout Route가 동적으로 읽음 |

### 5.3 현재 라우트별 스크롤 설정

| 라우트 | Layout | `isAppShell` | 스크롤 |
|--------|--------|---|---|
| `/` (Todo) | `_todo` | `true` (layout 고정) | ❌ |
| `/kanban` | `_kanban` | `true` (layout 고정) | ❌ |
| `/builder` | `_minimal` | `true` (staticData) | ❌ |
| `/focus-showcase` | `_minimal` | `false` (기본) | ✅ |
| `/aria-showcase` | `_minimal` | `false` (기본) | ✅ |
| `/kernel-lab` | `_minimal` | `false` (기본) | ✅ |
| `/docs/*` | `_minimal` | `false` (기본) | ✅ |

---

## 6. 결론

- **Layout Route**는 TanStack Router의 라우팅 그룹화 도구이고, **OS.App**은 그 위에 올라가는 OS 기능 주입 레이어이다.
- 둘은 관심사가 다르므로 1:1로 결합하되, Layout Route가 라우트 메타데이터를 읽어 OS.App에 전달하는 **브릿지 역할**을 한다.
- 3-column 고정 레이아웃에서는 `body` 클래스가 아닌, 가운데 컬럼(`.app-content`) 내부의 Zone className으로 스크롤을 제어하는 것이 올바른 접근이다.
