# TestBot 설계 논의 통합본 (2026-02-10)

> **통합일**: 2026-02-10
> **원본 파일 수**: 8
> **출처**: docs/0-inbox/ (PARA 정리 시 통합)

---

---

## 📄 2026-02-10_05-[testbot]Improvement_Proposal

# TestBot 개선 제안서

> 날짜: 2026-02-10
> 태그: testbot, improvement, proposal
> 상태: 제안

---

## 1. 현재 상태 요약

TestBot은 **브라우저 내 시각적 E2E 테스트 러너**로, 실제 DOM 이벤트를 디스패치하고 커서 애니메이션으로 실행 과정을 시각화한다.

| 항목 | 현황 |
|---|---|
| 코드량 | ~2,600 LOC (17 파일) |
| 아키텍처 | Zustand 기반, `os/testBot/`에 위치 |
| 테스트 수 | 51 suites (aria-showcase), 37 pass / 14 fail |
| LLM API | `window.__TESTBOT__` (3-layer: data-attr + JSON + global API) |
| 주요 강점 | 시각적 피드백, 시맨틱 셀렉터, LLM 친화적 출력 |

---

## 2. 식별된 문제 (우선순위별)

### P0 — 테스트 신뢰성

#### 2.1 Assertion에 retry/waitFor가 없다

현재 모든 assertion은 **고정 delay 후 1회 체크**:

```typescript
// createActions.ts — 현재
toBeFocused(): await wait(60); check(el === activeElement)
toHaveText():  await wait(150); check(el.textContent === text)
toExist():     await wait(150); check(querySelector !== null)
```

React 상태 업데이트, 애니메이션, 비동기 렌더링으로 인해 **타이밍 불일치가 가장 큰 실패 원인**이다. 14개 실패 suite 중 상당수가 이 문제와 관련.

**제안: `waitFor` 패턴 도입**

```typescript
async function waitFor(
  check: () => boolean,
  { timeout = 1000, interval = 50 } = {},
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (check()) return;
    await wait(interval);
  }
  throw new BotError(`waitFor timed out after ${timeout}ms`);
}

// 사용
toBeFocused() {
  await waitFor(() => el === document.activeElement);
}
```

모든 assertion을 `waitFor` 기반으로 전환하면 고정 delay를 제거하면서도 빠르게 통과할 수 있다 (조건 충족 시 즉시 resolve).

#### 2.2 Re-mount 타이밍이 하드코딩되어 있다

```typescript
// TestBotActions.ts:66
await new Promise((r) => setTimeout(r, 300)); // 300ms 고정 대기
```

`resetKey++` 후 React가 컴포넌트를 언마운트/리마운트하는 데 300ms를 가정. 복잡한 컴포넌트에서는 부족할 수 있고, 단순한 경우에는 낭비.

**제안: DOM 관찰 기반 대기**

```typescript
async function waitForRemount(containerSelector: string): Promise<void> {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutations) => {
      // 컨테이너가 교체되면 resolve
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          observer.disconnect();
          resolve();
          return;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // fallback timeout
    setTimeout(() => { observer.disconnect(); resolve(); }, 2000);
  });
}
```

---

### P1 — 아키텍처

#### 2.3 Kernel 통합 부재

TestBot은 `os/`(legacy) 에만 존재하고 Kernel을 전혀 모른다. os-new/로의 마이그레이션이 진행되면:

- Zustand store를 직접 조작하는 테스트가 깨진다
- Kernel `dispatch` → `effects` 파이프라인을 테스트할 방법이 없다
- Transaction Inspector와의 연동이 불가

**제안: Kernel-aware TestBot 어댑터**

```typescript
// 기존 TestActions 인터페이스는 유지하되, 내부적으로 Kernel을 활용
interface KernelTestExtensions {
  /** Kernel dispatch 후 상태 변화를 검증 */
  expectState(selector: (state: AppState) => unknown): {
    toBe(expected: unknown): Promise<void>;
    toContain(partial: unknown): Promise<void>;
  };

  /** 마지막 트랜잭션 검증 */
  expectTransaction(): {
    toHaveCommand(type: string): Promise<void>;
    toHaveEffect(key: string): Promise<void>;
    toHaveChanges(path: string): Promise<void>;
  };

  /** Kernel dispatch를 직접 수행 */
  dispatch(command: Command): Promise<void>;
}
```

기존 DOM 기반 테스트(`click`, `press`, `expect`)와 Kernel 상태 기반 테스트를 **동일한 suite에서 혼용** 가능.

#### 2.4 TestBot이 os/ 에 묶여 있다

`os/testBot/`에 위치하여 `os-new/`에서 import할 수 없다 (레이어 역전).

**제안: `packages/testbot/` 으로 분리**

```
packages/
├── kernel/        # 커맨드 엔진
└── testbot/       # 테스트 러너 (kernel, os 모두와 독립)
    ├── core/      # testBot, actions, cursor
    ├── adapters/  # kernel-adapter, dom-adapter
    └── ui/        # Panel, SuiteDetails
```

Kernel과 동일하게 독립 패키지로 분리하면:
- os/, os-new/ 어디서든 사용 가능
- Kernel 없이도 순수 DOM 테스트 가능
- Kernel 연동 시 어댑터만 추가

---

### P1 — LLM 호환성 (Red Team 감사 반영)

#### 2.5 해결된 P0 항목

Doc 01 (Red Team)에서 지적한 항목 중 **이미 구현된 것**:

| 항목 | Red Team 지적 | 현재 상태 |
|---|---|---|
| A-4 | `toHaveValue`, `toHaveText`, `toBeVisible` 없음 | ✅ 구현됨 (createActions.ts) |
| A-5 | `type()` 메서드 없음 | ✅ 구현됨 |
| A-2 | implicit role 미지원 | ✅ implicitRoles.ts (20+ roles) |
| A-8 | 시맨틱 셀렉터를 click에 직접 전달 불가 | ✅ `click({ text: "..." })` 지원 |
| A-3 | `getAllByText` 없음 | ✅ 구현됨 |

#### 2.6 미해결 항목

| 항목 | 내용 | 제안 |
|---|---|---|
| A-1 | `getByText()`가 leaf node만 매칭 (descendant count 최소) | `textContent.includes(text)` 기반으로 변경, closest match 기준 재설계 |
| A-6 | 테스트 간 상태 오염 — 수동 cleanup 필요 | `beforeAll`/`afterAll` hook 추가 또는 `resetKey` 패턴 강화 |
| A-7 | `await` 누락 시 silent fail | unresolved promise 감지 로직 추가 |

---

### P2 — 기능 개선

#### 2.7 beforeAll / afterAll 부재

현재 `beforeEach`/`afterEach`만 존재. Suite 단위 setup/teardown이 불가.

```typescript
// 제안
interface TestBot {
  beforeAll(fn: () => Promise<void>): void;   // 전체 실행 전 1회
  afterAll(fn: () => Promise<void>): void;    // 전체 실행 후 1회
  beforeEach(fn: () => Promise<void>): void;  // 각 suite 전
  afterEach(fn: () => Promise<void>): void;   // 각 suite 후
  describe(name: string, fn: TestFn): void;
}
```

#### 2.8 Assertion 체이닝 부재

현재 각 assertion이 독립적. 하나의 요소에 여러 assertion을 걸 때 반복적:

```typescript
// 현재
await t.expect("#input").toBeFocused();
await t.expect("#input").toHaveValue("hello");
await t.expect("#input").toHaveAttribute("aria-invalid", "false");
```

**제안: soft assertion 모드**

```typescript
// 제안: 여러 assertion을 모아서 한 번에 검증
await t.expect("#input").all(
  (e) => e.toBeFocused(),
  (e) => e.toHaveValue("hello"),
  (e) => e.toHaveAttribute("aria-invalid", "false"),
);
// → 하나의 step으로 기록, 모든 assertion 결과 종합
```

#### 2.9 테스트 필터링 / 태깅

Suite 수가 51개 이상으로 증가하면서 **선택적 실행**이 필요:

```typescript
// 제안
bot.describe("Navigation", async (t) => { ... }, { tags: ["keyboard", "nav"] });
bot.describe.skip("WIP feature", async (t) => { ... });
bot.describe.only("Debugging this", async (t) => { ... });

// Global API
window.__TESTBOT__.runByTag("keyboard");
window.__TESTBOT__.runByTag("aria");
```

#### 2.10 실패 컨텍스트 강화

현재 `captureFailureContext()`는 active element만 캡처 (50자 truncation):

```
[Failure Context]
→ Active: <button#submit role="button"> "Click to Submit..."
```

**제안: 확장된 컨텍스트**

```
[Failure Context]
→ Active: <button#submit role="button"> "Click to Submit"
→ Expected: <input#email> to be focused
→ DOM Snapshot: <input#email aria-invalid="true" value="" disabled>
→ Recent Kernel Txs: [NAVIGATE(down), ACTIVATE, FOCUS("email")]
→ Visible Zone: "login-form" (5 items, focused: "submit")
```

Kernel Transaction 로그와 Zone 상태를 포함하면 LLM이 실패 원인을 자가 진단할 수 있다.

---

### P2 — 커서 & 시각화

#### 2.11 FAIL 스탬프가 viewport 고정

```typescript
// cursor.ts:369 — 현재
stamp.style.left = `${cx}px`;  // viewport 기준 fixed position
stamp.style.top = `${cy}px`;
```

스크롤하면 스탬프가 요소에서 벗어난다.

**제안:** absolute position + 요소의 `offsetParent` 기준으로 변경하거나, `position: sticky` 래퍼 사용.

#### 2.12 Element Tracking Debounce가 과도

```typescript
// cursor.ts:271 — 250ms debounce
```

빠른 키보드 네비게이션에서 커서가 요소를 쫓아가지 못함.

**제안:** debounce를 `100ms`로 줄이거나, `requestAnimationFrame` 기반으로 전환.

---

## 3. 구현 로드맵

### Phase 1: 신뢰성 (P0)

| 작업 | 예상 변경 | 영향 범위 |
|---|---|---|
| `waitFor` 도입 | `createActions.ts` — assertion 함수 전체 | 14개 실패 suite 중 타이밍 관련 즉시 해소 |
| Re-mount MutationObserver | `TestBotActions.ts` — `runAll`/`runSuite` | 300ms 하드코딩 제거 |

### Phase 2: Kernel 통합 (P1)

| 작업 | 예상 변경 | 영향 범위 |
|---|---|---|
| `expectState`, `expectTransaction` | 새 파일 `kernelExtensions.ts` | 기존 API 유지, 확장 |
| `packages/testbot/` 분리 | 디렉토리 이동 + import 경로 변경 | os/, os-new/ 양쪽 |

### Phase 3: DX 개선 (P2)

| 작업 | 예상 변경 | 영향 범위 |
|---|---|---|
| `beforeAll`/`afterAll` | `testBot.ts` — 5줄 추가 | 기존 API 확장 |
| 태그 필터링 | `TestBot.ts` 인터페이스 + `globalApi.ts` | describe 시그니처 확장 |
| 실패 컨텍스트 확장 | `context.ts` — Kernel 연동 | LLM 자가 진단 품질 향상 |
| 커서 스탬프 수정 | `cursor.ts` — 스탬프 positioning | 시각적 정확성 |

---

## 4. Red Team 감사 현황 (업데이트)

Doc 01에서 지적된 8개 항목의 현재 상태:

| # | 항목 | 우선순위 | 상태 | 비고 |
|---|---|---|---|---|
| A-1 | getByText leaf node 문제 | P1 | ⚠️ 미해결 | descendant count 기반 → textContent 기반 전환 필요 |
| A-2 | implicit role 미지원 | P1 | ✅ 해결됨 | `implicitRoles.ts` (20+ roles) |
| A-3 | getAllByText 없음 | P2 | ✅ 해결됨 | 구현 완료 |
| A-4 | toHaveValue/Text/Visible 없음 | P0 | ✅ 해결됨 | + toBeDisabled, toHaveCount 추가 |
| A-5 | type() 없음 | P0 | ✅ 해결됨 | input/textarea 지원 |
| A-6 | 상태 오염 방지 없음 | P2 | ⚠️ 부분 해결 | resetKey 패턴으로 부분 대응 |
| A-7 | await 누락 silent fail | P2 | ❌ 미해결 | unresolved promise 감지 필요 |
| A-8 | 시맨틱 셀렉터 직접 전달 | P1 | ✅ 해결됨 | `click({ text })` 지원 |

**Red Team 해소율: 5/8 해결, 1 부분, 2 미해결**

---

## 5. ARIA Showcase 실패 분석 (14 suites)

Doc 02에서 분류한 6개 카테고리:

| 카테고리 | 실패 수 | 근본 원인 | TestBot 측 개선 가능? |
|---|---|---|---|
| A: onActivate 미발화 | 4 | FocusItem이 Enter→click relay 안 함 | ❌ OS 수정 필요 |
| B: Tab auto-select | 1 | followFocus 미구현 | ❌ OS 수정 필요 |
| C: aria-selected null | 3 | select pipeline 미렌더링 | ❌ OS 수정 필요 |
| D: Dialog focus restore | 2 | focus stack pop 순서 | ❌ OS 수정 필요 |
| E: Grid Home/End | 2 | NAVIGATE row-scope 미구현 | ❌ OS 수정 필요 |
| F: Combobox 구조 | 2 | 별도 FocusGroup 간 이동 불가 | ❌ OS 수정 필요 |

**결론:** 14개 실패 중 **TestBot 자체 문제는 0개**. 전부 OS 레이어(FocusGroup, 커맨드 핸들러) 문제. 다만 `waitFor` 도입으로 **타이밍 관련 false negative**는 줄일 수 있다.

---

## 6. 요약

| 우선순위 | 핵심 | 효과 |
|---|---|---|
| **P0** | `waitFor` 패턴 도입 | 타이밍 기반 false negative 제거, 테스트 속도 향상 |
| **P1** | Kernel 통합 (`expectState`, `expectTransaction`) | os-new/ 마이그레이션 대응, 상태 기반 테스트 |
| **P1** | `packages/testbot/` 분리 | os/, os-new/ 양쪽 사용 가능 |
| **P2** | DX (태그, beforeAll, 컨텍스트 확장) | suite 증가 대비 관리성 |
| **P2** | 커서 시각화 개선 | 스탬프 정확성, 추적 반응성 |


---

## 📄 2026-02-10_06-[testbot]Red_Blue_Team_Thesis

# TestBot의 의의 — Red Team / Blue Team

> 날짜: 2026-02-10
> 태그: testbot, red-team, blue-team, ai-native, thesis
> 상태: 의견서

---

## 1. 문제: LLM은 자기 코드를 검증할 수 없다

LLM이 코드를 작성한다. 하지만 **자기가 쓴 코드가 맞는지 확인할 방법**이 없다.

```
LLM: "NAVIGATE 커맨드를 구현했습니다. ArrowDown을 누르면 다음 아이템으로 이동합니다."
→ 정말? 실제 DOM에서 포커스가 이동하는가?
→ aria-activedescendant가 업데이트되는가?
→ 마지막 아이템에서 wrap되는가?
→ Grid에서 ArrowRight가 다음 열로 가는가?
```

LLM은 코드를 **읽고** 맞다고 판단할 수 있지만, 실제 **브라우저에서 실행한 결과**를 확인할 수 없다. 코드 리뷰와 실행 검증 사이에 gap이 존재한다.

이 gap을 메우는 유일한 방법: **코드가 아닌 런타임을 검증하는 자동화된 adversary.**

---

## 2. Red Team / Blue Team 모델

### Blue Team: OS 구현체

```
os-new/
├── 3-commands/     NAVIGATE, ACTIVATE, ESCAPE, SELECT, EXPAND, TAB...
├── 4-effects/      focus(), scroll(), blur(), click()
├── 6-components/   Zone, Item
└── kernel.ts       dispatch → handler → effects
```

Blue Team은 **W3C APG 스펙을 코드로 구현**한다. Listbox, Menu, Tabs, Grid, Dialog, Combobox — 각각의 키보드 인터랙션 패턴을 구현한다.

Blue Team의 목표: **모든 ARIA 패턴이 스펙대로 동작하게 만든다.**

### Red Team: TestBot

```
testBot/
├── actions/        click(), press(), type(), expect()
├── cursor           시각적 실행 추적
└── globalApi        window.__TESTBOT__
```

Red Team은 **스펙을 기준으로 구현체를 공격**한다. 실제 키보드 이벤트를 발사하고, 포커스가 맞는 곳에 있는지, 선택이 올바른지, 속성이 업데이트되었는지 검증한다.

Red Team의 목표: **Blue Team의 구현에서 스펙 위반을 찾아낸다.**

### 심판: W3C APG Spec

Red Team과 Blue Team 모두 **같은 스펙**을 참조한다. 의견 충돌은 없다. 스펙이 맞다.

```
W3C APG: "Listbox에서 Home을 누르면 첫 번째 옵션으로 이동한다"
                    ↓                              ↓
          Blue Team: NAVIGATE 핸들러        Red Team: press("Home")
          Home → items[0]으로 이동          expect(items[0]).toBeFocused()
```

---

## 3. 왜 LLM에게 이 구조가 필수적인가

### 3.1 LLM은 자기 코드를 과신한다

LLM이 NAVIGATE 커맨드를 구현하면, 그 코드가 맞다고 "확신"한다. 하지만:

- Off-by-one 에러 (마지막 아이템에서 overflow)
- 이벤트 버블링 순서 오류
- `aria-selected` vs `aria-checked` 혼동
- `roving tabindex` vs `aria-activedescendant` 혼용

이런 실수는 **코드를 읽는 것만으로는 발견할 수 없다.** 브라우저에서 실행해봐야 안다.

TestBot은 LLM의 과신을 **런타임 증거로 검증**한다.

### 3.2 Red Team은 Blue Team과 독립적이어야 한다

Red Team(TestBot)이 Blue Team(OS)과 같은 코드 경로를 공유하면 의미가 없다.

```
// ❌ 의미 없는 테스트: 같은 코드를 호출
test("navigate works", () => {
  const result = resolveNavigate("down", items, config);
  expect(result.targetId).toBe("item-2");
});
```

위 테스트는 `resolveNavigate` 함수의 단위 테스트일 뿐이다. **사용자가 실제로 ArrowDown을 눌렀을 때** 포커스가 이동하는지는 검증하지 않는다.

```
// ✅ 의미 있는 테스트: 실제 DOM 이벤트
test("navigate works", async (t) => {
  await t.click({ role: "option", name: "Item 1" });
  await t.press("ArrowDown");
  await t.expect({ role: "option", name: "Item 2" }).toBeFocused();
});
```

이 테스트는 Sensor → Command → Effect → DOM 전체 파이프라인을 관통한다. Red Team과 Blue Team이 **완전히 다른 코드 경로**를 탄다.

### 3.3 LLM 자가 수정 루프가 가능해진다

TestBot이 없으면:

```
LLM: 코드 작성 → 인간: 브라우저에서 확인 → 인간: "안 돼" → LLM: 수정
                  ^^^^ 병목
```

TestBot이 있으면:

```
LLM: 코드 작성 → TestBot: 자동 실행 → 결과 JSON → LLM: 실패 분석 → LLM: 수정 → TestBot: 재실행
                                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                    인간 개입 없는 피드백 루프
```

`window.__TESTBOT__.runAll()` → `getFailures()` → LLM이 실패 원인 분석 → 코드 수정 → `rerunFailed()`.

**인간이 자리를 비워도 품질이 수렴한다.**

---

## 4. "Structure as Specification" 과의 관계

프로젝트 철학이 "Structure as Specification"이다. 코드 구조 자체가 스펙이다.

TestBot은 이 철학의 **검증 계층**이다:

```
W3C APG Spec (문서)
    ↓ Blue Team이 구현
OS Commands, Effects, Components (코드 = 스펙)
    ↓ Red Team이 검증
TestBot Suites (테스트 = 스펙의 실행 가능한 증명)
```

TestBot suite가 통과한다 = **스펙이 런타임에서 증명되었다.**

TestBot suite가 실패한다 = **코드는 존재하지만 스펙을 만족하지 않는다.**

테스트는 문서가 아니다. 테스트는 **실행 가능한 스펙**이다.

---

## 5. 현재 증명: 51 Suites, 37 Pass, 14 Fail

ARIA Showcase에서 51개 테스트 suite를 실행한 결과:

- **37 pass** — Blue Team이 스펙을 올바르게 구현한 37개 패턴
- **14 fail** — Red Team이 발견한 14개 스펙 위반

14개 실패의 근본 원인 분석:

| 카테고리 | 실패 수 | 의미 |
|---|---|---|
| onActivate 미발화 | 4 | Enter/Space → click relay가 빠져있다 |
| Tab auto-select | 1 | followFocus 옵션이 미구현 |
| aria-selected 미갱신 | 3 | select pipeline이 DOM에 반영되지 않는다 |
| Dialog focus restore | 2 | 닫힐 때 focus stack pop이 안 된다 |
| Grid Home/End scope | 2 | row-scoped navigation이 미구현 |
| Combobox 구조 문제 | 2 | 별도 FocusGroup 간 이동 불가 |

**이 14개는 TestBot 없이는 발견할 수 없었다.** LLM이 코드를 읽어서 "onActivate가 발화되지 않을 것"이라고 추론하기는 극히 어렵다. 실제로 Enter를 누르고 결과를 관찰해야만 드러나는 문제들이다.

---

## 6. Kernel 시대의 Red Team

os-new/에서 Kernel 기반으로 전환되면 Red Team의 역할이 확장된다:

### 6.1 DOM 검증 (기존)

```typescript
await t.press("ArrowDown");
await t.expect({ role: "option", name: "Item 2" }).toBeFocused();
```

"사용자 관점에서 맞는가?"를 검증.

### 6.2 State 검증 (신규)

```typescript
await t.press("ArrowDown");
await t.expectState((s) => s.os.focus.zones["list"].focusedItemId).toBe("item-2");
```

"내부 상태가 올바른가?"를 검증. DOM은 맞는데 상태가 틀린 경우(또는 그 반대)를 잡아낸다.

### 6.3 Transaction 검증 (신규)

```typescript
await t.press("ArrowDown");
await t.expectTransaction()
  .toHaveCommand("OS_NAVIGATE")
  .toHaveEffect("focus")
  .toHaveChanges("os.focus.zones.list.focusedItemId");
```

"파이프라인이 올바른 경로를 탔는가?"를 검증. 상태는 맞는데 잘못된 커맨드가 처리된 경우를 잡아낸다.

### 세 겹의 검증

```
Layer 1: DOM       — 사용자가 보는 것이 맞는가?
Layer 2: State     — 내부 상태가 일관적인가?
Layer 3: Pipeline  — 올바른 경로로 처리되었는가?
```

어느 한 레이어만 테스트하면 나머지 두 레이어의 불일치를 놓친다. **세 겹 모두 통과해야 진짜 맞다.**

---

## 7. 요약

| | Red Team 없이 | Red Team 있으면 |
|---|---|---|
| 구현 검증 | 인간이 브라우저에서 수동 확인 | `runAll()` → 자동 검증 |
| LLM 피드백 | "이 코드 맞아 보입니다" | "37 pass, 14 fail — 실패 목록과 원인" |
| 스펙 준수 | 코드 리뷰로 추정 | 런타임 증명 |
| 자가 수정 | 불가능 (인간 병목) | LLM → TestBot → LLM 루프 |
| 회귀 방지 | 없음 | 51개 suite가 상시 감시 |

**TestBot은 "테스트 도구"가 아니다. LLM 시대의 개발에서 코드 품질을 수렴시키는 피드백 메커니즘이다.**

Red Team 없는 Blue Team은 자기 확신에 빠진다. Blue Team 없는 Red Team은 공격할 대상이 없다. 둘이 함께 돌아야 **스펙이 코드가 되고, 코드가 증명이 된다.**


---

## 📄 2026-02-10_07-[testbot]Build_vs_Buy_Debate

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


---

## 📄 2026-02-10_08-[testbot]Implementation_Strategy

# TestBot 구현 전략: 자체 구현 vs 라이브러리 활용

> 날짜: 2026-02-10
> 태그: testbot, strategy, testing-library, playwright
> 상태: 논의

---

## 1. 질문

TestBot을 유지한다면, 내부 구현을 어떻게 해야 하는가?

| 선택지 | 설명 |
|---|---|
| A | 현재처럼 전부 자체 구현 |
| B | Playwright 위에 구축 |
| C | 기존 라이브러리의 런타임 부품을 조합 |
| D | 인터페이스만 통일하고 러너는 분리 |

---

## 2. 선택지 B 검토: Playwright 위에 구축 — 불가

Playwright의 아키텍처:

```
Node.js Process              Browser
┌──────────┐    CDP/WebSocket    ┌──────────┐
│ Playwright│ ←──────────────── │  Chrome   │
│ (test.ts) │ ──────────────→  │  (app)    │
└──────────┘                    └──────────┘
```

Playwright는 **별도 프로세스**에서 브라우저를 원격 조종한다. 앱 내부에서 실행할 수 없다.

- `@playwright/test`는 Node.js 전용 (브라우저에서 import 불가)
- CDP 기반이라 브라우저 밖에서만 동작
- 같은 런타임 접근(kernel.getState() 등)이 원리적으로 불가

**결론: Playwright 위에 TestBot을 구축하는 것은 불가능하다.**

Cypress도 마찬가지 문제가 있다. 같은 브라우저에서 돌긴 하지만 **별도 iframe**이고, `cy.*` 체이닝 모델은 동기적 코드 흐름과 호환되지 않으며, Inspector 패널 안에 내장할 수 없다.

---

## 3. 선택지 C 검토: 런타임 부품 조합 — 유력

TestBot의 기능을 분해하면:

```
TestBot = 쿼리 + 이벤트 + 어설션 + 대기 + 커서 + 오케스트레이션 + Inspector
          ─────────────────────────────   ─────────────────────────────────
          기존 라이브러리로 대체 가능        자체 구현 필수
```

### 대체 가능한 부분

#### @testing-library/dom (8KB gzip)

```
npm: @testing-library/dom
브라우저 실행: ✅ (순수 DOM API만 사용)
```

TestBot이 직접 구현한 것 중 이 라이브러리가 더 잘하는 것:

| TestBot 현재 | @testing-library/dom | 차이 |
|---|---|---|
| `getByText()` — O(n) 스캔, descendant count 휴리스틱 | `screen.getByText()` — TextMatcher, exact/regex 지원 | TL이 더 정확하고 유연 |
| `getByRole()` — 20개 implicit role 수동 매핑 | `screen.getByRole()` — 전체 WAI-ARIA role 지원, accessible name 계산 | TL이 압도적으로 완전 |
| `getAllByText()` — leaf node 스캔 | `screen.getAllByText()` | TL이 표준 |
| — | `screen.getByLabelText()`, `getByPlaceholderText()`, `getByDisplayValue()` | TestBot에 없는 쿼리 |
| 없음 (고정 delay) | **`waitFor(callback, { timeout })`** | TL의 waitFor가 핵심 |

**`waitFor`가 이미 있다.** TestBot의 P0 개선 사항(waitFor 도입)을 직접 구현할 필요 없이 가져다 쓸 수 있다.

```typescript
import { screen, waitFor } from "@testing-library/dom";

// TestBot assertion 내부에서 사용
async toBeFocused() {
  await waitFor(() => {
    expect(document.activeElement).toBe(el);
  }, { timeout: 1000 });
}
```

#### @testing-library/user-event (5KB gzip)

```
npm: @testing-library/user-event
브라우저 실행: ✅
```

| TestBot 현재 | user-event | 차이 |
|---|---|---|
| `click()` — mousedown/focus/mouseup/click 수동 dispatch | `userEvent.click(el)` — 전체 이벤트 시퀀스 (pointerdown/mousedown/pointerup/mouseup/click) | UE가 더 현실적 |
| `press()` — keydown/keyup 수동 dispatch | `userEvent.keyboard("{ArrowDown}")` — 전체 키보드 시퀀스, modifier 지원 | UE가 더 정확 |
| `type()` — keydown/keyup + input.value 수동 설정 | `userEvent.type(el, text)` — 실제 입력 시뮬레이션, composition event 포함 | UE가 더 현실적 |

**user-event의 이벤트 시퀀스가 실제 브라우저와 더 가깝다.** TestBot은 mousedown→focus→mouseup→click 4단계만 발생시키지만, 실제 브라우저는 pointerenter→pointerdown→mousedown→... 등 더 많은 이벤트를 발생시킨다.

### 대체 불가능한 부분 (자체 구현 유지)

| 기능 | 이유 |
|---|---|
| **커서 애니메이션** (cursor.ts, 471줄) | TestBot 고유. 어떤 라이브러리에도 없음 |
| **Inspector Panel** (TestBotPanel, SuiteDetails) | 앱 내 Inspector 통합. 자체 UI |
| **오케스트레이션** (testBot.ts, TestBotActions.ts) | describe/beforeEach, resetKey 패턴, speed 제어 |
| **Global API** (globalApi.ts) | `window.__TESTBOT__` LLM 인터페이스 |
| **Step 기록** (StepResult, SuiteResult) | 커서 스탬프, 실시간 UI와 연동 |
| **Kernel 통합** (향후) | expectState, expectTransaction |

---

## 4. 선택지 C 적용 시 아키텍처

```
┌─────────────────────────────────────────────────┐
│ TestBot                                          │
│                                                  │
│  ┌──────────────────────┐  ┌──────────────────┐ │
│  │ @testing-library/dom │  │ user-event       │ │
│  │ • getByRole          │  │ • click          │ │
│  │ • getByText          │  │ • keyboard       │ │
│  │ • waitFor            │  │ • type           │ │
│  └──────────┬───────────┘  └────────┬─────────┘ │
│             │                        │           │
│  ┌──────────▼────────────────────────▼─────────┐ │
│  │ TestActions (어댑터 레이어)                    │ │
│  │ • click() → cursor.moveTo + UE.click        │ │
│  │ • press() → cursor.showBubble + UE.keyboard │ │
│  │ • expect() → TL.waitFor + cursor.showStatus │ │
│  └──────────┬──────────────────────────────────┘ │
│             │                                    │
│  ┌──────────▼──────────┐  ┌──────────────────┐  │
│  │ Cursor (자체)        │  │ Orchestration    │  │
│  │ • moveTo, ripple     │  │ • describe       │  │
│  │ • showBubble, stamp  │  │ • beforeEach     │  │
│  │ • trackElement       │  │ • runAll/Suite   │  │
│  └─────────────────────┘  └──────────────────┘  │
│                                                  │
│  ┌─────────────────────┐  ┌──────────────────┐  │
│  │ Inspector UI (자체)  │  │ Global API (자체) │  │
│  │ • TestBotPanel       │  │ • __TESTBOT__     │  │
│  │ • SuiteDetails       │  │ • runAll/summary  │  │
│  └─────────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

**교체되는 코드:**

| 현재 파일 | 줄 수 | 교체 대상 |
|---|---|---|
| `selectors.ts` (getByText, getByRole, findByRole...) | 107줄 | `@testing-library/dom` |
| `implicitRoles.ts` (수동 role 매핑) | 57줄 | `@testing-library/dom` (내장) |
| `createActions.ts` 이벤트 부분 (mousedown/keydown 수동 dispatch) | ~150줄 | `@testing-library/user-event` |
| assertion 내 고정 delay (wait(60), wait(150)) | ~30줄 | `@testing-library/dom` waitFor |
| **합계** | **~344줄 제거** | |

**유지되는 코드:**

| 파일 | 줄 수 | 이유 |
|---|---|---|
| `cursor.ts` | 471 | 고유 기능 |
| `createActions.ts` 래퍼 부분 | ~200 | 커서 + TL/UE 연결 |
| `testBot.ts` | 160 | 오케스트레이션 |
| `TestBotActions.ts` | 162 | 제어 메서드 |
| `TestBotStore.ts` | 110 | 상태 관리 |
| `globalApi.ts` | 132 | LLM API |
| UI 3파일 | 544 | Inspector |
| 기타 | ~100 | entities, context 등 |
| **합계** | **~1,880줄 유지** | |

**결과: 2,600줄 → 1,880줄. 344줄의 취약한 자체 구현을 검증된 라이브러리로 교체.**

---

## 5. 선택지 D 검토: 인터페이스 통일 + 러너 분리

C와 독립적으로, **테스트 시나리오의 이식성**을 위해 인터페이스를 추상화한다.

### 5.1 공통 인터페이스

```typescript
// packages/testbot/core/TestActions.ts
interface TestActions {
  click(target: Selector, modifiers?: Modifiers): Promise<void>;
  press(key: string, modifiers?: Modifiers): Promise<void>;
  type(text: string): Promise<void>;
  wait(ms: number): Promise<void>;

  getByRole(role: string, options?: { name?: string }): Promise<string>;
  getByText(text: string): Promise<string>;
  getAllByText(text: string): Promise<string[]>;

  expect(target: Selector): Expectations;
}

interface Expectations {
  toBeFocused(): Promise<void>;
  toHaveAttribute(attr: string, value: string): Promise<void>;
  toNotHaveAttribute(attr: string, value: string): Promise<void>;
  toExist(): Promise<void>;
  toNotExist(): Promise<void>;
  toHaveValue(value: string): Promise<void>;
  toHaveText(text: string): Promise<void>;
  toBeVisible(): Promise<void>;
  toBeDisabled(): Promise<void>;
  toHaveCount(n: number): Promise<void>;
}
```

### 5.2 테스트 시나리오 (러너 무관)

```typescript
// tests/scenarios/listbox.ts
export function listboxTests(describe: DescribeFn) {
  describe("ArrowDown navigates to next option", async (t) => {
    await t.click({ role: "option", name: "Item 1" });
    await t.press("ArrowDown");
    await t.expect({ role: "option", name: "Item 2" }).toBeFocused();
  });

  describe("Home moves to first option", async (t) => {
    await t.click({ role: "option", name: "Item 3" });
    await t.press("Home");
    await t.expect({ role: "option", name: "Item 1" }).toBeFocused();
  });
}
```

### 5.3 TestBot 러너 (앱 내)

```typescript
// 앱 내 등록
useTestBotRoutes("listbox", (bot) => {
  listboxTests(bot.describe);
});
```

TestBot 러너가 `TestActions`를 구현:
- `click()` → 커서 이동 + user-event.click + 스탬프
- `expect()` → waitFor + 커서 status
- 실시간 시각 피드백, Inspector 통합

### 5.4 Playwright 러너 (CI)

```typescript
// playwright/listbox.spec.ts
import { listboxTests } from "../tests/scenarios/listbox";
import { createPlaywrightActions } from "./adapter";

test.describe("Listbox", () => {
  listboxTests((name, fn) => {
    test(name, async ({ page }) => {
      await page.goto("/showcase/listbox");
      await fn(createPlaywrightActions(page));
    });
  });
});
```

Playwright 어댑터가 `TestActions`를 구현:
- `click()` → `page.click(selector)` 또는 `page.getByRole().click()`
- `expect()` → `expect(page.locator()).toBeFocused()`
- headless, CI 최적화

### 5.5 어댑터 구현 난이도

| TestActions 메서드 | Playwright 어댑터 | 복잡도 |
|---|---|---|
| `click(selector)` | `page.click(selector)` | 낮음 |
| `click({ role, name })` | `page.getByRole(role, { name }).click()` | 낮음 |
| `press(key)` | `page.keyboard.press(key)` | 낮음 |
| `type(text)` | `page.keyboard.type(text)` | 낮음 |
| `expect(sel).toBeFocused()` | `expect(page.locator(sel)).toBeFocused()` | 낮음 |
| `expect(sel).toHaveText(t)` | `expect(page.locator(sel)).toHaveText(t)` | 낮음 |
| `getByRole(role)` | `page.getByRole(role)` 의 selector 반환 | 중간 |

Playwright 어댑터는 **~100줄**이면 된다. 1:1 매핑이 거의 완벽하다.

---

## 6. 추천 전략: C + D

**Phase 1: 내부 품질 개선 (C)**
- `@testing-library/dom` 도입 → 쿼리 + waitFor 교체
- `@testing-library/user-event` 도입 → 이벤트 시뮬레이션 교체
- 자체 구현 344줄 제거, 검증된 라이브러리로 대체
- **기존 테스트 시나리오 변경 없음** (TestActions 인터페이스 유지)

**Phase 2: 인터페이스 분리 (D)**
- `TestActions` 인터페이스를 독립 모듈로 추출
- 테스트 시나리오를 러너 무관하게 작성
- Playwright 어댑터 구현 (~100줄)
- CI에서 같은 시나리오를 headless로 실행

### 의존성 크기

| 패키지 | gzip 크기 | 비고 |
|---|---|---|
| `@testing-library/dom` | ~8KB | 쿼리 + waitFor |
| `@testing-library/user-event` | ~5KB | 이벤트 시뮬레이션 |
| **합계** | **~13KB** | 344줄 자체 구현 대체 |

devDependency로 추가. 프로덕션 번들에 포함되지 않음 (TestBot 자체가 dev-only).

---

## 7. 요약

```
Playwright 위에 구축       → ❌ 불가 (별도 프로세스, 브라우저 내 실행 불가)
Cypress 위에 구축          → ❌ 비실용적 (iframe 모델, cy.* 체이닝)
전부 자체 구현 유지         → ⚠️ 가능하지만 344줄이 취약
TL/UE 부품 조합 + 자체 껍질 → ✅ 추천 (검증된 쿼리/이벤트 + 고유 커서/Inspector)
인터페이스 통일 + CI 어댑터  → ✅ 추천 (시나리오 1회 작성, 러너 2개)
```

| 결정 | 내용 |
|---|---|
| **쿼리 엔진** | `@testing-library/dom` 채택 (getByRole, waitFor) |
| **이벤트 엔진** | `@testing-library/user-event` 채택 |
| **커서/Inspector/오케스트레이션/Global API** | 자체 구현 유지 |
| **테스트 시나리오** | `TestActions` 인터페이스로 러너 무관하게 작성 |
| **CI** | Playwright 어댑터 (~100줄)로 같은 시나리오 실행 |


---

## 📄 2026-02-10_09-[testbot]Direction_Visual_Verification

# TestBot의 방향성: LLM이 쓴 테스트를 사람이 검증하는 도구

> 날짜: 2026-02-10
> 태그: testbot, direction, llm, playwright, visual-verification
> 상태: 확정

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

## 6. "앱 내부 실행"의 고유 가치

TestBot과 Playwright의 근본 차이는 커서 시각화가 아니다. **TestBot은 앱의 실제 React 트리 안에서 실행된다.**

| | Playwright | TestBot |
|---|---|---|
| 실행 위치 | 외부 (CDP/WebSocket) | **앱 내부 (같은 메모리 공간)** |
| 상태 접근 | DOM만 관찰 | **Zustand 스토어, Kernel 트랜잭션 로그 직접 접근** |
| Inspector 통합 | 불가 | **포커스 상태, ARIA 트리, 트랜잭션 히스토리를 실시간으로 같이 표시** |
| React 동기화 | 비동기만 가능 | **flushSync / batch update와 타이밍 일치** |
| 시각적 피드백 | headless (없음) | **커서 이동, 클릭 리플, 키캡 버블, ✅/❌ 스탬프** |

이것은 Playwright가 **구조적으로 할 수 없는 영역**이다. TestBot의 진짜 moat은 "커서가 보인다"가 아니라 "앱 내부에서 돌아간다"이다.

---

## 7. 워크플로우

### 7.1 개발 시

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

> **스코핑**: 테스트 수가 많아지면 매번 전부 보는 것은 비현실적. 시각 검증은 **새로 추가된 테스트**와 **실패한 테스트**에 집중.

### 7.2 코드 리뷰 시 ★ 킬러 유스케이스

```
1. PR에 새 컴포넌트 추가됨
2. 리뷰어: TestBot 탭 열고 시나리오 실행
3. 커서가 움직이며 동작을 보여줌
4. 리뷰어: "이 동작이 스펙에 맞는지" 눈으로 확인
   - 코드를 한 줄씩 읽는 것보다 빠르다
```

### 7.3 온보딩 시 ★ 킬러 유스케이스

```
1. 신규 팀원: "이 컴포넌트가 어떻게 동작해?"
2. TestBot 실행 → 커서가 시연
3. 테스트 코드 자체가 스펙 문서 역할
```

---

## 8. TestBot이 하는 것 / 하지 않는 것

### 한다

| | 이유 |
|---|---|
| Playwright 호환 TestActions 인터페이스 | LLM이 한 번 쓰면 양쪽에서 실행 |
| 시각적 커서 + 스탬프 + 리플 | 사람이 눈으로 검증하는 핵심 도구 |
| Inspector 패널 통합 | 앱 안에서 상태까지 확인 — Playwright가 못 하는 영역 |
| `window.__TESTBOT__` API | LLM 에이전트 피드백 루프 |
| 자체 셀렉터 엔진 (selectors.ts) | Playwright 시맨틱에 맞춰 직접 구현 |

### 하지 않는다

| | 이유 |
|---|---|
| @testing-library/dom 의존 | substring/exact 매칭 차이로 래핑 비용 발생 — selectors.ts 직접 수정이 더 가벼움 |
| CI 실행 | Playwright의 영역 |
| headless 모드 | 시각적 시연이 존재 이유 |
| 자체 API 설계 | Playwright 호환이 LLM 친화적 |

---

## 9. 네이밍: "TestBot" 유지

검토 결과, TestBot이라는 이름은 **what**(테스트를 실행)을 설명하지 **why**(시각적으로 올바름을 확인)를 설명하지 않는다.

검토한 대안: PlayBot (Playboy 연상), Playback (직관성 부족), PlayRunner, StageBot, ShowRunner.

**결론: TestBot 유지.**

- 이미 코드베이스 전체에 정착 (`@os/testBot`, `useTestBotRoutes`, `window.__TESTBOT__`)
- "Test"가 틀린 건 아니다 — 실제로 테스트 코드를 실행하는 건 맞음
- 리네이밍 비용 > 이름 정확성에서 얻는 이익
- 의의는 부제로 보완: **"TestBot — Playwright 테스트를 앱 안에서 시각 재생하는 도구"**

---

## 10. 요약

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


---

## 📄 2026-02-10_10-[testbot]Naming_Evaluation

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


---

## 📄 2026-02-10_11-[testbot]Unified_Dual_Runner_Plan

# 통합 테스트 시나리오: Playwright + TestBot 듀얼 러너

> 날짜: 2026-02-10
> 태그: testbot, playwright, unified-runner, architecture
> 상태: 제안

---

## 1. 개요

현재 상태:
- `e2e/` — Playwright 전용 스펙 11개 (74 테스트)
- `src/pages/*/tests/` — TestBot 전용 테스트 (동일한 시나리오의 다른 코드)

Doc 09에서 정의한 "하나의 시나리오, 두 개의 러너"를 구현한다.

**목표:** 시나리오를 한 번만 작성하고, Playwright와 TestBot 양쪽에서 실행한다.

---

## 2. 현재 API 차이 분석

### TestBot (src/pages/aria-showcase/tests/TabsTest.tsx)

```typescript
export function defineTabsTests(bot: TestBot) {
  bot.describe("Tabs: Horizontal Navigation", async (t) => {
    await t.click("#tab-account");
    await t.expect("#tab-account").toBeFocused();
    await t.press("ArrowRight");
    await t.expect("#tab-security").toHaveAttribute("aria-selected", "true");
  });
}
```

### Playwright (e2e/aria-showcase/tabs.spec.ts)

```typescript
test.describe("Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/aria-showcase");
  });

  test("Horizontal Navigation", async ({ page }) => {
    await page.locator("#tab-account").click();
    await expect(page.locator("#tab-account")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-security")).toHaveAttribute("aria-selected", "true");
  });
});
```

### 핵심 차이

| 동작 | TestBot | Playwright |
|---|---|---|
| click | `t.click("#id")` | `page.locator("#id").click()` |
| press | `t.press("Key")` | `page.keyboard.press("Key")` |
| click + meta | `t.click("#id", { meta: true })` | `page.locator("#id").click({ modifiers: ["Meta"] })` |
| expect focused | `t.expect("#id").toBeFocused()` | `expect(page.locator("#id")).toBeFocused()` |
| expect attr | `t.expect("#id").toHaveAttribute(a, v)` | `expect(page.locator("#id")).toHaveAttribute(a, v)` |
| expect !attr | `t.expect("#id").toNotHaveAttribute(a, v)` | `expect(page.locator("#id")).not.toHaveAttribute(a, v)` |
| wait | `t.wait(ms)` | `page.waitForTimeout(ms)` |
| suite 정의 | `bot.describe(name, fn)` | `test(name, fn)` |
| beforeEach | `bot.beforeEach(fn)` | `test.beforeEach(fn)` |

**결론:** API 형태(signature)는 다르지만, 의미(semantics)는 1:1이다. 어댑터로 브리지 가능하다.

---

## 3. 설계: TestActions 기준 통합

### 3.1 전략 선택

TestBot의 `TestActions` 인터페이스를 **공통 시나리오 언어**로 사용:

```typescript
// TestActions 인터페이스 (이미 존재)
interface TestActions {
  click(target: Selector, modifiers?: KeyModifiers): Promise<void>;
  press(key: string, modifiers?: KeyModifiers): Promise<void>;
  wait(ms: number): Promise<void>;
  expect(selector: string): Expectations;
}
```

이 인터페이스 기준으로 시나리오를 작성하고, 각 러너가 구현체를 제공한다.

### 3.2 구조

```
tests/scenarios/              ← 공통 시나리오 (러너 무관)
├── aria-showcase/
│   ├── tabs.ts
│   ├── disclosure.ts
│   ├── menu.ts
│   ├── grid.ts
│   ├── radiogroup.ts
│   ├── listbox.ts
│   ├── toolbar.ts
│   ├── tree.ts
│   └── complex-patterns.ts
├── focus-showcase/
│   └── focus-showcase.ts
└── builder/
    └── builder-spatial.ts

e2e/                          ← Playwright 러너 (얇은 어댑터)
├── aria-showcase/
│   └── tabs.spec.ts          ← import { tabsScenario } + playwrightAdapter
└── ...

src/pages/*/tests/            ← TestBot 러너 (기존)
├── TabsTest.tsx              ← import { tabsScenario } + bot.describe
└── ...
```

### 3.3 시나리오 파일 형태

```typescript
// tests/scenarios/aria-showcase/tabs.ts

import type { TestActions } from "@os/testBot";

export interface ScenarioRunner {
  describe(name: string, fn: (t: TestActions) => Promise<void>): void;
  beforeEach?(fn: (t: TestActions) => Promise<void>): void;
}

export function tabsScenarios(runner: ScenarioRunner) {
  runner.describe("Tabs: Horizontal Navigation", async (t) => {
    await t.click("#tab-account");
    await t.expect("#tab-account").toBeFocused();
    await t.press("ArrowRight");
    await t.expect("#tab-security").toBeFocused();
    await t.expect("#tab-security").toHaveAttribute("aria-selected", "true");
    await t.expect("#tab-account").toHaveAttribute("aria-selected", "false");
  });

  runner.describe("Tabs: Home/End Navigation", async (t) => {
    await t.click("#tab-security");
    await t.expect("#tab-security").toBeFocused();
    await t.press("Home");
    await t.expect("#tab-account").toBeFocused();
    await t.press("End");
    await t.expect("#tab-disabled").toBeFocused();
  });
}
```

### 3.4 Playwright 어댑터

```typescript
// tests/adapters/playwright.ts

import { test, expect, type Page } from "@playwright/test";
import type { TestActions, Expectations, KeyModifiers } from "./types";
import type { ScenarioRunner } from "./types";

function createPlaywrightActions(page: Page): TestActions {
  return {
    async click(target: string, modifiers?: KeyModifiers) {
      const opts: any = {};
      if (modifiers?.meta) opts.modifiers = ["Meta"];
      if (modifiers?.shift) opts.modifiers = [...(opts.modifiers || []), "Shift"];
      if (modifiers?.ctrl) opts.modifiers = [...(opts.modifiers || []), "Control"];
      if (modifiers?.alt) opts.modifiers = [...(opts.modifiers || []), "Alt"];
      await page.locator(target).click(opts);
    },

    async press(key: string, modifiers?: KeyModifiers) {
      let combo = key;
      if (modifiers?.meta) combo = `Meta+${combo}`;
      if (modifiers?.shift) combo = `Shift+${combo}`;
      if (modifiers?.ctrl) combo = `Control+${combo}`;
      if (modifiers?.alt) combo = `Alt+${combo}`;
      await page.keyboard.press(combo);
    },

    async wait(ms: number) {
      await page.waitForTimeout(ms);
    },

    expect(selector: string): Expectations {
      const loc = page.locator(selector);
      return {
        toBeFocused: () => expect(loc).toBeFocused(),
        toHaveAttribute: (attr, value) => expect(loc).toHaveAttribute(attr, value),
        toNotHaveAttribute: (attr, value) => expect(loc).not.toHaveAttribute(attr, value),
        toExist: () => expect(loc).toBeAttached(),
        toNotExist: () => expect(loc).not.toBeAttached(),
        toHaveValue: (value) => expect(loc).toHaveValue(value),
        toHaveText: (text) => expect(loc).toHaveText(text),
        toBeVisible: () => expect(loc).toBeVisible(),
        toBeDisabled: () => expect(loc).toBeDisabled(),
        toHaveCount: (n) => expect(loc).toHaveCount(n),
      };
    },

    async getByText(text: string) { return `text=${text}`; },
    async getByRole(role: string, name?: string) { return `role=${role}[name="${name}"]`; },
    async getAllByText(text: string) { return [`text=${text}`]; },
    async type(text: string) { await page.keyboard.type(text); },
  };
}

export function playwrightRunner(path: string): ScenarioRunner & { page: Page } {
  // 아래에서 사용:
  // e2e/aria-showcase/tabs.spec.ts 에서 호출
  let _page: Page;

  test.beforeEach(async ({ page }) => {
    _page = page;
    await page.goto(path);
  });

  return {
    get page() { return _page; },
    describe(name, fn) {
      test(name, async ({ page }) => {
        await fn(createPlaywrightActions(page));
      });
    },
  };
}
```

### 3.5 사용 예시

```typescript
// e2e/aria-showcase/tabs.spec.ts (변경 후)
import { test } from "@playwright/test";
import { tabsScenarios } from "../../tests/scenarios/aria-showcase/tabs";
import { playwrightRunner } from "../../tests/adapters/playwright";

test.describe("Tabs", () => {
  const runner = playwrightRunner("/aria-showcase");
  tabsScenarios(runner);
});
```

```typescript
// src/pages/aria-showcase/tests/TabsTest.tsx (변경 후)
import type { TestBot } from "@os/testBot";
import { tabsScenarios } from "../../../../tests/scenarios/aria-showcase/tabs";

export function defineTabsTests(bot: TestBot) {
  tabsScenarios(bot);  // TestBot은 이미 ScenarioRunner 인터페이스 호환
}
```

---

## 4. 상태 문제: TestBot은 stateful, Playwright는 isolated

**중요 차이:** TestBot은 같은 페이지에서 모든 suite를 순차 실행(상태 공유). Playwright는 각 test마다 새 페이지(상태 격리).

### 해결: 시나리오는 항상 self-contained로 작성

- 각 `runner.describe()`는 초기 상태에서 시작한다고 가정
- TestBot 러너에서 `beforeEach`로 페이지 리셋 (`resetKey` 증가)
- 이미 TestBot에 `beforeEach` 훅이 존재하므로 활용 가능

---

## 5. 구현 단계

### Phase 1: 인프라 (어댑터 + 타입)
- `tests/scenarios/types.ts` — `ScenarioRunner` 인터페이스 정의
- `tests/adapters/playwright.ts` — Playwright → TestActions 어댑터 구현

### Phase 2: 시나리오 추출
- 기존 TestBot 테스트 파일 (`src/pages/*/tests/*.tsx`)의 시나리오 로직을 `tests/scenarios/`로 이동
- 각 시나리오가 self-contained인지 확인 (stateful → stateless 변환)

### Phase 3: 소비자 전환
- `e2e/*.spec.ts` → `playwrightRunner` + 시나리오 import 형태로 변환
- `src/pages/*/tests/*.tsx` → 시나리오 import + `bot`에 전달 형태로 변환

### Phase 4: 검증
- `npm run test:e2e` — 동일한 결과
- TestBot 앱 내 실행 — 동일한 시각적 시연

---

## 6. 주의사항

1. **tsconfig 경로 설정**: `tests/` 디렉토리가 `e2e/`와 `src/` 양쪽에서 접근 가능해야 함
2. **TestBot의 `ScenarioRunner` 호환성**: `TestBot` 인터페이스가 이미 `describe(name, fn)` 메서드를 가지고 있으므로, `ScenarioRunner`와 구조적으로 호환됨. 별도 래핑 불필요
3. **Playwright `test()` 등록 타이밍**: Playwright는 모듈 로드 시 `test()`가 호출되어야 함 (lazy 불가). `playwrightRunner`는 이를 고려한 설계

---

## 7. 요약

```
Before:
  TestBot 테스트 = src/pages/*/tests/*.tsx (TestBot API)
  Playwright 테스트 = e2e/*.spec.ts (Playwright API)
  → 같은 시나리오를 두 번 작성

After:
  시나리오 = tests/scenarios/*.ts (TestActions 인터페이스)
  TestBot 러너 = bot.describe → 시나리오 import
  Playwright 러너 = playwrightAdapter → 시나리오 import
  → 시나리오 한 번 작성, 러너만 교체
```


---

## 📄 2026-02-10_12-[testbot]Zero_Change_Polyfill

# 기존 Playwright 코드 100% 호환 실행 계획 (Zero-Change Polyfill)

> 날짜: 2026-02-10
> 태그: testbot, playwright, polyfill, zero-change, vite-alias
> 상태: 확정 (Doc 11 대체)

---

## 1. 개요

**목표:** `e2e/` 폴더에 있는 Playwright 테스트 코드(`.spec.ts`)를 **단 한 줄도 수정하지 않고** TestBot(브라우저)에서 실행한다.

**핵심 전략:**
1.  **Vite Alias 활용:** 브라우저 번들링 시 `@playwright/test` 모듈을 우리가 만든 `polyfill` 구현체로 교체한다.
2.  **Browser-Side Polyfill:** `test()`, `expect()`, `page`, `locator` 등 Playwright API를 브라우저에서 `TestBotActions`로 매핑하여 구현한다.
3.  **Auto Discovery:** `import.meta.glob`를 사용하여 `e2e/**/*.spec.ts` 파일을 자동으로 불러와 TestBot에 등록한다.

---

## 2. 아키텍처

```
┌─────────────────────────────┐      ┌─────────────────────────────┐
│  e2e/auth.spec.ts           │      │  src/os/testBot/playwright  │
│                             │      │  (The Polyfill)             │
│  import { test } from       │      │                             │
│     "@playwright/test";     │ ───► │  export const test = ...    │ ◄── Vite Alias
│                             │      │  export const expect = ...  │     (@playwright/test)
│  test("Login", async () => {│      │                             │
│    await page.click(...)    │ ───► │  t.click(...)               │
│  });                        │      │                             │
└─────────────────────────────┘      └─────────────────────────────┘
```

### 2.1 파일 구조

```
src/os/testBot/playwright/
├── index.ts           # @playwright/test 모듈의 public API (test, expect 등)
├── shim.ts            # Page, Locator, Expect 클래스 구현
└── loader.tsx         # e2e 스펙 파일을 로드하고 TestBot 라우트를 등록하는 컴포넌트
```

### 2.2 Vite 설정 (`vite.config.ts`)

```typescript
resolve: {
  alias: {
    "@playwright/test": "/src/os/testBot/playwright/index.ts",
    // ...
  }
}
```

---

## 3. 상세 구현 계획

### 3.1 `test()` 함수 (Registry)

Playwright의 `test()` 함수는 실행 시 바로 테스트를 등록하는 역할을 한다. Polyfill은 이를 메모리 상의 레지스트리에 저장한다.

```typescript
// src/os/testBot/playwright/index.ts
export const registry = [];

export const test = (name: string, fn: Function) => {
  registry.push({ name, fn, type: 'test' });
};

test.describe = (name: string, fn: Function) => {
  // describe 블록 처리 (재귀적 구조 또는 플랫하게 매핑)
};

test.beforeEach = (fn: Function) => { ... };
```

### 3.2 `page` 객체 (Adapter)

`test` 함수가 실행될 때, `fn({ page })`에 전달할 가짜 `page` 객체를 생성한다. 이 객체는 `TestActions`를 내부적으로 호출한다.

```typescript
// src/os/testBot/playwright/shim.ts
export class ShimPage {
  constructor(private t: TestActions) {}

  locator(selector: string) {
    return new ShimLocator(this.t, selector);
  }

  async getByRole(role: string, options?: { name?: string }) {
    // TestBot은 selector 형태로 시맨틱 쿼리 지원
    return new ShimLocator(this.t, { role, ...options });
  }

  get keyboard() {
    return {
      press: (key: string) => this.t.press(key),
      type: (text: string) => this.t.type(text),
    };
  }
}
```

### 3.3 `locator` 및 `expect` (Mapping)

Playwright의 `locator().click()`은 비동기다. TestBot의 `t.click()`도 비동기다. 1:1 매핑된다.

```typescript
export class ShimLocator {
  constructor(private t: TestActions, private selector: Selector) {}

  async click(options?: { modifiers?: string[] }) {
    await this.t.click(this.selector, options);
  }
  
  // ... other methods
}

export const expect = (locator: ShimLocator) => {
  // TestActions.expect()를 호출하는 프록시 리턴
  return {
    toBeFocused: () => t.expect(locator.selector).toBeFocused(),
    toHaveAttribute: (k, v) => t.expect(locator.selector).toHaveAttribute(k, v),
    not: {
      toHaveAttribute: (k, v) => t.expect(locator.selector).toNotHaveAttribute(k, v),
    },
    // ...
  };
};
```

---

## 4. 실행 모델 (Loader)

TestBot 앱 내에서 `e2e` 테스트들을 실행하기 위해 `ShimLoader` 컴포넌트를 만든다.

```typescript
// src/os/testBot/playwright/loader.tsx
const modules = import.meta.glob('../../../../e2e/**/*.spec.ts', { eager: true });

export function usePlaywrightRoutes() {
  // 1. glob으로 로드된 모듈들을 순회
  // 2. 각 모듈이 실행되면서 'registry'에 테스트가 등록됨
  // 3. 등록된 테스트들을 TestBot.describe()로 변환하여 등록
  
  useTestBotRoutes("playwright-e2e", (bot) => {
    for (const item of registry) {
      bot.describe(item.name, async (t) => {
        const page = new ShimPage(t);
        await item.fn({ page });
      });
    }
  });
}
```

---

## 5. 제약 사항 및 해결

1.  **Node.js API 사용 불가**: `fs`, `child_process` 등을 사용하는 테스트는 브라우저에서 실패한다.
    - *해결:* 순수 UI 인터랙션 테스트(`page`, `expect`만 사용)에 집중한다. 현재 변환된 `aria-showcase` 등은 100% 호환된다.
2.  **`page.goto` 처리**:
    - *해결:* `ShimPage.goto(url)` 구현에서 내부 라우터(`history.pushState` 등)를 사용하여 SPA 네비게이션으로 처리한다. `useTestBotRoutes`가 이미 해당 페이지 컴포넌트를 마운트하고 있으므로, `goto`는 사실상 "리셋" 또는 "검증" 역할만 한다.

---

## 6. 결론

이 방식은 **"수정 없이(Zero-Change)"** 기존 코드를 실행할 수 있는 가장 강력하고 LLM 친화적인 방법이다. LLM은 그냥 평소대로 Playwright 코드를 짜면 되고, 실행 환경이 알아서 앱 내부로 적응(Polyfill)한다.


