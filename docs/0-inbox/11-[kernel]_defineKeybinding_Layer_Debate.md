# defineKeybinding — Kernel인가, OS인가?

> 날짜: 2026-02-09
> 태그: kernel, keybinding, architecture, debate
> 상태: Draft
> 선행 문서: 05-[architecture] 3-Layer, 10-[kernel] Scope & Bubbling 제안서

---

## 0. 질문

`defineKeybinding`은 어느 레이어에 속하는가?

```typescript
defineKeybinding({ key: "Enter", command: "ACTIVATE" });
defineKeybinding({ key: "ArrowDown", command: "NAVIGATE", args: { direction: "down" } });
defineKeybinding({ key: "Meta+C", command: "COPY", scope: "kanban-board" });
```

이 API는 "키 입력 → 커맨드 매핑"을 등록한다.
Kernel이 제공해야 하는가, OS가 제공해야 하는가?

---

## 1. Red Team — "Kernel이다"

### 1.1 dispatch의 자연스러운 전단(前段)

Kernel은 이미 이것을 가지고 있다:

```
defineCommand   → 커맨드 처리기 등록
defineEffect    → 이펙트 실행기 등록
defineContext   → 컨텍스트 제공자 등록
defineScope     → 스코프 계층 등록
dispatch        → 커맨드 발행
```

빠진 것은 **"무엇이 dispatch를 촉발하는가"**다.
`defineKeybinding`은 dispatch의 입구다. 나머지 `define*` 가족과 같은 레이어에 있어야 한다.

```
defineKeybinding → dispatch → defineCommand → defineEffect
       ↑              ↑            ↑              ↑
    입구           발행           처리           실행
```

**입구를 다른 레이어에 두면 파이프라인이 끊긴다.**

### 1.2 App이 Kernel에 직접 접근해야 한다

05 문서에서 확정한 의존 규칙:

```
App → Kernel ✅ (직접 접근 가능)
App → OS     ✅ (primitive 사용)
```

App이 자체 키바인딩을 등록할 때:

```typescript
// Kanban 앱: Cmd+N으로 컬럼 추가
defineKeybinding({ key: "Meta+N", command: "ADD_COLUMN", scope: "kanban-board" });
defineCommand("ADD_COLUMN", (ctx, payload) => ({ ... }));
```

`defineCommand`는 Kernel이다. `defineKeybinding`이 OS라면?

```
App → Kernel.defineCommand(...)      // ✅ 직접
App → OS.defineKeybinding(...)       // ❓ OS를 경유
```

**커맨드는 Kernel에 등록하고, 그 커맨드의 트리거는 OS에 등록한다?**
같은 것(커맨드 정의)의 두 부분이 다른 레이어에 흩어진다.

### 1.3 Scope Keybinding은 Kernel Scope의 연장

10 문서에서 scope-specific keybinding을 열린 질문(Q3)으로 남겼다:

```typescript
defineKeybinding({ key: "Meta+N", command: "ADD_COLUMN", scope: "kanban-board" });
```

`scope`는 Kernel 개념이다. `defineScope`가 Kernel이면 scope-aware keybinding도 Kernel이어야 한다.
**scope 계층을 따라 키바인딩을 탐색하는 로직은 `buildBubblePath`를 사용한다 — 이미 Kernel이다.**

### 1.4 범용 이벤트 엔진의 완결성

Kernel의 정체성은 **"범용 이벤트 엔진"**이다.
이벤트 엔진이라면 "이벤트 소스 → 이벤트 매핑"은 코어 관심사다.

- Express: `app.get("/path", handler)` — 라우팅은 프레임워크에 있다
- Redux: `createAction` — 액션 생성은 프레임워크에 있다
- DOM: `addEventListener` — 이벤트 바인딩은 브라우저 엔진에 있다

**키바인딩은 "이 입력이 오면 이 커맨드를 dispatch해라"는 라우팅 규칙이다.**
라우팅이 엔진 바깥에 있는 프레임워크는 없다.

### 1.5 현재 코드가 증명하는 것

현재 `resolveKeybinding()`이 하는 일:

```
1. canonicalKey로 바인딩 필터링     ← 순수 매칭
2. bubblePath 순회                  ← Kernel scope
3. when 조건 평가                   ← 조건 해석
4. hasZoneBinding 확인              ← scope handler 존재 여부
5. args 해석 (OS.FOCUS 등)         ← placeholder 치환
```

이 중 1, 2, 4는 **Kernel 로직**이다. 3, 5만 OS 의존적이다.
**80%가 Kernel 관심사인 함수를 OS에 두는 것은 잘못된 분류다.**

---

## 2. Blue Team — "OS다"

### 2.1 Kernel은 "키보드"를 모른다

Kernel의 정의 (05 문서):

> **Kernel이 모르는 것:**
> "포커스"가 뭔지, "Zone"이 뭔지, "ARIA"가 뭔지, "Todo"가 뭔지

여기에 하나 더: **"키보드"가 뭔지.**

`defineKeybinding`이 Kernel에 들어가면:

```typescript
// Kernel이 알아야 하는 것:
// - "Meta+Shift+K"가 뭔지 (modifier key 구문)
// - "ArrowDown"이 뭔지 (키 이름)
// - macOS에서 Cmd+↑이 Home인지 (플랫폼 규칙)
// - IME 조합 중인지 (입력 상태)
```

**Kernel이 키보드 지식을 갖는 순간, "범용 이벤트 엔진"이 아니라 "키보드 이벤트 엔진"이 된다.**

re-frame은 `dispatch`만 제공한다. 키 이벤트를 dispatch로 변환하는 것은 앱(= OS 레이어)의 책임이다.

### 2.2 Key → Command 변환은 입력 번역이다

현재 파이프라인:

```
DOM KeydownEvent
  → Sensor (SENSE)           ← 1-sensor/
  → Classify (COMMAND?)      ← 1-sensor/
  → Resolve (key → command)  ← 여기가 논쟁 대상
  → dispatch(command)        ← Kernel
```

Sensor는 OS 레이어다. `classifyKeyboard`도 OS 레이어다.
그 사이에 있는 `resolveKeybinding`만 Kernel로 옮긴다?

**key → command 변환은 "입력 번역"이다. 입력 번역은 센서의 일이다.**

```
마우스 클릭 → dispatch({ type: "ACTIVATE" })      ← 마우스 센서가 번역
키보드 Enter → dispatch({ type: "ACTIVATE" })      ← 키보드 센서가 번역
음성 "열어" → dispatch({ type: "ACTIVATE" })       ← 음성 센서가 번역
```

**모든 센서가 각자의 입력을 Command로 번역한다.**
키보드 센서의 번역 규칙(= keybinding)을 Kernel에 넣으면,
마우스 센서의 규칙, 음성 센서의 규칙도 Kernel에 넣어야 하는가?

### 2.3 `when` 조건은 OS 컨텍스트에 의존한다

```typescript
defineKeybinding({
  key: "Enter",
  command: "ACTIVATE",
  when: "!isEditing",          // ← OS가 관리하는 상태
});

defineKeybinding({
  key: "ArrowDown",
  command: "NAVIGATE",
  when: "focusPath.length > 0", // ← OS 포커스 시스템
});
```

`when` 조건을 평가하려면:
- `isEditing` — OS Field 시스템의 상태
- `focusPath` — OS 포커스 시스템의 상태
- `activeZone` — OS Zone 시스템의 상태
- `isInput` — OS 센서의 판단

**Kernel이 `when`을 평가하려면 OS 상태를 알아야 한다.**
이것은 "Kernel → OS" 의존이다. **레이어 위반.**

### 2.4 Key Normalization은 플랫폼 지식이다

현재 `getCanonicalKey()`가 하는 일:

```typescript
// macOS: Cmd+↑ → Home, Cmd+↓ → End
// Modifier 정규화: Meta → Ctrl → Alt → Shift 순서
// Space 정규화, 대소문자 정규화
```

이것은 **플랫폼별 키보드 지식**이다.
Kernel은 플랫폼을 모른다. "macOS에서 Cmd+↑이 Home이다"를 Kernel이 알아야 하는가?

### 2.5 분리했을 때의 아키텍처

```
┌─────────────────────────────────────────────┐
│  OS Layer                                    │
│                                              │
│  KeyboardSensor                              │
│    → getCanonicalKey()    (플랫폼 정규화)     │
│    → classifyKeyboard()   (입력 분류)         │
│    → resolveKeybinding()  (key → command)    │
│    → dispatch(command)    ← Kernel 호출      │
│                                              │
│  defineKeybinding()       (매핑 테이블 등록)  │
│  evaluateWhen()           (OS 컨텍스트 평가)  │
├─────────────────────────────────────────────┤
│  Kernel Layer                                │
│                                              │
│  dispatch(command)                           │
│    → scope bubbling                          │
│    → handler resolution                      │
│    → effects execution                       │
│                                              │
│  Kernel은 "command가 어디서 왔는지" 모른다.    │
│  키보드든 마우스든 API 호출이든 상관없다.       │
└─────────────────────────────────────────────┘
```

**Kernel은 Command만 받는다. Command가 키보드에서 왔는지, 마우스에서 왔는지, 테스트에서 왔는지 모른다.**
이것이 가장 깨끗한 경계다.

### 2.6 "App이 OS를 경유해야 한다"는 문제가 아니다

Red Team의 우려: App이 keybinding을 등록하려면 OS를 거쳐야 한다.

하지만 이미 그렇게 하고 있다:

```typescript
// 현재: App이 keymap을 AppDefinition에 선언
defineApplication({
  id: "kanban",
  keymap: {
    zones: {
      "kanban-board": [
        { key: "Meta+N", command: "ADD_COLUMN" },
      ],
    },
  },
});
```

App은 **선언**만 한다. 해석은 OS가 한다.
이것은 자연스러운 구조다. App은 "이 키를 이 커맨드에 연결해줘"라고 말하고,
OS가 "알겠다, 내가 키보드 이벤트가 오면 매칭해서 dispatch할게"라고 답한다.

**App이 직접 키보드 이벤트를 다루는 것은 레이어 위반이다.**
키보드 이벤트를 다루는 것은 OS의 일이다.

---

## 3. 쟁점 정리

| 쟁점 | Red Team (Kernel) | Blue Team (OS) |
|---|---|---|
| **정체성** | 이벤트 엔진의 라우팅 규칙 | 센서의 입력 번역 규칙 |
| **scope** | Kernel scope의 자연스러운 연장 | scope는 공유하되, 해석은 OS |
| **when 조건** | Kernel이 컨텍스트 주입받으면 됨 | OS 상태에 의존 = 레이어 위반 |
| **key 정규화** | 전처리 후 정규화된 키만 넘기면 됨 | 플랫폼 지식 = OS 관심사 |
| **App 접근** | Kernel 직접 접근이 자연스럽다 | 선언적 등록이면 충분하다 |
| **다른 센서** | 키바인딩만 특별하다 (구조화된 매핑) | 모든 센서가 동일한 패턴이어야 |
| **비유** | Express 라우팅은 프레임워크에 있다 | 브라우저의 키보드 처리는 OS에 있다 |
| **Kernel 순수성** | ~600 LOC에 keybinding 추가해도 작다 | 0 입력 지식이 Kernel의 가치 |

---

## 4. 제3의 시각 — 분리 가능한가?

keybinding을 단일 레이어에 강제하지 않고, **관심사를 쪼개는 방법**:

### 4.1 Kernel: 추상 라우팅 테이블

```typescript
// Kernel이 제공하는 것: "트리거 → 커맨드" 매핑의 범용 구조
defineMapping(trigger: string, command: string, options?: { scope?: string }): void
resolveMapping(trigger: string, scopeId: string): Command | null

// Kernel은 "trigger"가 키보드 키인지, 마우스 제스처인지, 음성 명령인지 모른다.
// 그냥 문자열 → 커맨드 매핑 테이블이다.
```

### 4.2 OS: 키보드 특화 래퍼

```typescript
// OS가 제공하는 것: 키보드 전용 API + 정규화 + when 조건
function defineKeybinding(binding: KeybindingItem): void {
  const normalizedKey = getCanonicalKey(binding.key);

  // when 조건이 있으면 OS 컨텍스트 평가를 wrapping
  defineMapping(normalizedKey, binding.command, {
    scope: binding.scope,
    // when은 OS가 resolve 시점에 평가
  });
}
```

### 4.3 이 접근의 장단점

**장점:**
- Kernel은 "입력"을 몰라도 된다 — 문자열 매핑만 안다
- OS는 키보드 전문성을 유지한다
- App은 `defineKeybinding`(OS)이든 `defineMapping`(Kernel)이든 선택 가능
- 다른 센서(마우스, 음성)도 같은 `defineMapping`을 사용 가능

**단점:**
- `when` 조건을 어디서 평가하는가? resolve 시점에 OS가 개입해야 한다
- API가 두 레이어에 걸쳐 있어 학습 비용 증가
- 실제로 키보드 외 센서가 이 구조를 쓸 가능성이 낮다 (YAGNI?)

---

## 5. 판정 기준

최종 결정을 위한 질문:

### Q1. Kernel이 키보드를 모르는 것이 얼마나 중요한가?

- Kernel을 **다른 프로젝트에서도 쓸 라이브러리**로 본다면 → 키보드 무지가 중요하다. OS에 둬야 한다.
- Kernel을 **이 프로젝트 전용 엔진**으로 본다면 → 키보드 지식이 있어도 된다. Kernel에 둘 수 있다.

### Q2. `when` 조건 없이도 되는가?

- `when`이 없으면 keybinding은 순수한 `string → string` 매핑이다. Kernel에 넣기 쉽다.
- `when`이 필수라면 OS 컨텍스트 의존이 불가피하다. OS에 두거나 제3의 방법이 필요하다.

### Q3. 실제로 키보드 외 센서가 매핑 테이블을 쓰는가?

- 마우스 센서: 클릭/더블클릭 → ACTIVATE. **매핑 테이블 불필요** (하드코딩으로 충분)
- 음성 센서: 없다 (현재)
- 제스처 센서: 없다 (현재)

→ 매핑 테이블이 필요한 센서는 **키보드뿐**이다. 범용 `defineMapping`은 YAGNI일 수 있다.

---

## 6. 결론

> 이 문서는 결론을 내리지 않는다. 양측 논거를 정리한 것이다.

**Kernel 쪽이 강한 논거:**
- `define*` 가족의 일관성
- scope-aware keybinding이 Kernel scope의 자연스러운 확장
- App이 Kernel에 직접 접근하는 것이 레이어 규칙에 부합

**OS 쪽이 강한 논거:**
- Kernel의 "입력 무지(input-agnostic)" 순수성 보존
- `when` 조건의 OS 컨텍스트 의존
- key normalization의 플랫폼 특수성
- "Command가 어디서 왔는지 모른다"는 깨끗한 경계

**제3의 방법이 강한 논거:**
- 관심사를 깨끗하게 분리 가능
- 하지만 YAGNI 위험 + 학습 비용
