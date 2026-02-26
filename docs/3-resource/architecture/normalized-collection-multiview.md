---
last-reviewed: 2026-02-24
---

# Normalized Collection + Multi-View Architecture

> 데이터를 정규화하면 View가 자유로워진다. 같은 컬렉션, 다른 렌즈.

## 왜 이 주제인가

Interactive OS는 "OS가 데이터를 소유하고, View는 projection"이라는 방향으로 진화 중이다.
이번 세션에서 `flattenVisibleTree`가 증명:
- `DocItem[]` (앱 도메인) → `FlatTreeNode[]` (OS 정규화) → Tree View
- 같은 데이터를 List, Kanban, Grid로도 볼 수 있어야 한다
- CRUD (add/remove/move/copy/paste/undo)는 View에 무관하게 동일해야 한다

이 패턴의 선례와 변형을 정리한다.

## Background: 왜 정규화인가

**문제**: 컴포넌트가 데이터를 소유하면:
- TreeView는 nested object를, ListView는 flat array를, KanbanView는 grouped map을 각각 요구
- 같은 데이터를 다른 뷰로 보려면 데이터 구조 자체를 바꿔야 함
- CRUD 로직이 뷰마다 다르게 구현됨 → N개 뷰 = N개 CRUD = N배 버그

**해법**: 데이터를 **하나의 정규화된 포맷**으로 통일하고, 뷰는 순수 함수 변환(projection)으로 파생.

```
Normalized Collection (Single Source of Truth)
       │
       ├─ flattenTree()  → TreeView
       ├─ groupByStatus() → KanbanView  
       ├─ identity()      → ListView
       └─ pivotToGrid()   → GridView
       
CRUD: add/remove/move/update → 어디서든 같은 커맨드
```

## Core Concept

### 1. Notion — Block-based Normalized Database

Notion의 핵심 통찰: **모든 것은 Block이다.**

- 텍스트, 이미지, 페이지, 데이터베이스 행 — 전부 같은 정규화된 Block 엔티티
- 하나의 Database(컬렉션)가 6가지 View를 지원:
  - Table, Board (Kanban), Calendar, Gallery, List, Timeline
- **핵심**: View를 바꿔도 데이터는 동일. Filter/Sort/Group은 View 레벨 설정.
- CRUD (생성, 수정, 삭제, 이동)는 Block 레벨에서 통일.

**우리 OS와의 매핑**:
| Notion | Interactive OS |
|--------|---------------|
| Block | Entity (normalized item) |
| Database | Collection (createCollectionZone) |
| View | Projection (flattenVisibleTree 등) |
| Property | Component/Attribute |
| Filter/Sort | View Transform options |

### 2. Airtable — Relational Normalized Views

Airtable = 스프레드시트 + 관계형 DB.

- 테이블 간 Linked Records로 관계 표현 (1NF~3NF 정규화)
- 같은 테이블을 Grid, Kanban, Calendar, Gallery, Form, Gantt로 표시
- **설계 원칙**: "One table, many views. Views share data, not duplicate it."

### 3. TanStack Table — Headless Data Processing

TanStack Table은 **headless UI의 산업 표준**.

- Core: 데이터 처리 엔진 (sorting, filtering, pagination, grouping)
- Adapter: React, Vue, Solid, Svelte 등 프레임워크별 바인딩
- **핵심 추상화**:
  - Column Definitions (스키마)
  - Row Model (정규화된 행)
  - Table Instance ("brain" — state + processing)
- UI는 `flexRender()`로 렌더 — markup은 개발자 자유

**우리 OS와 가장 가까운 선례.** 차이점:
| TanStack Table | Interactive OS |
|----------------|---------------|
| Table만 지원 | Tree, List, Kanban, Grid 범용 |
| 프레임워크 adapter | OS가 프레임워크 역할 |
| 정렬/필터만 headless | Focus, Selection, Expand, DnD, Clipboard까지 headless |

### 4. Redux Toolkit — Entity Adapter + Normalizr

Redux 생태계의 정규화 패턴:

```typescript
// normalizr: nested API response → flat entity map
// before: { users: [{ id: 1, posts: [{ id: 10 }] }] }
// after:  { users: { 1: {...} }, posts: { 10: {...} } }

// createEntityAdapter: 표준 CRUD reducers + selectors
const adapter = createEntityAdapter<Todo>();
adapter.addOne(state, todo);     // Create
adapter.selectAll(state);        // Read
adapter.updateOne(state, update); // Update
adapter.removeOne(state, id);    // Delete
```

**핵심 교훈**: `createEntityAdapter`가 증명 — CRUD를 통일하면 모든 컬렉션이 같은 인터페이스로 작동.

### 5. Apple Cocoa Bindings — NSArrayController / NSTreeController

macOS Cocoa의 원조 MVC 바인딩:

- `NSArrayController`: flat collection 관리 + 여러 View에 바인딩
- `NSTreeController`: hierarchical collection 관리
- `selectionIndexes` 공유: 한 View에서 선택하면 다른 View도 동기화
- KVO (Key-Value Observing): 데이터 변경 → 자동 UI 업데이트

**우리 OS의 `os.useComputed()`는 KVO의 웹 버전**, `Zone.bind()`는 Cocoa Bindings의 선언적 바인딩.

### 6. ECS (Entity Component System) — 게임 엔진의 극단적 정규화

Unity DOTS, Bevy, Flecs 등 게임 엔진의 데이터 아키텍처:

- **Entity**: 순수 ID (데이터 없음, 로직 없음)
- **Component**: 순수 데이터 (로직 없음)
- **System**: 순수 로직 (데이터 없음)

같은 Entity가 RenderSystem, PhysicsSystem, AISystem에서 각각 다르게 "보여진다."
Component 조합이 곧 "이 Entity를 어떤 System이 처리하는가"를 결정.

**이것이 "같은 데이터, 다른 View"의 가장 극단적 형태.**

### 7. CQRS (Command Query Responsibility Segregation)

- **Write Model**: 정규화된 엔티티. 비즈니스 규칙 집행.
- **Read Model**: 쿼리에 최적화된 비정규화 뷰. 여러 개 공존 가능.
- 같은 Event(명령)가 여러 Read Model을 업데이트

**우리 OS에서**:
- Write = `os.dispatch(OS_ADD/OS_REMOVE/OS_MOVE)` → kernel state
- Read = `useFlatTree()`, `useKanbanView()` → component re-render

## Best Practice + Anti-Pattern

### ✅ Do
- **정규화 먼저**: 앱 데이터를 OS에 넣기 전에 `Map<id, Entity>` + `order[]`로 변환
- **View Transform은 순수 함수**: `(entities, viewConfig) → viewData` — side effect 없음
- **CRUD는 Entity 레벨**: View가 뭐든 `add(entity)`, `remove(id)`, `move(id, newPos)` 동일
- **View 설정은 View 레벨**: Filter, Sort, Group은 View Config에 보관

### ❌ Don't
- **View가 데이터를 소유**: `<TreeView data={nestedTree}>` — View 변경 시 데이터 재구조화 필요
- **CRUD를 View마다 구현**: Tree의 addChild ≠ Kanban의 addCard → 같은 연산인데 다른 코드
- **정규화 없이 직접 바인딩**: API response → 그대로 컴포넌트 props → 스키마 변경 시 전파

## 흥미로운 이야기들

### "All Software is a Database" 가설

> 충분히 복잡한 모든 앱은 결국 데이터베이스를 재발명한다.
> — Greenspun의 Tenth Rule 변형

Notion은 "위키" → "데이터베이스" → "앱 빌더"로 진화했다.
Airtable은 "스프레드시트" → "관계형 DB" → "자동화 플랫폼"으로.
둘 다 핵심은 같다: **데이터를 정규화하면 View는 무한히 파생할 수 있다.**

Interactive OS도 같은 궤적: "UI 프레임워크" → "데이터 정규화 계층" → "웹 OS".

### ECS의 교훈: Composition over Inheritance

ECS가 OOP의 deep inheritance hierarchy를 대체한 것처럼,
Interactive OS는 "컴포넌트가 데이터를 소유하는" React 패턴을 대체한다.
React의 `useState`가 OOP의 멤버 변수라면, OS의 kernel state는 ECS의 Component Store.

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|--------|------|
| Redux Entity Adapter | CRUD 통일 패턴의 산업 표준 | [RTK docs: createEntityAdapter](https://redux-toolkit.js.org/api/createEntityAdapter) | ⭐⭐ | 1h |
| TanStack Table Architecture | Headless data processing의 설계 철학 | [TanStack Table Guide](https://tanstack.com/table/latest/docs/guide/introduction) | ⭐⭐ | 2h |
| Notion Engineering Blog | Block model + multi-view 구현기 | [Notion: The data model behind Notion](https://www.notion.so/blog/data-model-behind-notion) | ⭐⭐⭐ | 1h |
| CQRS by Martin Fowler | Write/Read 모델 분리의 원칙 | [martinfowler.com/bliki/CQRS](https://martinfowler.com/bliki/CQRS.html) | ⭐⭐ | 30m |
| ECS & Data-Oriented Design | 극단적 정규화의 성능 이점 | [Unity DOTS](https://unity.com/dots), [Bevy ECS](https://bevyengine.org/) | ⭐⭐⭐ | 3h |
| Database Normalization (1NF~3NF) | 정규화의 수학적 기초 | [Wikipedia: Database normalization](https://en.wikipedia.org/wiki/Database_normalization) | ⭐ | 1h |
