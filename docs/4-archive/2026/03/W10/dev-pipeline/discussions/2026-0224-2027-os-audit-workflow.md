# Discussion: OS 계약 감사 워크플로우

## Journey

**🧑 사용자**: when binding 확장은 지금 해볼까?

**🤖 AI**: 테스트가 이미 11 PASS. when 확장은 같은 동작의 리팩토링이지 새 기능이 아니다. Rules #8(단조 개선)에 의해 지금은 아니다.

---

**🧑 사용자**: 아니면 회고말고 OS의 개선점을 찾는 workflow를 만들자.

**🤖 AI**: 결정 테이블 → Full Path 테스트 → OS 결함 발견 (이번 세션의 ESC 버그)이 "우연"이었다. "필연"으로 만들자.

---

**🧑 사용자**: 우리가 바라는 OS의 최종 슬로건은? → "앱은 의도를 선언하고, OS가 실행을 보장한다"

**🤖 AI**: "앱이 선언만 했는데 OS가 보장 못 하는 곳"을 찾으면 그게 OS 개선점.

---

**🧑 사용자**: 위반하고 있는 곳을 전수 검사 → LLM 실수인지 OS 미지원인지 구분

**🤖 AI**: grep으로 위반 전수 열거 가능 (useState, useEffect, onClick, document.querySelector). 분류 2갈래: LLM 실수 → /refactor, OS 갭 → BOARD.

---

**🧑 사용자**: 정당한 예외는 BOARD로 관리하지 뭐 → `/audit`으로 가자

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | `/audit` = OS 계약 위반을 grep 전수 열거 → LLM 실수/OS 갭/정당한 예외로 3분류 → /refactor, BOARD Now, BOARD Backlog |
| **📊 Data** | 이번 세션에서 결정 테이블 Full Path 테스트가 ESC forward-iteration 버그를 발견 (6줄 수정, +13 tests) |
| **🔗 Warrant** | 위반 기준이 grep 가능(측정 가능), 분류가 3갈래(명확), 각 갈래가 기존 워크플로우에 연결 |
| **📚 Backing** | rules.md Goal #7 "앱은 의도를 선언하고, OS가 실행을 보장한다", rules.md 검증 #9 "OS 코드는 DOM을 직접 조작하지 않는다" |
| **⚖️ Qualifier** | Clear |
| **⚡ Rebuttal** | 일부 위반은 OS 설계상 불가피 (e.g., 외부 라이브러리 통합). 이런 건 BOARD Backlog에 사유 기록 |
| **❓ Open Gap** | callback 내부 분기 감지는 grep으로 불완전 (AST 분석 필요) — 1차는 grep, 이후 확장 |
