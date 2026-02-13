# Discussion Journey: OS 키바인딩 아키텍처 재설계

## 발단 — clipboard.ts에서 시작

**🧑 사용자**: `/go` 실행 → P1 "레거시 clipboard.ts 삭제"

**🤖 AI**: 분해 시작. clipboard.ts에 4개 커맨드 중 CopyTodo/CutTodo/PasteTodo는 v3에서 대체 완료. 하지만 `DuplicateTodo`가 `todoKeys.ts`(keymap)에서 직접 참조되고 있어서a삭제 불가. v3 커맨드는 위젯 안에 캡슐화되어 keymap이 참조할 수 없음. §멈춤 — 의사결정 필요.

**🧑 사용자**: 상황 설명을 자세히 듣고 싶어.

---

## 아키텍처 충돌 발견

**🤖 AI**: 커맨드 시스템이 2세대 공존 중.
- 레거시(v1): `todoSlice.group.defineCommand` → 독립 export → keymap에서 직접 참조 가능
- v3: `define.command` → 위젯 안에 캡슐화 → 외부에서 import 불가

`DuplicateTodo`가 v1 패턴인데 keymap이 이것을 참조 → clipboard.ts 삭제 불가.

**🧑 사용자**: OS 설계 이슈로 격상하자. 단축키는 cmd+k cmd+f 등 OS가 당연히 제공해야 하는 일이야.

---

## OS 표준 vs 앱 커스텀 2계층

**🤖 AI**: 이미 동작 중인 패턴: `Key → OS_COPY → zone.onCopy → app command`. Duplicate도 `onDuplicate`로?

**🧑 사용자**: 아니지 duplicate는 OS에서 제공하는게 아냐. OS에서 제공하는건 onXXX인데 custom은 keybindings가 필요한거야.

**🤖 AI**: 정정. 2계층:
- OS 표준 (on* props): Copy, Paste, Delete → OS가 키를 알고 있음
- 앱 커스텀 (keybindings): Duplicate, ToggleView → 앱이 { key, command }를 선언, OS가 등록·실행

---

## VSCode 패턴이 근본 원인

**🧑 사용자**: 키바인딩은 위젯/Zone/FocusGroup에서 관리해야 하는 거지. VSCODE 패턴을 참고했다가 이 사단이 난거야.

**🤖 AI**: 근본 원인 발견.
- VSCode: 전역 플랫 keymap + 문자열 command ID + when 절
- 이 OS: 커맨드가 위젯에 캡슐화 + Zone이 컨텍스트
- VSCode 패턴을 그대로 가져와서 `todoKeys.ts`라는 전역 keymap이 생겼고, 이것이 v3 캡슐화와 충돌.

---

## when 조건의 가드와 소유권

**🧑 사용자**: 기능은 있어도 동작하지 않아야 할때가 있지. FOCUS가 없는데 복사가 되면 안되니까.

**🤖 AI**: OS가 이미 자동 가드를 함 (zone 활성, 핸들러 존재, 포커스 존재). 앱은 앱 상태 가드만 `when`으로 선언.

**🧑 사용자**: 커맨드의 when은 누구의 소유일까? 커맨드의 책임이라 생각해.

**🤖 AI**: 맞습니다. 분리:
- 커맨드: when(조건) + handler(동작)
- 키바인딩: key → command (입력 계층)
- Trigger: click → command (UI 계층, when으로 auto disabled)

---

## Trigger와 Inspector화

**🧑 사용자**: `<OS.Trigger>`가 아니라 `createTrigger`를 만들기로 했지. 그리고 when은 이름을 붙여서 Inspector화하려고 했어. 조건 파악이 개발을 정말 어렵게 하니까.

```ts
when("hasNoFocus", state => state.ui.focusedId == null)
```

Inspector에서 "왜 이 커맨드가 disabled인지" 시각적으로 보이게.

---

## App = Widget

**🧑 사용자**: 전역 키바인딩은 App에 달거야. 사실 App = Widget이야.

**🤖 AI**: 이것이 전체 구조를 단순하게 함:
```
TodoApp (루트 위젯)
  ├─ keybindings: [Cmd+Shift+V → toggleView]  ← "전역"
  ├─ TodoList (자식 위젯)
  │   ├─ zone: { onCopy, onDelete }            ← OS 표준
  │   └─ keybindings: [Cmd+D → duplicate]      ← 존 스코프
  └─ TodoSidebar (자식 위젯)
```

전역 vs 로컬 구분 불필요 — 위젯 트리 위치가 스코프.

> 한 줄 요약: VSCode식 전역 keymap(`todoKeys.ts`)을 제거하고, 커맨드(when+handler) + 위젯 트리(keybindings) + Zone(on*) 3계층 구조로 전환. App = Widget이므로 전역/로컬 구분 불필요. clipboard.ts·todoKeys.ts 소멸.

---

# Discussion Conclusion: OS 키바인딩 아키텍처 재설계

## Why

레거시 `clipboard.ts`를 삭제하려 했으나, `DuplicateTodo`가 전역 keymap(`todoKeys.ts`)에서 직접 참조되어 삭제 불가. 근본 원인: VSCode식 전역 플랫 keymap 패턴과 v3 위젯 캡슐화 아키텍처가 충돌.

## Intent

VSCode식 전역 keymap을 제거하고, 커맨드(when+handler) + 위젯 트리(keybindings) + Zone(on*) 3계층 구조로 전환한다. App = Widget이므로 전역/로컬 구분 불필요.

## Warrants

| # | Warrant |
|---|---------|
| W1 | 레거시(v1) 커맨드는 독립 export → keymap에서 직접 참조 가능 |
| W2 | v3 커맨드는 위젯 안에 캡슐화 → 외부에서 import 불가 |
| W3 | Copy/Cut/Paste는 OS 표준(`on*` prop)으로 이미 해결됨 |
| W4 | Duplicate는 앱 전용 → `keybindings` 배열로 선언 |
| W5 | 근본 원인: VSCode 패턴(전역 플랫 keymap + 문자열 커맨드 ID + when 절)을 그대로 가져옴 |
| W6 | 이 OS의 올바른 패턴은 이미 Zone의 `on*` prop으로 동작 중 |
| W7 | macOS 패턴: OS 표준(Cmd+C) + 앱 등록(Cmd+L) — 둘 다 OS 인프라를 통함 |
| W8 | 앱이 `keybindings: [{ key, command }]`를 선언하면 todoKeys.ts 소멸 |
| W9 | OS가 이미 자동 가드(zone 활성, 포커스 존재)를 하고 있음 |
| W10 | `when`은 커맨드의 소유 — 키바인딩과 Trigger는 읽기만 함 |
| W11 | rules.md #2 "번역기는 번역만 한다" — 키보드/Trigger는 번역기 |
| W12 | `when`을 커맨드에 co-locate하면 Trigger(disabled), 키바인딩(무시), CommandPalette(grayed out) 3개 표면이 단일 소스에서 파생 |
| W13 | `createTrigger` = `createWidget`과 동일 패턴. OS 프리미티브의 일관성 |
| W14 | Named when은 Inspector화 가능 — "왜 disabled인지" 시각적 디버깅 |
| W15 | App = Widget → 전역 키바인딩은 루트 위젯에 선언. 별도 메커니즘 불필요 |
| W16 | OS.Trigger는 당장 폐기하지 않음 — 점진적 전환 |

## 합의된 설계

### 3계층 구조

```
1. OS 표준 (Zone on* props)
   - OS가 키 매핑을 알고 있음 (Cmd+C → OS_COPY → zone.onCopy)
   - OS가 자동 가드 (zone 활성, 핸들러 존재, 포커스 존재)

2. 앱 커스텀 (keybindings 배열)
   - 앱이 { key, command } 쌍을 선언
   - OS가 등록·실행
   - 위젯 트리 위치가 스코프 (App = 전역, 자식 위젯 = 존 스코프)

3. 커맨드 (when + handler)
   - when: 커맨드가 실행 가능한 조건 (커맨드가 소유)
   - handler: 실행 로직
   - Trigger/키바인딩/CommandPalette가 when을 읽어서 자동 disabled/무시/grayed out
```

### API 예시

```ts
// 앱 정의
const TodoApp = defineApp("todo", { ... });

// 위젯 정의
const TodoList = TodoApp.createWidget("list", (define) => {
  // Named context (Inspector화 가능)
  const context = define.context({
    isEditing: (state) => state.ui.editingId != null,
  });

  // 커맨드 (when은 커맨드의 소유)
  const duplicateTodo = define.command("duplicateTodo", {
    when: context.not("isEditing"),
    handler: (ctx) => (payload) => { ... },
  });

  return {
    commands: { duplicateTodo },
    zone: {
      onCopy: copyTodo,      // OS 표준
      onDelete: deleteTodo,  // OS 표준
    },
    keybindings: [
      { key: "Meta+D", command: duplicateTodo },  // 앱 커스텀
    ],
  };
});
```

### 소멸하는 것

| 파일 | 이유 |
|------|------|
| `todoKeys.ts` | Zone on* + keybindings로 대체 |
| `clipboard.ts` | v3 커맨드 + keybindings로 대체 |
| `createLogicExpect` + `Rule` | `define.context`로 일원화 |

### 점진적 전환

- `OS.Trigger`는 당장 폐기하지 않음
- `createTrigger`를 새로 만들되, 기존 코드와 공존
- when의 Inspector화는 구현 디테일로 프로젝트에서 결정

## 한 줄 요약

> VSCode식 전역 keymap을 제거하고, 커맨드(when+handler) + 위젯 트리(keybindings) + Zone(on*) 3계층 구조로 전환. App = Widget이므로 전역/로컬 구분 불필요. clipboard.ts·todoKeys.ts 소멸.
