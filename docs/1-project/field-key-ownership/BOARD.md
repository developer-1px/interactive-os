# BOARD — field-key-ownership

## 🔴 Now

- [ ] KeyboardListener의 `isEditing` 이분법을 `isConsumedByField(key, fieldType)`로 교체
- [ ] FieldConfig에 `fieldType` 속성 추가 (기본값: `"inline"`)
- [ ] FIELD_CONSUMES 테이블 구현 (4개 프리셋 × 키 매핑)
- [ ] Meta+Z/Shift+Z에 `when: "navigating"` 가드 추가
- [ ] Todo Draft의 Tab/↑↓ E2E 테스트 작성 + 통과 확인

## ⏳ Done

_(empty)_

## 💡 Ideas

- `tokens` 프리셋의 Backspace→칩삭제 실제 구현
- multi-line Enter vs Shift+Enter 전략  
- boundary 감지 (커서가 마지막 줄에 있을 때만 ArrowDown을 OS에 위임)
- `<OS.Field fieldType="editor">` 기반 코드 에디터 PoC
