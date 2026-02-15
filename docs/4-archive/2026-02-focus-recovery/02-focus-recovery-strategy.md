# 포커스 복구 전략: OS 기능인가, 앱 책임인가?

## 1. 개요

아이템이 삭제될 때, 포커스가 사라진다. 이 **"포커스 복구(Focus Recovery)"**를 누가 처리해야 하는가?

현재 상태:
- `resolveRecovery.ts` — OS에 순수 함수가 존재하지만 **아무도 호출하지 않음**
- `DELETE.ts` — OS 커맨드가 `deleteCommand`를 앱에 위임만 함
- `DeleteTodo` (앱) — 앱이 직접 복구 대상을 계산하고 `FOCUS_ID` effect를 push
- `navigationMiddleware` (앱) — 앱이 동기적으로 store + DOM 업데이트

---

## 2. 🔴 Red Team: OS가 해야 한다

### 논거

**1. DRY 원칙 위반**
모든 앱이 `DeleteItem` 핸들러에서 동일한 로직을 반복해야 한다:
```typescript
// Todo 앱
const visibleIds = state.data.todoOrder.filter(...);
const currentIdx = visibleIds.indexOf(targetId);
const recoveryId = currentIdx < visibleIds.length - 1 
    ? visibleIds[currentIdx + 1] 
    : visibleIds[currentIdx - 1];
```
Issue Tracker, Mail, Builder... 모든 앱에서 이 코드가 **복사**된다.

**2. OS는 이미 모든 정보를 갖고 있다**
`DELETE.ts`가 실행되는 시점에서 OS는 이미 알고 있다:
- `ctx.focusedItemId` — 현재 포커스된 아이템
- `ctx.dom.items` — Zone 내 모든 아이템 목록 (DOM 순서)
- `ctx.config.navigate.recovery` — Zone이 선언한 복구 전략 (`next`/`prev`/`nearest`)

이걸 왜 앱에 떠넘기나?

**3. `resolveRecovery`가 이미 존재한다**
OS에 완벽한 순수 함수가 있다. 전략 패턴까지 지원한다. 그런데 아무도 호출하지 않는다. 이것은 설계 의도가 **OS 레벨**이었다는 증거다.

**4. 앱이 실수할 수 있다**
앱 개발자가 복구 로직을 잊으면? 포커스가 `<body>`로 떨어진다. 키보드 사용자는 완전히 길을 잃는다. **접근성 위반**이다. OS가 기본 안전망을 제공해야 한다.

**5. 타입 불일치 함정**
앱이 직접 처리하면 string/number ID 변환을 매번 신경 써야 한다 (실제로 이 세션에서 `indexOf` 버그가 발생했다). OS가 일괄 처리하면 이 함정이 한 곳에서 해결된다.

### Red Team 제안: OS DELETE에 자동 복구 내장
```typescript
// DELETE.ts (Red Team 제안)
export const DELETE: OSCommand<{ targetId?: string }> = {
    run: (ctx, payload) => {
        const targetId = payload?.targetId ?? ctx.focusedItemId;
        if (!targetId || !ctx.deleteCommand) return null;

        // OS가 자동으로 복구 계산
        const recovery = resolveRecovery(
            targetId, ctx.focusedItemId, ctx.dom.items,
            ctx.config.navigate.recovery
        );

        const result: OSResult = { dispatch: ctx.deleteCommand };

        if (recovery.changed && recovery.targetId) {
            result.state = { focusedItemId: recovery.targetId };
            result.domEffects = [{ type: 'FOCUS', targetId: recovery.targetId }];
        }

        return result;
    }
};
```

---

## 3. 🔵 Blue Team: 앱이 해야 한다

### 논거

**1. OS는 삭제의 결과를 모른다**
`deleteCommand`는 앱에 위임된다. OS는:
- 삭제가 **성공**할지 모른다 (서버 에러, 낙관적 업데이트 실패)
- **어떤 아이템이 사라지는지** 모른다 (필터링된 뷰에서의 삭제, cascade 삭제)
- **삭제 후 뷰가 어떻게 바뀌는지** 모른다 (카테고리 필터링으로 인한 visible items 변화)

**2. DOM items ≠ 앱의 visible items**
OS의 `ctx.dom.items`는 **현재 DOM에 렌더링된 아이템**이다. 하지만 삭제 후:
- React가 리렌더하면 아이템 목록이 바뀐다
- 필터링된 뷰에서는 DOM 순서와 데이터 순서가 다를 수 있다
- 빈 상태(empty state) UI가 나타날 수 있다

OS가 "삭제 전 DOM"을 기준으로 계산하면, 삭제 후 실제 DOM과 불일치가 발생한다.

**3. "예측적 실패" 위험**
OS가 삭제 전에 포커스를 이동하면:
1. 포커스가 다음 아이템으로 이동
2. 앱의 `deleteCommand`가 서버 에러로 실패
3. 포커스는 이미 이동했는데, 아이템은 안 지워짐
→ **상태 불일치**

**4. 앱만이 "올바른 복구 대상"을 안다**
- Todo: 같은 카테고리의 다음 아이템
- Mail: 같은 라벨의 다음 메일
- Builder: 부모 블록으로 이동
- Tree: 형제 노드 또는 부모 노드

**"다음 아이템"의 정의가 앱마다 다르다.**

**5. Command-Level Hygiene 원칙**
v8.201.60 표준은 명시적으로 선언한다:
> "Application Command Handler is responsible for identifying the next focus target, dispatching a focus update, and executing the actual removal."

이것은 의도적 설계 결정이다.

### Blue Team 입장: 현재 구조 유지 + 헬퍼 제공
```typescript
// OS는 유틸리티만 제공 (이미 존재하는 resolveRecovery)
// 앱이 필요할 때 호출
export const DeleteTodo = defineListCommand({
    run: (state, payload) => produce(state, (draft) => {
        // 앱이 자신의 도메인 지식으로 복구 대상 계산
        const visibleIds = getVisibleTodos(state); // 앱만 아는 필터 로직
        const recoveryId = findNextInCategory(visibleIds, targetId);
        
        delete draft.data.todos[targetId];
        if (recoveryId) draft.effects.push({ type: 'FOCUS_ID', id: recoveryId });
    }),
});
```

---

## 4. 🟣 제3의 길: 하이브리드 전략

### 핵심 아이디어: **OS Default + App Override**

| 레이어 | 책임 | 시점 |
|--------|------|------|
| **OS (Safety Net)** | `FocusSync`에서 `focusedItemId`가 DOM에 없으면 자동 복구 | 삭제 **후** (React 렌더 후) |
| **App (Precision)** | 앱이 `FOCUS_ID` effect로 정밀 복구 대상 지정 | 삭제 **전** (Command 내부) |

```
[삭제 요청]
    ↓
[앱 핸들러] → FOCUS_ID effect 있음? → 앱이 지정한 대상으로 포커스 ✅
    ↓ (effect 없음)
[React 렌더] → focusedItemId가 DOM에서 사라짐
    ↓
[FocusSync 감지] → resolveRecovery로 자동 복구 (Safety Net) ✅
```

### 장점
- 앱이 복구 로직을 **잊어도** OS가 잡아줌 (접근성 보장)
- 앱이 정밀 제어를 **원하면** effect로 오버라이드 가능
- `resolveRecovery`가 드디어 **사용됨**
- 기존 앱 코드 변경 불필요 (하위 호환)

### 구현 위치
```
FocusSync.tsx (Phase 5)
├── 매 렌더 후 focusedItemId 검증
├── DOM에 없으면 → resolveRecovery() 호출
└── 새 대상으로 store 업데이트 + DOM focus
```

---

## 5. 결론 / 제안

### 최종 권장: **하이브리드 (Option 3)**

| 기준 | App-Only (현재) | OS-Only | 하이브리드 |
|------|:---:|:---:|:---:|
| DRY | ❌ | ✅ | ✅ |
| 정밀 제어 | ✅ | ❌ | ✅ |
| 접근성 안전망 | ❌ | ✅ | ✅ |
| 예측적 실패 방지 | ✅ | ❌ | ✅ |
| 하위 호환 | ✅ | ❌ | ✅ |
| 구현 복잡도 | 낮음 | 중간 | 중간 |

### 구현 우선순위
1. **FocusSync에 Safety Net 추가** — `focusedItemId`가 DOM에 없을 때 자동 복구
2. **DELETE.ts는 현재대로 유지** — 앱에 위임만 함
3. **앱은 선택적으로 정밀 복구** — `FOCUS_ID` effect 사용 (현재 Todo처럼)
4. **`resolveRecovery`를 FocusSync에서 활용** — 드디어 연결

---
*Interaction OS Focus Recovery Strategy Analysis (2026-02-07)*
