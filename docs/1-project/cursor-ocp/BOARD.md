# cursor-ocp BOARD

> Created: 2026-02-23
> Last Updated: 2026-02-23

## Now

(all done)

## Done

- [x] T1 — `model/cursorRegistry.ts` 생성: `Map<string, CursorMeta>` + get/set/delete ✅
- [x] T2 — `hooks/useCursorMeta.ts` 생성: useEffect wrapper ✅
- [x] T3 — 각 프리미티브에 `CURSOR_META` 상수 + `useCursorMeta()` 호출 추가 ✅
  - BuilderIcon, BuilderButton, BuilderImage, BuilderBadge, BuilderLink, BuilderDivider, BuilderTabs
- [x] T4 — `BuilderCursor.tsx` 수정: `TYPE_COLORS` 삭제, `resolveItemBlockInfo` 삭제, `cursorRegistry.get()` 교체 ✅
- [x] T5 — text 타입 처리: `Builder.Item` (createBuilderComponent)에 `useCursorMeta` 추가. `Builder.Section`/`Group`도 등록 ✅
- [x] T6 — 검증: tsc 0 errors, vite build OK, 914 tests passed ✅
- [x] T7 — `6-products/builder/design/builder-cursor.md` #2 결정 supersede 기록 ✅

## Ideas

(none)
