# BOARD — field-key-ownership

## 🔴 Now

_(empty — all initial tasks done)_

## ⏳ Done

- [x] FieldConfig에 `fieldType` 속성 추가 (기본값: `"inline"`)
- [x] FIELD_CONSUMES 테이블 구현 (4개 프리셋 × 키 매핑) — `fieldKeyOwnership.ts`
- [x] KeyboardListener의 `isEditing` 이분법을 dual-context (isEditing + isFieldActive)로 교체
- [x] macFallbackMiddleware도 동일하게 교체
- [x] Meta+Z/Shift+Z에 `when: "navigating"` 가드 추가
- [x] Todo Draft의 Tab/↑↓ E2E 테스트 작성 + 3/3 통과 확인
- [x] keybindings.resolve 확장: `isFieldActive` (per-key) vs `isEditing` (mode) 분리

## 💡 Ideas

- `tokens` 프리셋의 Backspace→칩삭제 실제 구현
- multi-line Enter vs Shift+Enter 전략
- boundary 감지 (커서가 마지막 줄에 있을 때만 ArrowDown을 OS에 위임)
- `<OS.Field fieldType="editor">` 기반 코드 에디터 PoC
- Tab navigation loop (마지막 zone에서 forward → 첫 zone으로 순환)
- defineApp.bind FieldComponent에 fieldType prop 전달 지원

## 🐛 Discovered Issues

- **Draft Enter 미작동** — `keyboard.type() + Enter`로 todo 생성이 E2E에서 실패 (field-key-ownership 변경 이전에도 발생, 별도 이슈)
