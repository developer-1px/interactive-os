# cursor-ocp BOARD

> Created: 2026-02-23
> Last Updated: 2026-02-23

## Now

- [ ] T1 — `model/cursorRegistry.ts` 생성: `Map<string, CursorMeta>` + get/set/delete
- [ ] T2 — `hooks/useCursorMeta.ts` 생성: useEffect wrapper
- [ ] T3 — 각 프리미티브에 `CURSOR_META` 상수 + `useCursorMeta()` 호출 추가 (BuilderIcon, BuilderButton, BuilderImage, BuilderBadge, BuilderLink, BuilderDivider, BuilderTabs)
- [ ] T4 — `BuilderCursor.tsx` 수정: `TYPE_COLORS` 삭제, `resolveItemBlockInfo` 삭제, `cursorRegistry.get()` 으로 교체
- [ ] T5 — text 타입 처리: Field.Editable 등 프리미티브 없이 직접 사용되는 텍스트 필드의 cursor meta 등록 방안
- [ ] T6 — 검증: 빌드 + 기존 spatial 테스트 통과 확인
- [ ] T7 — `6-products/builder/design/builder-cursor.md` 갱신: #2 결정 supersede 기록

## Done

(none)

## Ideas

(none)
