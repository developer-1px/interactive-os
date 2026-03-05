# Discussion: Focus/Selection Lazy Resolution

## Journey

**🧑 사용자**: focus와 selection, copy/paste, undo/redo 복구 전략을 하나의 전략으로 다 처리하도록 하고 싶은데

**🤖 AI**: "하나의 전략"이 의미하는 것은? 상태 모델 통합인가, 복구 정책 통합인가, 트랜잭션 단위 통합인가?

---

**🧑 사용자**: focus와 selection은 변경사항을 추적할 수 있게 그대로 따라간다. focus와 selection을 읽게되면 가장 인접했던 곳으로 간다 (next, prev 순)

**🤖 AI**: 본질은 **Write-time Recovery → Read-time Resolution** 전환. "복구"라는 별도 행위 자체를 없앤다. Stale Reference + Lazy Resolution 패턴. 해석 함수의 배치는?
- (a) 컴포넌트 레벨
- (b) 상태 레벨 getter
- (c) 투명 프록시

---

**🧑 사용자**: 앱을 몰라도 돼 어차피 copy paste undo redo를 OS가 알아서 처리하는데

**🤖 AI**: Clear — rules.md #7 "앱은 의도를 선언하고, OS가 실행을 보장한다." 투명 프록시 (c)가 유일한 정답. Pure Lazy가 답 — 확인?

---

**🧑 사용자**: (Inspector 이벤트 첨부) 지금 undo를 했을때 focus와 selection 복구를 전혀 못하고 있어

**🤖 AI**: Inspector 추적 결과:
- Cut 후 `OS_FOCUS`가 원본 ID를 card-6으로 덮어씀 → 원본 소멸
- Undo 시 card-3,4,5 부활하지만 focus/selection은 card-6에 잠김
- Lazy Resolution이면: 원본 ID 보존 → undo 시 자동 복귀 (zero-cost)

**한 줄 요약**: Write-time recovery가 원본 ID를 파괴하여 undo 복구를 원천 차단한다. Read-time lazy resolution이 이 모든 문제를 하나의 규칙으로 해결한다.

---

## Conclusion

### Why
현재 focus/selection 복구가 write-time에 원본 ID를 덮어쓰기 때문에, undo/redo 시 포커스/셀렉션이 원래 자리로 돌아가지 못한다. 이 문제는 clipboard, undo/redo, 삭제 등 모든 상태 변경에서 동일하게 발생한다.

### Intent
Focus/Selection의 원본 ID를 절대 덮어쓰지 않고 보존한다. 읽을 때(read-time) 현재 아이템 리스트에서 resolve하여, 있으면 그대로, 없으면 인접(next > prev) 아이템으로 해석한다.

### Warrants
- W1. 개체가 적은 쪽이 정답이다 (rules.md #10) — recoveryTargetId, OS_RECOVER, 감지 로직, 복구 실행 로직 4개 → 해석 함수 1개
- W2. 모든 변경은 하나의 문을 통과한다 (rules.md #4)
- W3. "저장은 ID만, 해석은 읽을 때" — Stale Reference + Lazy Resolution
- W4. Undo 시 원본 ID가 살아나면 자연스럽게 복귀 — zero-cost undo focus restoration
- W5. Hollywood Principle (rules.md #7) — OS가 투명하게 처리, 앱은 해석을 모른다
- W6. Write-time recovery(OS_FOCUS + OS_SELECTION_CLEAR)가 원본 ID를 파괴하여 undo 복구를 불가능하게 한다 — Inspector 증거로 확인

### 한 줄 요약
**원본 ID를 보존하고 읽을 때 해석하면, 복구 코드 없이 undo/redo/삭제의 focus/selection이 자연스럽게 해결된다.**
