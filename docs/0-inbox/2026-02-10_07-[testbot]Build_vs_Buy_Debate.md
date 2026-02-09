# TestBot: 자가 도구를 만들어야 하는가?

> 날짜: 2026-02-10
> 태그: testbot, build-vs-buy, debate, red-team, blue-team
> 상태: 논의

---

## 1. 질문

기존에 검증된 테스트 도구가 있다:

| 도구 | 특성 |
|---|---|
| **Playwright** | 크로스 브라우저, auto-wait, video/trace, CI 통합 |
| **Cypress** | 브라우저 내 실행, time travel, 실시간 리로드 |
| **Testing Library** | 시맨틱 쿼리, 사용자 관점, React 통합 |
| **Vitest / Jest** | 단위/통합, JSDOM, 빠른 피드백 |
| **Storybook** | 컴포넌트 격리, 시각적 검증, interaction testing |

이 도구들이 수천 명의 기여자와 수년의 검증을 거쳤는데, **2,600줄짜리 자가 도구를 왜 만드는가?**

---

## 2. Red Team: "만들지 마라"

### 2.1 기존 도구로 다 된다

TestBot이 하는 것을 Playwright로 대체하면:

```typescript
// TestBot
await t.press("ArrowDown");
await t.expect({ role: "option", name: "Item 2" }).toBeFocused();

// Playwright — 거의 동일
await page.keyboard.press("ArrowDown");
await expect(page.getByRole("option", { name: "Item 2" })).toBeFocused();
```

시맨틱 셀렉터? Testing Library가 원조다. auto-wait? Playwright가 내장하고 있다. 시각적 추적? Playwright Trace Viewer가 있다. LLM이 아는 API? Playwright/Cypress를 TestBot보다 100배 더 잘 안다.

### 2.2 직접 만들면 직접 유지해야 한다

TestBot의 현재 문제들:

- `waitFor` 없음 → assertion이 고정 delay 기반 (Playwright는 10년 전에 해결)
- 크로스 브라우저 미지원
- CI 통합 없음
- 스크린샷/비디오 없음
- parallel execution 없음
- retry 전략 없음

이 모든 걸 직접 구현해야 한다. **2,600줄이 26,000줄이 되는 건 시간 문제.**

### 2.3 LLM 호환성에서도 불리하다

LLM의 학습 데이터에 Playwright 코드는 수백만 건이다. TestBot 코드는 0건이다.

```
LLM에게 "이 컴포넌트 테스트 작성해줘"라고 하면:
→ Playwright 코드를 즉시 생성한다
→ TestBot 코드는 API 문서를 매번 컨텍스트에 넣어줘야 한다
```

### 2.4 Cypress는 이미 브라우저 안에서 돈다

"TestBot은 같은 프로세스에서 돈다"는 장점? **Cypress도 그렇다.** Cypress는 앱과 같은 브라우저 탭에서 실행되며, `cy.window()`로 앱의 전역 객체에 접근할 수 있다.

```typescript
// Cypress에서 Kernel 상태 접근
cy.window().then((win) => {
  const state = win.__KERNEL__.getState();
  expect(state.os.focus.focusedItemId).to.eq("item-2");
});
```

### 2.5 결론: 바퀴를 재발명하고 있다

> "좋은 프로그래머는 좋은 코드를 쓴다. 위대한 프로그래머는 좋은 코드를 가져다 쓴다."

Playwright + Testing Library 조합이면 TestBot이 하는 모든 것을 더 안정적으로 할 수 있다.

---

## 3. Blue Team: "만들어야 한다"

### 3.1 TestBot은 테스트 도구가 아니다

이것이 핵심 반론이다. TestBot을 Playwright와 비교하는 것 자체가 범주 오류다.

| | Playwright/Cypress | TestBot |
|---|---|---|
| 실행 환경 | 별도 프로세스 (Node.js) 또는 별도 iframe | 앱과 같은 런타임 |
| 목적 | QA — "배포 전 검증" | **시연** — "이렇게 동작함을 보여줌" |
| 실행 주체 | CI 파이프라인 | 개발자, LLM 에이전트, 앱 안의 Inspector |
| 피드백 속도 | 빌드 → 실행 → 결과 (분 단위) | `runAll()` → 즉시 (초 단위) |
| 시각적 출력 | 사후 trace/video | **실시간** 커서 + 스탬프 |
| 대상 | 완성된 기능의 회귀 테스트 | **개발 중인 기능의 실시간 증명** |

Playwright는 "이 기능이 깨졌나?" 를 확인한다.
TestBot은 "이 기능이 이렇게 동작한다" 를 **앱 안에서 실시간으로 시연**한다.

### 3.2 같은 런타임이라는 것의 의미

Playwright는 CDP(Chrome DevTools Protocol)를 통해 브라우저를 **외부에서** 조종한다. 이건 근본적 한계가 있다:

```
Playwright (Node.js)  ──CDP──→  Browser (Chrome)
    │                                │
    └─ page.evaluate()로 ──────────→ 커널 상태 읽기
       JS 문자열을 주입                (직렬화/역직렬화 필요)
```

```
TestBot (앱 내)
    │
    └─ kernel.getState()     ← 같은 메모리 공간. 직접 참조.
    └─ kernel.getTransactions() ← Transaction 객체를 직접 순회.
    └─ kernel.getScopePath()    ← scope tree를 직접 조회.
```

Playwright에서 `kernel.getTransactions()`의 결과를 가져오려면 **직렬화 → 전송 → 역직렬화**가 필요하다. Transaction 안의 `stateBefore`, `stateAfter`는 임의의 JS 객체라 직렬화가 완벽하지 않다 (Map, Set, circular ref 등).

TestBot은 같은 메모리를 공유하므로 **직렬화 없이 직접 참조**한다. 이건 Cypress도 마찬가지지만, Cypress는 `cy.` 체이닝 모델의 비동기 큐 때문에 즉시 동기 접근이 자연스럽지 않다.

### 3.3 Inspector Panel 통합

TestBot은 Inspector의 한 탭이다. 개발자가 OS State, Kernel Transaction, Event Stream을 보면서 **같은 화면에서** 테스트를 실행하고 결과를 본다.

```
┌─────────────────────────────────────────┐
│  App                                     │
│  ┌───────────────────────────────┐       │
│  │  Zone: listbox                │       │
│  │  → mail    ← 커서가 여기 이동 │       │
│  │    calendar                   │       │
│  │    notes                      │       │
│  └───────────────────────────────┘       │
├─────────────────────────────────────────┤
│  Inspector                               │
│  [OS State] [Kernel] [TestBot] [Events]  │
│                                          │
│  ✅ Navigate Down     ← 실시간 결과      │
│  ✅ Expect Focused                       │
│  ❌ Expect aria-selected                 │
│     Error: Expected "true", got null     │
│     Active: <li#mail role="option">      │
└─────────────────────────────────────────┘
```

이건 Playwright가 제공할 수 없는 경험이다. Playwright Trace Viewer는 별도 창에서 사후에 본다. TestBot은 **개발 중인 앱 안에서 실시간으로** 본다.

### 3.4 LLM 에이전트 루프에서의 차이

Playwright 기반 LLM 루프:

```
1. LLM: 코드 수정
2. LLM: "npx playwright test" 실행
3. 빌드 대기 (수 초)
4. 브라우저 시작 대기 (수 초)
5. 테스트 실행 (수 초)
6. 결과 파싱 (stdout)
7. LLM: 실패 분석
→ 1회 루프: 30초~1분
```

TestBot 기반 LLM 루프:

```
1. LLM: 코드 수정 (HMR 반영)
2. LLM: window.__TESTBOT__.rerunFailed()
3. 결과 즉시 반환 (구조화된 JSON)
4. LLM: 실패 분석
→ 1회 루프: 3~5초
```

**피드백 루프 속도가 10배 차이**난다. LLM 에이전트에게 30초는 영원이다. 한 번의 대화 턴에서 3~4회 수정-검증 사이클을 돌 수 있느냐 없느냐의 차이.

### 3.5 TestBot은 "시연"이다

사용자(인간 또는 LLM)에게 "이 컴포넌트가 어떻게 동작하는지" 를 **보여주는** 도구다.

- 신규 팀원 온보딩: TestBot 실행하면 Zone/Item이 어떻게 동작하는지 눈으로 본다
- LLM 컨텍스트: "이 컴포넌트의 동작을 설명해줘" 대신 TestBot 결과를 보여주면 된다
- 스펙 리뷰: "Home 키가 첫 아이템으로 가는가?" → TestBot 실행으로 즉시 증명

**Playwright는 CI에서 돌아간다. 아무도 보지 않는다. TestBot은 앱 안에서 돌아간다. 모두가 본다.**

---

## 4. 진짜 답: 둘 다 필요하다

| 역할 | 도구 | 실행 시점 |
|---|---|---|
| **개발 중 실시간 검증** | TestBot | 코드 작성하면서, Inspector 옆에서 |
| **LLM 에이전트 피드백 루프** | TestBot | `window.__TESTBOT__` 통해 즉시 |
| **시각적 시연 / 스펙 증명** | TestBot | 앱 내에서 실시간 커서로 |
| **CI 회귀 테스트** | Playwright | PR merge 전, headless |
| **크로스 브라우저 검증** | Playwright | 주기적, Safari/Firefox |
| **E2E 통합 테스트** | Playwright | 전체 앱 플로우 |

**TestBot은 Playwright를 대체하지 않는다. Playwright가 채울 수 없는 틈을 채운다.**

그 틈은:
1. 같은 런타임에서 즉시 실행 (빌드/서버 없음)
2. 앱 안에서 실시간 시각적 피드백
3. LLM 에이전트의 초 단위 피드백 루프
4. Kernel 내부 상태/트랜잭션 직접 참조

---

## 5. TestBot이 하지 말아야 할 것

TestBot이 Playwright를 흉내 내기 시작하면 **양쪽 다 중간만 하는 도구**가 된다.

TestBot이 **하지 말아야** 할 것:

| 하지 말 것 | 이유 |
|---|---|
| headless 실행 | 시각적 시연이 존재 이유. headless가 필요하면 Playwright를 쓴다 |
| CI 파이프라인 통합 | Playwright의 영역 |
| 크로스 브라우저 | Playwright의 영역 |
| 스크린샷 비교 | Playwright/Storybook의 영역 |
| parallel 실행 | 같은 DOM을 공유하므로 원리적으로 불가 |
| 네트워크 모킹 | MSW/Playwright의 영역 |

TestBot이 **해야** 할 것:

| 해야 할 것 | 이유 |
|---|---|
| 즉시 실행 (`runAll()`) | LLM 루프 속도 |
| 실시간 커서 + 스탬프 | 시각적 시연 |
| Kernel 상태/트랜잭션 검증 | 같은 런타임의 고유 장점 |
| Inspector 통합 | 개발 경험의 핵심 |
| `window.__TESTBOT__` API | LLM 에이전트 인터페이스 |
| `waitFor` 기반 assertion | 신뢰성 (이건 해야 한다) |

---

## 6. 제안: 역할 분리 원칙

```
TestBot = 개발 시점의 실시간 시연 + LLM 피드백 루프
Playwright = 배포 시점의 회귀 방지 + 크로스 브라우저 검증
```

**테스트 코드를 공유하되, 러너를 분리:**

```typescript
// shared test definition
export function listboxTests(t: TestActions) {
  t.describe("ArrowDown navigates", async (t) => {
    await t.click({ role: "option", name: "Item 1" });
    await t.press("ArrowDown");
    await t.expect({ role: "option", name: "Item 2" }).toBeFocused();
  });
}

// TestBot runner (앱 내)
useTestBotRoutes("listbox", (bot) => listboxTests(bot));

// Playwright runner (CI)
test("listbox", async ({ page }) => {
  await listboxTests(playwrightAdapter(page));
});
```

`TestActions` 인터페이스를 추상화하면, **같은 테스트 시나리오**를 TestBot(개발 시점)과 Playwright(CI)에서 모두 실행할 수 있다. 테스트를 두 번 작성할 필요가 없다.

---

## 7. 결론

**TestBot을 만들어야 하는가?** 이미 만들었고, 그 가치는 증명되었다 (14개 스펙 위반 발견).

**Playwright를 도입해야 하는가?** 예. CI 회귀 테스트에는 TestBot이 적합하지 않다.

**둘 중 하나만 골라야 하는가?** 아니다. 역할이 다르다.

```
TestBot ≠ 열등한 Playwright
TestBot = Playwright가 못하는 것을 하는 다른 종류의 도구
```

핵심은 **경계를 지키는 것**이다. TestBot이 CI 러너가 되려 하거나, Playwright가 앱 내 시연을 하려 하면 둘 다 어중간해진다. 각자의 강점에 집중하고, 테스트 시나리오만 공유한다.
