# /divide — defineApp v5 Red Team 공격 분해

> **대상**: Red Team Report 8개 공격
> **일자**: 2026-02-14
> **원칙**: 정답 있음 → 테스트로 증명 → 실행. 정답 없음 → 나누거나 질문.

---

## 분류 결과

### ✅ Known (정답 있음) — 7개

| # | 공격 | 정답 | 증명 방법 |
|---|------|------|-----------|
| 2 | Scope 버블링 미구현 (flat Map) | 구현: scope별 Map + bubble | 단위 테스트: 두 Zone에 같은 type → 각각 자기 handler 실행 |
| 3 | `setState` public | AppHandle에서 제거 | 타입 테스트: `@ts-expect-error` setState 접근 |
| 4 | Condition 이름 중복 미검사 | 중복 등록 시 throw | 단위 테스트: 같은 이름 2회 → Error |
| 5 | when + handler 이중 체크 | handler의 동일 guard 제거 | when 통과 = 전제조건 충족. dead code 제거 |
| 6 | dispatch chain 미구현 | TestInstance에서 result.dispatch 처리 | 단위 테스트: handler가 반환한 dispatch 커맨드가 실행되는지 |
| 7 | Shallow state copy | `structuredClone` 사용 | 단위 테스트: 두 인스턴스의 중첩 객체가 다른 참조 |
| 8 | Dead code (when 통과 후 handler guard) | Attack 5와 동일 — 제거 | 코드 검사 |

### ❓ Open (정답 없음) — 1개

| # | 공격 | 왜 Open인가 |
|---|------|-------------|
| 1 | "Zone = 키보드"는 거짓 | **정의의 문제**. Zone이 키보드만의 스코프인가, 모든 인터랙션의 커맨드 매핑인가? 이것은 설계 결정이지 코드 버그가 아님 |

---

## ❓ Open: Attack 1 — Zone의 정의

### 현재 정의 (W20)
> "Zone의 존재 이유는 키보드 모호함 해소"

### 반례
```ts
onCheck: toggleTodo    // ← 마우스 체크박스 클릭에서도 발생
onAction: startEdit    // ← 마우스 더블클릭에서도 발생
onDelete: deleteTodo   // ← 컨텍스트 메뉴에서도 발생
```

### 분해 시도

Zone이 하는 일을 나열:
1. **키보드 이벤트 → 커맨드** (Enter → startEdit, Delete → deleteTodo)
2. **마우스 이벤트 → 커맨드** (더블클릭 → startEdit, 체크박스 → toggleTodo)
3. **포커스 관리** (activeZoneId, aria-activedescendant)
4. **keybinding 스코프** (Cmd+D가 list에서만 동작)
5. **ARIA role 선언** (role="listbox")

1, 2, 4 → "이벤트를 커맨드로 번역"
3 → "포커스 소유"
5 → "접근성 선언"

**공통점**: 전부 **"이 영역"**이라는 바운더리 안에서의 행동 정의.

### 재정의안 (제안)

> **Zone = "UI 영역의 인터랙션 바운더리. 이 영역에서 발생하는 입력(키보드/마우스/터치)을 커맨드로 번역하고, 포커스를 소유한다."**

키보드는 Zone이 필요한 **주된 이유**(같은 키가 다른 곳에서 다른 의미)이지만,
Zone이 하는 일은 키보드에 국한되지 않는다.

W20 수정:
- ~~"Zone의 존재 이유는 키보드 모호함 해소"~~
- → **"Zone은 인터랙션 바운더리다. 키보드 모호함 해소가 주된 존재 이유이지만, 마우스/터치 이벤트의 커맨드 매핑과 포커스 소유도 Zone의 책임이다."**

**→ 사용자 확인 필요**: 이 재정의를 수용하는가?

---

## ✅ Known: Attack 2 — Scope 버블링 (가장 중요)

### 문제
```ts
// 현재: flat Map
const handlerRegistry = new Map<string, ...>();
// listZone.command("SELECT", h1) → set("SELECT", h1)
// sidebarZone.command("SELECT", h2) → set("SELECT", h2) → h1 덮어씀!
```

### 정답
Zone마다 scope를 가지고, dispatch 시 scope chain을 따라 핸들러를 찾는다.

```ts
// 목표:
const scopedRegistry = new Map<string, Map<string, ...>>();
// "list" scope → { "SELECT": h1 }
// "sidebar" scope → { "SELECT": h2 }
// dispatch("SELECT", { scope: "list" }) → h1 실행
```

### 증명 테스트
```ts
// 두 Zone에 같은 type 등록
const listZone = app.createZone("list");
const sidebarZone = app.createZone("sidebar");

let listCalled = false;
let sidebarCalled = false;

listZone.command("SELECT", (ctx, p: { id: string }) => {
  listCalled = true;
  return { state: ctx.state };
});
sidebarZone.command("SELECT", (ctx, p: { id: string }) => {
  sidebarCalled = true;
  return { state: ctx.state };
});

// list scope에서 dispatch → list handler만 실행
app.dispatch(selectFromList({ id: "1" }), { scope: "list" });
assert(listCalled === true);
assert(sidebarCalled === false);
```

**상태**: 미구현. v5 PoC에서 scope별 Map으로 전환 필요.

---

## ✅ Known: Attack 3, 4, 5, 6, 7, 8 — 요약

| # | 정답 | 구현 난이도 | 우선순위 |
|---|------|------------|---------|
| 3. setState 제거 | AppHandle에서 삭제 | 1줄 | 높음 (원칙) |
| 4. 이름 중복 검사 | `if (names.has(name)) throw` | 3줄 | 낮음 |
| 5+8. handler dead code 제거 | when이 보장하는 조건 제거 | 10줄 수정 | 낮음 |
| 6. dispatch chain | result.dispatch 재귀 처리 | 10줄 | 중간 |
| 7. Deep copy | `structuredClone(initialState)` | 1줄 | 낮음 |

---

## 실행 계획

### 즉시 실행 (정답 확실, 테스트 가능)
1. ~~Attack 3~~: `setState` 제거
2. ~~Attack 4~~: Condition 이름 중복 체크
3. ~~Attack 7~~: Deep copy

### 다음 스프린트 (구현 필요)
4. **Attack 2**: Scope별 handler registry + bubble
5. **Attack 6**: dispatch chain

### 정리 (코드 리팩터링)
6. Attack 5+8: handler dead code 제거

### 사용자 결정 필요
7. **Attack 1**: Zone 정의 재확인 → W20 수정 여부

---

## 결론

**8개 중 7개는 정답 있음.** 코드로 해결 가능.
**1개(Zone 정의)만 Open.** 설계 결정이지 버그가 아님.

가장 중요한 건 **Attack 2 (Scope 버블링)** — v5의 핵심 주장인데 증명 안 됨.
이것을 해결하면 v5가 v4 대비 **구조적으로도** 견고해진다.
