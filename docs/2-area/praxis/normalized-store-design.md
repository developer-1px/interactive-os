# NormalizedStore — 보편 정규화 구조 (Design Spike)

> **원칙**: Tree, List, Grid, Form, Dropdown — 모든 구조가 **하나의 shape**으로 정규화된다.
> 각 Zone의 `from()`이 patch를 반환하고, OS가 합성하여 단일 Store를 구성한다.
> **normalize/denormalize는 앱이 작성한다.**

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
  // enum/color/date — 미확정. T4에서 설계
```

---

## 2. 이 구조가 표현하는 것

| 구조 | 표현 방법 |
|------|----------|
| **Flat List** | parentId 전부 null, rootIds가 순서 |
| **Tree** | parentId/childIds |
| **Grid** | items=행, columns=열, field=셀 |
| **Kanban** | depth-1 tree (루트=열, 자식=카드) |
| **Form** | item 1개, fields=폼 필드 |
| **Dropdown** | list + OS Selection |
| **Nested Zone** | zone.parentItemId로 item 안에 포함 |

---

## 3. Patch 합성

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

## 4. 미확정 (T2에서 탁상 검증할 것)

- [ ] FieldValue에 enum/color/date 추가 여부
- [ ] Grid의 column 정의가 충분한지 (정렬, 필터, 리사이즈)
- [ ] Nested zone의 parentItemId 양방향 참조 필요성
- [ ] 7가지 케이스별 상세 예시 데이터 검증
