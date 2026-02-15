---
description: 코드 변경 후 반드시 실행하는 검증 게이트. 다른 워크플로우에서 참조한다.
---

## /verify — 검증 게이트

> **원칙**: 코드를 수정했으면 반드시 검증 게이트를 통과해야 한다.
> 하나라도 빠뜨리면 검증이 불완전하다. "통과했다"고 말하지 마라.

### 절차

// turbo-all

0. **환경 확인** (E2E 실행 시에만)
   - `/ready` 워크플로우를 실행한다 (App 5555 + Docs 4444 health check & 복구).
   - 타입/린트/유닛만 검증할 때는 이 단계를 스킵한다.

1. **Type Check**
   - `npx tsc --noEmit`
   - 0 errors 확인.

2. **Lint**
   - `npx biome check src/` (변경 파일 대상)
   - errors 0 확인. warnings는 보고하되 블로커로 취급하지 않는다.
   - lint 오류가 pre-commit hook에서만 발견되는 사태를 방지한다.

3. **Unit Test**
   - `npx vitest run`
   - 전체 통과 확인. 실패 시 수정 후 재실행.

4. **E2E Test** (UI/라우트 변경 시)
   - `npx playwright test`
   - 30초 이상 출력 없이 멈추면 dev 서버 상태를 재확인한다 (Step 0).
   - 전체 통과 확인. 실패 시 원인 분석.
   - E2E 실패가 코드 변경의 파급이면 수정한다.
   - E2E 실패가 기존 문제면 명시적으로 보고한다.
   - **스킵 가능 조건**: UI 컴포넌트/라우트/CSS 변경이 없는 순수 타입/로직 변경. 보고서에 `⏭️ E2E skipped — no UI changes` 명시.

5. **Build**
   - `npx vite build` (또는 `npm run build`)
   - 빌드 성공 확인.

6. **Smoke Test** (dev 서버 환경 복구)
   - `vite build`는 `node_modules/.vite` 캐시 해시를 변경하여 실행 중인 dev 서버를 오염시킨다 (504 Outdated Optimize Dep).
   - 캐시를 정리하고 dev 서버를 재시작한다:
     ```
     rm -rf node_modules/.vite
     ```
   - `/ready` 워크플로우를 실행하여 두 서버(App 5555, Docs 4444)가 200 응답하는지 확인한다.
   - **이 단계를 생략하면 "검증 통과했지만 앱이 깨진" 상태가 된다.**

### 결과 보고

모든 단계 완료 후 아래 형식으로 보고한다:

```
| 단계       | 결과                    |
|-----------|------------------------|
| Type      | ✅ 0 errors             |
| Lint      | ✅ 0 errors (N warnings)|
| Unit      | ✅ N/N passed           |
| E2E       | ✅ N/N passed (또는 ⏭️ skipped — no UI changes) |
| Build     | ✅ OK                   |
| Smoke     | ✅ dev servers 200      |
```

### 호출 관계

이 워크플로우를 호출하는 곳:
- `/fix` — 수정 후 검증
- `/go` — 자율 실행 루프의 주기적 검증
- `/cleanup` — 정리 후 최종 검증
- `/project` — 구현 후 검증
- `/refactor` — 변환 후 검증
- `/tdd` — 테스트 통과 확인
- `/poc` — spike 후 검증
