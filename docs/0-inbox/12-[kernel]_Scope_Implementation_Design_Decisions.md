# Scope 구현 전 의사결정 필요 사항

> 날짜: 2026-02-09
> 태그: kernel, scope, bubbling, dispatch, design-decision
> 상태: Decision Required
> 선행 문서: 10-[kernel]\_Scope\_and\_Bubbling\_Proposal.md

---

## 1. 개요

Scope & Bubbling 제안서(10번 문서)의 핵심 방향 — 계층적 dispatch + bubbling — 은 타당하다.
그러나 구현으로 들어가기 전에 **3가지 설계 결정**이 필요하다. 각각은 독립적이지 않고 서로 영향을 준다.

---

## 2. Decision 1: Scope는 암묵적(implicit)인가, 명시적(explicit)인가?

### 문제

제안서(§5)의 dispatch 흐름:

```
dispatch({ type: "ACTIVATE" })
  → getActiveScope()          ← 글로벌 상태에서 암묵적으로 읽음
  → bubblePath 계산
  → scope 순회
```

같은 `{ type: "ACTIVATE" }`를 보내도 `activeScope`에 따라 **다른 핸들러가 실행**된다.
이것은 dispatch의 **결정론성**을 깨뜨린다.

- **디버깅**: Transaction log에 `{ type: "ACTIVATE" }`만 기록하면, 어떤 scope에서 실행됐는지 모른다.
- **테스트**: 테스트에서 `dispatch()`만으로는 동작을 재현할 수 없다. `setActiveScope()`를 먼저 호출해야 한다.
- **Time travel**: Transaction에 scope 정보가 없으면 replay가 불완전하다.

### 옵션

| | 옵션 A: Implicit Scope | 옵션 B: Explicit Scope |
|---|---|---|
| **API** | `dispatch({ type: "ACTIVATE" })` | `dispatch({ type: "ACTIVATE", scope: "card-list" })` |
| **결정론** | ❌ 글로벌 상태에 의존 | ✅ command 자체에 모든 정보 |
| **Sensor 부담** | 없음 (Kernel이 알아서 읽음) | Sensor가 scope를 넣어줘야 함 |
| **Transaction** | scope를 별도 기록 필요 | command에 이미 포함 |
| **Time travel** | scope 복원 로직 필요 | command replay만으로 충분 |
| **비유** | DOM event bubbling (target은 암묵적) | `EventTarget.dispatchEvent()` (target을 지정) |

### 분석

DOM 이벤트 버블링이 암묵적인 이유는 target이 **이벤트가 발생한 실제 DOM 노드**이기 때문이다. 프로그래머가 지정하는 게 아니라 브라우저가 결정한다.

우리 경우 `activeScope`는 **OS가 관리하는 포커스 상태**에서 파생된다. Sensor는 이미 "어떤 Zone에서 이벤트가 발생했는지" 알고 있다 — `routeCommand.ts`가 `focusPath`와 `activeGroupId`를 사용해 `buildBubblePath()`를 호출하고 있다.

따라서 Sensor가 scope를 넣어주는 것은 **추가 부담이 아니라 이미 하고 있는 일**이다.

### 절충안: 하이브리드

```typescript
dispatch({ type: "ACTIVATE" });                          // scope 생략 → getActiveScope() 사용
dispatch({ type: "ACTIVATE", scope: "card-list" });      // scope 명시 → 해당 scope부터 bubble
```

scope를 **optional**로 두되, 내부적으로는 항상 resolved scope를 Transaction에 기록한다.

```typescript
// Transaction 구조
{
  command: { type: "ACTIVATE" },
  resolvedScope: "card-list",    // ← 실제로 해석된 scope (항상 기록)
  handlerScope: "card-list",     // ← 실제로 핸들러가 매칭된 scope
  ...
}
```

### 결정 필요

1. **scope를 Command에 포함시킬 것인가?** (optional field로?)
2. **Transaction에 resolvedScope를 기록할 것인가?** (time travel/디버깅 용도)

---

## 3. Decision 2: Middleware는 Scope 순회 전인가, 후인가?

### 문제

현재 dispatch 파이프라인:
```
before middleware → handler → after middleware → effects
```

Scope를 도입하면 "handler" 단계가 "scope 순회 → 핸들러 매칭 → 실행"으로 확장된다.
Middleware가 어디에 위치하느냐에 따라 능력이 달라진다.

### 옵션

| | 옵션 A: 순회 바깥 | 옵션 B: 순회 안쪽 | 옵션 C: 분리 |
|---|---|---|---|
| **구조** | `before → [scope순회 → handler] → after → effects` | `scope순회 → [before → handler → after] → effects` | `before → scope순회 → [handler] → after → effects` |
| **before가 할 수 있는 일** | command 변환 (scope 순회 전) | command 변환 (이미 scope 확정 후) | command 변환 (scope 순회 전) |
| **after가 할 수 있는 일** | EffectMap 수정 | EffectMap 수정 (scope별) | EffectMap 수정 |
| **middleware가 scope를 바꿀 수 있는가** | ✅ 변환된 command의 scope가 반영됨 | ❌ scope 이미 확정 | ✅ before에서 가능 |

### 분석

현재 사용 중인 middleware 패턴:
1. **command 변환** (before): `{ type: "alias-me" }` → `{ type: "aliased" }` — scope 순회 **전**이어야 함
2. **effect 수정** (after): `notify: "hello"` → `notify: "HELLO"` — scope 순회 **후**면 충분
3. **inject** (before): context 주입 — scope 순회 **전**이어야 함 (핸들러가 ctx를 쓰므로)

**옵션 C (분리)**가 가장 자연스럽다. 현재 구현과도 호환된다.

### 제안

```
1. Global before middleware 실행
2. Scope 순회 + 핸들러 매칭
3. Per-command before interceptor 실행 (inject 등)
4. 핸들러 실행
5. Per-command after interceptor 실행
6. Global after middleware 실행
7. Effects 실행
8. Transaction 기록
```

### 결정 필요

1. **위 순서가 맞는가?**
2. **Global middleware가 scope를 알아야 하는가?** (MiddlewareContext에 `resolvedScope` 필드 추가?)

---

## 4. Decision 3: Scope Tree는 Kernel에 있어야 하는가?

### 문제

제안서(§3.1)는 Kernel과 OS의 경계를 이렇게 정의한다:

```
Scope: Kernel의 계층 단위.
Zone:  OS가 Scope를 포커스 목적으로 사용한 것.
Kernel은 "포커스"를 모른다.
```

그런데 Scope tree(부모-자식 관계)를 **Kernel이 관리**하면:
- `defineScope("card-list", { parent: "col-1" })` — Kernel API
- `buildBubblePath("card-list")` — Kernel이 트리 순회

Kernel이 사실상 **트리 관리자**가 된다. 이것은 Kernel의 책임 범위를 넓히는 것이다.

### 옵션

| | 옵션 A: Kernel이 트리 관리 | 옵션 B: OS가 트리 관리, Kernel은 경로만 받음 |
|---|---|---|
| **API** | `defineScope(id, { parent })` | `dispatch({ type: "X", bubblePath: ["a", "b", "__global__"] })` |
| **Kernel 책임** | 트리 저장, 순회, bubblePath 계산 | bubblePath를 받아서 순회만 |
| **OS 책임** | scope 등록/해제 | 트리 관리 + bubblePath 계산 + scope 등록/해제 |
| **Kernel 복잡도** | 높음 (트리 자료구조 필요) | 낮음 (배열 순회만) |
| **현재 코드** | — | `buildBubblePath()`가 이미 OS에 있음 (`os-new/4-effect/`) |

### 분석

현재 `buildBubblePath()`는 이미 **OS 레이어** (`os-new/4-effect/buildBubblePath.ts`)에 구현되어 있다.
`routeCommand.ts`가 `focusPath`와 `activeGroupId`를 사용해 bubblePath를 계산한다.

이 로직을 Kernel로 내리면:
- Kernel이 "트리"를 관리해야 한다 (React mount/unmount와 동기화)
- Kernel이 점점 커진다
- OS의 기존 `buildBubblePath`와 중복된다

반면 **OS가 bubblePath를 만들어서 dispatch에 넘기면**:
- Kernel은 "배열을 순회하며 핸들러를 찾는다"만 하면 된다
- 트리 관리는 OS의 기존 코드(FocusGroup mount/unmount)가 계속 담당
- Kernel은 순수하고 작게 유지된다

### 제안

```typescript
// OS 레이어 (Sensor → dispatch)
const bubblePath = buildBubblePath(focusPath, activeGroupId);
dispatch({ type: "ACTIVATE", scope: bubblePath });

// Kernel (dispatch.ts)
function processCommand(cmd) {
  const path = cmd.scope ?? [getActiveScope(), "__global__"];  // fallback
  for (const scope of path) {
    const handler = getScopedCommand(cmd.type, scope)
                 ?? (scope === "__global__" ? getCommand(cmd.type) : undefined);
    if (!handler) continue;
    const result = handler(ctx, cmd.payload);
    if (result !== null) return result;  // 처리됨
  }
}
```

이렇게 하면:
- Kernel에 트리 자료구조가 **필요 없다**
- `scope.ts`는 **scoped handler 저장소**만 담당 (Map<scope, Map<type, handler>>)
- 트리 관리는 OS의 기존 책임 유지
- `buildBubblePath()`는 OS에 그대로 유지

### 결정 필요

1. **Scope tree를 Kernel에 둘 것인가, OS에 둘 것인가?**
2. **bubblePath를 dispatch에 넘길 것인가, Kernel이 계산할 것인가?**

---

## 5. 세 결정의 상호 의존성

```
Decision 1 (Explicit Scope)
  ↓ scope가 command에 포함되면
Decision 3 (Kernel에 트리 불필요)
  ↓ bubblePath를 OS가 계산해서 넘기면
Decision 2 (Middleware 위치)
  ↓ before middleware가 scope를 변환할 수 있는가?
     → bubblePath가 command에 이미 있으면, before에서 변환 가능
```

**가장 일관된 조합:**

| Decision | 선택 | 이유 |
|---|---|---|
| 1. Scope 전달 | **Explicit** (optional, bubblePath 배열) | 결정론적, time travel 호환 |
| 2. Middleware | **옵션 C (분리)** — before → scope순회 → after | 현재 구현과 호환 |
| 3. Scope Tree | **OS가 관리** — Kernel은 경로 순회만 | Kernel 최소화, 기존 코드 활용 |

---

## 6. 결론

Scope & Bubbling 제안서의 **Why는 확실**하다. 계층적 dispatch는 필요하다.

**How에 대해 3가지 결정이 필요하다:**

1. ⬜ Scope를 command에 명시할 것인가? (implicit vs explicit vs hybrid)
2. ⬜ Middleware는 scope 순회의 바깥/안쪽/분리 중 어디인가?
3. ⬜ Scope tree 관리는 Kernel의 책임인가, OS의 책임인가?

이 결정이 내려지면, `scope.ts` + `dispatch.ts` 수정 + `registry.ts` scoped handler 저장소 추가로 구현을 시작할 수 있다.
