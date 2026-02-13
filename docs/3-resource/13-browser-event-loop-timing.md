---
last-reviewed: 2026-02-13
---

# 브라우저 이벤트 루프와 타이밍의 모든 것

> DOM 포커스, 키보드 이벤트, 상태 업데이트 — "왜 이 순서로 실행되는가"를 이해하면 타이밍 버그의 90%가 사라진다.

## 왜 이 주제인가

이 프로젝트의 핵심 문제들이 **타이밍**에 뿌리를 두고 있다:

- **포커스 복구**: Todo 삭제 후 `document.activeElement`가 body로 떨어지는 시점은 언제인가?
- **키보드 이벤트**: `KeyboardListener`의 `preventDefault`가 네이티브 클립보드보다 먼저 실행되어야 하는 이유
- **상태 → DOM 동기화**: `kernel.dispatch` → React 렌더 → DOM 업데이트 → `element.focus()` 순서 보장
- **TestBot vs Playwright**: 동기식 테스트 실행에서 비동기 DOM 변화를 기다리는 메커니즘

이 모든 것이 **브라우저 이벤트 루프의 실행 순서**를 모르면 "왜 되는지 / 왜 안 되는지" 설명할 수 없다.

## Background: 왜 싱글 스레드인가

브라우저의 메인 스레드는 **하나**다. JavaScript 실행, DOM 조작, 스타일 계산, 레이아웃, 페인트 — 전부 하나의 스레드에서 순서대로 처리된다. 이건 의도적인 설계다:

```
만약 두 스레드가 동시에 같은 DOM 노드를 수정하면?
→ Race condition → 화면 깨짐

해법: 단일 스레드 + 이벤트 루프로 순서를 보장한다.
```

1995년 Brendan Eich가 JavaScript를 10일 만에 만들 때부터 이 결정이 내려졌고, 이후 Web Worker(별도 스레드, DOM 접근 불가)로 보완되었다.

## Core Concept: 이벤트 루프의 한 사이클

```
┌─────────────────────────────────────────────────────────┐
│                    하나의 Event Loop 사이클                │
│                                                         │
│  1. ⬛ Task (Macrotask) 하나 실행                         │
│     └─ setTimeout, setInterval, DOM event, I/O          │
│                                                         │
│  2. 🟦 Microtask 큐 전부 비우기                           │
│     └─ Promise.then, queueMicrotask, MutationObserver   │
│     └─ 비우는 도중 새로 추가된 microtask도 이번에 실행!     │
│                                                         │
│  3. 🟩 렌더링 (브라우저가 필요하다고 판단하면)               │
│     ├─ requestAnimationFrame 콜백                        │
│     ├─ Style 계산                                        │
│     ├─ Layout (Reflow)                                   │
│     ├─ Paint                                             │
│     └─ Composite                                         │
│                                                         │
│  4. 🟨 requestIdleCallback (여유 시간이 있으면)            │
│                                                         │
│  → 다시 1로                                              │
└─────────────────────────────────────────────────────────┘
```

### 핵심 규칙

| 규칙 | 설명 |
|------|------|
| **Macrotask는 한 번에 하나** | `setTimeout` 콜백 2개가 있어도, 한 사이클에 1개만 실행 |
| **Microtask는 전부 비우기** | Promise가 Promise를 만들면 그것도 이번에 실행 → **무한 루프 주의** |
| **렌더링은 선택적** | 브라우저가 "필요하다"고 판단할 때만. 보통 ~16.67ms (60fps) |
| **rAF는 렌더링 직전** | `requestAnimationFrame`은 paint 전에 실행 → 시각적 업데이트에 최적 |

## 이 프로젝트에서의 실제 타이밍 분석

### Case 1: Todo 삭제 후 포커스 복구

```
[사용자] Backspace 누름
  ↓
⬛ Task: KeyboardEvent 핸들러 (KeyboardListener)
├── kernel.dispatch(DELETE_TODO)
├── state 업데이트 (동기)
└── React 리렌더 예약 (setState → microtask)
  ↓
🟦 Microtask: React의 상태 업데이트 배칭
├── 가상 DOM diffing
└── DOM에서 삭제된 아이템 제거
  ↓
🟦 Microtask: MutationObserver (있다면)
└── DOM 변경 감지 → 포커스 복구 가능 시점!
  ↓
⬛ 다음 Task: FocusListener의 focusin/focusout 이벤트
└── document.activeElement === <body> 감지
  ↓
🟩 렌더링: 화면에 반영
```

> **핵심 인사이트**: `element.focus()`를 호출하려면 해당 DOM 노드가 이미 존재해야 한다.
> 삭제 후 새 대상에 focus를 주려면, **React가 새 DOM을 그린 후** (microtask 완료 후) 시점에 호출해야 한다.

### Case 2: `queueMicrotask` vs `setTimeout(0)` vs `requestAnimationFrame`

```typescript
console.log('1: 동기');

queueMicrotask(() => console.log('2: microtask'));

setTimeout(() => console.log('4: macrotask'), 0);

requestAnimationFrame(() => console.log('3: rAF (렌더 직전)'));

console.log('1.5: 동기 계속');

// 출력 순서: 1 → 1.5 → 2 → 3 → 4
```

| API | 실행 시점 | 용도 |
|-----|----------|------|
| `queueMicrotask` | 현재 태스크 끝나자마자 | 상태 정리, DOM 변경 반응 |
| `requestAnimationFrame` | 다음 렌더링 직전 | 시각적 업데이트, 애니메이션 |
| `setTimeout(fn, 0)` | 다음 macrotask | 작업 양보 (yield), 무거운 작업 분할 |
| `requestIdleCallback` | 여유 시간 | 로깅, 분석, 프리페칭 |

### Case 3: `element.focus()` 타이밍

```typescript
// ❌ Anti-pattern: DOM이 아직 준비 안 됨
kernel.dispatch(DELETE_TODO);
document.getElementById('next-item')?.focus(); // 아직 없을 수 있음!

// ✅ Pattern 1: microtask로 한 턴 대기
kernel.dispatch(DELETE_TODO);
queueMicrotask(() => {
  document.getElementById('next-item')?.focus(); // React 렌더 후
});

// ✅ Pattern 2: rAF로 렌더 직전 실행
kernel.dispatch(DELETE_TODO);
requestAnimationFrame(() => {
  document.getElementById('next-item')?.focus(); // 확실히 DOM 존재
});

// ✅ Pattern 3: useEffect (React가 관리)
useEffect(() => {
  document.getElementById(focusId)?.focus();
}, [focusId]); // React가 DOM 업데이트 후 실행 보장
```

## Best Practice + Anti-Pattern

### ✅ Do

| 상황 | 사용할 API | 이유 |
|------|-----------|------|
| Promise 체인 후 정리 | `queueMicrotask` | 즉시 실행, 렌더 전 |
| 포커스 이동 | `useEffect` 또는 `rAF` | DOM 존재 보장 |
| 애니메이션 | `requestAnimationFrame` | 프레임 동기화 |
| 무거운 계산 분할 | `setTimeout(0)` | 메인 스레드 양보 |
| 비필수 작업 (로깅) | `requestIdleCallback` | 유저 인터랙션 방해 안 함 |

### ❌ Don't

| Anti-Pattern | 문제 | 대안 |
|-------------|------|------|
| Microtask 안에서 microtask 무한 생성 | 메인 스레드 영구 블로킹 | 카운터 또는 setTimeout으로 탈출 |
| setTimeout으로 "DOM 준비 기다리기" | 타이밍 불확실 (4ms~) | MutationObserver 또는 useEffect |
| rAF 안에서 무거운 계산 | 프레임 드롭 | 계산은 별도 task, rAF는 결과만 적용 |
| 포커스를 동기적으로 호출 | DOM 미존재 가능 | 최소 microtask 이후 |

## 흥미로운 이야기들

### Jake Archibald의 "In The Loop" (2018)

이벤트 루프를 시각적으로 설명한 전설적인 발표. 핵심 메시지:

> "Microtask는 task의 **끝**에 실행되는 게 아니다. **JavaScript 스택이 비워질 때마다** 실행된다."

이건 미묘하지만 중요한 차이다. 하나의 task 안에서도 JavaScript 스택이 비워지는 순간이 있으면 microtask가 끼어들 수 있다.

### `scheduler.postTask()` — 차세대 스케줄링

Chrome 94+에서 도입된 실험적 API. 세 가지 우선순위를 명시적으로 지정할 수 있다:

```typescript
// 유저 블로킹 (최우선)
scheduler.postTask(() => handleKeyPress(), { priority: 'user-blocking' });

// 유저 가시 (보통)
scheduler.postTask(() => updateUI(), { priority: 'user-visible' });

// 백그라운드 (최저)
scheduler.postTask(() => sendAnalytics(), { priority: 'background' });
```

이건 Interactive OS의 커맨드 우선순위와 개념적으로 동일하다 — 브라우저 레벨에서 "어떤 작업이 더 긴급한가"를 선언하는 것.

### React 18의 `startTransition` — 같은 아이디어

```typescript
// 긴급: 입력 필드 즉시 반영
setState(input);

// 덜 긴급: 검색 결과는 나중에
startTransition(() => {
  setSearchResults(filter(input));
});
```

React가 자체 스케줄러(`scheduler` 패키지)로 이벤트 루프를 활용하는 방식. "모든 업데이트가 같은 우선순위는 아니다"는 인사이트.

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|--------|------|
| Jake Archibald "In The Loop" | 이벤트 루프 시각적 이해 | [YouTube (JSConf.Asia 2018)](https://www.youtube.com/watch?v=cCOL7MC4Pl0) | 🟢 | 35분 |
| Tasks, Microtasks, Queues | Jake의 인터랙티브 블로그 | [jakearchibald.com](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) | 🟢 | 20분 |
| React Scheduler Deep Dive | React가 이벤트 루프를 쓰는 방법 | [jser.dev](https://jser.dev/react/2022/03/16/how-react-scheduler-works/) | 🔴 | 1시간 |
| `scheduler.postTask` | 차세대 브라우저 스케줄링 | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask) | 🟡 | 15분 |
| Browser Rendering Pipeline | DOM → Paint 전체 과정 | [web.dev Critical Rendering Path](https://web.dev/articles/critical-rendering-path) | 🟡 | 30분 |
