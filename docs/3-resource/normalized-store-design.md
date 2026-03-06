# NormalizedStore — 보편 정규화 구조 (Design Spike)

> **원칙**: Tree, List, Grid, Form, Dropdown — 모든 구조가 **하나의 shape**으로 정규화된다.
> 각 Zone의 `from()`이 patch를 반환하고, OS가 합성하여 단일 Store를 구성한다.
> **normalize/denormalize는 앱이 작성한다.**
> **상태**: v2 — T2 탁상 검증 완료 (7/7 케이스 ✅)

---

## 1. 단일 구조

```typescript
interface NormalizedStore {
  items: Record<string, NormalizedItem>;
  zones: Record<string, ZoneDef>;
}

interface NormalizedItem {
  id: string;
  fields: Record<string, FieldValue>;    // 타입이 있는 필드 값
  parentId: string | null;               // null = zone의 루트
  childIds: string[];                    // 정렬된 자식 (없으면 [])
  zoneId: string;                        // 소속 zone
}

interface ZoneDef {
  id: string;
  structure: "list" | "tree" | "grid" | "form";
  rootIds: string[];                     // 최상위 아이템 (정렬됨)
  parentItemId?: string;                 // nested zone일 때, 부모 아이템 ID
  columns?: ColumnDef[];                 // grid일 때 열 정의
}

interface ColumnDef {
  id: string;
  field: string;
  label: string;
  width?: number;
}

type FieldValue =
  | { type: "string";  value: string }
  | { type: "boolean"; value: boolean }
  | { type: "number";  value: number };
  // enum/color/date — T4에서 설계
```

---

## 2. 7가지 케이스 탁상 검증

### Case 1: Flat List (Todo)

**앱 데이터**:
```typescript
{ todos: [
  { id: "t1", text: "Buy groceries", done: false },
  { id: "t2", text: "Write report", done: true },
]}
```

**NormalizedStore**:
```typescript
{
  items: {
    "t1": { id: "t1", fields: { text: { type: "string", value: "Buy groceries" }, done: { type: "boolean", value: false } }, parentId: null, childIds: [], zoneId: "todo-list" },
    "t2": { id: "t2", fields: { text: { type: "string", value: "Write report" }, done: { type: "boolean", value: true } }, parentId: null, childIds: [], zoneId: "todo-list" },
  },
  zones: {
    "todo-list": { id: "todo-list", structure: "list", rootIds: ["t1", "t2"] }
  }
}
```
**검증**: ✅ parentId 전부 null, rootIds가 순서, fields가 타입 구분.

---

### Case 2: Tree (Builder Sidebar)

**앱 데이터**:
```typescript
{ blocks: [
  { id: "hero", label: "Hero Section", children: [
    { id: "hero-title", label: "Title" },
    { id: "hero-btn", label: "CTA Button" },
  ]},
  { id: "footer", label: "Footer" },
]}
```

**NormalizedStore**:
```typescript
{
  items: {
    "hero":       { id: "hero", fields: { label: { type: "string", value: "Hero Section" } }, parentId: null, childIds: ["hero-title", "hero-btn"], zoneId: "sidebar" },
    "hero-title": { id: "hero-title", fields: { label: { type: "string", value: "Title" } }, parentId: "hero", childIds: [], zoneId: "sidebar" },
    "hero-btn":   { id: "hero-btn", fields: { label: { type: "string", value: "CTA Button" } }, parentId: "hero", childIds: [], zoneId: "sidebar" },
    "footer":     { id: "footer", fields: { label: { type: "string", value: "Footer" } }, parentId: null, childIds: [], zoneId: "sidebar" },
  },
  zones: {
    "sidebar": { id: "sidebar", structure: "tree", rootIds: ["hero", "footer"] }
  }
}
```
**검증**: ✅ parentId/childIds로 계층 표현. rootIds가 최상위 순서.

---

### Case 3: Grid (데이터 테이블)

**앱 데이터**:
```typescript
{ users: [
  { id: "u1", name: "Alice", age: 30, active: true },
  { id: "u2", name: "Bob", age: 25, active: false },
]}
```

**NormalizedStore**:
```typescript
{
  items: {
    "u1": { id: "u1", fields: { name: { type: "string", value: "Alice" }, age: { type: "number", value: 30 }, active: { type: "boolean", value: true } }, parentId: null, childIds: [], zoneId: "user-grid" },
    "u2": { id: "u2", fields: { name: { type: "string", value: "Bob" }, age: { type: "number", value: 25 }, active: { type: "boolean", value: false } }, parentId: null, childIds: [], zoneId: "user-grid" },
  },
  zones: {
    "user-grid": {
      id: "user-grid", structure: "grid", rootIds: ["u1", "u2"],
      columns: [
        { id: "col-name", field: "name", label: "Name" },
        { id: "col-age", field: "age", label: "Age", width: 80 },
        { id: "col-active", field: "active", label: "Active", width: 60 },
      ]
    }
  }
}
```
**검증**: ✅ items=행, columns=열 정의, fields=셀 값. 순서는 rootIds.

---

### Case 4: Kanban (칸반 보드)

**앱 데이터**:
```typescript
{ columns: [
  { id: "todo", title: "To Do", cards: [
    { id: "c1", title: "Design API" },
    { id: "c2", title: "Write tests" },
  ]},
  { id: "doing", title: "Doing", cards: [
    { id: "c3", title: "Implement auth" },
  ]},
]}
```

**NormalizedStore**:
```typescript
{
  items: {
    "todo":  { id: "todo", fields: { title: { type: "string", value: "To Do" } }, parentId: null, childIds: ["c1", "c2"], zoneId: "kanban" },
    "doing": { id: "doing", fields: { title: { type: "string", value: "Doing" } }, parentId: null, childIds: ["c3"], zoneId: "kanban" },
    "c1":    { id: "c1", fields: { title: { type: "string", value: "Design API" } }, parentId: "todo", childIds: [], zoneId: "kanban" },
    "c2":    { id: "c2", fields: { title: { type: "string", value: "Write tests" } }, parentId: "todo", childIds: [], zoneId: "kanban" },
    "c3":    { id: "c3", fields: { title: { type: "string", value: "Implement auth" } }, parentId: "doing", childIds: [], zoneId: "kanban" },
  },
  zones: {
    "kanban": { id: "kanban", structure: "tree", rootIds: ["todo", "doing"] }
  }
}
```
**검증**: ✅ depth-1 tree. 루트=열, 자식=카드. reparent()로 카드 열 간 이동.

---

### Case 5: Form (단일 엔티티 편집)

**앱 데이터**:
```typescript
{ profile: { name: "Alice", bio: "Developer", age: 30, newsletter: true } }
```

**NormalizedStore**:
```typescript
{
  items: {
    "profile": {
      id: "profile",
      fields: {
        name: { type: "string", value: "Alice" },
        bio: { type: "string", value: "Developer" },
        age: { type: "number", value: 30 },
        newsletter: { type: "boolean", value: true },
      },
      parentId: null, childIds: [], zoneId: "profile-form"
    },
  },
  zones: {
    "profile-form": { id: "profile-form", structure: "form", rootIds: ["profile"] }
  }
}
```
**검증**: ✅ item 1개, fields=폼 필드. structure="form"이면 UI가 세로 폼 레이아웃.

---

### Case 6: Dropdown (선택 목록)

**앱 데이터**:
```typescript
{ options: [
  { id: "ko", label: "한국어" },
  { id: "en", label: "English" },
  { id: "ja", label: "日本語" },
]}
```

**NormalizedStore**:
```typescript
{
  items: {
    "ko": { id: "ko", fields: { label: { type: "string", value: "한국어" } }, parentId: null, childIds: [], zoneId: "locale-menu" },
    "en": { id: "en", fields: { label: { type: "string", value: "English" } }, parentId: null, childIds: [], zoneId: "locale-menu" },
    "ja": { id: "ja", fields: { label: { type: "string", value: "日本語" } }, parentId: null, childIds: [], zoneId: "locale-menu" },
  },
  zones: {
    "locale-menu": { id: "locale-menu", structure: "list", rootIds: ["ko", "en", "ja"] }
  }
}
```
**검증**: ✅ Flat list + OS Selection이 현재 선택을 추적. Dropdown은 Overlay(trigger) + list Zone.

---

### Case 7: Nested Zone (트리 내 인라인 Zone)

**앱 데이터**:
```typescript
// 트리 아이템 "hero"를 펼치면 내부에 properties form이 나타남
```

**NormalizedStore**:
```typescript
{
  items: {
    "hero": { id: "hero", fields: { label: { type: "string", value: "Hero" } }, parentId: null, childIds: [], zoneId: "sidebar" },
    "hero-prop": {
      id: "hero-prop",
      fields: { title: { type: "string", value: "My Title" }, visible: { type: "boolean", value: true } },
      parentId: null, childIds: [], zoneId: "hero-props"
    },
  },
  zones: {
    "sidebar": { id: "sidebar", structure: "tree", rootIds: ["hero"] },
    "hero-props": { id: "hero-props", structure: "form", rootIds: ["hero-prop"], parentItemId: "hero" },
  }
}
```
**검증**: ✅ zone.parentItemId가 포함 관계 표현. hero 아이템을 펼치면 hero-props zone이 나타남.

---

## 3. 검증 결과

| # | 구조 | 검증 | 발견된 문제 |
|---|------|:----:|------------|
| 1 | Flat List | ✅ | — |
| 2 | Tree | ✅ | — |
| 3 | Grid | ✅ | column 정렬/필터는 ZoneDef.columns 확장 필요 (🟡 미래) |
| 4 | Kanban | ✅ | reparent()로 열 간 이동 표현 가능 |
| 5 | Form | ✅ | — |
| 6 | Dropdown | ✅ | — |
| 7 | Nested Zone | ✅ | parentItemId 양방향 참조 불필요 (단방향으로 충분) |

**결론**: 7/7 케이스 모두 NormalizedStore 단일 구조로 표현 가능. FieldValue enum/color/date 확장은 T4.

---

## 4. Patch 합성

```
sidebar.from(state) → patch₁ = { items: {...}, zones: { sidebar: {...} } }
canvas.from(state)  → patch₂ = { items: {...}, zones: { canvas: {...} } }
                          │
                          ▼  OS가 merge
                  ╔═══════════════════╗
                  ║  NormalizedStore   ║  ← 단일 거대 구조
                  ╚═══════════════════╝
```

---

## 5. 미확정 잔여

- [x] ~~FieldValue에 enum/color/date~~ → T4에서 설계
- [x] ~~Grid columns 충분성~~ → 현재 충분. 정렬/필터는 미래 확장 (columns에 sort/filter 옵션 추가)
- [x] ~~Nested zone parentItemId 양방향~~ → 불필요. 단방향으로 충분
- [x] ~~7가지 케이스별 상세 검증~~ → ✅ 전수 완료
