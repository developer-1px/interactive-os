# Code Review — OS (src/os/)

> 2026-02-16 21:04
> Scope: `src/os/` 전체 (test 제외)

---

## 결과 요약

| 심각도 | 건수 |
|--------|------|
| 🔴 철학 위반 | 2 |
| 🟡 패턴 비일관성 | 2 |
| 🔵 개선 제안 | 2 |

---

## 🔴 철학 위반

### R-1: `as any` 30개 — 100% Type-Strict 위반 [Suggest]

**위치**: `defineApp.ts/bind/trigger/widget`, `Field.tsx`, `FocusItem.tsx`, `Trigger.tsx`, `kernel.ts`

**현황**: 30개 `as any` (테스트 제외). T8 조사에서 25개는 defineApp 내부 generic 문제로 확인됨.

**분류**:
- `defineApp.*` 계열: 25개 — T9 (defineApp 분할) 시 해결 대상
- `Field.tsx`: 3개 — ref/props 처리 (line 231, 272, 274)
- `FocusItem.tsx`: 2개 — childElement ref 접근 (line 198, 199)

**권고**: T9 실행 시 일괄 해결. Field/FocusItem의 `as any`는 React ref 타입 제한 때문이므로 별도 유틸(`composeRefs` 타입 개선)로 해결 가능.

### R-2: Field.tsx `useComputed` — string 반환 [Blocker]

**위치**: `Field.tsx` line 128-131

```typescript
const activeZoneId = kernel.useComputed((s) => s.os.focus.activeZoneId);  // string|null
const osFocusedItemId = kernel.useComputed(
  (s) => s.os.focus.zones[zoneId]?.focusedItemId ?? null,  // string|null
);
```

**규칙 위반**: `useComputed` selector는 원시값(boolean)을 반환해야 한다 (rules.md 성능 §1).
**영향**: 모든 zone 변경마다 모든 Field 컴포넌트가 리렌더.
**수정 방안**: FocusItem처럼 boolean 비교를 selector 안에서 수행.

```typescript
const isActive = kernel.useComputed((s) => s.os.focus.activeZoneId === zoneId);
const isFocused = kernel.useComputed(
  (s) => (s.os.focus.zones[zoneId]?.focusedItemId ?? null) === fieldId,
);
```

단, `osFocusedItemId`는 line 264 `aria-activedescendant`에서 **string 값 자체**가 필요.
→ 이 경우만 별도 구독으로 분리하되, 대부분 사용처는 boolean으로 변환 가능.

---

## 🟡 패턴 비일관성

### R-3: FocusGroup.tsx `useComputed` — string 반환 [Nitpick]

**위치**: `FocusGroup.tsx` line 372

```typescript
const activeZoneId = kernel.useComputed((s) => s.os.focus.activeZoneId);
const isActive = activeZoneId === groupId;
```

**비일관성**: FocusItem은 `=== zoneId`를 selector 안에서 수행 (boolean). FocusGroup은 밖에서 수행.
**영향**: Zone 단위 컴포넌트라 실질적 영향 적음. 패턴 통일 관점에서만 수정 고려.

### R-4: FocusItem.tsx `[key: string]: any` index signature [Nitpick]

**위치**: `FocusItem.tsx` line 61

```typescript
[key: string]: any;
```

**문제**: props에 index signature가 있으면 타입 가드가 무력화됨.
**권고**: `rest` props를 `React.HTMLAttributes<HTMLElement>`로 제한.

---

## 🔵 개선 제안

### R-5: `loopGuard.ts` — console.error 대신 logger [Suggest]

**위치**: `lib/loopGuard.ts` line 38, 109

현재 `console.error` 사용. 규칙은 logger 사용을 권장하지만, crash 방지 코드라 합리적.
프로젝트에 공식 logger가 도입되면 교체.

### R-6: Field.tsx line 283 — 파일 하단 import [Nitpick]

```typescript
import { Label } from "./Label";
```

파일 하단에 import가 있음 (namespace merge를 위해). 기능적 문제 없으나 컨벤션과 다름.

---

## 결론

- **즉시 수정 권장**: R-2 (Field useComputed string 반환) — 성능 규칙 위반
- **T9 연동**: R-1 (as any 30개) — defineApp 분할 시 일괄 해결
- **나머지**: 패턴 통일 관점의 개선, 긴급하지 않음
