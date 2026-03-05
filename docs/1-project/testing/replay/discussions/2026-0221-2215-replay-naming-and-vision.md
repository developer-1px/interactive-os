# Replay 네이밍 & 비전 — Discussion Journey

> **날짜**: 2026-02-21 22:15–22:21
> **트리거**: projection-checkpoint 완성 후, "테스트 봇을 이번에는 만들 수 있을까?"

---

## Journey

**🧑 사용자**: todo-bdd.test.ts를 headless e2e하게 완성하고 테스트 봇을 이번에는 만들 수 있을까?

**🤖 AI**: 테스트봇 역사를 읽음. TestBot v1(아카이브) → OS Page(완료) → projection-checkpoint(방금 완료) → TestBot v2(진행중). 사용자가 원하는 것은 TestBot v2?

---

**🧑 사용자**: 아니 그 테스트봇 맞아. 테스트봇이라고 하니까 LLM vitest e2e 시각화 도구라고 상상을 못하는 거 같아서 이번에는 이름을 바꿔볼라고

**🤖 AI**: rules #7 "이름은 법이다". 이름이 비전을 가린다. 후보 제시: Witness, Spotlight, LiveSpec, TestStage, Replay, Projector.

---

**🧑 사용자**: Replay가 제일 좋아. 실제로 동기로 돌아가는 코드를 천천히 재생하는거라서

**🤖 AI**: Replay — 이름이 곧 기능. createPage API가 시각화 단위와 1:1 매핑.

---

**🧑 사용자**: TestBot v2도 버려. "Replay"로 처음부터 다시 생각할거야. 핵심은 page.keyboard.press와 page.click page.query등을 기존에 만들었던 가상 마우스와 키보드 pass fail 배지등으로 시각화 하는거야

> **한 줄 요약**: TestBot → Replay. 이름을 바꾸고 처음부터 다시 생각. 핵심: createPage의 press/click/query를 가상 마우스+키보드+배지로 시각화.

---

## Conclusion

### Why
"테스트봇"이라는 이름이 "자동화 봇"을 연상시켜서, 진짜 비전인 "인간의 시각적 검증 도구"를 매번 재설명해야 했다.

### Intent
TestBot v2의 기술적 부채(Shim, ReplayPanel) 없이, "Replay"라는 이름으로 createPage API 위에 깨끗하게 시작한다.

### Warrants
- W1. Replay = 동기 실행된 테스트의 시각적 재생. 이름이 곧 기능
- W2. createPage API가 Replay의 시각화 단위와 1:1 매핑
- W3. TestBot v2의 기술적 부채 없이 깨끗한 시작
- W4. 비전은 불변: "LLM이 만든 테스트를 인간이 시각적으로 검증하는 도구"

**한 줄 요약**: 동기로 0ms에 실행된 테스트를 createPage의 press/click/query 단위로 천천히 시각적으로 재생(Replay)한다.
