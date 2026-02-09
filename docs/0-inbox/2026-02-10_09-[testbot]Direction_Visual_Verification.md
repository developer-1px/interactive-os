# TestBot의 방향성: LLM이 쓴 테스트를 사람이 검증하는 도구

> 날짜: 2026-02-10
> 태그: testbot, direction, llm, playwright, visual-verification
> 상태: 제안

---

## 1. 핵심 명제

**TestBot = LLM이 작성한 Playwright 스타일 테스트를 앱 안에서 시각적으로 시뮬레이션하는 도구**

```
LLM이 테스트를 쓴다 → 그 테스트가 맞는지 누가 확인하는가? → 사람이 눈으로 본다.
```

---

## 2. 문제: LLM이 쓴 테스트를 누가 검증하는가?

LLM은 Playwright 테스트를 잘 쓴다. 학습 데이터에 수백만 건이 있다.

```typescript
// LLM이 생성한 Playwright 테스트
test("ArrowDown navigates to next option", async ({ page }) => {
  await page.getByRole("option", { name: "Mail" }).click();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("option", { name: "Calendar" })).toBeFocused();
});
```

이 코드는 문법적으로 완벽하다. CI에서 돌리면 pass/fail이 나온다.

**하지만:**

- 이 테스트가 **올바른 것을 검증하고 있는가?**
- ArrowDown 다음에 Calendar가 맞는가, Notes가 맞는가?
- `toBeFocused()`가 맞는가, `toHaveAttribute("aria-selected", "true")`가 맞는가?
- 이 테스트가 pass한다고 해서 **사용자가 기대하는 동작**인가?

CI의 녹색 체크마크는 "테스트가 통과했다"만 말한다. "테스트가 올바르다"는 말하지 않는다.

**LLM이 코드를 과신하듯, LLM이 쓴 테스트도 과신할 수 있다.**

---

## 3. 해법: 시각적 시뮬레이션

같은 테스트 코드를 **앱 안에서 실행하면서 눈으로 보여준다.**

```
┌─────────────────────────────────────────┐
│  App                                     │
│  ┌───────────────────────────────┐       │
│  │  Listbox                      │       │
│  │    Mail                       │       │
│  │  ► Calendar  ← 커서가 여기로   │       │
│  │    Notes                      │       │
│  └───────────────────────────────┘       │
│                                          │
│  🖱️ click "Mail"                         │
│  ⌨️ press ArrowDown                      │
│  ✅ "Calendar" is focused                │
└─────────────────────────────────────────┘
```

사람은 이걸 보고 판단한다:

- "ArrowDown 다음에 Calendar로 가는 게 맞네" ✅
- "아니, 이건 Notes여야 하는데?" → 테스트가 틀림
- "포커스는 맞는데 스크롤이 안 따라가네?" → 테스트가 부족함

**CI가 "통과 여부"를 확인한다면, TestBot은 "의도 부합 여부"를 확인한다.**

---

## 4. Playwright 코드를 그대로 실행한다는 것의 의미

### 4.1 하나의 시나리오, 두 개의 러너

```typescript
// tests/scenarios/listbox.ts — 러너에 무관한 시나리오
export function listboxTests(t: TestActions) {
  t.describe("ArrowDown navigates", async (t) => {
    await t.click({ role: "option", name: "Mail" });
    await t.press("ArrowDown");
    await t.expect({ role: "option", name: "Calendar" }).toBeFocused();
  });
}
```

```typescript
// Playwright (CI) — headless, 자동, 녹색/빨간색
test.describe("Listbox", () => {
  listboxTests(playwrightAdapter(page));
});

// TestBot (앱 내) — 시각적, 실시간, 커서가 움직임
useTestBotRoutes("listbox", (bot) => {
  listboxTests(bot);
});
```

**LLM이 시나리오를 한 번 쓰면:**
- Playwright가 CI에서 회귀를 잡는다
- TestBot이 앱 안에서 사람에게 보여준다

### 4.2 LLM 친화적 API = Playwright 호환 API

TestBot의 API가 Playwright와 다르면, LLM이 별도로 배워야 한다. Playwright와 같으면, LLM의 기존 지식을 그대로 쓴다.

```typescript
// Playwright
await page.getByRole("option", { name: "Mail" }).click();
await page.keyboard.press("ArrowDown");
await expect(page.getByRole("option", { name: "Calendar" })).toBeFocused();

// TestBot — 동일한 패턴, 커서 시각화가 추가될 뿐
await t.click({ role: "option", name: "Mail" });      // 커서 이동 + 클릭 리플
await t.press("ArrowDown");                            // 키캡 버블 표시
await t.expect({ role: "option", name: "Calendar" }).toBeFocused();  // ✅ 스탬프
```

차이는 **커서가 움직이는지 여부**뿐이다. 테스트 로직은 동일하다.

---

## 5. TestBot의 재정의

### 기존 프레이밍 (Doc 06: Red Team)

```
TestBot = 스펙 위반을 찾는 적대적 테스트 도구 (Red Team)
```

### 새로운 프레이밍

```
TestBot = LLM이 쓴 테스트의 시각적 검증 도구 (Visual Verifier)
```

| | Red Team 프레이밍 | Visual Verifier 프레이밍 |
|---|---|---|
| 테스트 작성자 | 사람 (스펙 보고 수동 작성) | **LLM** (Playwright 스타일로 자동 생성) |
| 검증 대상 | OS 구현체의 스펙 준수 여부 | **LLM이 쓴 테스트의 올바름** |
| 실행 목적 | 버그 발견 | **의도 확인** |
| 핵심 가치 | 자동화된 adversary | **시각적 시뮬레이션** |

두 프레이밍은 배타적이지 않다. TestBot은 Red Team이면서 동시에 Visual Verifier다. 하지만 **주된 사용 시나리오**는 달라진다:

```
이전: 사람이 테스트를 쓰고 → TestBot이 자동 실행 → 버그 발견
이후: LLM이 테스트를 쓰고 → TestBot이 시각 실행 → 사람이 의도 확인
```

---

## 6. 워크플로우

### 6.1 개발 시

```
1. 사람: "Listbox 컴포넌트의 키보드 네비게이션 테스트 작성해줘"
2. LLM:  Playwright 스타일 시나리오 생성 (10개 suite)
3. TestBot: 앱 안에서 시각적 실행
4. 사람: 커서가 움직이는 걸 보면서 확인
   - "3번 테스트, End 키 누른 다음에 마지막 아이템이 아니라 마지막 visible 아이템으로 가야 해"
   - → LLM에게 수정 지시
5. LLM:  시나리오 수정
6. TestBot: 재실행 → 사람 확인 → 통과
7. 같은 시나리오가 CI Playwright에도 등록됨
```

### 6.2 코드 리뷰 시

```
1. PR에 새 컴포넌트 추가됨
2. 리뷰어: TestBot 탭 열고 시나리오 실행
3. 커서가 움직이며 동작을 보여줌
4. 리뷰어: "이 동작이 스펙에 맞는지" 눈으로 확인
   - 코드를 한 줄씩 읽는 것보다 빠르다
```

### 6.3 온보딩 시

```
1. 신규 팀원: "이 컴포넌트가 어떻게 동작해?"
2. TestBot 실행 → 커서가 시연
3. 테스트 코드 자체가 스펙 문서 역할
```

---

## 7. 이 방향에서 Testing Library 도입의 의미

Testing Library를 내부에 쓰면:

| | 효과 |
|---|---|
| 쿼리 | `screen.getByRole()` — Playwright의 `page.getByRole()`과 1:1 |
| 이벤트 | `user.click()` — Playwright의 `.click()`과 1:1 |
| 대기 | `waitFor()` — Playwright의 auto-wait와 동일한 역할 |
| 어설션 | jest-dom 매처 — Playwright의 `expect()` 매처와 1:1 |

**Testing Library가 곧 "브라우저 안의 Playwright"가 된다.** API가 거의 동일하므로, TestActions 어댑터가 얇아진다.

```
Playwright (CI)       = page.getByRole + page.keyboard + expect
TestBot (앱 내)       = screen.getByRole + user.keyboard + waitFor + expect
                        + 커서 시각화
```

---

## 8. TestBot이 하는 것 / 하지 않는 것 (재정의)

### 한다

| | 이유 |
|---|---|
| Playwright 호환 TestActions 인터페이스 | LLM이 한 번 쓰면 양쪽에서 실행 |
| 시각적 커서 + 스탬프 + 리플 | 사람이 눈으로 검증하는 핵심 도구 |
| Inspector 패널 통합 | 앱 안에서 즉시 확인 |
| `window.__TESTBOT__` API | LLM 에이전트 피드백 루프 |
| @testing-library/dom + user-event 내부 사용 | 검증된 쿼리/이벤트 엔진 |

### 하지 않는다

| | 이유 |
|---|---|
| 자체 쿼리 엔진 | Testing Library가 더 정확 |
| 자체 이벤트 시뮬레이션 | user-event가 더 현실적 |
| CI 실행 | Playwright의 영역 |
| headless 모드 | 시각적 시연이 존재 이유 |
| 자체 API 설계 | Playwright 호환이 LLM 친화적 |

---

## 9. 요약

```
LLM이 테스트를 잘 쓴다.
하지만 LLM이 쓴 테스트가 맞는지는 사람이 봐야 한다.
CI의 녹색 체크는 "통과"를 말하지 "올바름"을 말하지 않는다.

TestBot = Playwright 테스트 코드를 앱 안에서 시각적으로 재생하는 도구.
사람은 커서가 움직이는 걸 보고 "이게 내가 원한 동작인가"를 판단한다.

테스트 코드는 하나. 러너는 둘.
Playwright는 "깨졌는가"를 확인한다.
TestBot은 "맞는가"를 보여준다.
```
