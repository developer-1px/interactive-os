# Headless Test Layer 분리 — 4-Layer + 2 Satellite

> 작성일: 2026-03-10
> 태그: infra
> 우선순위: P1

## 문제 / 동기

`packages/os-devtool/src/testing/` 전체가 레이어 없이 혼재되어 있다.
- `page.ts` 883줄 God Object — 5가지 관심사 혼재
- `simulate.ts`에 시뮬레이션 + 라이프사이클 혼재
- `AppPageInternal extends AppPage` — Page에 OS 메서드를 붙인 안티패턴
- Script(컨텐츠)와 인프라가 같은 모듈에 공존

발견 경위: headless test 개념 확립 discussion에서 naming Key Pool 분석 + 아키텍처 논의 중 도출.

## 기대 상태

### 4-Layer 구조

```
① Contract
   page: Page (Playwright 성역 — OS 메서드 부착 금지)
   app:  TestInstance (defineApp().create() — dispatch, state)
   os:   TestInstance (OS 커널 포함 — dispatch, state)

② Simulate
   OS Kernel의 DOM 동작 재현 (vitest에서 실행 가능)
   simulateKeyPress, simulateClick, buildKeyboardInput
   (순수 시뮬레이션만. 라이프사이클은 ③으로)

③ Adapter (WHERE — 환경 이름)
   VitestAdapter  ← ②를 사용
   BrowserAdapter ← 실제 DOM Event
   PlaywrightAdapter ← native (shim 0)

④ Runner
   vitest: runScenarios (describe/it)
   browser: TestBotRegistry (Inspector)
   playwright: native runner
```

### 2 Satellite (완전 분리)

- **Script** — 컨텐츠. Page만 import. 인프라에 의존 없음.
- **TestBot UI** — 시각화(VisualEffects, Panel, CSS). BrowserAdapter만 import.

### 핵심 설계 원칙

1. **Page는 Playwright 성역** — OS 메서드를 절대 부착하지 않는다
2. **app/os는 TestInstance** — 이미 존재하는 타입. 새 이름 발명 불필요
3. **Adapter는 WHERE로 명명** — Headless(개념) ≠ Vitest(환경)
4. **AppPageInternal extends AppPage 제거** — dispatch/state는 TestInstance로 분리
5. **Script는 page만 알고, os/app을 모른다** — E2E 동형성 보장

### 완료 조건

- [ ] page.ts God Object (883줄) → Contract + Adapter로 분리
- [ ] simulate.ts에서 registerHeadlessZone → VitestAdapter로 이동
- [ ] AppPageInternal extends AppPage 제거 — dispatch/state를 TestInstance로 분리
- [ ] scripts.ts에서 타입 정의(TestScript, TestScenario) → Contract로 이동
- [ ] createBrowserPage.ts에서 VisualEffects → TestBot UI Satellite로 분리
- [ ] 기존 293 suite 전부 GREEN 유지

### 검증 방법

- tsc 0 에러
- 기존 vitest 774 tests 회귀 0
- naming Key Pool 재분석 — 이상 패턴 감소 확인

## 선행 조건

**os, app, page 삼각 구조 정의**가 먼저 완료되어야 한다. 현재 discussion에서 진행 중.

---

## /wip 분석 이력 (2026-03-12)

### 분석 과정

#### 턴 1: /divide
- **입력**: 완료 조건 6개 vs 현재 상태
- **결과** — 부분 해소 확인:
  - ✅ `page.ts` God Object → **해소됨** (883→99줄, lib/ 5모듈 분리 완료 03-10)
  - ❓ `createBrowserPage.ts` 847줄 — 여전히 대형. TestBot UI Satellite 분리 미완
  - ❓ `simulate.ts` registerHeadlessZone → VitestAdapter 이동 여부 미확인
  - ❓ AppPageInternal extends AppPage 제거 여부 미확인
  - ❓ 선행 조건 "os, app, page 삼각 구조 정의" 진행 상태 불명
- **Cynefin**: Complicated — 방향 명확, 부분 해소, 잔여 범위 재조사 필요

### Open Gaps (인간 입력 필요)

- [ ] Q1: page.ts 해체 후 남은 완료 조건 중 어디까지 우선인가? createBrowserPage.ts(847줄) 분해가 핵심 잔여
- [ ] Q2: "os, app, page 삼각 구조 정의" discussion 결론이 있는가?

### 다음 /wip 시 시작점

Q1+Q2 해소 → 완료 조건 재작성 (해소된 항목 제거) → `/project` 재생성 가능

## 관련 항목

- `docs/0-inbox/2026-0310-1105-[analysis]-headless-test-concept.md` — 개념 정의
- `docs/0-inbox/2026-0310-1109-[analysis]-headless-test-naming-diagram.md` — 이름 관계도
- `docs/5-backlog/pipeline-leak-audit.md` — 파이프라인 구조 P0
- `docs/1-project/testing/headless-page/headless-simulator/BOARD.md` — headless-simulator 프로젝트
