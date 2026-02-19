---
description: 검증 게이트. tsc, lint, unit, e2e, build를 순차 실행하여 코드 안정성을 확인한다.
---

// turbo-all

## /verify — 검증 게이트

> **목적**: 코드 변경 후 시스템 안정성을 확인하는 기계적 게이트.
> **분류**: 리프. 다른 워크플로우를 호출하지 않는다.
> **전제**: 개발 환경이 정상 동작 중이어야 한다. 서버가 없으면 오케스트레이터가 `/ready`를 먼저 실행한다.

### 게이트 순서

각 게이트를 순차 실행한다. 실패 시 즉시 보고하고 멈춘다.

#### Gate 1: Type Check
// turbo
```bash
npx tsc --noEmit
```
- 0 errors → 다음 게이트
- errors → 보고하고 멈춘다

#### Gate 2: Lint
// turbo
```bash
npx biome check --write
```

#### Gate 3: Unit Test
// turbo
```bash
npx vitest run 2>&1 | tail -30
```
- all pass → 다음 게이트
- fail → 실패한 테스트 목록을 보고하고 멈춘다

#### Gate 4: E2E Smoke (해당 시)
```bash
npx playwright test --grep @smoke 2>&1 | tail -30
```
- smoke가 없거나 E2E 설정이 없으면 스킵

#### Gate 5: Build
// turbo
```bash
npx vite build 2>&1 | tail -20
```
- success → 완료
- fail → 보고하고 멈춘다

### 결과 보고

```
| Gate | Result |
|------|--------|
| tsc  | ✅ 0 errors |
| lint | ✅ |
| unit | ✅ N passed |
| e2e  | ✅ / ⏭ skip |
| build| ✅ |
```

### Dev Server 복구

빌드가 성공했는데 dev 서버가 죽어있으면:
```bash
lsof -t -i :5555 | xargs kill -9 2>/dev/null
source ~/.nvm/nvm.sh && nvm use && npx vite
```
