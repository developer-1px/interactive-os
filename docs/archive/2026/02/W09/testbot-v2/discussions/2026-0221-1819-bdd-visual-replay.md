# Discussion: BDD Test → Visual Replay

## Journey

**🧑 사용자**: docs/products/todo의 spec bdd를 보면 keyboard-mouse 시나리오가 있어. 이걸 createPage로 만들어보자.

**🤖 AI**: todo-bdd.test.ts 16개 BDD 시나리오를 TodoApp.createPage() 기반으로 구현. 881/881 pass.

---

**🧑 사용자**: 이제 진짜 testBot을 해보자. todo-bdd.test.ts를 브라우저에서 이 코드 그대로 돌리려고 해.

**🤖 AI**: 두 가지 해석:
- A) Headless 실행 + 시각적 리플레이 (기록 재생)
- B) 브라우저에서 직접 실행 (같은 코드, 다른 런타임)

❓ Code의 `createPage()`가 headless인데 브라우저에서 뭘 시각화?

---

**🧑 사용자**: B가 좋지. Page를 이중화시키면 돼. Node에서와 브라우저에서 다르게 동작하게.

**🤖 AI**: Strategy/DI 패턴. `createPage()`가 환경에 따라 headless/visual 구현 반환.

❓ 동기 테스트 코드에 시각적 딜레이를 어떻게?

---

**🧑 사용자**: 동기인거 알아. 리얼타임일 필요 없어. 재생이 되는 형태면 충분해. DOM event 전달 안 돼도 돼. 커널에 preview 덮어쓰기만 하면 돼.

**🤖 AI**: 수렴: 동기 실행 → snapshot 기록 → setPreview 기반 재생.

---

**🧑 사용자**: snapshot도 테스트 커널이 찍으면 돼. 재생할 때 keyboard/mouse를 가상화해서 보여주는 거야. dispatch랑 diff도.

**🤖 AI**: 
재생 3채널:
1. 가상 keyboard/mouse — 어떤 입력이 들어갔는가
2. dispatch + diff — OS가 뭘 했고 뭐가 변했는가
3. setPreview → 실제 UI 반영

---

**🧑 사용자**: 이 방향으로 state monitor/inspector도 명확해지겠지. 프로젝트로.

---

> **한 줄 요약**: 테스트 코드 = 시연 스크립트. 동기 실행 → snapshot 기록 → setPreview 재생 + 가상 입력/dispatch/diff 시각화.

---

## Conclusion

### Why
테스트가 곧 데모. LLM이 만든 테스트를 인간이 **보면서** 검증하는 도구.

### Intent
`todo-bdd.test.ts`를 코드 변경 0으로 브라우저에서 실행. 동기 실행 → 기록 → 시각적 재생.

### Warrants
- W1. "이 OS 위에서 이 OS를 테스트한다" (Rule 검증 #2)
- W2. "same test code, different runtime" — createPage()가 유일한 분기점
- W3. Page — Playwright isomorphic API (naming 확정)
- W4. DI/Strategy — AppPage interface, headless/visual 이중 구현
- W5. setPreview()가 브릿지 — test kernel snapshot → production kernel preview → React 렌더
- W6. 재생 3채널: 입력 시각화(keyboard/mouse) + 커맨드/diff 로그 + UI 반영
- W7. Inspector/State Monitor 방향 통합 — 동일 dispatch/diff 시각화 인프라

> **한 줄 요약**: createPage()를 이중화(headless/visual)하여 동일 테스트 코드가 터미널에서는 검증, 브라우저에서는 시연이 되게 한다.
