# Discussion: Tab 버그에서 OS PRD 필요성 발견

## Journey

**🧑 사용자**: Tab/Shift+Tab이 `/playground/focus`에서 깨졌어. 수정해줘.

**🤖 AI**: 원인 추적 완료 — `tabEscape`라는 effect가 커널에 등록되지 않은 채 리턴되고 있었음. `KeyboardListener`에서 state-before/after 비교 hack으로 임시 수정.

**🧑 사용자**: 실제로 브라우저에서 안 돼. `KeyboardListener` 우아하지 않아. 리팩토링하면서 원인 분석해. **탭은 전부 OS에서 관리해야 해.**

**🤖 AI**: 맞습니다. hack 제거. 정석으로 수정:
- `DOM_ZONE_ORDER` 컨텍스트 추가 (DOM 순서로 모든 zone 탐색)
- `TAB` 커맨드가 escape 시 다음 zone으로 직접 이동
- `KeyboardListener`는 모든 키를 동일하게 처리 (Tab 특별 분기 없음)

**🧑 사용자**: OS를 제대로 PRD를 세워서 개발하지 않았네. 개밥먹기는 충분히 했으니 이제 커널처럼 단단한 OS를 만들어야 할 것 같아.

**🤖 AI**: 맞습니다. Tab 버그는 단일 버그가 아니라 "사양 부재"의 증상. 커널은 명시적 계약이 있지만 OS는 암묵적 동작이 쌓임. SPEC.md를 진실의 원천으로 만들어 모든 동작 계약을 표로 관리.

**🧑 사용자**: 프로젝트를 만들어서 문서를 만들고 표를 만들어가면서 하나의 진실의 원천을 중심으로 관리가 가능하도록 만들어야겠어.

---

## Conclusion

📌 **Intent**: OS의 동작 계약을 커널 수준으로 격상하여, 하나의 SPEC.md가 코드와 테스트의 원천이 되게 한다.

📋 **Warrants**:
- W1. 커널은 명시적 계약으로 견고하다 (defineCommand/defineEffect/defineContext)
- W2. OS는 dogfooding으로 자라면서 암묵적 동작이 쌓였다 (tabEscape 미등록)
- W3. Tab 버그는 "사양 부재"의 증상이다 — 구조적 문제
- W4. 타입(shape)은 있지만 동작(behavior)의 명세는 없었다
- W5. 표(table)가 산문(prose)보다 기계적으로 검증 가능하다
- W6. 하나의 문서 = 하나의 진실의 원천 = 유지보수 가능

**한 줄 요약**: Tab 버그는 OS에 사양이 없어서 생긴 구조적 문제이며, SPEC.md를 진실의 원천으로 세워 커널처럼 단단한 OS를 만든다.
