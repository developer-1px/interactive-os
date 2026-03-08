# 🔍 삽질 일지: Headless Trigger Click이 커맨드를 디스패치하지 못하는 이유

> 날짜: 2026-03-08
> 실행 명령: `npx vitest run tests/headless/apps/todo/todo-trigger-click.test.ts`
> 결과: 5개 실패 / 2개 통과

## 증상

`page.click("start-edit")` 등 트리거 ID로 클릭하면 아무 일도 일어나지 않는다.
키보드 단축키(Delete, Meta+ArrowDown)는 정상 동작한다 (대조군 2개 통과).

| 테스트 | 결과 | 기대 | 실제 |
|--------|------|------|------|
| click 'start-edit' | FAIL | editingId = "todo_1" | null |
| click 'move-item-down' | FAIL | todoOrder[0] = "todo_2" | "todo_1" |
| click 'move-item-up' | FAIL | todoOrder[0] = "todo_2" | "todo_1" |
| click 'delete-todo' | FAIL | todoOrder에 "todo_1" 없음 | 있음 |
| click 'toggle-todo' | FAIL | completed = true | false |
| keyboard Delete (control) | PASS | — | — |
| keyboard Meta+ArrowDown (control) | PASS | — | — |

## 삽질 과정

### 1단계: simulateClick 코드 추적

`page.click("start-edit")` → `simulateClick(os, "start-edit")` (simulate.ts:245).

simulateClick에는 두 경로가 있다:
- **Standalone**: trigger가 어떤 Zone의 getItems()에도 없을 때 (line 263)
- **Zone-bound**: trigger가 Zone의 item일 때 (line 338)

`ZoneRegistry.findZoneByItemId("start-edit")`를 확인했다. 이 함수는 `entry.getItems()`에 itemId가 포함된 Zone을 찾는다(zoneRegistry.ts:290-297). "start-edit"은 Zone의 **item이 아니라 trigger**이므로 `getItems()`에 없다 → `null` 반환.

따라서 **Standalone 경로**를 탄다.

### 2단계: Standalone 경로 추적

```typescript
// simulate.ts:263-284
if (itemCb?.onActivate && !triggerZoneId) {
  const activeZoneId = readActiveZoneId(kernel);
  const focusId = activeZoneId
    ? (readFocusedItemId(kernel, activeZoneId) ?? "")
    : "";
  const cmd = typeof itemCb.onActivate === "function"
    ? itemCb.onActivate(focusId)   // ← focusId = "todo_1" (string)
    : itemCb.onActivate;
  kernel.dispatch(cmd);
  return;
}
```

`findItemCallback("start-edit")`는 `ZoneRegistry.itemCallbacks`를 전역 검색하여 찾는다 (zoneRegistry.ts:300-306). `page.goto()`가 트리거를 등록하므로 (page.ts:346-359) 콜백은 존재한다.

activeZoneId는 테스트에서 `page.locator("#todo_1").click()` 이후 설정됨. focusId = "todo_1".

**`onActivate("todo_1")`이 호출된다.**

### 3단계: onActivate의 정체 — 페이로드 형태 불일치 발견

`zone.trigger("start-edit", startEdit)` (defineApp/index.ts:281-305):
```typescript
const onActivate = typeof commandOrFactory === "function"
  ? (commandOrFactory as (focusId: string) => BaseCommand)  // type-only cast!
  : commandOrFactory;
```

`startEdit`은 `CommandFactory<"startEdit", { id: string }>`이다.
런타임에서 `startEdit`은 `(payload) => ({ type: "startEdit", payload, scope })` 형태.

**호출**: `startEdit("todo_1")` → `{ type: "startEdit", payload: "todo_1" }` (string 페이로드!)

**기대**: `startEdit({ id: "todo_1" })` → `{ type: "startEdit", payload: { id: "todo_1" } }` (object 페이로드)

### 4단계: 핸들러에서 무슨 일이 일어나나

```typescript
// todo/app.ts:137-143
const startEdit = listCollection.command("startEdit",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      if (!payload.id) return;       // ← payload = "todo_1", payload.id = undefined → early return!
      draft.ui.editingId = payload.id;
    }),
  }),
);
```

`payload`가 string `"todo_1"`이므로 `payload.id`는 `undefined`.
`if (!payload.id) return;` → 아무 것도 안 함. **상태 불변**.

같은 패턴이 모든 5개 트리거 커맨드에 적용된다:
- `toggleTodo`: `draft.data.todos[payload.id]` → `draft.data.todos[undefined]` → `undefined` → no-op
- `remove`: `payload.id` → `undefined` → findIndex 실패 → no-op
- `moveUp/moveDown`: `payload.id` → `undefined` → findIndex 실패 → no-op

### 5단계: 마이그레이션 전 코드와 비교

**Before (trigger-unify 전)**:
```typescript
triggers: [{
  id: "start-edit",
  onActivate: (focusId) => startEdit({ id: focusId })  // ← 올바른 래핑!
}]
```

**After (trigger-unify 후)**:
```typescript
triggers: [listCollection.trigger("start-edit", startEdit)]
// → onActivate = startEdit (factory 자체, 래핑 없음)
```

마이그레이션 전에는 `(focusId) => startEdit({ id: focusId })`로 focusId를 `{ id }` 객체로 감쌌다.
마이그레이션 후 `zone.trigger(id, factory)`는 factory를 그대로 저장하므로 래핑이 사라졌다.

**그러나** 이 테스트 파일 헤더에는 "trigger callbacks are not registered in headless mode"라고 기술되어 있다. 테스트가 trigger-unify 이전부터 존재했다면, 이전에도 같은 문제였을 수 있다. trigger-unify 이전에는 수동 래핑이 있었으므로 payload는 올바르지만, 다른 이유로 실패했을 수도 있다.

**현재 코드 기준 근본 원인은 명확하다: payload 형태 불일치.**

## 원인 추정 — 5 Whys

1. **왜 트리거 클릭이 상태를 변경하지 않나?**
   → 커맨드 핸들러가 `payload.id`를 읽지만 `undefined`라서 early return.

2. **왜 `payload.id`가 `undefined`인가?**
   → `startEdit("todo_1")` 호출 시 payload가 string `"todo_1"`이 되어 `.id` 프로퍼티가 없다.

3. **왜 string으로 호출되나?**
   → `simulateClick` standalone 경로가 `onActivate(focusId)`로 raw string을 전달한다 (simulate.ts:271).

4. **왜 onActivate가 raw string을 받도록 설계됐나?**
   → `zone.trigger(id, factory)` API가 CommandFactory를 `(focusId: string) => BaseCommand`로 **type-only cast** 한다 (defineApp/index.ts:290). 런타임에서는 여전히 원래 payload 타입(`{ id: string }`)을 기대한다. 이 cast는 **거짓말**이다.

5. **왜 이 불일치가 발생했나?**
   → `zone.trigger()` API 설계 시, factory의 payload 타입이 항상 `focusId: string`과 호환될 것이라 가정했다. 실제로는 대부분의 커맨드가 `{ id: string }` 구조체를 기대한다. **focusId → payload 변환 레이어가 빠져있다.**

→ **근본 원인**: `zone.trigger(id, factory)`는 factory를 그대로 `onActivate`에 저장하지만, headless `simulateClick`은 `onActivate(focusId)` — raw string으로 호출한다. `focusId: string` → `payload: { id: string }` 변환이 없다.

→ **확신도**: 높음 (코드 경로 완전 추적, 핸들러의 early return까지 확인)

## 다음 액션 제안

**방향 A — `zone.trigger()` 내부에서 자동 래핑**:
```typescript
// factory path에서 focusId → { id: focusId } 자동 변환
const onActivate = typeof commandOrFactory === "function"
  ? (focusId: string) => (commandOrFactory as Function)({ id: focusId })
  : commandOrFactory;
```
장점: 호출부 코드 변경 없음. 단점: 모든 factory가 `{ id }` 페이로드를 쓴다는 가정.

**방향 B — `zone.trigger()`에 매퍼 옵션 추가**:
```typescript
zone.trigger("start-edit", startEdit, (focusId) => ({ id: focusId }))
```
장점: 명시적, 타입 안전. 단점: 호출부 verbose.

**방향 C — `simulateClick`이 payload 구조를 존중**:
standalone 경로에서 `onActivate(focusId)` 대신 `onActivate({ id: focusId })` 호출.
단점: onActivate가 BaseCommand(object)인 경우와 충돌.

**권장: 방향 A** — Collection 커맨드의 payload는 일관되게 `{ id: string }`이므로, `zone.trigger()`가 factory를 감싸는 것이 가장 자연스럽다. void payload factory는 `() => cmd`이므로 extra arg가 무시되어 호환됨.
