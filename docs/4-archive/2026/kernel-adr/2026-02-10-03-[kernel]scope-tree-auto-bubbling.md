# Kernel Scope Tree Auto Bubbling

> 날짜: 2026-02-10
> 태그: kernel, scope, bubbling, design
> 상태: 제안

---

## 1. 문제

현재 Kernel의 scope bubbling은 **외부에서 scope chain 배열을 직접 조립**해서 넘겨야 한다.

```typescript
// OSKernelDemo.tsx — 수동 조립
kernel.dispatch(ACTION(), {
  scope: [DEMO_SCOPE, GLOBAL as ScopeToken],
});
```

Zone이 중첩되면 이 배열을 누군가 만들어야 한다:

```
App > Sidebar > TodoList > TodoItem
→ [TODO_ITEM, TODO_LIST, SIDEBAR, APP, GLOBAL]
```

지금은 이 책임이 전적으로 사용측(OS 레이어)에 있다. 단순한 상태관리 용도에서도 scoped command를 쓰려면 scope chain을 수동으로 조립해야 하는 friction이 있다.

---

## 2. 핵심 발견: group() 호출에 이미 트리 정보가 존재한다

`group()` 메서드는 부모 scope의 클로저 안에서 호출된다. 부모-자식 관계가 **이미 암묵적으로 존재**하지만 기록하지 않고 버리고 있다.

```typescript
// createKernel.ts:425-431 현재 코드
group(config) {
  const childScope = config.scope ? (config.scope as string) : scope;
  //                                                           ^^^^^ 이게 parent
  const childTokens = (config.inject ?? []) as NewTokens;
  return createGroup(childScope, childTokens);
  // → parent 정보가 여기서 소실됨
}
```

`group()` 중첩이 곧 트리 선언이다:

```typescript
const kernel = createKernel(state);               // GLOBAL
const sidebar = kernel.group({ scope: SIDEBAR });  // GLOBAL → SIDEBAR
const todo = sidebar.group({ scope: TODO_LIST });  // GLOBAL → SIDEBAR → TODO_LIST
const item = todo.group({ scope: TODO_ITEM });     // GLOBAL → SIDEBAR → TODO_LIST → TODO_ITEM
```

---

## 3. 제안: parentMap 기반 자동 버블링

### 3.1 데이터 구조 추가

`createKernel` 클로저에 `parentMap`을 추가한다.

```typescript
// createKernel 클로저 내부
const parentMap = new Map<string, string>(); // childScope → parentScope
```

### 3.2 group()에서 부모 관계 등록

`createGroup.group()` 메서드에서 자식 scope 생성 시 부모 관계를 기록한다.

```typescript
group(config) {
  const childScope = config.scope ? (config.scope as string) : scope;
  const childTokens = (config.inject ?? []) as NewTokens;

  // ✅ 부모-자식 관계 등록 (새 scope가 생성될 때만)
  if (childScope !== scope) {
    parentMap.set(childScope, scope);
  }

  return createGroup(childScope, childTokens);
}
```

### 3.3 buildBubblePath 내부 함수

parentMap을 역추적하여 scope chain을 자동 생성한다.

```typescript
function buildBubblePath(startScope: string): ScopeToken[] {
  const path: string[] = [startScope];
  let current = startScope;

  while (parentMap.has(current)) {
    current = parentMap.get(current)!;
    path.push(current);
  }

  // GLOBAL이 경로 끝에 없으면 추가
  if (path[path.length - 1] !== (GLOBAL as string)) {
    path.push(GLOBAL as string);
  }

  return path as ScopeToken[];
}
```

결과 예시:

```
buildBubblePath("TODO_ITEM")
→ ["TODO_ITEM", "TODO_LIST", "SIDEBAR", "GLOBAL"]
```

### 3.4 dispatch에서 자동 확장

CommandFactory가 생성한 Command에는 이미 단일 scope가 부여되어 있다 (`scope: [TODO_LIST]`). dispatch에서 이 단일 scope를 자동으로 전체 bubble path로 확장한다.

```typescript
function dispatch(
  cmd: Command<string, any>,
  options?: { scope?: ScopeToken[] },
): void {
  let enriched = options?.scope ? { ...cmd, scope: options.scope } : cmd;

  // ✅ scope가 단일 토큰이면 트리를 걸어올라감
  if (enriched.scope?.length === 1) {
    const startScope = enriched.scope[0] as string;
    if (parentMap.has(startScope)) {
      enriched = { ...enriched, scope: buildBubblePath(startScope) };
    }
  }

  queue.push(enriched as Command);

  if (processing) return;
  // ... (기존 로직 동일)
}
```

**동작 규칙:**

| 케이스 | 입력 | 동작 |
|---|---|---|
| scope 없음 | `dispatch(INCREMENT())` | `[GLOBAL]` fallback (기존 동작) |
| 단일 scope + parentMap 존재 | `dispatch(TOGGLE())` (scope: `[TODO_LIST]`) | 자동 확장 → `[TODO_LIST, SIDEBAR, GLOBAL]` |
| 단일 scope + parentMap 없음 | `dispatch(TOGGLE())` (scope: `[ORPHAN]`) | 확장 안 함 → `[ORPHAN]` + GLOBAL fallback |
| 다중 scope (수동 지정) | `dispatch(cmd, { scope: [A, B, C] })` | 그대로 사용 (OS 동적 케이스) |

### 3.5 선택적: 외부 노출 API

디버깅 및 OS 레이어 활용을 위해 트리 조회 API를 노출할 수 있다.

```typescript
return {
  ...root,
  // 기존 API...

  // ✅ Scope Tree (선택적 노출)
  getScopeParent(scope: ScopeToken): ScopeToken | null,
  getScopePath(scope: ScopeToken): ScopeToken[],  // = buildBubblePath
};
```

---

## 4. 사용측 변화 (Before → After)

### 4.1 단일 상태관리 (scope 없이)

변화 없음. 기존과 동일하게 동작한다.

```typescript
const kernel = createKernel<{ count: number }>({ count: 0 });
const INC = kernel.defineCommand("INC", (ctx) => () => ({
  state: { ...ctx.state, count: ctx.state.count + 1 },
}));
kernel.dispatch(INC()); // → GLOBAL에서 처리
```

### 4.2 Scoped command (Before)

```typescript
const TODO = defineScope("TODO_LIST");
const todoGroup = kernel.group({ scope: TODO });

const TOGGLE = todoGroup.defineCommand("TOGGLE", handler);
// TOGGLE() → Command { scope: [TODO_LIST] }

// ❌ 수동으로 bubble path 조립 필요
kernel.dispatch(TOGGLE(), {
  scope: [TODO, GLOBAL],
});
```

### 4.3 Scoped command (After)

```typescript
const TODO = defineScope("TODO_LIST");
const todoGroup = kernel.group({ scope: TODO });

const TOGGLE = todoGroup.defineCommand("TOGGLE", handler);
// TOGGLE() → Command { scope: [TODO_LIST] }

// ✅ dispatch만 하면 커널이 자동으로 [TODO_LIST, GLOBAL] 생성
kernel.dispatch(TOGGLE());
```

### 4.4 중첩 scope (After)

```typescript
const SIDEBAR = defineScope("SIDEBAR");
const TODO = defineScope("TODO_LIST");
const ITEM = defineScope("TODO_ITEM");

const sidebarGroup = kernel.group({ scope: SIDEBAR });
const todoGroup = sidebarGroup.group({ scope: TODO });
const itemGroup = todoGroup.group({ scope: ITEM });

const DELETE = itemGroup.defineCommand("DELETE", handler);

// ✅ group 중첩 순서대로 자동 버블링
kernel.dispatch(DELETE());
// → [TODO_ITEM, TODO_LIST, SIDEBAR, GLOBAL]
```

### 4.5 OS 동적 케이스 (변화 없음)

OS에서 포커스 위치에 따라 동적으로 scope chain을 계산하는 경우, 기존처럼 `options.scope`로 오버라이드한다.

```typescript
// OS Sensor에서 동적 bubble path 계산
const dynamicPath = osBuildBubblePath(focusedZoneId);
kernel.dispatch(ACTION(), { scope: dynamicPath });
// → 자동 확장 건너뜀 (다중 scope이므로)
```

---

## 5. 정적 트리 vs 동적 트리

이 제안은 **정적 트리**(코드에서 `group()` 중첩으로 정의)만 지원한다.

### 정적 트리 (Kernel이 지원)

코드 로드 시점에 확정되는 구조. 앱의 도메인 모듈 구조.

```typescript
// 모듈 로드 시 한 번 정의 → 불변
const kernel = createKernel(state);
const app = kernel.group({ scope: APP });
const sidebar = app.group({ scope: SIDEBAR });
const todo = sidebar.group({ scope: TODO });
```

```
GLOBAL
└── APP
    ├── SIDEBAR
    │   └── TODO
    └── MAIN
        └── DETAIL
```

**적합한 경우:**
- 도메인 모듈 간 커맨드 bubbling (App → Feature → Global)
- 단일 상태관리에서 모듈별 scope 분리
- 플러그인 시스템 (플러그인 scope → App scope → Global)

### 동적 트리 (OS가 관리)

DOM 구조와 포커스 위치에 따라 런타임에 변하는 경로.

```
같은 <TodoList> 컴포넌트가:
- Sidebar에 렌더되면: [TODO_LIST, SIDEBAR, GLOBAL]
- MainContent에 렌더되면: [TODO_LIST, MAIN, GLOBAL]
→ 포커스 위치에 따라 경로가 달라짐
```

**이 케이스는 OS 레이어의 `buildBubblePath(focusedZoneId)`가 담당.**
Kernel은 `dispatch(cmd, { scope })` 오버라이드를 통해 수용한다.

### 공존 규칙

| 우선순위 | 조건 | 동작 |
|---|---|---|
| 1 | `dispatch(cmd, { scope: [...] })` 명시적 지정 | 그대로 사용 |
| 2 | `cmd.scope` 단일 토큰 + parentMap 등록됨 | 자동 확장 |
| 3 | `cmd.scope` 단일 토큰 + parentMap 없음 | `[scope, GLOBAL]` |
| 4 | scope 없음 | `[GLOBAL]` |

---

## 6. 구현 비용

### 변경 파일

`packages/kernel/src/createKernel.ts` — 이 파일만 수정.

### 변경량

| 위치 | 내용 | 줄 수 |
|---|---|---|
| 클로저 상단 | `const parentMap = new Map<string, string>()` | +1 |
| `createGroup.group()` | `parentMap.set(childScope, scope)` | +3 |
| 새 내부 함수 | `buildBubblePath(scope)` | +12 |
| `dispatch()` | 단일 scope 자동 확장 분기 | +5 |
| (선택) 반환 객체 | `getScopePath`, `getScopeParent` | +6 |

**총 ~25줄 추가. API 변경 없음. 기존 동작 100% 호환.**

### 테스트 추가

- `parentMap` 등록 검증: `group()` 중첩 시 부모 관계 기록
- `buildBubblePath` 검증: 단일 scope → 전체 경로 생성
- `dispatch` 자동 확장 검증: 단일 scope command가 전체 경로로 확장
- 수동 scope 오버라이드 검증: `options.scope` 지정 시 자동 확장 건너뜀
- 기존 테스트 회귀 없음 검증

---

## 7. 설계 원칙 준수 확인

| 원칙 | 위반 여부 |
|---|---|
| Kernel은 DOM을 모른다 | ✅ 위반 없음 — 순수 Map 기반, DOM 참조 없음 |
| Kernel은 입력 소스를 모른다 | ✅ 위반 없음 |
| scope는 문자열 배열 | ✅ 변함없음 — 자동 생성된 것도 문자열 배열 |
| `dispatch(cmd, { scope })` 오버라이드 | ✅ 유지됨 — OS 동적 케이스 지원 |
| 하위 호환 | ✅ scope 없는 커맨드는 기존과 동일하게 `[GLOBAL]` |
| API 추가 최소화 | ✅ 기존 `group()` 시그니처 변경 없음 |

---

## 8. 요약

**`group()` 중첩 = 트리 선언.** 이미 존재하는 부모-자식 관계를 `parentMap`에 기록하고, dispatch 시 단일 scope를 자동으로 전체 bubble path로 확장한다.

- 단일 상태관리: scope chain 수동 조립 불필요
- OS 동적 케이스: 기존 `dispatch(cmd, { scope })` 오버라이드 유지
- 구현 비용: ~25줄, createKernel.ts 한 파일, API 변경 없음
