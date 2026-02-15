# BOARD — os-prd

## 🔴 Now
- [ ] T3: Typeahead를 NAVIGATE command에 연동 (KeyboardListener fallback or middleware)
- [ ] T4: Overlay 커맨드 테스트 작성 (G3)

## ⏳ Done
- [x] T0: SPEC.md 초안 작성 — 코드 역추적으로 전체 인벤토리 (02-15)
- [x] T1: Navigate unit tests — 35개 (orientation, loop, home/end, entry) (02-15)
- [x] T2a: Field unit tests — 14개 (start/commit/cancel lifecycle) (02-15)
- [x] T2b: Typeahead unit tests — 12개 + `resolveTypeahead` 구현 (02-15, G6 해결)
- [x] T2c: History middleware unit tests — 13개 (undo/redo/future/entry) (02-15, G7 해결)
- [x] SPEC.md 갱신 — Coverage Map + Known Gaps 반영 (02-15)

## 💡 Ideas
- Unit test 생성기: SPEC.md의 Command Behavior Table에서 자동으로 test case 생성
- Role Preset 검증: roleRegistry.ts의 preset이 SPEC 7번 표와 일치하는지 자동 검증
- SPEC.md를 코드에서 참조: 커맨드 파일 상단에 SPEC 섹션 번호 링크
