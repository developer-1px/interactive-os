# Discussion: OS API Surface — 자동 처리, 네이밍, 발견 가능성

## Journey

**🧑 사용자**: (SectionSidebar 리뷰) 이런 걸 꼭 써야 해? `kernel.useComputed`, `useCallback`, `kernel.dispatch`... 그냥 aria만 적으면 되도록 해야 되는 거 아냐?

**🤖 AI**: 맞습니다. 현재 앱이 4가지를 직접 하고 있는데 (상태 읽기, dispatch, 렌더링 분기, 키바인딩), OS가 `role="tree"` + `aria-expanded` 선언만 보고 자동 처리해야 합니다.

---

**🧑 사용자**: React Primitives가 반드시 필요해? `defineApp`에서 하기엔 너무 작은 단위 같은데.

**🤖 AI**: defineApp은 앱 레벨, expand는 Zone/Item 레벨. 세 가지 옵션: (A) Zone이 role 보고 자동, (B) defineApp 선언, (C) DOM에서 직접. B는 너무 작은 단위.

---

**🧑 사용자**: chevron이 꼭 React일 필요 있어? CSS로 충분하지 않아?

**🤖 AI**: CSS `[aria-expanded]::before { content: "▶" }` + `rotate(90deg)`로 대부분 커버 가능. SVG 아이콘이 필요할 때만 React.

**🧑 사용자**: React로 하려면 값을 가져오는 방법이 필요한 거지?

**🤖 AI**: 네. 훅(`useFocusExpansion`) 또는 Item render prop. 하지만 CSS면 값 가져올 필요 자체가 없음.

---

**🧑 사용자**: `useFocusExpansion`이 이미 있는데 왜 안 썼어?

**🤖 AI**: 제가 몰랐습니다. OS 훅을 탐색하지 않고 바로 로우레벨로 작성했습니다.

**🧑 사용자**: 네이밍이 OS에서 제공한다는 느낌이 전혀 없다.

**🤖 AI**: `useFocusExpansion`은 커스텀 훅처럼 보임. `kernel.useExpansion()` 또는 `os.useExpansion()`이어야 발견 가능.

---

**🧑 사용자**: kernel은 커널이지 OS가 아니잖아. 이 kernel은 OS인가?

**🤖 AI**: 앱 입장에서 `kernel`은 OS의 전체 인터페이스. 전통적 커널(내부 구현)이 아니라 시스템 콜 API에 해당. `os` 또는 `OS`가 더 정확한 이름.

**🧑 사용자**: API 명세 및 네이밍 건 전부 묶어서 함께 다루자.

> **한 줄 요약**: OS가 제공하는 API는 이름·경로·자동화 수준 모두에서 "OS가 해주는 것"임이 명확해야 하며, 앱은 ARIA 선언만으로 충분해야 한다.

---

## Conclusion

### Why (근본 문제)
앱 개발자(= AI 포함)가 OS 제공 기능을 발견하지 못하고 바퀴를 다시 만든다. 원인은 네이밍, 접근 경로, 자동화 수준 세 가지.

### Intent
OS API Surface를 **선언적(ARIA 기반) + 발견 가능(명확한 네이밍) + 자동(수동 코드 최소화)**으로 정비한다.

### Warrants

| # | Warrant |
|---|---------|
| W1 | 앱은 Passive Projection — handler/useState를 직접 작성하지 않는다 |
| W2 | ARIA role은 이미 인터랙션 계약이다 — `role="tree"` + `aria-expanded`는 충분한 선언 |
| W3 | OS는 이미 ARIA role 기반으로 동작한다 — Navigate, Select 등이 role을 봄 |
| W4 | 기존 OS 훅(`useFocusExpansion`)이 발견 불가능한 이름·경로에 숨어 있다 |
| W5 | `kernel`이라는 이름은 "내부 구현"처럼 들려서 앱 개발자가 직접 사용을 주저하게 만든다 |
| W6 | CSS `[aria-expanded]`로 대부분의 비주얼 분기를 처리할 수 있다 — React 불필요 |
| W7 | `defineApp`은 앱 레벨 관심사, expand는 Zone/Item 레벨 — 레이어 불일치 |

### 액션 항목

#### 1. 자동 처리 (Expand as example)
- Navigate가 `role="tree"` 인식 → ArrowLeft=collapse, ArrowRight=expand 자동
- Zone이 tree item 클릭 시 자동 EXPAND dispatch
- Item이 `aria-expanded` 속성을 DOM에 자동 주입
- CSS 기본 indicator (`[aria-expanded]::before`) 제공

#### 2. API 네이밍
- `kernel` → `os` (또는 `OS`) 변수명 검토
- `useFocusExpansion` → `os.useExpansion()` 또는 유사한 발견 가능한 이름
- OS 훅/유틸의 import 경로 정규화

#### 3. 발견 가능성
- OS가 제공하는 모든 API를 하나의 네임스페이스(`os.*`)로 통합
- 앱 개발자가 "expand 하고 싶다" → `os.` 타이핑 → 자동완성으로 발견
