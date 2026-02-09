# 충격선언: Zone / Item / Field / Trigger — asChild-Only로 전환?

> **날짜**: 2026-02-10  
> **상태**: ⚪ 보류 (현행 유지)  
> **영향 범위**: OS 레이어 전체 Primitive API  
> **결정**: 인지했으나 현 시점에서는 변경하지 않음. 구체적 pain point 발생 시 재검토.

## 1. 개요

Zone, Item, Field, Trigger 등 OS 레이어의 모든 Primitive 컴포넌트를 **`asChild`-only**로 전환하는 방안을 검토한다. 즉, primitive가 자체 DOM 노드(`<div>`, `<span>` 등)를 생성하지 않고, **항상 소비자가 제공한 자식 엘리먼트에 행동(behavior)과 접근성 속성만 주입**하는 구조로 변경한다.

### 현재 상태

| Primitive | 현재 DOM 생성 | `asChild` 지원 |
|-----------|-------------|---------------|
| `Zone` (→ `FocusGroup`) | `<div>` 항상 생성 | ❌ 미지원 |
| `Item` (→ `FocusItem`) | `<div>` 기본, `asChild` 선택 | ✅ 선택적 |
| `Field` | `<span>` 기본 (`as` prop으로 변경 가능) | ❌ 미지원 |
| `Trigger` | `<button>` 기본, `asChild` 선택 | ✅ 선택적 |

### 제안

**모든 primitive에서 자체 DOM 생성을 제거하고, `asChild` 패턴만 허용한다.**

```tsx
// Before: Zone이 wrapper <div>를 생성
<Zone role="listbox">
  <ul className="my-list">
    <Item id="a"><li>Apple</li></Item>
  </ul>
</Zone>

// After: Zone은 DOM을 만들지 않고 행동만 부여
<Zone role="listbox" asChild>
  <ul className="my-list">
    <Item id="a" asChild>
      <li>Apple</li>
    </Item>
  </ul>
</Zone>
```

---

## 2. 왜 이 생각을 했는가?

### 근본 원칙: OS는 DOM을 소유하면 안 된다

프로젝트의 레이어 구조에서:

```
Kernel (상태 + 커맨드) → OS (포커스 + 키보드 + 네비게이션) → App (UI 렌더링)
```

OS 레이어의 역할은 **행동(behavior)과 접근성(accessibility)**이다. DOM 구조와 시각적 표현은 App 레이어의 관심사다. OS가 `<div>`를 찍는 순간 **App의 레이아웃에 침범**하게 된다.

### Headless UI 패러다임의 자연스러운 귀결

Radix UI가 `asChild`를 도입한 이유와 동일하다:
- **"나는 행동과 접근성을 제공한다. DOM 구조와 스타일링은 소비자가 한다."**
- Zone/Item/Trigger는 이 정의에 정확히 부합하는 headless primitive이다.

### Wrapper Hell 제거

현재 구조에서 Zone → div, Item → div가 중첩되면 불필요한 wrapper 노드가 쌓인다. 이는 CSS 레이아웃을 방해하고, DOM 트리를 비대하게 만든다.

---

## 3. 레드팀 🔴 vs 블루팀 🔵

### 🔵 블루팀 (찬성: asChild-only로 가야 한다)

**B1. 관심사 분리 원칙에 충실**

OS primitive는 "행동 주입기"다. `data-focus-item`, `aria-selected`, `tabIndex`, `role` 같은 속성을 자식에게 부여하는 게 전부다. 이런 컴포넌트가 `<div>`를 만들 이유가 없다.

**B2. 시맨틱 HTML 완전 제어**

`asChild`-only면 소비자가 `<ul>/<li>`, `<nav>/<a>`, `<table>/<tr>` 등 올바른 시맨틱 HTML을 자유롭게 선택할 수 있다. 현재는 Zone이 `<div>`를 강제해서 `<ul>` 안에 `<div>`가 끼는 등의 문제가 발생할 수 있다.

**B3. CSS 레이아웃 충돌 제거**

Flexbox/Grid 레이아웃에서 중간에 의미 없는 wrapper `<div>`가 끼면 `gap`, `align-items` 등이 깨진다. `asChild`로 wrapper를 없애면 CSS가 자연스럽게 동작한다.

**B4. API 단순화**

`as` prop, `asChild` prop, 기본 태그 — 세 가지 경로를 하나(asChild-only)로 통일하면 API surface가 줄어들고, 사용자가 고민할 게 없어진다.

**B5. Radix, Ark UI 등 검증된 패턴**

이미 업계에서 검증된 접근이다. Radix의 모든 primitive가 이 방식으로 동작하며, 커뮤니티에서 높은 만족도를 보인다.

---

### 🔴 레드팀 (반대: 일부 또는 전체를 DOM-generating으로 유지해야 한다)

**R1. Zone은 Container Ref가 필수**

`FocusGroup`은 `containerRef`를 통해 `FocusData.set()`으로 WeakMap에 그룹 메타데이터를 등록한다. 이 ref는 **그룹의 물리적 DOM 경계**를 정의하는 역할을 한다. `asChild`로 전환하면 소비자의 자식 엘리먼트가 이 역할을 떠안게 되는데, 이게 항상 올바른 경계인지 보장할 수 있는가?

```tsx
// 소비자가 fragment나 조건부 렌더링을 쓰면?
<Zone asChild>
  <>  {/* Fragment는 ref를 받을 수 없다 */}
    <Item id="a">...</Item>
  </>
</Zone>
```

**R2. Field의 contentEditable 결합**

Field는 단순 속성 주입이 아니다:
- `contentEditable` 상태 토글
- `innerRef.current.innerText` 직접 조작
- 커서 위치 복원 (`cursorRef`)
- placeholder를 `::before` pseudo-element로 구현
- `useFieldFocus`를 통한 DOM focus 관리

이 모든 것이 **특정 DOM 노드의 내부 상태에 깊게 결합**되어 있다. `asChild`로 외부 엘리먼트에 위임하면, 소비자가 이 계약을 위반할 리스크가 크다 (예: children으로 React 컴포넌트를 넣거나, contentEditable과 충돌하는 이벤트 핸들러를 붙이거나).

**R3. 편의성 vs 순수성 트레이드오프**

`asChild`-only는 **매번 DOM 엘리먼트를 명시적으로 제공**해야 한다. 간단한 프로토타이핑이나 빠른 개발에서 boilerplate가 늘어난다:

```tsx
// asChild-only: 매번 태그를 써야 함
<Zone role="list" asChild>
  <div>
    <Item id="a" asChild><div>Apple</div></Item>
    <Item id="b" asChild><div>Banana</div></Item>
  </div>
</Zone>

// 기본 DOM 생성: 더 간결
<Zone role="list">
  <Item id="a">Apple</Item>
  <Item id="b">Banana</Item>
</Zone>
```

**R4. Auto-focus, Scroll 등 DOM 의존 로직**

`FocusGroup`은 `containerRef`로 `querySelector("[data-focus-item]")`을 호출해 auto-focus를 구현한다. `FocusItem`은 `internalRef`로 `.focus({ preventScroll: true })`를 호출한다. 이런 로직들이 `asChild` 패턴에서도 안전하게 동작하려면 ref 합성(composeRefs)이 완벽해야 한다.

**R5. 마이그레이션 비용**

현재 모든 소비자 코드가 Zone/Item의 기본 DOM에 의존하고 있다. `asChild`-only로 전환하면 **모든 사용처를 수정**해야 한다. 점진적 마이그레이션 전략이 필요하다.

---

## 4. 합의 가능한 중간안

| Primitive | 제안 | 근거 |
|-----------|------|------|
| **Zone** | `asChild` 기본, fallback `<div>` 유지 | containerRef가 필수이므로 fallback이 안전망 역할 |
| **Item** | `asChild`-only | 순수 상태 바인딩, 소비자가 태그를 결정해야 함 |
| **Trigger** | `asChild`-only | 순수 click→dispatch, `<button>` 강제는 불필요 |
| **Field** | `asChild` 불가, `as` prop 유지 | contentEditable 결합이 너무 深해서 외부 위임이 위험 |

> [!WARNING]
> Field는 `contentEditable`과의 긴밀한 결합 때문에 `asChild` 패턴이 적합하지 않을 수 있다. ref를 통한 직접 DOM 조작(innerText, cursor position)이 필수적이며, 이를 소비자에게 위임하면 예측 불가능한 버그가 발생할 수 있다.

---

## 5. 결론

**핵심 질문**: "이 primitive가 DOM 구조에 대한 의견(opinion)을 가져야 하는가?"

- **Zone, Item, Trigger** → 아니다. 이들은 행동만 제공하면 된다. → **`asChild`-only (또는 기본)**
- **Field** → 그렇다. contentEditable이라는 DOM 고유 메커니즘에 결합되어 있다. → **`as` prop으로 태그만 변경 가능하게 유지**

이 결정은 "OS 레이어는 DOM을 소유하지 않는다"는 아키텍처 원칙의 직접적인 적용이며, Field만이 예외적으로 DOM 소유가 정당화되는 케이스다.
