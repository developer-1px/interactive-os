# Workflow Redesign: 산출물 기반 개발 파이프라인

## Journey

**🧑 사용자**: 기본이 되는 개발 workflow를 점검하고 싶다.

**🤖 AI**: 42개 워크플로우 현황 파악. 핵심 루프는 `/discussion → /project → /go` 3개.

---

**🧑 사용자**: TDD를 계속 skip하더라. `/project`의 산출물이 테스트 코드일 때는 작동했다.

**🤖 AI**: Steel-manning — "TDD를 규칙이 아닌 입출력 의존으로 강제한다." Pit of Success 적용.

---

**🧑 사용자**: `/go`에서 다음 태스크에 Red가 필요한 시점에 또 skip한다.

**🤖 AI**: `/project`는 1회성 초기화. 후속 태스크의 Red 테스트는 구조적 공백.

---

**🧑 사용자**: `/go` 하나로 다 하고 싶은데, `/go`가 알아서 Red를 쓰라고 하면 skip한다.

**🤖 AI**: LLM goal fixation — Goal은 달성하지만 중간 단계는 skip. 세션 분리만이 해법.

**🧑 사용자**: 분리해도 괜찮더라. `/go`가 라우터 역할만 하면 되겠네? `/red`와 `/green`으로 나누자.

---

**🧑 사용자**: `/refactor`도 유명무실이었다. Red → Green → Refactor를 `/go`가 반복하게 하자.

**🤖 AI**: `/go` 상태 머신: Red 없음 → `/red`, FAIL → `/green`, PASS → `/refactor`, 루프.

---

**🧑 사용자**: 워크플로우에서 워크플로우를 호출하면 되지 않나?

**🤖 AI**: 조사 결과, Gemini CLI에 워크플로우 합성(composition) 기능이 없음. 이전 오케스트레이터들의 하위 워크플로우 호출은 실질적으로 작동하지 않았음.

**🧑 사용자**: 그동안 속았던 거네.

---

**🧑 사용자**: `/temp_go`로 `view_file` 기반 오케스트레이션을 테스트해보자.

**🤖 AI**: 실험 결과 — `view_file`로 `.md`를 읽으라고 명시하면 실제로 읽고 실행함. 오케스트레이션 검증 성공.

---

**🧑 사용자**: `/test`와 `/tdd`를 제거하고 `/red`와 `/green`으로 대체. 산출물 기준이어야 LLM이 잘 한다.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | 개발 워크플로우는 **산출물 기반**으로 설계해야 한다. 각 워크플로우의 이름 = 세션 Goal = 산출물. 핵심 파이프라인: `discussion → project → [red → green → refactor]ₙ → archive`. `/go`는 상태 기반 라우터로, `view_file`을 통해 하위 워크플로우를 읽고 실행한다. |
| **📊 Data** | ① TDD를 규칙으로 강제해도 LLM이 skip함 (반복 관찰) ② `/project`의 산출물을 테스트 코드로 했을 때는 성공함 ③ Gemini CLI에 워크플로우 합성 기능 없음 (웹 조사) ④ `view_file` 기반 오케스트레이션은 작동함 (`/temp_go` 실험) |
| **🔗 Warrant** | LLM은 Goal은 달성하지만 중간 단계는 skip한다 (goal fixation). 따라서 각 세션의 Goal과 워크플로우의 산출물이 일치해야 skip이 불가능하다. |
| **📚 Backing** | Pit of Success (Rico Mariani) — 올바른 사용법으로 "떨어지게" 설계. rules.md #12 "강제할 것은 워크플로우에". rules.md #9 "이름은 법이다". |
| **⚖️ Qualifier** | Clear (실험으로 검증됨) |
| **⚡ Rebuttal** | ① `view_file` 오케스트레이션의 장기 안정성 미검증 ② 기존 42개 워크플로우 중 오케스트레이터 패턴 사용한 것들의 재검토 필요 ③ 세션 분리로 인한 컨텍스트 단절 비용 |
| **❓ Open Gap** | ① `/go` 라우터 재설계 (상태 머신 + view_file) ② `/refactor` 재정의 (reflect + doubt + verify 인라인) ③ 42개 워크플로우 전체 재검토 |
