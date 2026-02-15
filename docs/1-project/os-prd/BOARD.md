# BOARD — os-prd

## 🔴 Now

(빈 — 다음 태스크 대기)

## ⏳ Done
- [x] T5d: `CommandPalette` 리팩토링 → QuickPick 소비자로 전환 (02-15)
- [x] T5: QuickPick (OS Level Primitive) 구현 (02-15)
    - [x] T5a: `virtualFocus` 지원 (NAVIGATE/FOCUS) (02-15)
    - [x] T5b: `QuickPick` 컴포넌트 조립 (02-15)
    - [x] T5c: Showcase 구현 (02-15)
- [x] T0: SPEC.md 초안 작성 — 코드 역추적으로 전체 인벤토리 (02-15)
- [x] T1: Navigate unit tests — 35개 (orientation, loop, home/end, entry) (02-15)
- [x] T2a: Field unit tests — 14개 (start/commit/cancel lifecycle) (02-15)
- [x] T2b: Typeahead unit tests — 12개 + `resolveTypeahead` 구현 (02-15, G6 해결)
- [x] T2c: History middleware unit tests — 13개 (undo/redo/future/entry) (02-15, G7 해결)
- [x] T3: Typeahead → OS fallback middleware 연동 (02-15)
- [x] T4a: Tab resolver 추출 + 22개 unit tests (02-15)
- [x] T4b: Escape resolver 추출 + 5개 unit tests (02-15)
- [x] T4c: Expand resolver 7개 unit tests (02-15)
- [x] T4d: Focus Stack (STACK_PUSH/POP) 9개 unit tests (02-15)
- [x] T4e: Overlay (OPEN/CLOSE) 9개 unit tests (02-15, G3 해결)
- [x] T4f: Role Presets SPEC §7 검증 — 147 assertions (02-15)
- [x] T4g: Role Helpers (child/check/expand) — 31 tests (02-15)
- [x] Todo ID 마이그레이션: number → string + uid() (02-15)
- [x] SPEC.md 갱신 — 전 Gap 해결(G1-G7), Coverage Map 완전 (02-15)
- [x] T6: Focus E2E MECE 강화 — 15→26개 테스트, SPEC 전 영역 커버 (02-15)

## 💡 Ideas
- T6: Kernel Test Utils (Context Mocking) — Unit Test 작성 효율화
- SPEC.md를 코드에서 참조: 커맨드 파일 상단에 SPEC 섹션 번호 링크

## 📚 Resources
- [Virtual Focus & aria-activedescendant](../../3-resource/04-architecture/2026-0215-virtual-focus-activedescendant.md) — T5a/T5b 구현 가이드

