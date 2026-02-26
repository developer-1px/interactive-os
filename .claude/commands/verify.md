---
description: 검증 게이트. tsc, lint, unit, e2e, build를 순차 실행하여 코드 안정성을 확인한다.
---

## /verify — 검증 게이트

> **목적**: 코드 변경 후 시스템 안정성을 확인하는 기계적 게이트.
> **분류**: 리프. 다른 워크플로우를 호출하지 않는다.
> **전제**: 개발 환경이 정상 동작 중이어야 한다. 서버가 없으면 오케스트레이터가 `/ready`를 먼저 실행한다.

### 게이트 순서

각 게이트를 순차 실행한다. 실패 시 즉시 보고하고 멈춘다.

#### Gate 1: Type Check
```bash
npx tsc --noEmit
```
- 0 errors → 다음 게이트
- errors → 보고하고 멈춘다

#### Gate 2: Lint
```bash
npx biome check --write
```

#### Gate 3: Unit Test
```bash
npx vitest run 2>&1 | tail -30
```
- all pass → 다음 게이트
- fail → 실패한 테스트 목록을 보고하고 멈춘다

#### Gate 4: Bind Smoke (해당 시)

> "연결했다"와 "연결이 동작한다"는 다른 증명이다.

이번 변경에서 새로 bind된 OS 프리미티브가 있으면:

1. **경로 나열**: bind에서 연결한 콜백 → 커맨드 → OS dispatch 경로를 나열
2. **Headless 검증**: OS 커맨드를 dispatch하여 상태 변경 확인 (vitest 또는 인라인)
3. **브라우저 확인** (headless 불가 시): dev server에서 기능 실행 + 콘솔 에러 확인
4. **headless 불가 사유** → OS gap 후보로 기록 (`/audit`에서 분류)

bind 변경이 없으면 스킵.

#### Gate 5: Build
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

### Dev Server 복구 & 에러 확인

빌드 또는 테스트 완료 후 dev 서버 상태를 확인한다.
tsc는 통과해도 esbuild(Vite)의 module resolution은 다를 수 있다.

```bash
# 1. 기존 서버 kill + 캐시 삭제
lsof -t -i :5555 | xargs kill -9 2>/dev/null
rm -rf node_modules/.vite

# 2. 서버 재기동
source ~/.nvm/nvm.sh && nvm use && npx vite

# 3. 기동 후 5초 내 콘솔 에러(esbuild ERROR) 확인
# 에러가 있으면 보고하고 멈춘다
```

