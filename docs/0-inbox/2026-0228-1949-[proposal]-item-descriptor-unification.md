# Item Descriptor 단일화 — N개 Getter에서 1개 파이프라인으로

| 항목 | 내용 |
|------|------|
| 원문 | `getExpandableItems: () => expandableIds` 이 형태가 아니라 데이터는 도구 단일 정규화 방식을 쓰기로 했는데? |
| 내(AI)가 추정한 의도 | **경위**: Accordion 패턴 구현 중 `getExpandableItems`, `getTreeLevels` 등 아이템 메타데이터를 N개 별도 getter로 제공하는 패턴에 위화감 발생. |
| | **표면**: `getExpandableItems: () => expandableIds`는 우리가 합의한 데이터 정규화 방식이 아니다. |
| | **의도**: ZIFT가 Zone/Item/Focus/Tab을 단일 모델로 통합했듯, 아이템 메타데이터도 직교하는 최소 축으로 통합하여 모든 패턴에서 동일 방식으로 아이템을 기술하고 싶다. |
| 날짜 | 2026-02-28 |
| 상태 | 📥 Inbox |

---

## 1. 개요 (Overview)

현재 OS는 아이템이 **어떤 것인지**(메타데이터)를 기술하기 위해 N개의 독립된 getter를 사용한다:

```typescript
// 현재: N개 getter — 각각 다른 타입, 다른 시점에 추가됨
getItems():           string[]             // 목록 + 순서
getExpandableItems(): Set<string>          // 확장 가능 여부
getTreeLevels():      Map<string, number>  // 트리 깊이
getLabels():          Map<string, string>  // 타이프어헤드 라벨
itemFilter():         (id: string) => bool // disabled 필터
```

이것은 **"상황별 콜백 추가"** 패턴이다. 새로운 아이템 속성이 필요할 때마다 새 getter가 Zone에 추가된다. ZIFT의 철학("직교하는 최소 축으로 모든 것을 표현")에 반한다.

---

## 2. 분석 (Analysis)

### 2.1 현재 방식(N-Getter)의 문제점

```
Zone에 연결된 getter 수: 5개 (getItems, getExpandableItems, getTreeLevels, getLabels, itemFilter)
각 getter의 반환 타입: 전부 다름 (string[], Set<string>, Map<string, number>, ...)
```

| 문제 | 설명 |
|------|------|
| **비정규화** | 같은 아이템(`acc-personal`)에 대한 정보가 5곳에 분산. id로 join해야 함 |
| **타입 불일치** | `string[]` vs `Set<string>` vs `Map<string, number>` — 통일된 자료구조 없음 |
| **과잉선언** | accordion의 모든 아이템은 expandable인데 매번 `getExpandableItems`를 수동 선언 |
| **확장 비용** | 새 속성(예: `draggable`, `groupId`) 추가 시 getter + Zone prop + Registry 필드 + bind.ts 전달 = 4곳 수정 |

### 2.2 두 가지 대안 비교

#### 방안 A: Role-Derived Defaults (역할 기반 기본값)

```typescript
// role이 기본값을 제공. getExpandableItems 불필요.
accordionZone.bind({
  role: "accordion",
  // accordion → 모든 아이템 expandable (기본)
  // tree → children이 있는 아이템 expandable (기본)
  // listbox → expandable 없음 (기본)
});
```

- **장점**: 선언량 최소. Pit of Success.
- **한계**: 기본값과 다른 경우(일부만 expandable) 여전히 override 필요. 근본 해결이 아님.

#### 방안 B: Item Descriptor (단일 정규화)

```typescript
// 아이템 메타데이터를 하나의 정규화된 구조로 기술
interface ItemDescriptor {
  id: string;
  expandable?: boolean;  // 기본: role에서 파생
  level?: number;        // 트리 깊이
  label?: string;        // 타이프어헤드 라벨
  disabled?: boolean;    // 상호작용 불가
  // 향후: draggable?, groupId?, ...
}

accordionZone.bind({
  role: "accordion",
  items: (state) => [
    { id: "acc-personal", label: "Personal Information" },
    { id: "acc-billing", label: "Billing Address" },
    { id: "acc-shipping", label: "Shipping Address" },
  ],
});
```

- **장점**: 단일 자료구조. N개 getter → 1개 accessor. 새 속성 추가 = interface에 필드 추가만.
- **한계**: 기존 5개 getter와의 호환성 설계 필요. 마이그레이션 비용.

### 2.3 직교 축 발견 — Item Descriptor의 최소 축

N개 getter를 분석하면, 아이템에 대해 OS가 알아야 하는 것은 **3개 축**으로 수렴한다:

```
Axis 1: Enumeration  — 뭐가 있고, 순서는? (getItems)
Axis 2: Capability    — 뭘 할 수 있나?     (expandable, draggable, disabled)
Axis 3: Topology      — 구조적 위치는?      (level, groupId, parentId)
```

현재 getter 매핑:

| 현재 Getter | 축 | ItemDescriptor 필드 |
|-------------|-----|---------------------|
| `getItems()` | Enumeration | `id` (순서 = 배열 순서) |
| `getExpandableItems()` | Capability | `expandable: boolean` |
| `itemFilter()` | Capability | `disabled: boolean` |
| `getTreeLevels()` | Topology | `level: number` |
| `getLabels()` | (보조) | `label: string` |

이 3개 축을 하나의 `ItemDescriptor[]`로 통합하면:

```typescript
// Before: 5 getters, 5 types
getItems():           string[]
getExpandableItems(): Set<string>
getTreeLevels():      Map<string, number>
getLabels():          Map<string, string>
itemFilter():         (id: string) => boolean

// After: 1 accessor, 1 type
items: ItemDescriptor[]
// → id + 순서 = Enumeration
// → expandable + disabled = Capability
// → level = Topology
// → label = 보조
```

### 2.4 Role이 제공하는 기본값 (Pit of Success)

`ItemDescriptor`의 많은 필드는 role에서 **파생 가능**하다:

| Role | expandable 기본값 | level 기본값 | label 기본값 |
|------|-------------------|-------------|-------------|
| `accordion` | **모든 아이템 true** | 불필요 | `textContent` |
| `tree` | **children 있으면 true** | hierarchy에서 파생 | `textContent` |
| `listbox` | false | 불필요 | `textContent` |
| `toolbar` | false | 불필요 | `textContent` |
| `menu` | **submenu 있으면 true** | hierarchy에서 파생 | `textContent` |

따라서 accordion에서는:

```typescript
// 완전체 (role이 기본값 제공)
accordionZone.bind({
  role: "accordion",
  items: (state) => [
    { id: "acc-personal" },  // expandable: true (accordion 기본)
    { id: "acc-billing" },
    { id: "acc-shipping" },
  ],
});

// 최소체 (정적이면 items도 Zone children에서 스캔 = 현재 동작)
accordionZone.bind({ role: "accordion" });
```

---

## 3. 결론 / 제안 (Proposal)

### 단기 (이번 세션에서 적용 가능)

**방안 A: accordion role의 기본값만 추가.**

```typescript
// roleRegistry.ts
accordion: {
  navigate: { orientation: "vertical", loop: false },
  activate: { mode: "manual", onClick: true },
  expand: { allItems: true },  // ← NEW: 모든 아이템 expandable
  tab: { behavior: "escape" },
},
```

`getExpandableItems`가 없고 role이 `accordion`이면, OS가 자동으로 모든 아이템을 expandable로 처리.
이것만으로 AccordionPattern에서 `getExpandableItems: () => expandableIds` 제거 가능.

### 중기 (별도 프로젝트)

**방안 B: ItemDescriptor 도입.**

```
Phase 1: ItemDescriptor 타입 정의 + computeItem에서 descriptor 읽기
Phase 2: getExpandableItems / getTreeLevels → items accessor로 대체
Phase 3: 기존 getter 호환 레이어 → deprecated → 삭제
```

이것은 OS core 변경이므로 별도 프로젝트로 진행해야 한다.

### 아키텍처 비전

```
Before (현재):
  App → getItems()           ─┐
  App → getExpandableItems() ─┤→ ZoneRegistry → computeItem()
  App → getTreeLevels()      ─┤
  App → getLabels()          ─┤
  App → itemFilter()         ─┘

After (ItemDescriptor):
  App → items: ItemDescriptor[] → ZoneRegistry → computeItem()
        └── role defaults auto-fill missing fields
```

**N:1 통합. 5개 독립 파이프라인 → 1개 정규화 파이프라인.**

---

## 4. Cynefin 도메인 판정

**🟡 Complicated** — 분석하면 답이 좁혀진다.

- 이미 `fromEntities`라는 정규화 선례가 존재한다.
- `ItemDescriptor` 타입 설계는 기존 getter들의 union이므로 분석적으로 도출 가능하다.
- 마이그레이션 경로도 점진적으로 설계할 수 있다 (호환 레이어 → deprecated → 삭제).
- 단, "role이 제공하는 기본값"의 범위(어디까지 자동화할 것인가)는 의사결정이 필요하다.

---

## 5. 인식 한계 (Epistemic Status)

- `getLabels()`의 실제 사용 빈도와 의존성은 정밀 조사하지 않았다. DOM에서 스캔하는 경우와 push하는 경우의 비율이 불명확.
- `itemFilter`가 disabled 외 다른 용도로 사용되는지 전수 조사하지 않았다.
- ItemDescriptor 도입 시 성능 영향(매 렌더마다 descriptor 배열 재생성)은 측정하지 않았다. useMemo/shallow compare 전략이 필요할 수 있다.
- Tree의 경우 hierarchy 정보를 ItemDescriptor 안에 넣을지 별도 축으로 유지할지 미결정.

---

## 6. 열린 질문 (Complex Questions)

1. **ItemDescriptor를 별도 프로젝트로 진행할 것인가, 아니면 단기(role 기본값)로 충분한가?**
   - 규모: core 변경 + 전 앱 마이그레이션. 예상 4~6 task.

2. **Tree의 hierarchy 정보는 ItemDescriptor에 포함할 것인가, 아니면 별도 축(topology)으로 유지할 것인가?**
   - `level`을 descriptor에 넣으면 flat list와 tree가 같은 인터페이스. 하지만 tree는 parent-child 관계도 필요.

3. **정적 데이터(accordion showcase)에서는 items accessor가 상태를 읽을 필요가 없다. `items: ItemDescriptor[]` (상수)와 `items: (state) => ItemDescriptor[]` (함수) 둘 다 허용할 것인가?**
   - 둘 다 허용하면 유연하지만 타입이 복잡해진다. 함수만 허용하면 상수도 `() => [...]` 래핑.

---

> **3줄 요약:**
> 현재 아이템 메타데이터는 5개 getter(`getItems`, `getExpandableItems`, `getTreeLevels`, `getLabels`, `itemFilter`)로 비정규화되어 있다.
> 직교 축 분석 결과 Enumeration / Capability / Topology 3축으로 수렴하며, `ItemDescriptor[]` 단일 파이프라인으로 통합 가능하다.
> 단기: accordion role에 `allItems: expandable` 기본값 추가. 중기: ItemDescriptor 프로젝트로 N-getter → 1-accessor 마이그레이션.
