# TestBot — PRD

## 배경

TestBot은 Interactive OS의 **시각적 E2E 테스트 러너**다. 브라우저 내에서 Playwright와 동일한 API로 작성된 테스트를 실행하며, 커서 애니메이션·버블·PASS/FAIL 스탬프를 통해 테스트 과정을 시각적으로 보여준다.

## 목표

**"한 번 작성, 세 곳에서 실행"** — Playwright 표준 API로 작성된 테스트를 Playwright CLI(자동화)와 TestBot(시각 시연) 양쪽에서 실행.

## 범위

### In Scope

| # | 항목 | 설명 |
|---|------|------|
| 1 | **Playwright API Shim 완성** | 현재 7개 API(getByRole, getByText, click, press, fill, focus, keyboard.press) + expect 지원. 추가 API 단계적 확대 |
| 2 | **상태 격리** | `resetAllAppSlices()`로 테스트 간 완전 격리 |
| 3 | **Spec → TestBot 변환** | Vite 플러그인으로 `.spec.ts` → TestBot 실행 가능 형태 자동 변환 |
| 4 | **Visual Verification** | 커서, 버블, 스탬프 — 핵심 UX 유지·개선 |
| 5 | **`window.__TESTBOT__` API** | LLM이 테스트를 실행·수집할 수 있는 글로벌 API |

### Out of Scope

| # | 항목 | 이유 |
|---|------|------|
| 1 | CDP Remote Control | 장기 목표, 별도 프로젝트 |
| 2 | 네트워크 모킹 | 현재 앱이 클라이언트 전용 |
| 3 | 다중 브라우저 지원 | Playwright에 위임 |

## 사용자 시나리오

### S1: LLM 자가검증
1. LLM이 코드 변경
2. `npx playwright test` 실행 → pass/fail 확인
3. 실패 시 `window.__TESTBOT__.runAll()` 로 브라우저에서 시각적 디버깅

### S2: 개발자 시연
1. Inspector 패널에서 TestBot 탭 열기
2. "Run All" 클릭 → 커서가 움직이며 테스트 시각 수행
3. PASS/FAIL 스탬프로 결과 확인

### S3: AI 통합 (Future)
1. AI가 E2E spec 작성 → Playwright + TestBot 양쪽 실행
2. 개발자가 TestBot에서 시각적으로 검증 → 승인

## 기술 제약

- Shim은 Playwright의 **서브셋**만 구현 (브라우저 환경 한계)
- Synthetic event는 일부 네이티브 동작 불가 → 폴리필 필요 (Meta+a, Backspace 등)
- `.spec.ts`의 `test()`, `expect()` 호출을 TestBot 컨텍스트로 래핑하는 Vite 플러그인 필요
