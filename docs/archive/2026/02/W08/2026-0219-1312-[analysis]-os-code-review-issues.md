# OS 코드 리뷰 — 발견 사항 상세 분석

| 항목 | 값 |
|------|-----|
| 원문 | `OS @/review @/solve` → `@/inbox 각 문제를 상세히 설명해봐` |
| 내(AI)가 추정한 의도 | 코드 리뷰에서 발견된 기술 부채를 정확히 이해하고, 각각의 위험도와 해결 난이도를 판단하여 우선순위를 정하고 싶다. |
| 날짜 | 2026-02-19 |
| 상태 | 📥 Inbox |

---

## 1. 개요

`/review` 워크플로우로 `src/os/` 전체를 점검한 결과, 프로덕션 코드에서 8건의 이슈를 발견했다.
테스트 코드의 `as any` (24건)는 테스트 편의를 위한 것으로 별도 분류한다.

---

## 2. 상세 분석

### Issue #1 — `defineApp.ts:150-151` — 커맨드 등록 경로의 타입 우회 🔴

**파일**: `src/os/defineApp.ts` (line 148-152)
```typescript
const factory = targetGroup.defineCommand(
  type,
  kernelHandler as any,   // 🔴
  whenGuard as any,        // 🔴
) as unknown as CommandFactory<T, P>;
```

**문제**: `defineCommand`의 오버로드 시그니처가 `(type, handler)` 또는 `(type, tokens[], handler)` 2가지인데, **3번째 인자로 `whenGuard` 옵션 객체를 전달**하고 있다. 이 호출 패턴은 `defineCommand`의 공식 시그니처에 존재하지 않는다.

**왜 위험한가**:
- `whenGuard`는 `{ when: (state) => boolean }` 형태의 객체다. `defineCommand`가 이것을 올바르게 처리하려면 내부에 이 시그니처를 지원하는 분기가 있어야 한다.
- `as any`가 타입 시스템을 완전히 우회하므로, `defineCommand`의 시그니처가 변경되면 **컴파일 타임에 감지할 수 없다**.
- 이것은 "커맨드 등록" 경로 — 앱 전체의 인터랙션이 이 코드를 통과한다. 런타임 오류 시 모든 앱이 동시에 깨진다.

**근본 원인**: `defineCommand`가 **`when` guard 옵션을 공식 API로 지원하지 않기 때문**이다. `defineApp`이 비공식 내부 경로를 통해 guard를 주입하고 있다.

**해결 방향**:
- A) `defineCommand` 시그니처에 `options?: { when? }` 을 공식 추가
- B) `when` guard를 미들웨어로 분리 (현재 `historyMiddleware`가 이미 이 패턴)

---

### Issue #2 — `defineApp.testInstance.ts:98-99,152` — 동일 패턴 (테스트 인스턴스) 🔴

**파일**: `src/os/defineApp.testInstance.ts`
```typescript
const factory = targetGroup.defineCommand(
  type,
  kernelHandler as any,   // line 98
  whenGuard as any,        // line 99
) as unknown as CommandFactory<T, P>;

// ...
} as any;                   // line 152
```

**문제**: Issue #1과 정확히 **같은 원인**이다. 프로덕션 `defineApp.ts`의 `registerCommand` 로직이 `defineApp.testInstance.ts`에 복제(!)되어 있다. 이것은 이번 세션에서 해결한 "command handler 복제" 문제와 **동일한 패턴**이다.

**왜 위험한가**:
- Rule #11 위반: 복제본 동기화 문제
- `defineCommand` 시그니처 변경 시 두 곳을 모두 수정해야 함

**해결 방향**: `register()` 패턴을 `defineApp`에도 적용하거나, `registerCommand` 로직을 공유 함수로 추출

---

### Issue #3 — `FocusItem.tsx:228-229` — React ref 접근의 `as any` 🔴

**파일**: `src/os/6-components/base/FocusItem.tsx`
```typescript
const combinedRef = useMemo(
  () => composeRefs(ref, internalRef, (childElement as any)?.ref),
  [ref, (childElement as any)?.ref],
);
```

**문제**: React 19에서 `element.ref`는 더 이상 직접 접근 가능한 속성이 아니다. `React.Children` API나 `forwardRef`를 통한 ref 전달이 공식 패턴이며, `element.ref` 직접 접근은 deprecated 경로이다.

**왜 위험한가**:
- React 19 업그레이드 시 `element.ref`가 `undefined`를 반환할 수 있고, 이 경우 **ref가 사라져서 FocusItem이 DOM element에 .focus()를 호출하지 못하게 된다**.
- `useMemo` deps 배열에 `(childElement as any)?.ref`가 포함되어 있어, ref가 undefined가 되면 memo가 의미 없이 매 렌더마다 재실행된다.

**해결 방향**:
- `useImperativeHandle` 또는 React 19의 `ref as prop` 패턴으로 전환
- 단기적으로는 `asChild`일 때 child element에서 ref를 추출하는 유틸 함수를 만들어 React 버전별 분기 처리

---

### Issue #4 — `Trigger.tsx:131` — `MouseEvent` 타입 불일치 🟡

**파일**: `src/os/6-components/6-project/Trigger.tsx`
```typescript
onClick?.(e as any);
```

**문제**: `onClick`은 `React.MouseEventHandler<HTMLElement>`이고, `e`는 `ReactMouseEvent` (제네릭 없음)다. 제네릭 파라미터 불일치. React의 `MouseEvent<HTMLElement>`는 `MouseEvent`의 서브타입이므로 `MouseEvent`를 `MouseEvent<HTMLElement>`로 넘기면 타입 에러가 발생한다.

**왜 위험한가**: 실제 런타임 문제는 없다. `MouseEvent`의 모든 속성이 동일하기 때문. 하지만 타입 안전성 원칙 위반.

**해결 방향**: 
```typescript
onClick?.(e as ReactMouseEvent<HTMLElement>);
```
한 줄 수정으로 해결.

---

### Issue #5 — `Trigger.tsx:147,162` — `child.type` 비교와 `portalElement.props` 🟡

**파일**: `src/os/6-components/6-project/Trigger.tsx`
```typescript
if (isValidElement(child) && (child.type as any) === TriggerPortal) {
  // ...
  cloneElement(portalElement, {
    ...(portalElement.props as any),
    _overlayId: overlayId,
    _overlayType: overlayRole,
  })
}
```

**`child.type as any` 문제**: React의 `ReactElement.type`은 `string | JSXElementConstructor<any>`인데, 함수 컴포넌트인 `TriggerPortal`과 직접 비교하려면 타입 캐스팅이 필요하다. 이것은 **React의 compound component 패턴에서 흔히 발생하는 구조적 한계**다.

**`portalElement.props as any` 문제**: `ReactElement`의 `props` 타입이 기본적으로 `unknown`이기 때문. `portalElement`를 `ReactElement<TriggerPortalProps>`로 캐스팅하면 해결된다.

**동일 패턴**: `Dialog.tsx:88`의 `(child.type as any) === DialogContent`도 정확히 같은 원인.

**왜 위험한가**: 중간 정도. `child.type` 비교는 React 내부 동작에 의존하며, **React Server Components 등에서 직렬화될 경우 type 참조가 깨질 수 있다**. 하지만 현재 CSR 전용이므로 당장은 안전.

**해결 방향**:
- `displayName` 기반 비교 (덜 안전하지만 `as any` 제거)
- 또는 `ReactElement<TriggerPortalProps>` 타입 단언 (조건부)
- 또는 sentinel prop 기반 마커: `__isTriggerPortal: true`

---

### Issue #6 — `Trigger.tsx:210` — span fallback의 ref/props 타입 우회 🟡

**파일**: `src/os/6-components/6-project/Trigger.tsx`
```typescript
<span ref={ref as any} {...(baseProps as any)}>
```

**문제**: `ref`는 `React.Ref<HTMLElement>`이고 `<span>`은 `HTMLSpanElement`을 기대한다. `baseProps`에는 `onClick` 등이 있는데, `HTMLSpanElement`에는 이벤트 핸들러의 제네릭이 다르다.

**왜 위험한가**: 런타임 문제는 없으나, 이 fallback 경로 자체가 "triggerChildren이 element가 아닌 경우"에만 도달한다. **얼마나 자주 이 경로를 타는지가 위험도를 결정**한다. 거의 안 탄다면 `as any`의 실질적 위험은 낮다.

**해결 방향**:
```typescript
<span ref={ref as React.Ref<HTMLSpanElement>} {...baseProps as React.HTMLAttributes<HTMLSpanElement>}>
```

---

### Issue #7 — `Field.tsx:193` — `useComputed`의 string 반환 🟡

**파일**: `src/os/6-components/6-project/Field.tsx`
```typescript
const activedescendantId = kernel.useComputed((s) => {
  if (target !== "virtual" || !controls) return null;
  const focusedId = s.os.focus.zones[zoneId]?.focusedItemId ?? null;
  return focusedId && focusedId !== name ? focusedId : null;
});
```

**문제**: `useComputed`는 참조 동등성(===)으로 리렌더 여부를 판단한다. `string`은 원시값이므로 값이 같으면 리렌더를 트리거하지 않는다 → **실제 성능 문제는 없다.**

**원래 리뷰에서 이슈로 지적한 이유**: 프로젝트 규칙이 "useComputed는 원시값(boolean, number)"이라고 했고, `string|null`은 원시값이기는 하지만 object/array와 달리 괜찮다.

**재평가**: 🟡 → 🔵. 원칙적으로 문제 없음. string은 immutable primitive이므로 성능 이슈 아님.

---

### Issue #8 — `kernel.ts:38` — `window.__kernel` 타입 우회 🔵

**파일**: `src/os/kernel.ts`
```typescript
if (import.meta.env.DEV) {
  (window as any).__kernel = kernel;
}
```

**문제**: dev-only 디버깅용 코드에서 `window`에 `__kernel`을 붙이는데, `Window` 타입에 이 속성이 선언되어 있지 않다.

**왜 위험한가**: dev-only이므로 프로덕션 영향 없음. 타입 원칙 위반이지만 실질적 위험은 0에 가깝다.

**해결 방향**:
```typescript
declare global {
  interface Window {
    __kernel?: typeof kernel;
  }
}
```
한 줄 선언으로 해결.

---

## 3. 결론 / 제안

### 위험도-난이도 매트릭스

| # | 이슈 | 위험도 | 난이도 | 우선순위 |
|---|------|--------|--------|----------|
| 1 | `defineApp` 커맨드 등록 타입 우회 | 🔴 높음 | 🟡 중간 | **P1** |
| 2 | `defineApp.testInstance` 복제+타입 우회 | 🔴 높음 | 🟡 중간 | **P1** (1과 함께) |
| 3 | `FocusItem` React ref 접근 | 🔴 높음 | 🟡 중간 | **P2** (React 19 전환 시) |
| 4 | `Trigger` MouseEvent 제네릭 | 🟡 낮음 | 🟢 쉬움 | **P3** |
| 5 | `Trigger/Dialog` child.type 비교 | 🟡 중간 | 🟡 중간 | **P3** |
| 6 | `Trigger` span fallback 타입 | 🟡 낮음 | 🟢 쉬움 | **P3** |
| 7 | `Field` activedescendantId string | 🔵 없음 | — | 허위양성 |
| 8 | `kernel.ts` window.__kernel | 🔵 없음 | 🟢 쉬움 | **P4** |

### 권장 실행 순서

1. **P1 (Issue #1, #2)**: `defineCommand`에 `when` guard를 공식 지원하거나, 미들웨어로 분리. `defineApp.testInstance`의 복제 제거.
2. **P2 (Issue #3)**: React 19 마이그레이션 전에 ref 접근 패턴 정리.
3. **P3 (Issue #4, #5, #6)**: 한번에 정리 가능. 예상 소요 30분.
4. **P4 (Issue #8)**: `declare global` 한 줄 추가.

---

## 4. Cynefin 도메인 판정

- Issue #1, #2: 🟡 **Complicated** — `defineCommand`의 API 설계 결정이 필요하지만, 선택지가 명확하다 (공식 옵션 추가 vs 미들웨어 분리).
- Issue #3: 🟡 **Complicated** — React 19 ref 변경사항을 분석하면 답이 좁혀진다.
- Issue #4, #5, #6, #8: 🟢 **Clear** — 타입 캐스팅 교정. Best practice가 명확.
- Issue #7: N/A — 허위양성으로 재판정.

---

## 5. 인식 한계 (Epistemic Status)

- `defineCommand`의 `when` guard 내부 처리 로직은 `createKernel.ts`의 `processCommand` 함수를 직접 확인했으나, 모든 edge case를 검증하지는 못했다.
- React 19의 `element.ref` 변경사항은 공식 RFC 기준이며, 실제 마이그레이션 시 추가 이슈가 있을 수 있다.
- `child.type` 비교 패턴의 RSC 호환성은 미확인 (현재 프로젝트가 CSR 전용이므로 당장의 위험은 없음).

---

## 6. 열린 질문 (Complex Questions)

1. **Issue #1**: `defineCommand`에 `when` guard를 공식 API로 추가할 것인가, 아니면 미들웨어로 분리할 것인가? 이것은 kernel의 API 표면적과 복잡도에 영향을 미치는 설계 결정이다.

---

**한줄요약**: OS 프로덕션 코드에 `as any` 11건 존재하며, P1(커맨드 등록 타입 우회)은 전체 앱에 영향을 미치는 경로이므로 `defineCommand` API 확장이 필요하고, P3(React 타입 불일치)은 30분 내 일괄 정리 가능하다.
