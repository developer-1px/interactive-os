# BOARD — field-key-ownership

## 🔴 Now

_(empty — project complete)_

## ⏳ Done

- [x] FieldConfig에 `fieldType` 속성 추가 (기본값: `"inline"`)
- [x] FIELD_DELEGATES_TO_OS 테이블 구현 (delegation 모델) — `fieldKeyOwnership.ts`
- [x] KeyboardListener dual-context: `isEditing` (mode) + `isFieldActive` (per-key)
- [x] macFallbackMiddleware 동일 패턴 적용
- [x] Meta+Z/Shift+Z에 `when: "navigating"` 가드 추가
- [x] keybindings.resolve 확장: `isFieldActive` 분리
- [x] 🐛 Space 삼킴 버그 수정 (CHECK override에서 `!isEditing` 사용)
- [x] 🐛 모델 반전: CONSUMES (blocklist) → DELEGATES_TO_OS (allowlist)
- [x] E2E 19/19 통과 (기존 16 + 신규 3)
- [x] Unit 476/476 통과, tsc 클린

## 💡 Ideas

- `tokens` 프리셋의 Backspace→칩삭제 실제 구현
- multi-line Enter vs Shift+Enter 전략
- boundary 감지 (커서가 마지막 줄에 있을 때만 ArrowDown을 OS에 위임)
- `<OS.Field fieldType="editor">` 기반 코드 에디터 PoC
- Tab navigation loop (마지막 zone에서 forward → 첫 zone으로 순환)
- defineApp.bind FieldComponent에 fieldType prop 전달 지원
