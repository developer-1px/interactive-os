# RFC: accessor-first 레거시 제거

## Summary

`getItems` accessor-first 전환이 완료되었지만, 3개 command와 `defineApp.page.ts`에
DOM_ITEMS 직접 참조 / mockItems 레거시가 남아있다. 이를 통일한다.

## Motivation

navigate/index.ts L46은 이미 accessor-first:
```ts
const rawItems = zoneEntry?.getItems?.() ?? ctx.inject(DOM_ITEMS);
```

하지만 `select.ts`, `selectAll.ts`, `tab.ts`는 여전히 `ctx.inject(DOM_ITEMS)` 직접 사용.
`defineApp.page.ts`는 `mockItems` 배열을 수동 관리하지만, `getItems` accessor가 우선이라
실제로 사용되지 않는 dead code.

이 불일치는:
1. getItems에 filter를 적용하면 select/tab에는 반영 안 됨 (오늘 발견)
2. page mock이 실제 동작과 다른 경로를 테스트 (false confidence)
3. 새 기능 추가 시 어디를 수정해야 하는지 혼란

## Guide-level explanation

모든 command가 `getItems?.() ?? DOM_ITEMS` 패턴을 사용.
`defineApp.page.ts`는 `mockItems`를 제거하고 `2-contexts/index.ts`의 원본 provider 재사용.
`goto()`의 `items` 옵션은 폐기.

## Drawbacks

- `getItems`가 없는 zone (순수 DOM-only zone)에서 regression 가능
  → DOM_ITEMS fallback 유지로 해결

## Unresolved questions

없음. navigate에서 이미 검증된 패턴.
