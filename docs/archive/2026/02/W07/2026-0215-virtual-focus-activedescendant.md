---
last-reviewed: 2026-02-15
---

# Virtual Focus와 `aria-activedescendant`: 두 세계의 포커스

> DOM focus는 하나지만, 사용자가 인지하는 focus는 두 개일 수 있다.

## 왜 이 주제인가

BOARD.md의 **T5: QuickPick** 구현이 바로 앞에 놓여 있다. QuickPick의 핵심은 Combobox 패턴 — 사용자가 input에 타이핑하면서 동시에 popup listbox의 항목을 방향키로 탐색하는 패턴이다.

이 패턴의 기술적 핵심이 바로 `aria-activedescendant`다. 우리 OS에는 이미 `virtualFocus: true` 설정이 combobox role preset에 포함되어 있고, `FOCUS` 커맨드에서 `isVirtual`일 때 DOM focus effect를 억제하는 코드가 작성되어 있다. 하지만 이것은 아직 **반쪽짜리 구현**이다:

- `NAVIGATE` 커맨드의 virtualFocus 분기가 `.skip`된 채로 남아 있다
- `aria-activedescendant` 속성을 실제로 DOM에 투영하는 로직이 없다
- Combobox의 popup ↔ input 사이의 focus 전이 모델이 정의되지 않았다

T5 구현 전에 **Virtual Focus가 정확히 무엇이고, 어떤 함정이 있으며, 우리 OS에서 어떻게 구현해야 하는지** 정리해두지 않으면, 구현 중에 접근성 버그가 숨어든다.

---

## Background / Context

### 포커스는 원래 하나다

웹 브라우저에서 "포커스"는 **딱 하나의 DOM 요소**만 가질 수 있는 전역 상태다. `document.activeElement`가 항상 정확히 하나의 요소를 가리킨다는 것이 이 제약의 핵심이다.

```
┌───────────────────────────────────────┐
│ Document                              │
│   ┌─────────┐  ┌─────────┐          │
│   │ Button  │  │ Input   │ ← focus  │
│   └─────────┘  └─────────┘          │
│                                       │
│   → document.activeElement === Input  │
└───────────────────────────────────────┘
```

이 모델은 대부분의 UI에서 잘 작동한다. 하지만 **Combobox**에서 무너진다.

### Combobox의 딜레마

Combobox에서 사용자는 동시에 두 가지를 한다:

1. **Input에 타이핑** — DOM focus가 input에 있어야 함 (커서, 입력 이벤트)
2. **Listbox 항목을 방향키로 탐색** — focus가 option에 있어야 함 (스크린 리더 안내)

DOM focus를 listbox option으로 옮기면? **Input 커서가 사라지고, 타이핑이 불가능해진다.** DOM focus를 input에 두면? **스크린 리더가 현재 하이라이트된 option을 알 수 없다.**

바로 이 딜레마를 해결하기 위해 `aria-activedescendant`가 탄생했다.

---

## Core Concept

### `aria-activedescendant`의 정의

W3C ARIA 스펙의 정의:

> `aria-activedescendant` identifies the currently active element when DOM focus is on a composite widget, combobox, textbox, group, or application.

이 속성은 **"DOM focus는 여기 있지만, 논리적으로 활성화된 자식은 저기야"** 라고 보조기술에 알려주는 역할을 한다.

```html
<!-- DOM focus는 input에 있음 -->
<input role="combobox"
       aria-controls="listbox-1"
       aria-activedescendant="option-3" />

<!-- popup listbox -->
<ul role="listbox" id="listbox-1">
  <li role="option" id="option-1">Apple</li>
  <li role="option" id="option-2">Banana</li>
  <li role="option" id="option-3" aria-selected="true">Cherry</li>
  <!--                              ↑ 시각적으로도 하이라이트됨 -->
</ul>
```

스크린 리더는 `aria-activedescendant="option-3"`을 읽고 "Cherry"를 안내한다. 하지만 실제 DOM focus는 `<input>`에 머물러 있으므로, 사용자는 계속 타이핑할 수 있다.

### 두 종류의 "Focus"

이 패턴에서 **focus라는 단어가 두 가지 의미**로 사용된다:

| 구분 | DOM Focus | Virtual Focus |
|------|-----------|---------------|
| **메커니즘** | `document.activeElement` | `aria-activedescendant` |
| **이동 방법** | `element.focus()` 호출 | 속성 값 변경 (JS) |
| **브라우저 관여** | 스크롤, 포커스 링, 이벤트 발생 | 아무것도 하지 않음 |
| **스크린 리더** | 자동으로 요소를 안내 | `aria-activedescendant` 읽어서 안내 |
| **시각적 표시** | 브라우저 기본 (`:focus`) | **개발자가 직접 구현** (`:focus-visible` 아님!) |
| **스크롤** | 자동 (`scrollIntoView`) | **개발자가 직접 구현** |

핵심 인사이트: **Virtual Focus에서는 브라우저가 아무것도 자동으로 해주지 않는다.** 하이라이트 스타일, 스크롤, 스크린 리더 안내 — 모두 개발자의 책임이다.

### Roving Tabindex vs. `aria-activedescendant`

우리 OS에는 두 가지 포커스 관리 전략이 공존한다:

```
┌─────────────────────────────────────────────────────┐
│ Roving Tabindex (기본값, virtualFocus: false)        │
│                                                      │
│ ↓ key → tabindex="0" 이동 → element.focus() 호출    │
│         → 브라우저가 스크롤 + 포커스 링 + SR 안내    │
│                                                      │
│ 사용처: listbox, tree, menu, toolbar, grid, tabs     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ aria-activedescendant (virtualFocus: true)            │
│                                                      │
│ ↓ key → state 업데이트 → aria-activedescendant 변경  │
│         → 개발자가 스크롤 + 하이라이트 + SR 알림      │
│                                                      │
│ 사용처: combobox popup                               │
└─────────────────────────────────────────────────────┘
```

**언제 어떤 것을 선택하는가?**

| 질문 | Roving | Virtual |
|------|--------|---------|
| DOM focus가 다른 요소에 남아야 하는가? | ❌ | ✅ |
| 사용자가 동시에 타이핑하는가? | ❌ | ✅ |
| 브라우저의 자동 포커스 관리가 필요한가? | ✅ | ❌ |
| 단독 위젯인가? | ✅ | ❌ (항상 쌍으로 존재) |

경험칙: **input과 popup이 쌍을 이루는 패턴이면 Virtual, 아니면 Roving.**

---

## Usage

### W3C APG Combobox의 ARIA 속성 전체

```html
<!-- ① Input (DOM focus 유지) -->
<input
  role="combobox"
  aria-expanded="true"           <!-- popup 열림 상태 -->
  aria-controls="listbox-1"      <!-- popup 요소 참조 -->
  aria-haspopup="listbox"        <!-- popup 유형 (listbox가 기본값) -->
  aria-activedescendant="opt-2"  <!-- 현재 활성 option id -->
  aria-autocomplete="list"       <!-- 자동완성 유형 -->
/>

<!-- ② Popup (DOM focus 없음) -->
<ul role="listbox" id="listbox-1">
  <li role="option" id="opt-1">Command A</li>
  <li role="option" id="opt-2" aria-selected="true">
    Command B  <!-- 현재 활성 -->
  </li>
  <li role="option" id="opt-3">Command C</li>
</ul>
```

### 키보드 인터랙션 테이블 (APG 정의)

**Input에 DOM focus가 있을 때:**

| 키 | 동작 |
|----|------|
| `↓` | Popup 열기 + 첫 항목(또는 자동선택 다음 항목)으로 virtual focus 이동 |
| `↑` | (선택적) Popup 열기 + 마지막 항목으로 virtual focus 이동 |
| `Escape` | Popup 닫기. 선택적으로 input 내용도 지움 |
| `Enter` | 선택된 항목 확정 → input 값 갱신 → popup 닫기 |
| `Tab` | 현재 값 수락 + 다음 탭 순서로 이동 |
| 타이핑 | Input에 문자 입력 → 필터링 |
| `Alt + ↓` | (선택적) Popup 열기만, virtual focus 이동 없음 |
| `Alt + ↑` | (선택적) Popup 닫기 + virtual focus를 input으로 복귀 |

**Popup 내 virtual focus가 있을 때 (실제 DOM focus는 input):**

| 키 | 동작 |
|----|------|
| `↓` | 다음 항목으로 virtual focus 이동 |
| `↑` | 이전 항목으로 virtual focus 이동 |
| `Enter` | 현재 항목 선택/실행 → popup 닫기 |
| `Escape` | Popup 닫기 → DOM focus input에 유지 |
| `←` / `→` | (Editable) Virtual focus 해제, input 커서 이동 |
| `Home` | 첫 항목으로 virtual focus 이동 |
| `End` | 마지막 항목으로 virtual focus 이동 |

### 우리 OS에서의 현재 구현

**완성된 부분:**

```typescript
// roleRegistry.ts — combobox preset
combobox: {
  navigate: { orientation: "vertical", loop: false, typeahead: false },
  select: { mode: "single", followFocus: true },
  dismiss: { escape: "close" },
  project: { virtualFocus: true },  // ← 핵심 플래그
  tab: { behavior: "escape" },
},

// focus.ts — virtualFocus 분기
const isVirtual = zoneEntry?.config?.project?.virtualFocus ?? false;
return {
  state: produce(ctx.state, (draft) => { /* ... */ }),
  focus: isVirtual ? undefined : itemId,  // ← DOM focus 억제
};
```

**미완성 부분 (T5 구현 시 해결):**

1. **NAVIGATE 커맨드**: virtualFocus 분기가 `.skip` 상태 
2. **DOM 투영**: `aria-activedescendant` 속성을 실제 DOM에 반영하는 Effect 없음
3. **Scroll**: 브라우저 자동 스크롤 없으므로, active item의 `scrollIntoView` 필요
4. **Combobox ↔ Popup 전이**: input zone과 listbox zone 사이의 focus 전이 모델 미정의

### 구현 시 필요한 것: 우리 OS 아키텍처에서

```
T5 구현 청사진:

┌── Input Zone (role="combobox") ──────────────────┐
│  DOM focus 항상 여기                               │
│  aria-activedescendant → popup의 active item id   │
│  aria-controls → popup zone id                     │
│  aria-expanded → overlay open state                │
│                                                    │
│  ↓ key → NAVIGATE dispatch → popup zone에 전달     │
│  타이핑 → FIELD dispatch → 필터 state 변경          │
│  Escape → OVERLAY_CLOSE                            │
│  Enter → ACTIVATE(activeItem) → popup 닫기         │
└──────────────────────────────────────────────────┘
         │ aria-activedescendant
         ▼
┌── Popup Zone (role="listbox") ───────────────────┐
│  DOM focus 없음 (virtualFocus: true)               │
│  state.focusedItemId → visual highlight            │
│                                                    │
│  NAVIGATE → focusedItemId 변경 → scroll into view  │
│  ACTIVATE → selection → input 반영 → popup 닫기   │
└──────────────────────────────────────────────────┘
```

핵심 질문: **누가 `aria-activedescendant`를 관리하는가?**

- **Option A**: Input Zone의 DOM 요소에 직접 속성 설정 (Effect에서)
- **Option B**: OS 미들웨어가 virtualFocus zone의 state 변화를 감지하여 자동 투영

Option B가 우리 OS 철학("행동은 OS가, DOM은 앱이")에 부합한다. 하지만 `aria-activedescendant`는 input 요소에 설정해야 하므로 **cross-zone 참조**가 필요하다. 이것은 `aria-controls`로 연결된 두 zone 사이의 관계를 OS가 알아야 한다는 의미다.

---

## Best Practice + Anti-Pattern

### ✅ Do

| 원칙 | 설명 |
|------|------|
| **`id`를 가진 option만 참조** | `aria-activedescendant`의 값은 반드시 존재하는 DOM 요소의 `id`. 없는 id를 참조하면 묵묵히 실패 |
| **시각적 하이라이트 필수** | Virtual focus는 `:focus` 의사 클래스가 적용되지 않으므로, `[aria-selected="true"]` 또는 data 속성으로 스타일링 |
| **`scrollIntoView` 직접 호출** | 브라우저가 자동 스크롤하지 않음. active item이 viewport 밖이면 개발자가 스크롤 처리 |
| **`aria-selected`와 함께 사용** | 현재 활성 option에 `aria-selected="true"` 설정. 스크린 리더가 두 속성을 조합하여 안내 |
| **Input에서 text가 바뀌면 `aria-activedescendant` 초기화** | NVDA 등에서 character deletion을 올바르게 안내하려면, 텍스트 변경 시 active를 초기화해야 함 |
| **Popup이 닫히면 속성 제거** | `aria-expanded="false"`일 때 `aria-activedescendant`도 제거하여 혼동 방지 |

### ❌ Don't

| Anti-Pattern | 위험 |
|-------------|------|
| **`element.focus()`를 popup option에 호출** | Input 커서가 사라지고, 타이핑 불가. Combobox의 핵심 UX가 깨짐 |
| **`aria-activedescendant` 없이 visual highlight만** | 시각이 아닌 사용자(스크린 리더)가 현재 option을 알 수 없음 |
| **모든 Composite에 Virtual Focus 사용** | Roving tabindex가 브라우저 지원이 더 안정적. Virtual Focus는 **input + popup 쌍 패턴**에서만 사용 |
| **`aria-owns`로 구조 왜곡** | Popup이 DOM 트리상 input의 자식이 아닐 때 `aria-owns` 사용 가능하나, 스크린 리더 호환성이 불안정. Portal 사용 시 주의 |
| **`aria-activedescendant`를 popup 요소에 설정** | 반드시 **DOM focus를 가진 요소**(input)에 설정해야 함. Popup에 설정하면 스크린 리더가 무시 |
| **Dialog popup에서 사용** | APG 명시: popup이 dialog일 때는 DOM focus를 dialog 안으로 이동시키고, `aria-activedescendant`를 사용하지 않음 |

---

## 흥미로운 이야기들

### Sarah Higley: "activedescendant is not focus"

Microsoft Accessibility팀의 Sarah Higley는 `aria-activedescendant`에 대한 업계에서 가장 깊은 분석을 제공했다. 그녀의 핵심 주장:

> `aria-activedescendant`는 focus가 아니다. 이것은 **연결된 요소의 정보를 안내**하는 메커니즘이다. 실제 keyboard focus, selection, activation은 모두 별개의 개념이다.

이 구별은 우리 OS 아키텍처와 정확히 대응된다:

| 개념 | Sarah Higley의 구분 | 우리 OS의 매핑 |
|------|---------------------|---------------|
| DOM Focus | `document.activeElement` | `focus` effect |
| Active Descendant | `aria-activedescendant` | `state.focusedItemId` (virtualFocus=true일 때) |
| Selection | `aria-selected` | `state.selection` |
| Activation | Enter/Click 동작 | `ACTIVATE` 커맨드 |

### React Aria의 VoiceOver 워크어라운드

Adobe의 React Aria 팀은 `aria-activedescendant`에서 VoiceOver(macOS)의 버그를 발견하고 대책을 세웠다:

1. **VoiceOver가 `aria-activedescendant` 변경을 무시하는 경우가 있음** — `aria-activedescendant`를 비운 후 다시 설정하는 2-step 업데이트로 우회
2. **NVDA에서 character deletion이 안내되지 않는 문제** — 텍스트 변경 시 `aria-activedescendant`를 초기화

이 워크어라운드들은 우리 OS Effect 레이어에서 처리해야 할 대상이다. 커맨드/상태 레이어에서는 "virtual focus가 이동했다"만 기술하고, DOM 투영의 책임은 Effect에 위임한다.

### VS Code의 QuickPick 아키텍처

우리가 만들려는 QuickPick(T5)의 원조인 VS Code의 Command Palette는 정확히 이 패턴을 사용한다:

- **Input에 DOM focus 유지** — 사용자가 `>toggle sidebar` 같은 명령을 타이핑
- **Popup listbox에서 virtual focus로 탐색** — 방향키로 필터된 목록 탐색
- **모드 접두사** (`>`, `#`, `@`, `:`) — 같은 input에서 컨텍스트에 따라 다른 popup 내용 표시

VS Code의 접근법은 우리 OS의 "커맨드 스코프 + Overlay" 모델과 일치한다. QuickPick = Combobox Zone(input) + Overlay(popup listbox).

### 상태 머신으로 보는 Combobox

Zag.js(Chakra 팀)는 Combobox를 **유한 상태 머신**으로 모델링했다:

```
idle ─(focus)──→ focused ─(type)──→ suggesting
  ↑                                     │
  │                       (escape)      │(↓ key)
  │                          ↑          ↓
  └──(blur)────── focused ←── navigating
                              │
                         (enter/click)
                              ↓
                           selected → idle
```

이 모델이 시사하는 것: Combobox의 복잡성은 **상태 전이의 풍부함**에서 온다. idle, focused, suggesting, navigating, selected — 각 상태에서 키보드 입력에 대한 반응이 다르다. 우리 OS에서는 이 상태 전이가 `activeZoneId`, `focusedItemId`, `overlayOpen` 등의 조합으로 표현된다.

---

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|--------|------|
| APG Combobox Pattern | QuickPick 구현의 ARIA 규격 원본 | [W3C APG: Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) | ⭐⭐⭐ | 1시간 |
| APG Combobox 예제 (Editable) | 실제 코드로 보는 ARIA 속성 조합 | [APG Example](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/) | ⭐⭐ | 30분 |
| React Aria `useCombobox` 소스 | 프로덕션 레벨 VoiceOver/NVDA 워크어라운드 | [GitHub: adobe/react-spectrum](https://github.com/adobe/react-spectrum/tree/main/packages/%40react-aria/combobox) | ⭐⭐⭐⭐ | 2시간 |
| Zag.js combobox 상태 머신 | FSM 기반 구현, 프레임워크 무관 | [GitHub: chakra-ui/zag/combobox](https://github.com/chakra-ui/zag/tree/main/packages/machines/combobox) | ⭐⭐⭐⭐ | 2시간 |
| MDN: `aria-activedescendant` | 속성의 공식 MDN 문서, 지원 role 목록 | [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-activedescendant) | ⭐⭐ | 20분 |
| Zell Liew: activedescendant 테스트 | 실제 스크린 리더에서 테스트한 호환성 보고서 | [zellwk.com](https://zellwk.com/blog/element-focus-vs-aria-activedescendant/) | ⭐⭐⭐ | 40분 |
