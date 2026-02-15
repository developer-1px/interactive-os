# 🐛 TestBot 러너 — Playwright spec 연동 불가
> 등록일: 2026-02-15
> 상태: open
> 심각도: P1

## 원문
테스트봇 러너 연동이 안되고 있어 확인 후 수정

## 환경 (Environment)
- 브라우저/OS: Chrome, macOS
- 화면 크기: N/A
- 관련 서버 상태: App 5555 ✅ / Docs 4444 ✅

## 재현 단계 (Reproduction Steps)
1. http://localhost:5555 접속
2. Inspector TestBot 패널 열기 → "0 Routes Active", 테스트 없음
3. TestDashboard(/tests)에서 E2E spec 선택 → 실행 불가 (execLoader 없음)

## 기대 결과 (Expected)
- `.spec.ts` 파일이 TestBot에서 실행 가능해야 함
- PRD: "한 번 작성, 세 곳에서 실행" — Playwright spec을 TestBot에서도 실행

## 실제 결과 (Actual)
- TestBot Runner: "0 Routes Active" — 어떤 페이지도 testbot route를 등록하지 않음 (KernelLabBot만 수동 Bot API 사용)
- TestDashboard: E2E spec에 Run 버튼 없음 (execLoader가 없어서)
- Playwright shim 파일 누락: `src/inspector/testbot/playwright/index.ts` 없음
- Registry 파일 누락: `src/inspector/testbot/playwright/registry.ts` 없음

## 진단 결과

### 근본 원인: Playwright 호환 레이어 미구현

**3개의 연결 고리가 모두 끊어져 있다:**

### 1. Vite Alias 대상 파일 부재
```
vite.config.ts: "@playwright/test": "/src/inspector/testbot/playwright/index.ts"
→ 이 파일이 존재하지 않음
```
- `.spec.ts` 파일들이 `import { test, expect } from "@playwright/test"`를 사용
- Vite alias가 testbot playwright shim으로 매핑하지만, 실제 shim 파일이 없음

### 2. Spec Wrapper Plugin 대상 파일 부재
```
vite-plugins/spec-wrapper.ts: import from "@inspector/testbot/playwright/registry"
→ registry.ts가 존재하지 않음
```
- Plugin이 `.spec.ts`를 `__runSpec__()` 함수로 래핑하지만, registry가 없어서 실행 불가

### 3. TestDashboard에서 E2E spec의 execLoader 미연결
```typescript
// TestDashboard.tsx 현재:
const unitFilesExec = import.meta.glob("/src/**/tests/unit/**/*.test.ts");
// → E2E exec glob 없음!
// → testbot layer glob도 없음!
```
- Unit 테스트만 실행 가능, E2E spec은 소스 보기만 가능

### 필요한 구현 목록

| # | 파일 | 목적 |
|---|------|------|
| 1 | `src/inspector/testbot/playwright/index.ts` | `test`, `expect` 등 Playwright API의 TestBot 호환 구현 |
| 2 | `src/inspector/testbot/playwright/registry.ts` | `setLoadingContext` — spec 등록 컨텍스트 관리 |
| 3 | TestDashboard E2E exec glob 추가 | E2E spec도 in-browser 실행 가능하게 |
| 4 | Playwright test/expect → TestBot API 브릿지 | `page.locator()`, `page.keyboard`, `expect().toBeVisible()` 등 |

## 관련 이슈
- docs/1-project/testbot/2-prd.md — "한 번 작성, 세 곳에서 실행" 목표
- docs/1-project/testbot/4-proposal.md — Phase 1: Shim 커버리지 확대
