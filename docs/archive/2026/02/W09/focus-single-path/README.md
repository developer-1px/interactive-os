# focus-single-path

## WHY

현재 `.focus()` DOM 호출이 **두 경로**로 실행된다:

```
경로 A: 커맨드 → { focus: itemId } → 4-effects/focus → el.focus()
경로 B: 커맨드 → { state }       → React → FocusItem/Field → el.focus()
```

이 이중 경로로 인해:
- `FocusItem`, `useFieldHooks`, `QuickPick`이 각각 `.focus()`를 직접 호출
- 앱 코드(`BuilderCursor`, `DocsPage`, `aria-showcase`)도 OS를 우회하여 DOM에 직접 접근
- "DOM 부수효과는 `4-effects`에만" 원칙(Rule #9)이 구조적으로 어긋남

## Goals

1. **`.focus()` 호출 경로를 하나로 통합** — 이중 실행 제거
2. **앱 코드의 DOM 직접 접근 0건** — 모든 DOM 부수효과는 OS를 통해
3. **`useComputed`의 순수성 보장** — computed 내 DOM 접근 0건

## Scope

- `src/os/4-effects/` — focus/focusField effect 설계
- `src/os/6-components/base/FocusItem.tsx` — focus effect 중복 제거
- `src/os/6-components/field/Field.tsx` — computed 순수성 (✅ K1 완료)
- `src/os/5-hooks/useFieldHooks.ts` — effect 레이어 활용
- `src/os/6-components/quickpick/QuickPick.tsx` — effect 레이어 활용
- `src/os/2-contexts/index.ts` — DOM_ZONE_ORDER Registry 기반 전환
- `src/apps/builder/BuilderCursor.tsx` — OS hook/context 활용
- `src/pages/DocsPage.tsx` — (✅ C1 완료)

## Out of Scope

- `src/pages/aria-showcase/` — showcase 데모 코드는 저수준 패턴 시연 목적으로 예외
- `inspector/`, `tests/` — 개발/테스트 도구는 DOM 직접 접근 허용
