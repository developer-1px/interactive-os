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
npm run typecheck
```
- 0 errors → 다음 게이트 (절대 0 원칙: pre-existing 면책 없음)
- errors → 보고하고 멈춘다

#### Gate 2: Lint
```bash
npm run lint:biome -- --write
```
- `--write` 후에도 error 0 달성 필요

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

#### Gate 6: Dev Server Smoke

> tsc·build 통과해도 esbuild(Vite dev)의 module resolution은 다르다.
> **모든 vite config**를 대상으로 기동 → 요청 → 에러 확인한다.

```bash
bash scripts/vite-smoke.sh
```
- exit 0 → 완료
- exit 1 → 실패한 config와 에러 메시지를 보고하고 멈춘다

### 결과 보고

```
| Gate | Result |
|------|--------|
| tsc  | ✅ 0 errors |
| lint | ✅ |
| unit | ✅ N passed |
| bind | ✅ / ⏭ skip |
| build| ✅ |
| dev  | ✅ |
```

