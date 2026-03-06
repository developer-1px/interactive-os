# trigger-id

## Context

Claim: createTrigger로 생성한 Trigger 컴포넌트에 id를 지정할 수 있어야 한다. id가 없으면 data-trigger-id가 undefined가 되어 PointerListener가 무시하고, TestPage locator로도 잡을 수 없다.

Before: createDynamicTrigger/createSimpleTrigger는 id 전달 경로 없음. DocsViewer prev/next는 SelectDocTrigger + button으로 클릭 미동작.
After: createTrigger(command, { id }) 옵션 추가. DocsViewer prev/next는 PrevDocTrigger/NextDocTrigger + a 태그로 전환.

Risks: overload 시그니처 변경 시 기존 소비자 영향 (하위호환 — options는 optional)

## Now

## Done

- [x] T1: createDynamicTrigger/createSimpleTrigger에 options?: { id } 추가 — tsc 0 | +2 tests | build OK
- [x] T2: createTrigger overload에 options 전달 — tsc 0
- [x] T3: DocsViewer PrevDocTrigger/NextDocTrigger + a 태그 전환 — tsc 0 | 1929 tests | build OK

## Unresolved

## Ideas
