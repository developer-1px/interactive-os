# Replay — RFC

## Summary

`createPage` API의 `press/click/query` 호출을 가상 마우스, 가상 키보드, PASS/FAIL 배지로 시각화하여 재생하는 도구. LLM이 vitest로 작성한 테스트를 인간이 눈으로 검증한다.

## Motivation

### Why

LLM이 작성한 테스트 코드가 `PASS`를 반환해도, 인간은 "이 PASS가 진짜 의미 있는가?"를 코드만으로 판단하기 어렵다. `pressKey("ArrowDown") → expect(focusedItemId()).toBe("b")`를 읽는 것보다, **커서가 실제로 b로 이동하는 것을 보는 것**이 빠르다.

### Warrants (from Discussion)

| # | Warrant |
|---|---------|
| W1 | Replay = 동기 실행된 테스트의 시각적 재생. 이름이 곧 기능 |
| W2 | createPage API가 시각화 단위와 1:1 매핑 (press→키보드, click→마우스, query→배지) |
| W3 | vitest 코드가 유일한 원본 — Replay 전용 코드 없음 |
| W4 | "이 OS 위에서 이 OS를 테스트한다" (rules.md 검증 #2) |
| W5 | TestBot v1/v2의 기술적 부채(Shim, ReplayPanel) 없이 깨끗한 시작 |
| W6 | 비전 불변: "LLM이 만든 테스트를 인간이 시각적으로 검증하는 도구" |

### Prior Art

- TestBot v1: Playwright Shim 기반. Todo 12/12 PASS. 한계 발견 → 아카이브.
- TestBot v2: OS 시그널 기반으로 전환 시도. 구현 복잡성으로 보류.
- `createPage(App, View?)`: projection-checkpoint 프로젝트에서 구현 완료. Replay의 기반.
- 기존 가상 마우스/키보드/배지 컴포넌트: 이전 TestBot에서 구현한 시각화 자산.

## Detailed Design

→ `prd.md` 위임

## Unresolved Questions

- ~~createPage의 동기 실행을 어떻게 step-by-step 재생으로 변환하는가?~~ → **해소됨** (기존 hook 조합)
- Replay 앱은 별도 라우트(`/replay`)인가, Inspector 탭인가? → **미해소 (Q2)**
- ~~기존 가상 마우스/키보드 컴포넌트를 재사용할 수 있는가?~~ → **해소됨** (전부 재사용 가능)

---

## /wip 분석 이력

### Round 1 (2026-03-12) — Complex 판정

#### 턴 1: /divide
- **입력**: Goal(createPage 시각 재생) + 현재 인프라 조사
- **결과**: 5갈래 분해(A~E), 인프라 부재 판단
- **Cynefin**: Complex — 핵심 설계 질문 3개 미해소

---

### Round 2 (2026-03-12) — Complicated 판정 (Clear 직전)

#### 턴 1: /divide (심화) — 코드베이스 instrumentation 포인트 탐색
- **입력**: Q1(instrumentation) 기술적 실현 가능성 조사
- **결과 — 3개 recording hook 이미 존재**:
  1. **`BrowserPage.onStep`** (`createBrowserPage.ts:45,420`): `BrowserStep { action, detail, result, timestamp }` — 매 action마다 fire. **가장 자연스러운 recording point**
  2. **`InteractionObserver`** (`simulate.ts:56-59`): `setInteractionObserver()` → `{ type, label, stateBefore, stateAfter, timestamp }` — headless+browser 양쪽 동작, 전체 OS state snapshot
  3. **Kernel middleware** (`historyKernelMiddleware.ts:119-300`): command + patches + focus/selection — 이미 history system이 사용 중
- **Q1 해소**: Proxy/Decorator 불필요. `onStep` + middleware 조합이면 충분
- **Cynefin**: Complex → **Complicated**

#### 턴 2: /usage — 시각화 자산 재사용성 조사
- **입력**: 기존 시각 컴포넌트 재사용 가능 여부
- **결과 — 전부 존재하며 재사용 가능**:
  - **Cursor overlay** — Popover API, SVG pointer + spotlight (`createBrowserPage.ts:157-386`)
  - **Ripple** — 60px, 0.4s CSS keyframe (`testbot-overlays.css`)
  - **Key badge** — keycap 스타일, modifier 지원 (`testbot-overlays.css`)
  - **PASS/FAIL stamp** — pop rotation 애니메이션 (`testbot-overlays.css`)
  - **Step timeline UI** — `SuiteDetails` + `StepIcon` (`TestBotPanel.tsx`)
  - **Kbd 컴포넌트** — OS별 기호, 3 size, 4 variant (`Kbd.tsx`)
  - **Speed control** — `STEP_DELAY = 400/speed` 이미 구현
- **Q4 해소**: `createVisualEffects()`가 이미 독립 함수. God Object 분해 불필요
- **Cynefin**: Complicated 유지

#### 턴 3: 최종 판정
- **빌딩블록 매핑**:

| 계층 | 있는 것 | 새로 만들 것 (크기) |
|------|---------|-------------------|
| Recording | `onStep`, `InteractionObserver`, kernel middleware | Step 직렬화 adapter (S) |
| Visual Effects | cursor, ripple, keybadge, stamp, bubble | 없음 |
| Step Timeline UI | `SuiteDetails`, `StepIcon` | Play/Pause/Step 컨트롤 (S) |
| Speed Control | `BrowserPageOptions.speed` | 없음 |
| Storage | — | 녹화 저장/로드 (S) |
| Replay Engine | `createBrowserPage()` + visual effects | Step→action dispatcher (M) |
| UI Shell | Inspector panel 인프라 | **Q2: 배치 결정 필요** |

### Open Gaps (인간 입력 필요)

- [x] ~~Q1: Instrumentation 접근~~ → `onStep` + kernel middleware 조합
- [ ] **Q2: Inspector 탭 vs 별도 라우트 (`/replay`)** — 제품 결정. Inspector에 넣으면 개발 도구와 통합, 별도 라우트면 standalone 경험. 해소 시 UI shell 설계 가능
- [x] ~~Q3: TestBot v1/v2 실패 교훈~~ → 부분 해소. v1 Shim 제거 완료, v2의 VisualEffects는 이미 재사용 가능 형태. Replay는 기존 `createBrowserPage` 위에 adapter만 추가하므로 복잡성 낮음
- [x] ~~Q4: createBrowserPage God Object 분리~~ → `createVisualEffects()`가 이미 독립 함수. 선행 조건 아님

### 기술 아키텍처 (확정)

```
TestScript.run(page, expect)
        │
        ▼
  createBrowserPage({ onStep })  ── 기존 코드
        │
        ├─ onStep fires ────► StepRecorder (새로 만들 것, S)
        │                          │
        │                          ▼
        │                    BrowserStep[] → JSON 직렬화
        │
        ▼
  Replay Mode: JSON → step-by-step dispatcher (새로 만들 것, M)
        │
        ├─ page.click(detail) ─► createVisualEffects() 자동 실행
        ├─ page.keyboard.press(detail)
        └─ assert → showStamp()
```

### 다음 /wip 시 시작점

Q2 해소 후 → `/blueprint`로 Replay Engine + UI Shell 설계. 기술적으로는 Clear — Q2 결정만 남음
