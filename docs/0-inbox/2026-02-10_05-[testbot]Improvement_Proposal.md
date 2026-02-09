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
