# PRD — OS Collection: JSON CRUD Primitive

> 이 문서는 os-collection 프로젝트의 요구사항과 설계를 정의한다.
> README.md가 Why, 이 문서가 What.

## 핵심 통찰

> **JSON 자체를 CRUD + clipboard + undo/redo 가능하게 한다.**
> Collection과 Property를 분리하지 않는다. 둘 다 JSON 조작이다.

## 1. 용어 정의

| 용어 | 정의 |
|------|------|
| **Collection** | JSON array — 순서 있는 entity 목록 (`todoOrder`, `blockOrder`) |
| **Entity** | JSON object — id로 식별되는 개체 (`todos["abc"]`) |
| **Property** | Entity의 속성 — `todos["abc"].completed` |
| **Path** | JSON 경로 — `"data.todos.abc.completed"` |
| **Mutation** | Path에 대한 atomic 변경 — set, delete, move, splice |

## 2. 조작 축 (Operation Axes)

Focus 시스템과 동일하게 축 기반 opt-in.

| 축 | 조작 | Focus 대응 |
|----|------|-----------|
| **crud** | add, remove, update | — |
| **reorder** | moveUp, moveDown, moveTo | navigate |
| **clipboard** | copy, cut, paste | — |
| **history** | undo, redo | — |
| **bulk** | selectAll → bulk remove/move/toggle | select |

## 3. 데이터 모델

### Option A: JSON Path 기반

```typescript
collection: {
  entities: "data.todos",      // string path
  order: "data.todoOrder",     // string path
}
```

장점: 단순, nested 자연스러움, 런타임 동적 path 가능
단점: 타입 안전성 어려움

### Option B: Lens 기반

```typescript
collection: {
  into: (state) => ({ entities: state.data.todos, order: state.data.todoOrder }),
  from: (state, { entities, order }) => ({ ...state, data: { ...state.data, todos: entities, todoOrder: order } }),
}
```

장점: 타입 안전, 기존 TypeScript 패턴
단점: nested에서 verbose

### Option C: Hybrid — Immer produce path

```typescript
collection: {
  slice: (draft) => draft.data,  // Immer draft에서 대상 접근
  entities: "todos",             // slice 내 entity map key
  order: "todoOrder",            // slice 내 order array key
}
```

장점: Immer와 자연스러운 통합, produce() 내부에서 직접 조작
단점: 새로운 추상화

### 미결정 — T1에서 확정

## 4. App Coverage Matrix

| 앱 | Collection 구조 | CRUD | Reorder | Clipboard | History | Nested |
|----|----------------|------|---------|-----------|---------|--------|
| **Todo** | todos[] flat | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Builder** | blocks[] + fields{} | ✅ | ✅ | ✅ | ✅ | fields는 property |
| **Kanban** | columns[] → cards[] | ✅ | ✅ | ✅ | ✅ | 2-depth |

## 5. 원칙

1. **Data mutation은 1 command 안에서 atomic.** dispatch는 cross-scope side effect만.
2. **JSON path/lens가 유일한 진입점.** 앱이 직접 produce()로 entity를 삭제하지 않는다 (OS가 한다).
3. **History는 mutation에 내장.** 별도 미들웨어 등록 불필요.
4. **축은 opt-in.** 필요한 것만 선언.
5. **커널은 flat queue.** Hierarchy 불필요.

## 6. 비기능 요구사항

- 기존 `createCollectionZone` 앱은 점진적 마이그레이션 가능해야 한다.
- 타입 안전성: `as any` 없이 사용 가능해야 한다.
- 성능: undo/redo는 O(1) snapshot restore.

## 7. Unresolved Questions (→ T1)

1. **API**: JSON path vs lens vs hybrid?
2. **Nested**: parentId context는 Zone에서? FocusItem에서? props에서?
3. **Property vs Collection**: field editing은 collection 축인가, 별도 primitive인가?
4. **타입**: path 문자열의 타입 안전성 — template literal type? codegen?
5. **Migration**: `createCollectionZone`→OS collection 자동 변환 가능한가?
