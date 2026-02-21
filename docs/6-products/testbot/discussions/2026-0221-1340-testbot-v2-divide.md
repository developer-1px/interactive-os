# TestBot v2 — Cynefin 분해 보고서

> **목적**: VISION.md의 How를 구현하기 위한 태스크 분해
> **작성일**: 2026-02-21 13:40
> **입력**: Discussion 결론 (Record/Replay, Vitest Browser Mode, pressKey/click/attrs 데코레이터)

---

## 현재 상태

| 지표 | 값 |
|------|-----|
| Vitest 버전 | 4.0.18 (browser mode 정식 지원) |
| 총 테스트 케이스 | ~369개 (APG 58 + integration 16 + unit ~284 + apps ~11) |
| 기존 TestBot 코드 | `src/inspector/testbot/` — 25+ 파일 |
| 기존 Shim | `test-shim.ts` (Vite plugin) + `createApgKernel.browser.ts` + `vitest/index.ts` |
| 기존 Visual Assets | CursorOverlay, StampOverlay, TestBotPanel — **재사용 가능** |

---

## 분해 결과

### T1: Vitest Browser Mode 기반 구축 — **Complicated**

**왜**: Vitest 4.0의 정식 기능이라 문서가 있지만, 우리 프로젝트의 alias, OS 모듈, kernel 등과의 통합은 분석이 필요.

**할 일**:
1. `@vitest/browser` + `@vitest/browser-playwright` 설치
2. `vitest.config.ts`에 `browser` 설정 추가 (chromium, headless 옵션)
3. 기존 369개 테스트가 browser mode에서도 통과하는지 확인
4. Path alias (`@kernel`, `@os`, `@apps`) 해석 확인

**검증**: `vitest --browser` 실행 → 기존 테스트 전체 PASS

**리스크**: 
- `createTestOsKernel`이 JSDOM 가정을 하는 부분이 있을 수 있음
- `vitest.setup.ts`의 의존성이 browser 환경에서 동작하는지

---

### T2: TestStep 타입 + Record Decorator — **Complicated**

**왜**: Decorator 패턴은 자명하지만, 어떤 데이터를 기록할지(before/after state, DOM rect, timing)는 분석 필요.

**할 일**:
1. `TestStep` 타입 정의:
   ```ts
   type TestStep =
     | { type: "pressKey"; key: string; timestamp: number; 
         focusedBefore: string | null; focusedAfter: string | null }
     | { type: "click"; itemId: string; timestamp: number; rect?: DOMRect }
     | { type: "attrs"; itemId: string; result: ItemAttrs; pass: boolean; timestamp: number }
     | { type: "suite:start" | "suite:end"; name: string; timestamp: number }
     | { type: "test:start" | "test:end"; name: string; status?: "pass" | "fail"; 
         error?: string; timestamp: number }
   ```
2. `createTestOsKernel`의 browser 버전에서 `pressKey/click/attrs` 호출 시 `TestStep[]`에 push
3. 테스트 실행 후 `TestStep[]`을 접근 가능한 곳(globalThis, file, store)에 저장

**검증**: browser mode 테스트 실행 후 `TestStep[]`이 올바르게 기록됨

**의존**: T1 (browser mode가 동작해야 decorator 테스트 가능)

---

### T3: 데이터 브릿지 (vitest → TestBot Panel) — **Complex**

**왜**: vitest --browser는 별도 프로세스, TestBot Panel은 dev 서버(npm run dev)의 앱 내부. 두 세계 사이에 데이터를 전달하는 방법이 여러 가지이고, 프로젝트 맥락에 따라 달라짐.

**선택지**:
| 방식 | 장점 | 단점 |
|------|------|------|
| **A. JSON 파일** | 단순, vitest reporter → file → fetch | 실시간 아님, 파일 I/O |
| **B. Vitest Custom Reporter + WebSocket** | 실시간 스트리밍 | 복잡도 높음 |
| **C. preview provider (headless: false)** | vitest 자체 UI에서 보이도록 | TestBot Panel 불필요, 하지만 커스텀 시각화 어려움 |
| **D. globalThis (같은 브라우저)** | 가장 단순 | vitest browser가 같은 페이지에서 동작해야 함 |

**결정 필요**: 사용자와 논의 필요. "replay마냥"이라는 요구에 가장 가까운 것은 **A (JSON 파일)** — 기록 후 불러와서 재생.

---

### T4: Replay Engine — **Complicated**

**왜**: 기존 CursorOverlay, StampOverlay, TestBotStore의 cursor/stamp 액션이 이미 구현되어 있음. TestStep[]을 순차적으로 이 액션들에 매핑하면 됨.

**재사용 가능한 기존 자산**:
- `showCursor()`, `setCursorState()`, `addCursorBubble()` — 커서 애니메이션
- `addCursorKey()` — 키 입력 표시
- `addCursorRipple()` — 클릭 효과
- `addStamp()` — PASS/FAIL 스탬프
- `CursorOverlay.tsx`, `CursorOverlay.css` — 렌더링
- `StampOverlay.tsx`, `StampOverlay.css` — 렌더링

**할 일**:
1. `replaySteps(steps: TestStep[], speed: number)` 함수 구현
2. 각 step 타입 → 기존 TestBotStore 액션 매핑:
   - `pressKey` → `addCursorKey(key)` + `setCursorState(focusedAfter의 위치)`
   - `click` → `addCursorRipple(rect.x, rect.y)` + `setCursorState(rect)`
   - `attrs` → `addStamp(pass ? "pass" : "fail", el, selector)`
   - `suite/test` → 상태 바 업데이트
3. Replay 컨트롤: Play, Pause, Step, Speed

**검증**: TestStep[] 입력 → 커서가 움직이고 스탬프가 찍힘

**의존**: T2 (TestStep 타입), T3 (데이터 전달)

---

### T5: TestBot Panel 리뉴얼 — **Complicated**

**왜**: 기존 TestBotPanel.tsx (299줄)이 있고, suite browser + 결과 표시는 이미 구현됨. Record/Replay 방식에 맞게 UI를 리뉴얼.

**할 일**:
1. Suite → Test → Step 계층 탐색 UI
2. "Replay" 버튼 + 속도 조절 
3. Step 타임라인 뷰 (각 pressKey/click/attrs를 시간순 표시)
4. 성공/실패 요약 대시보드

**의존**: T4 (Replay Engine)

---

### T6: 기존 Custom Shim 정리 — **Clear**

**왜**: Vitest Browser Mode가 정석이면, 커스텀 shim은 불필요해짐.

**삭제 대상**:
- `vite-plugins/test-shim.ts` — 커스텀 vitest import 교체 플러그인
- `src/inspector/testbot/vitest/index.ts` — describe/it/expect 수동 매핑
- `src/inspector/testbot/playwright/` — Playwright shim 전체 (사용자 판단: 유지 or 삭제)
- `vite.config.ts`의 `@playwright/test` alias

**보존 대상** (사용자 확인 필요):
- `src/inspector/testbot/vitest/createApgKernel.browser.ts` → T2의 Record Decorator 기반으로 재작성될 수 있음
- Playwright TestBot (v1) — VISION.md에서 "폐기하지 않음"으로 명시

**검증**: 삭제 후 `vitest` + `vitest --browser` + `vite build` 전체 통과

---

## 실행 순서

```
T1 (Browser Mode 구축)
  ↓
T2 (Record Decorator)
  ↓
T3 (데이터 브릿지) ← Complex, 결정 필요
  ↓
T4 (Replay Engine) ← 기존 자산 재사용
  ↓
T5 (Panel 리뉴얼)
  ↓
T6 (Shim 정리) ← 마지막, 모든 게 동작한 후
```

## Complex 항목 요약

| ID | 항목 | 왜 Complex인가 | 다음 행동 |
|----|------|----------------|-----------|
| T3 | 데이터 브릿지 | vitest 프로세스 → TestBot Panel 간 데이터 전달 방식이 여러 가지. 프로젝트 맥락(replay vs 실시간)에 따라 달라짐 | 사용자에게 A/B/C/D 중 선택 요청, 또는 PoC spike |

## Clear 즉시 실행 가능

| ID | 항목 | 예상 난이도 |
|----|------|------------|
| T6 | 기존 Shim 정리 | 🟢 삭제 작업 (T1~T5 이후) |
