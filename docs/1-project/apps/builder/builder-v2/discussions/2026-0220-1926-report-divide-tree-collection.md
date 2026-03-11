# Divide Report: Collection v2 → Tree Collection

> Date: 2026-02-20T19:26
> Domain: **Complex** — 정답이 없고, 기존 인프라 전체에 영향
> Trigger: Tab Container에서 children 삽입이 불가능한 문제

---

## 1. 현재 상태 (As-Is)

`createCollectionZone`은 **flat list or entity+order**만 지원:

```typescript
interface ItemOps<S, T> {
  getItems: (state: S) => T[];        // 1차원 배열 반환
  removeItem: (draft, id) => void;    // flat remove
  swapItems: (draft, idA, idB);       // flat swap
  insertAfter: (draft, index, item);  // flat insert
}
```

**모든 연산이 형제(sibling) 레벨에서만 동작**. 트리 탐색(findInTree), 부모-자식 관계(insertChild), accept 검증 없음.

### 두 가지 data shape adapter

| Adapter | 대상 | 방식 |
|---------|------|------|
| `accessor` | `T[]` (Builder) | 배열 직접 splice |
| `fromEntities` | `Record<id, T>` + `order[]` (Todo) | entity map + order array |

둘 다 flat. 트리 불가.

---

## 2. 목표 상태 (To-Be)

**어떤 JSON이든** normalize해서 트리 Collection으로 관리.

```
App Data (any shape)
    ↓  [from: normalize at mount]
Internal Tree (nodes + parent-child)
    ↓  [tree operations: insert, move, remove, paste + accept]
Updated Tree
    ↓  [to: denormalize on read]
App Data (original shape)
```

---

## 3. 분해

### Gap 1: TreeOps — 트리 mutation 인터페이스 ⭐ Core

**Cynefin: Complicated** — Slate.js에 선례가 있고, 분석하면 답이 좁혀짐.

현재 `ItemOps`를 확장하거나 대체:

```typescript
interface TreeOps<S, T extends { id: string }> {
  // === 기존 flat ops (호환) ===
  getItems: (state: S) => T[];           // root-level items
  
  // === 신규 tree ops ===
  findNode: (state: S, id: string) => T | undefined;         // 트리 전체 탐색
  getParent: (state: S, id: string) => T | undefined;        // 부모 찾기
  getChildren: (state: S, parentId: string) => T[];           // 자식 목록
  getAccept: (state: S, id: string) => string[] | undefined;  // accept 제약
  
  // === mutations ===
  removeNode: (draft: S, id: string) => void;                 // cascade children
  insertChild: (draft: S, parentId: string, item: T, afterId?: string) => void;
  insertSibling: (draft: S, siblingId: string, item: T) => void; // = 기존 insertAfter
  moveNode: (draft: S, nodeId: string, newParentId: string, afterId?: string) => void;
}
```

**가장 작은 probe**: `findNode`, `insertChild`, `removeNode` 3개만 먼저 구현.

---

### Gap 2: Accept 검증 — paste/insert 시 타입 제약

**Cynefin: Complicated** — 규칙이 명확 (accept 배열에 type이 있는지 검사).

```typescript
function canAccept(parent: Block, child: Block): boolean {
  if (!parent.accept) return true;  // accept 없으면 제약 없음
  return parent.accept.includes(child.type);
}
```

Paste 로직에서:
1. `target = findNode(focusId)`
2. `if (canAccept(target, clipboardItem))` → `insertChild(target.id, item)`
3. `else` → `insertSibling(target.id, item)` (현행)

---

### Gap 3: Adapter Facade — from/to transform

**Cynefin: Complex** — 범용 인터페이스 설계. 다양한 app 데이터 형태를 어떻게 추상화할지.

```typescript
interface TreeCollectionConfig<S, T> {
  from: (state: S) => T[];                    // nested tree 반환
  to: (tree: T[], draft: S) => void;          // tree → state 반영
  id: (node: T) => string;
  type: (node: T) => string;
  children: (node: T) => T[];
  accept?: (node: T) => string[] | undefined;
  text?: (node: T) => string;
}
```

**이건 나중**. Gap 1, 2가 해결되면 facade는 자연스럽게 결정됨.

---

### Gap 4: 기존 API 호환 — 마이그레이션

**Cynefin: Clear** — 기존 `createCollectionZone`은 TreeOps의 특수 케이스 (depth=1 tree).

- `accessor` config → `from: (s) => accessor(s)` + `children: () => []`
- `fromEntities` config → 동일 패턴
- 기존 테스트 전부 통과해야 함

---

## 4. 실행 순서

```
Gap 1 (TreeOps)        ← Complicated, probe 가능
  ↓
Gap 2 (Accept 검증)    ← Complicated, Gap 1 위에 올라감
  ↓
Gap 4 (호환)           ← Clear, 기존 테스트로 증명
  ↓
Gap 3 (Adapter facade) ← Complex, Gap 1-2-4 경험 후 결정
```

### 최소 probe (Gap 1 검증)

파일: `createCollectionZone.ts`에 `TreeOps` 추가 + Builder tab container에서 `insertChild` 한 번 동작시키기.

- 입력: `paste(targetId)` when target = tab node
- 기대: clipboard의 section이 tab.children에 추가됨
- 검증: 단위 테스트

---

## 5. 남은 질문 (사용자에게)

1. **Gap 1 probe부터 시작해도 되나?** TreeOps를 기존 `createCollectionZone.ts`에 추가하는 방식 vs 새 파일로 분리?
2. **Gap 3 (from/to facade)는 Gap 1-2 결과 보고 결정?** 아니면 지금 인터페이스부터 확정?
