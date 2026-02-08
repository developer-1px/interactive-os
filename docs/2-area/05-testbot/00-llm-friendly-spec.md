# TestBot LLM/AI 에이전트 친화적 인터페이스 스펙

> **상태**: 제안됨 | **우선순위**: 높음  
> **관련 파일**: `src/os/testBot/TestBotPanel.tsx`, `TestBotStore.ts`, `testBot.ts`

## 1. 개요 (Overview)

TestBot Runner Inspector는 사람에게 훌륭한 시각적 피드백을 제공하지만, **AI/LLM 에이전트가 프로그래밍적으로 접근하기에는 많은 비효율**이 존재합니다. 현재 에이전트는 테스트를 실행하고 결과를 파악하기 위해 복잡한 DOM 순회, CSS 클래스 추측, 좌표 기반 클릭을 해야 합니다.

이 문서는 **3가지 레이어**의 개선을 통해 에이전트가 효율적으로 테스트를 제어하고 결과를 수집할 수 있도록 하는 스펙을 정의합니다.

---

## 2. 현재 문제 분석

### 2.1 에이전트가 겪는 어려움

| 작업 | 현재 방식 | 문제점 |
|:---|:---|:---|
| **특정 테스트 Run 버튼 찾기** | `title` 속성 파싱 + 픽셀 좌표 클릭 | hover 시에만 보이는 Play 아이콘, CSS class 기반 파싱 필요 |
| **테스트 결과 확인** | `.text-red-500` / `.text-emerald-500` 클래스로 추측 | 스타일 변경 시 깨짐 (fragile), 의미론적 정보 없음 |
| **개별 step 결과 읽기** | `innerText` 파싱 | 구조화되지 않음, action/detail/error 분리 불가 |
| **전체 결과 요약 가져오기** | 없음 | DOM 전체 순회 필요, `h3` 태그와 형제 노드 탐색 |
| **특정 테스트만 실행** | UI 버튼 좌표를 목측하여 클릭 | 스크롤 상태, 뷰포트 위치에 따라 실패 |

### 2.2 실제 에이전트 코드 예시 (현재)

```javascript
// 복잡한 DOM traversal로 테스트 결과 추출
const tests = Array.from(document.querySelectorAll('.flex-1.overflow-y-auto > div'));
tests.map(test => {
    const name = test.querySelector('h3')?.innerText;
    const hasError = !!test.querySelector('.text-red-500, .bg-red-50');
    const hasSuccess = !!test.querySelector('.text-green-500, .bg-green-50');
    const status = hasError ? 'FAIL' : (hasSuccess ? 'PASS' : 'UNKNOWN');
    return { name, status };
});
// → 스타일 의존적, 구조 변경에 취약
```

---

## 3. 제안: 3-Layer 접근

```
┌─────────────────────────────────────────────────┐
│ Layer 3: window.__TESTBOT__ Global JS API       │  ← 가장 강력
│   runByName(), getResults(), runAll()            │
├─────────────────────────────────────────────────┤
│ Layer 2: Hidden JSON <pre> Element              │  ← DOM 기반 대안
│   #testbot-results-json                         │
├─────────────────────────────────────────────────┤
│ Layer 1: data-* Semantic Attributes             │  ← CSS selector 접근
│   data-testbot-suite, data-testbot-run, etc.    │
└─────────────────────────────────────────────────┘
```

---

## 4. Layer 1: `data-*` Semantic Attributes

### 4.1 Suite 컨테이너

각 테스트 Suite 래퍼 `<div>`에 다음 속성을 추가합니다:

```html
<div
    data-testbot-suite="Select: Toggle Mode"
    data-testbot-index="4"
    data-testbot-status="done"
    data-testbot-result="fail"
>
```

| 속성 | 값 | 설명 |
|:---|:---|:---|
| `data-testbot-suite` | 테스트명 (string) | Suite를 이름으로 식별 |
| `data-testbot-index` | 숫자 (string) | Suite의 순서 인덱스 |
| `data-testbot-status` | `"planned"` / `"running"` / `"done"` | 현재 실행 상태 |
| `data-testbot-result` | `"pass"` / `"fail"` / 없음 | 최종 결과 (done일 때만) |

**에이전트 사용 예시**:
```javascript
// 이름으로 Suite 찾기
document.querySelector('[data-testbot-suite="Tab: Trap Mode"]');

// 실패한 테스트만 찾기
document.querySelectorAll('[data-testbot-result="fail"]');

// 결과 데이터 읽기
el.dataset.testbotResult; // → "pass" or "fail"
```

### 4.2 Run/Re-run 버튼

```html
<button data-testbot-run="4" title="Run 'Select: Toggle Mode'">
```

| 속성 | 값 | 설명 |
|:---|:---|:---|
| `data-testbot-run` | 숫자 (string) | 해당 Suite 인덱스. 클릭 시 해당 테스트만 실행 |

**에이전트 사용 예시**:
```javascript
// 인덱스로 실행
document.querySelector('[data-testbot-run="4"]').click();
```

### 4.3 Run All 버튼

```html
<button data-testbot-run-all>▶ Run All</button>
```

### 4.4 Step 행

```html
<div
    data-testbot-step="0"
    data-testbot-action="click"
    data-testbot-step-result="pass"
>
```

| 속성 | 값 | 설명 |
|:---|:---|:---|
| `data-testbot-step` | 숫자 (string) | Step 인덱스 (0-based) |
| `data-testbot-action` | `"click"` / `"press"` / `"expect"` / `"error"` | Step 유형 |
| `data-testbot-step-result` | `"pass"` / `"fail"` / `"pending"` | Step 결과 |

### 4.5 에러 메시지

```html
<div data-testbot-error>Expected aria-selected to NOT be "true"</div>
```

에이전트가 `[data-testbot-error]`로 바로 에러 메시지를 찾을 수 있습니다.

---

## 5. Layer 2: Hidden JSON Results Element

테스트 실행이 완료되면, 숨겨진 `<pre>` 요소에 구조화된 JSON 결과를 직렬화합니다.

```html
<pre id="testbot-results-json" data-testbot-results style="display:none">
[
    {
        "name": "Autofocus: Entry Focus",
        "passed": true,
        "steps": [
            { "action": "click", "detail": "#af-auto-1", "passed": true, "error": null },
            { "action": "expect", "detail": "...", "passed": true, "error": null }
        ]
    },
    ...
]
</pre>
```

**에이전트 사용 예시**:
```javascript
const results = JSON.parse(
    document.getElementById('testbot-results-json').textContent
);
const failed = results.filter(r => !r.passed);
```

이 방식은 `execute_browser_javascript`만으로 충분하며, 별도의 DOM 순회가 불필요합니다.

---

## 6. Layer 3: `window.__TESTBOT__` Global JS API

가장 강력한 레이어입니다. Store를 직접 노출하여 에이전트가 JS에서 테스트를 실행하고 결과를 즉시 받을 수 있습니다.

### 6.1 API 명세

```typescript
interface TestBotGlobalAPI {
    /** 전체 테스트 실행 */
    runAll(): Promise<void>;
    
    /** 인덱스로 단일 Suite 실행 */
    runSuite(index: number): Promise<void>;
    
    /** 이름으로 단일 Suite 실행 */
    runByName(name: string): Promise<void>;
    
    /** 현재 결과를 구조화된 JSON으로 반환 */
    getResults(): TestBotResults;
    
    /** 테스트 실행 중 여부 */
    isRunning(): boolean;
    
    /** 등록된 Suite 이름 목록 */
    listSuites(): string[];
}

interface TestBotResults {
    isRunning: boolean;
    summary: {
        total: number;
        pass: number;
        fail: number;
    };
    suites: Array<{
        name: string;
        status: "planned" | "running" | "done";
        passed: boolean;
        steps: Array<{
            action: string;
            detail: string;
            passed: boolean;
            error: string | null;
        }>;
    }>;
}
```

### 6.2 Implementation Location

`TestBotStore.ts`에서 Store 초기화 시 `window.__TESTBOT__`를 설정합니다:

```typescript
// Located at the end of TestBotStore.ts
(window as any).__TESTBOT__ = {
    runAll: () => TestBotActions.runAll(),
    runSuite: (i: number) => TestBotActions.runSuite(i),
    runByName: (name: string) => {
        const { suites } = useTestBotStore.getState();
        const idx = suites.findIndex(s => s.name === name);
        if (idx >= 0) return TestBotActions.runSuite(idx);
        throw new Error(`Suite "${name}" not found`);
    },
    getResults: () => {
        const { suites, isRunning } = useTestBotStore.getState();
        return {
            isRunning,
            summary: {
                total: suites.length,
                pass: suites.filter(s => s.passed).length,
                fail: suites.filter(s => s.status === "done" && !s.passed).length,
            },
            suites: suites.map(s => ({
                name: s.name,
                status: s.status,
                passed: s.passed,
                steps: s.steps.map(step => ({
                    action: step.action,
                    detail: step.detail,
                    passed: step.passed,
                    error: step.error || null,
                })),
            })),
        };
    },
    isRunning: () => useTestBotStore.getState().isRunning,
    listSuites: () => useTestBotStore.getState().suites.map(s => s.name),
};
```

### 6.3 에이전트 워크플로우 예시

```javascript
// 1. 특정 테스트 실행
await window.__TESTBOT__.runByName("Select: Toggle Mode");

// 2. 실행 완료 대기 (polling)
while (window.__TESTBOT__.isRunning()) {
    await new Promise(r => setTimeout(r, 500));
}

// 3. 결과 조회
const results = window.__TESTBOT__.getResults();
// → {
//     isRunning: false,
//     summary: { total: 12, pass: 4, fail: 8 },
//     suites: [
//       { name: "Autofocus: Entry Focus", passed: true, steps: [...] },
//       ...
//     ]
//   }

// 4. 실패한 테스트만 추출
const failures = results.suites
    .filter(s => !s.passed && s.status === 'done')
    .map(s => ({
        name: s.name,
        errors: s.steps.filter(st => st.error).map(st => st.error)
    }));
```

---

## 7. Before / After 비교

### 테스트 실행 + 결과 수집 전체 플로우

#### Before (현재)
```
1. navigate to page
2. get DOM → find "Run All" button coordinate (fragile)
3. click pixel (X, Y)
4. wait 15s
5. execute JS: complex DOM traversal with CSS class parsing
6. execute JS: scroll panel, re-parse
7. execute JS: find h3 elements, match by text content
8. execute JS: parse sibling elements for error messages
→ 약 8+ 브라우저 상호작용, 높은 실패율
```

#### After (개선 후)
```
1. navigate to page
2. execute JS: await window.__TESTBOT__.runAll()
3. execute JS: window.__TESTBOT__.getResults()
→ 3 브라우저 상호작용, 구조화된 JSON 보장
```

---

## 8. 구현 시 주의사항

1. **`data-*` 속성은 사람에게 영향 없음**: 렌더링, 스타일, 동작에 영향주지 않습니다.
2. **`window.__TESTBOT__`는 개발 모드 전용**: 프로덕션 빌드에서는 제거하거나 `import.meta.env.DEV` 가드를 추가할 수 있습니다.
3. **Hidden `<pre>`는 메모리 고려**: 수백 개의 step이 있을 때 JSON이 커질 수 있으므로, `isFinished` 상태에서만 렌더합니다.
4. **`runByName`은 정확 매칭**: Suite 이름이 정확히 일치해야 합니다. 부분 매칭이 필요하면 `findSuite(pattern)` 추가를 고려합니다.

---

## 9. 적용 대상 파일

| 파일 | 변경 내용 |
|:---|:---|
| `src/os/testBot/TestBotPanel.tsx` | `data-*` 속성 추가, Hidden JSON `<pre>` 추가 |
| `src/os/testBot/TestBotStore.ts` | `window.__TESTBOT__` 글로벌 API 등록 |
