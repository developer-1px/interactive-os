# Discussion: Field 재편집 시 캐럿 복원 + headless 검증 가능성

## Journey

**🧑 사용자**: Field 편집모드 이후 다시 재편집 모드시 focus가 안되는 버그가 있어.

**🤖 AI**: 코드를 분석하여 `wasActiveRef` 리셋 문제와 `cursorRef` 미갱신 문제를 추측성으로 수정.

---

**🧑 사용자**: 아닌데? 이거 네가 재현을 하고 검증을 할 수 있는 이슈야? 추측성으로 수정하지 말고

**🤖 AI**: 정직한 보고 — headless로 재현/검증 불가. DOM focus, caret position은 브라우저에서만 동작. 추측성 수정 원복.

---

**🧑 사용자**: 그러면 headless하게 할 수 있을지 고민을 해보자. context와 effect로 풀 수 없는 문제일까?

**🤖 AI**: OS가 이미 focus를 state로 모델링(focusedItemId → DOM은 effect). caret에 동일 패턴 미적용. FieldRegistry에 caretPosition 추가하면 state 계약을 headless 검증 가능.

---

**🧑 사용자**: 고빈도 시점이라 커맨드는 아닌데, 종료시점에 보관은 돼야 해. defineQuery 방식으로는?

**🤖 AI**: defineQuery는 "관찰 → state 보관"의 세 번째 경로. InputListener가 이미 이 패턴(updateValue). 하지만 지금 사용처가 caret 하나뿐 — FieldRegistry에 직접 추가가 엔트로피 최소.

---

**🧑 사용자**: caret position이 직렬화되려면 offset만 보관해야 해.

**🤖 AI**: `getCaretPosition`이 이미 `number`(flat offset)를 반환. 직렬화 인프라는 존재.

---

**한 줄 요약**: DOM에 갇힌 캐럿 위치를 FieldRegistry state(number)로 승격하여 headless 검증 가능하게 만든다.

---

## Conclusion

### Why
Field 재편집 시 캐럿이 복원되지 않는 버그가 있지만, 현재 아키텍처에서는 headless로 재현/검증할 수 없다. 이는 caret position이 state가 아닌 DOM에만 존재하기 때문이다.

### Intent
FieldRegistry에 `caretPosition: number | null`을 추가하여 캐럿 위치를 **관찰 가능한 state**로 만들고, "State 계약 테스트 + DOM effect trust" 패턴으로 headless 검증을 가능하게 한다.

### Warrants

1. **W1**: OS는 focus를 state로 모델링 (focusedItemId). caret에도 동일 패턴 적용 가능.
2. **W2**: `wasActiveRef`, `cursorRef`는 로컬 ref — 관찰/테스트 불가.
3. **W3**: Testability Principle — 테스트 불가 = 설계 결함.
4. **W4**: `getCaretPosition`/`setCaretPosition`이 이미 number ↔ DOM Selection 변환. 직렬화 인프라 존재.
5. **W5**: FieldRegistry가 이미 per-field state 관리. caretPosition은 자연스러운 확장.
6. **W6**: FieldRegistry는 순수 JS 스토어 — vitest 완전 검증 가능.
7. **W7**: focusedItemId 동일 패턴: State 계약 테스트 + DOM effect trust.
8. **W8**: 커맨드 = 의도, 관찰 ≠ 의도. 캐럿은 editing 부산물. 고빈도 → 커맨드 부적합.
9. **W9**: InputListener가 이미 "관찰 → state 보관" 선례.

**한 줄 요약**: 캐럿 위치를 FieldRegistry state로 승격하면 headless 검증 가능 + 복원 로직 구현 가능.
