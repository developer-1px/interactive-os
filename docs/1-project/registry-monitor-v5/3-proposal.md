# Registry Monitor v5 — 기술 설계 제안서

## 1. 핵심 문제

v5 커널의 `scopedCommands`는 클로저 안에 갇혀 있다.
외부에서 "어떤 커맨드가 어떤 스코프에 등록되어 있는가"를 알 방법이 없다.

현재 `GroupRegistry`는 이 문제를 **별도 정적 Map으로 우회**했으나:
- v5 `defineCommand()`가 `GroupRegistry.register()`를 호출하지 않음
- 따라서 GroupRegistry에는 수동 등록된 커맨드만 보임
- **데이터 불일치** — 실제 커널과 모니터가 다른 것을 보고 있음

## 2. 설계 방향

### 방향 A: 커널에 Inspector API 추가 ✅ 채택

커널 반환 객체에 `getRegistry()` 메서드를 추가한다.

```ts
// createKernel.ts — 반환에 추가
getRegistry(): {
  commands: Map<string, string[]>;   // scope → commandType[]
  whenGuards: Map<string, string[]>; // scope → commandType[] (with guards)
  scopeTree: Map<string, string>;    // child → parent
  middleware: Map<string, string[]>;  // scope → middleware id[]
  effects: Map<string, string[]>;    // scope → effect id[]
}

// when guard를 현재 state 기준으로 평가 (Inspector 전용)
evaluateWhenGuard(scope: string, type: string): boolean | null;
// null = guard 없음, true/false = 평가 결과
```

**장점:**
- 커널이 유일한 진실의 원천 (Single Source of Truth)
- GroupRegistry 레거시를 완전히 제거 가능
- 커널 핵심 로직 수정 없이 읽기 전용 API만 추가

**위험:**
- `@frozen` 파일에 코드 추가 — but Inspector 영역이므로 기존 `getTransactions()` 패턴과 동일

### 방향 B: defineCommand에서 side-effect로 레지스트리 갱신 ❌ 기각

커맨드 등록 시 외부 이벤트를 fire하는 방식.

**기각 사유:** 커널 핵심 로직에 side-effect 추가. 원칙 위반 ("모든 변경은 하나의 문을 통과한다").

## 3. 구현 계획

### Step 1: 커널 Inspector API 추가

`createKernel.ts`에 `getRegistry()` 추가:

```ts
// 반환 객체에 추가 (getTransactions 옆)
getRegistry() {
  const commands = new Map<string, string[]>();
  for (const [scope, map] of scopedCommands) {
    commands.set(scope, Array.from(map.keys()));
  }
  const whenGuards = new Map<string, string[]>();
  for (const [scope, map] of scopedWhenGuards) {
    whenGuards.set(scope, Array.from(map.keys()));
  }
  const scopeTree = new Map(parentMap);
  const middleware = new Map<string, string[]>();
  for (const [scope, mws] of scopedMiddleware) {
    middleware.set(scope, mws.map(m => m.id));
  }
  const effects = new Map<string, string[]>();
  for (const [scope, map] of scopedEffects) {
    effects.set(scope, Array.from(map.keys()));
  }
  return { commands, whenGuards, scopeTree, middleware, effects };
},
```

### Step 2: RegistryMonitor v5 재작성

**데이터 소스:** `kernel.getRegistry()` 직접 호출
**렌더링 구조:**

```
┌─────────────────────────────┐
│ 📡 REGISTRY MONITOR         │
├─────────────────────────────┤
│ Scope Tree (접을 수 있음)      │
│  ├─ GLOBAL                  │
│  │  ├─ OS_MOVE_UP           │
│  │  ├─ OS_MOVE_DOWN         │
│  │  └─ ...                  │
│  ├─ app:todo                │
│  │  ├─ TODO_ADD       🟢   │
│  │  ├─ TODO_TOGGLE    🔒   │
│  │  └─ ...                  │
│  └─ zone:sidebar            │
│     └─ SIDEBAR_SELECT       │
├─────────────────────────────┤
│ Summary: 42 commands, 8 scopes │
└─────────────────────────────┘
```

**컴포넌트 구조:**

```
RegistryMonitor (container)
  ├─ ScopeSection (per scope, collapsible)
  │    └─ CommandEntry (per command)
  └─ RegistrySummary (footer stats)
```

### Step 3: CommandEntry 재설계

| 필드 | 소스 | 표시 방식 |
|------|------|-----------|
| `type` | `getRegistry().commands` | 메인 라벨 |
| `scope` | scope key | 부모 섹션 헤더 |
| `hasWhenGuard` | `getRegistry().whenGuards` | 🔒 아이콘 |
| `isLastExecuted` | `getLastTransaction()` | flash 애니메이션 |
| `payload` | 마지막 트랜잭션 | inline 표시 |

### Step 4: GroupRegistry 제거

- `src/inspector/GroupRegistry.ts` 삭제
- 임포트 참조 제거 (RegistryMonitor만 사용 중)

### Step 5: CommandInspector 연동 정리

- `ctx`, `activeKeybindingMap` 등 레거시 props 정리
- 커널 직접 구독으로 전환

## 4. 리스크

| 리스크 | 대응 |
|--------|------|
| `@frozen` 파일 수정 | Inspector 전용 읽기 API만 추가. 핵심 로직 불변. |
| when guard 평가 불가 | 커널 내부에서 평가됨 → 등록 여부만 표시하고 실제 평가는 dispatch 시점에 위임 |
| HMR 시 레지스트리 불일치 | `getRegistry()`는 매 호출마다 클로저 상태를 스냅샷 → 항상 최신 |
| 성능 (대량 커맨드) | `useMemo` + `memo` 유지. 렌더 트리거는 트랜잭션 수 변경 시에만. |

## 5. 변경 범위

| 파일 | 변경 |
|------|------|
| `packages/kernel/src/createKernel.ts` | `getRegistry()` 추가 (~20줄) |
| `packages/kernel/src/index.ts` | export type 추가 (선택적) |
| `src/inspector/panels/RegistryMonitor.tsx` | 전면 재작성 |
| `src/inspector/panels/CommandRow.tsx` | CommandEntry로 리네이밍 + 단순화 |
| `src/inspector/panels/CommandInspector.tsx` | props 정리, 커널 직접 연결 |
| `src/inspector/GroupRegistry.ts` | **삭제** |
