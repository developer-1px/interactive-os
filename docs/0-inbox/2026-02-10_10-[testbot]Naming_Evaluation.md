# TestBot 의의 평가 및 네이밍 검토

> 날짜: 2026-02-10
> 태그: testbot, naming, evaluation, visual-verification
> 상태: 결론 도출

---

## 1. Doc 09 (Direction: Visual Verification) 평가

### Red Team / Blue Team 논의

| 항목 | 평가 |
|---|---|
| "통과 ≠ 올바름" 문제 정의 | **탁월** — LLM 시대에 맞는 새로운 관점 |
| Red Team → Visual Verifier 전환 | **합리적** — TestBot의 비교우위에 정확히 맞음 |
| 하나의 시나리오, 두 러너 아키텍처 | **킬러 아이디어** — 기존 도구(Playwright, Storybook, Cypress)에 없는 포지셔닝 |

**핵심 인사이트:** Playwright는 headless/CI에서 "깨졌는가"를 확인하는 데 최적. TestBot은 앱 내부에서 "맞는가"를 사람에게 보여주는 데 최적. 둘은 경쟁이 아니라 보완 관계.

### 워크플로우 시나리오 평가

- **코드 리뷰, 온보딩 = 킬러 유스케이스** — 커서가 움직이며 동작을 시연하는 것은 코드를 읽는 것보다 압도적으로 빠름
- **개발 시 "매번 눈 확인"은 스코핑 필요** — 테스트 100개를 매번 다 보는 것은 비현실적. 새로 추가된 테스트 / 실패한 테스트에 한정될 것

### 보완 권장 사항

1. **"앱 내부 실행"의 고유 가치가 과소 표현됨** — TestBot은 같은 React 트리, 같은 메모리 공간에서 실행됨. Zustand 스토어, Kernel 트랜잭션 로그 직접 접근, Inspector 패널 통합 등은 Playwright가 절대 할 수 없는 영역
2. **Testing Library 도입 제안 (Section 7-8)은 현재 합의 방향과 불일치** — `@testing-library/dom`을 도입하지 않고 `selectors.ts`를 직접 수정하기로 결정했으므로, 해당 섹션 업데이트 필요

---

## 2. 네이밍 검토: "TestBot"

### 문제

"TestBot"은 **what**(테스트를 실행)을 설명하지, **why**(시각적으로 올바름을 확인)를 설명하지 않는다.

- "Test" → 자동화된 테스팅, CI, pass/fail
- "Bot" → 사람 개입 없이 자동 실행

합치면 "알아서 테스트를 돌리는 봇" — 이건 Playwright의 역할이지 Visual Verifier의 역할이 아님.

### 검토한 대안

| 후보 | 장점 | 단점 |
|---|---|---|
| PlayBot | Playwright와 "play" 어근 공유, 직관적 | Playboy 연상 |
| Playback | "재생"에 집중, Playwright와 메타포 일치 | 직관적 느낌 부족, Bot 느낌 없음 |
| PlayRunner | play + runner, 테스트 러너 명시 | 길다 |
| StageBot | 무대 시연 메타포 | 낯설음 |
| ShowRunner | 시각적 시연 + 실행 총괄 | TV 용어라 맥락 필요 |

### 결론: TestBot 유지

- **입에 붙은 이름이 최고의 이름** — 이미 코드베이스 전체에 박혀 있음 (`@os/testBot`, `useTestBotRoutes`, `window.__TESTBOT__`)
- 리네이밍 비용 > 이름 정확성에서 얻는 이익
- "Test"가 틀린 건 아님 — 실제로 테스트 코드를 실행하는 건 맞음
- 의의는 부제로 보완: **"TestBot — Playwright 테스트를 앱 안에서 시각 재생하는 도구"**

---

## 3. 최종 정리

```
TestBot의 의의:
  Playwright는 "깨졌는가"를 확인한다.
  TestBot은 "맞는가"를 보여준다.

네이밍:
  TestBot 유지. 부제로 의의 보완.
```
