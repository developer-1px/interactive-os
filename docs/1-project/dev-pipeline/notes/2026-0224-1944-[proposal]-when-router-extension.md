# `when` 라우터 확장 — Usage-First 설계

| 항목 | 내용 |
|------|------|
| **원문** | 그렇다면 그 라우터는 어떻게 생겨야할까? usage |
| **내(AI)가 추정한 의도** | 'when을 확장한다'의 구체적 API 형태를 코드 수준에서 확인하고, 현재 시스템과의 호환성을 판단하고 싶다 |
| **날짜** | 2026-02-24 |
| **상태** | 🔴 Proposal |

---

## 1. 개요

Discussion에서 도출된 결론:
- 커맨드는 단일 책임, `when`이 라우팅
- keybindings 배열이 곧 결정 테이블
- `when`을 App 조건까지 확장하면 코드 자체가 BDD 스펙

현재 `when`은 `"editing" | "navigating"` 2가지만 지원. 이걸 확장한 usage를 보여준다.

---

## 2. Usage — Before / After

### Before (현재: 콜백 안에서 분기, 원칙 위반)

```typescript
// builder/features/hierarchicalNavigation.ts
export function createDrillDown(zoneId: string) {
  return (cursor: ZoneCursor): BaseCommand | BaseCommand[] => {
    const level = getItemAttribute(zoneId, cursor.focusId, "data-level");
    if (!level) return [];
    if (level === "item") return OS_FIELD_START_EDIT();
    const childLevel = getChildLevel(level);
    if (!childLevel) return [];
    const childId = getFirstDescendantWithAttribute(zoneId, cursor.focusId, "data-level", childLevel);
    if (childId) return OS_FOCUS({ zoneId, itemId: childId });
    // grandchild fallback...
    return [];
  };
}

// builder/app.ts
export const BuilderCanvasUI = canvasCollection.bind({
  onAction: createDrillDown(CANVAS_ZONE_ID),  // ← 5갈래 분기가 여기 숨음
  keybindings: [
    { key: "\\", command: createDrillUp(CANVAS_ZONE_ID) },  // ← 또 3갈래
    { key: "Escape", command: createDrillUp(CANVAS_ZONE_ID) },
  ]
});
```

### After (제안: when이 라우팅, 커맨드는 단일 책임)

```typescript
// builder/app.ts — 바인딩 코드가 결정 테이블

export const BuilderCanvasUI = canvasCollection.bind({
  role: "grid",
  keybindings: [
    // ── Enter: DrillDown ──
    { key: "Enter", command: drillToFirstChild,   when: itemAttr("data-level", "section") },
    { key: "Enter", command: drillToFirstChild,   when: itemAttr("data-level", "group") },
    { key: "Enter", command: startFieldEdit,      when: itemAttr("data-level", "item") },

    // ── Escape / \: DrillUp ──
    { key: "Escape", command: drillToParent,      when: itemAttr("data-level", "item") },
    { key: "Escape", command: drillToParent,      when: itemAttr("data-level", "group") },
    { key: "Escape", command: forceDeselect,      when: itemAttr("data-level", "section") },
    { key: "\\",     command: drillToParent,      when: itemAttr("data-level", "item") },
    { key: "\\",     command: drillToParent,      when: itemAttr("data-level", "group") },
    { key: "\\",     command: forceDeselect,      when: itemAttr("data-level", "section") },
  ],
});

// 각 커맨드는 단일 책임:
const drillToFirstChild = zone.command("drillToFirstChild", (ctx) => {
  const childId = getFirstDescendantWithAttribute(...);
  if (!childId) return { state: ctx.state };
  return { dispatch: OS_FOCUS({ zoneId, itemId: childId }) };
});

const drillToParent = zone.command("drillToParent", (ctx) => {
  const parentId = getAncestorWithAttribute(...);
  if (!parentId) return { state: ctx.state };
  return { dispatch: OS_FOCUS({ zoneId, itemId: parentId }) };
});

const startFieldEdit = zone.command("startFieldEdit", (ctx) => ({
  dispatch: OS_FIELD_START_EDIT(),
}));

const forceDeselect = zone.command("forceDeselect", (ctx) => ({
  dispatch: OS_ESCAPE({ force: true }),
}));
```

### 읽을 때의 차이

**Before**: "Enter를 누르면 `createDrillDown`이 호출되는데, 그 안을 열어봐야 뭘 하는지 안다."

**After**: 바인딩 표를 읽으면 끝이다:

| key | when | command |
|-----|------|---------|
| Enter | `data-level=section` | drillToFirstChild |
| Enter | `data-level=group` | drillToFirstChild |
| Enter | `data-level=item` | startFieldEdit |
| Escape | `data-level=item` | drillToParent |
| Escape | `data-level=group` | drillToParent |
| Escape | `data-level=section` | forceDeselect |

**코드가 곧 결정 테이블. BDD Step 2(같은 행동, 다른 결과)가 코드에 직접 표현됨.**

---

## 3. `when` API 설계

### 3.1 기존 호환

현재 `when?: "editing" | "navigating"`은 그대로 동작해야 한다.

```typescript
// 기존 코드 그대로 작동
{ key: "Meta+Z", command: undoCommand(), when: "navigating" }
```

### 3.2 확장: 함수형 `when`

```typescript
interface KeyBinding {
  key: string;
  command: BaseCommand | ZoneCallback;
  when?: "editing" | "navigating" | WhenPredicate;
}

/** 포커스된 아이템 + 존 상태를 받아 boolean을 반환 */
type WhenPredicate = (context: WhenContext) => boolean;

interface WhenContext {
  /** 현재 포커스된 아이템의 DOM 속성을 읽는다 */
  itemAttr: (attr: string) => string | null;
  /** 현재 존 상태 */
  zoneState: ZoneState;
  /** OS 상태 */
  isEditing: boolean;
  isFieldActive: boolean;
}
```

### 3.3 편의 팩토리 (Condition Builder)

```typescript
import { itemAttr, and, not } from "@/os/when";

/** 포커스된 아이템의 data-level이 특정 값인지 */
itemAttr("data-level", "section")
// → (ctx) => ctx.itemAttr("data-level") === "section"

/** 합성 */
and(itemAttr("data-level", "item"), not("editing"))
// → (ctx) => ctx.itemAttr("data-level") === "item" && !ctx.isEditing

/** aria 속성 */
itemAttr("aria-expanded", "true")
// → (ctx) => ctx.itemAttr("aria-expanded") === "true"
```

### 3.4 resolve 로직 확장

```typescript
// keybindings.ts — resolve 수정
resolve(key: string, context: KeyResolveContext): KeyBinding | null {
  const list = bindings.get(key);
  if (!list) return null;

  for (const b of [...list].reverse()) {
    if (matchesWhen(b.when, context)) return b;
  }
  return null;
}

function matchesWhen(
  when: "editing" | "navigating" | WhenPredicate | undefined,
  context: KeyResolveContext,
): boolean {
  if (!when) return true;                          // universal
  if (when === "editing") return context.isEditing && !context.isFieldActive;
  if (when === "navigating") return !context.isFieldActive;
  if (typeof when === "function") return when(context.whenContext);
  return false;
}
```

---

## 4. Todo / 빌더 적용 비교

### Todo (변경 적음)

Todo는 App 조건 분기가 거의 없다. `onAction`, `onCheck`, `onDelete`가 각각 단일 커맨드.

```typescript
// 이미 원칙에 가깝다
onCheck: (cursor) => toggleTodo({ id: cursor.focusId }),    // 단일 책임
onAction: (cursor) => startEdit({ id: cursor.focusId }),    // 단일 책임
```

변경 필요 없음 — 이미 올바른 구조.

### 빌더 (변경 큼)

빌더는 `drillDown`과 `drillUp`이 각각 5갈래, 3갈래 분기. `when` 확장으로 해체:
- `createDrillDown` (5갈래) → 커맨드 3개 + when 3개
- `createDrillUp` (3갈래) → 커맨드 2개 + when 3개
- 총: **5개 단일 커맨드 + 9개 keybinding 행**

---

## 5. Cynefin 도메인 판정

🟡 **Complicated** — API 형태(함수형 when + 편의 팩토리)는 업계 관행(VS Code when clause, Figma key contexts). OS에서의 구현 범위(resolve 로직 수정, WhenContext 생성)를 분석하면 답이 좁혀진다.

## 6. 인식 한계

- `WhenContext.itemAttr`는 DOM 읽기가 필요 — resolve 시점에 DOM 접근이 가능한지 확인 필요 (현재 `getItemAttribute`가 이미 이 역할)
- `when` 함수의 평가 빈도: 매 키 입력마다 모든 바인딩의 `when`을 평가 → N이 클 때 성능 영향 확인 필요
- 마우스 `onAction` 콜백에서도 같은 `when` 시스템을 쓸 수 있는지 (호환성)

## 7. 열린 질문

1. **`when` 함수의 범위**: `itemAttr` (DOM 읽기)만 지원? 아니면 App 상태 읽기(`BuilderState.data.blocks`)까지?
2. **우선순위**: 같은 key에 여러 `when`이 매치하면? 마지막 등록(later-wins)? 가장 구체적인 것(specificity)?
3. **마우스 확장**: `onAction`도 `when`을 받을 수 있게 할 것인가? 아니면 키보드 전용?

---

> **한줄요약**: `when`을 함수형 predicate로 확장하고 `itemAttr()` 팩토리를 제공하면, keybindings 배열이 곧 결정 테이블이 되어 — BDD Step 2가 코드에 직접 표현되고, 콜백 안의 분기가 구조적으로 불필요해진다.
