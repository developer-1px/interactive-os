# TestBot — Discussion Journey

> 이 문서는 TestBot 프로젝트의 논의 여정을 시간순으로 정리한다.

## 2026-02-10: TestBot v1 탄생과 의미

TestBot은 **LLM 자가검증 도구**로 탄생했다. 브라우저를 열어 눈으로 확인하는 대신, 테스트 코드를 실행해 빠르게 검증하는 것이 목적이었다.

핵심 발견:
1. **Visual Verification** — 커서가 움직이고, 테스트가 시각적으로 수행되는 경험이 핵심 가치
2. **제약 발견** — 브라우저 안에서 Node.js 생태계(Playwright)를 흉내내려니 마찰 발생

결론: v1은 "Concept Car". 비전을 증명했다.

## 2026-02-10: 아키텍처 3가지 옵션 검토

| 옵션 | 방식 | 판정 |
|------|------|------|
| A | Isomorphic Action | 단기 채택 |
| B | Build-time Transpile | 과도한 복잡성 |
| C | CDP Remote Control | 장기 목표 |

**추천**: A로 시작 → C로 발전.

## 2026-02-10: Playwright API 정렬

Pareto 20% 분석: 7개 API(`getByRole`, `getByText`, `click`, `press`, `fill`, `toBeFocused`, `toHaveAttribute`)로 95% 커버 가능. Shim에서 이 7개를 Playwright 시그니처와 100% 일치시키는 전략.

## 2026-02-12: 상태 격리 삽질

`kernel.reset(initialAppState)` 시도 → `apps: {}`가 앱 슬라이스를 파괴 → 백화현상.
근본 원인: `registerAppSlice`가 1회성. 해법: `appSlice.resetState()` + `resetAllAppSlices()` 레지스트리.

## 2026-02-12: TestBot 12/12 PASS 달성

6건 수정으로 shim parity 달성:
1. `[id="..."]` selector escape
2. TestBot DOM 제외 (`findByText` scope)
3. contenteditable typing (`execCommand`)
4. Meta+a select-all polyfill
5. `isLocator` type guard
6. `goto()` → `resetAllAppSlices()` state isolation
