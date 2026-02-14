---
description: 코드 변경 후 반드시 실행하는 4단계 검증 게이트. 다른 워크플로우에서 참조한다.
---

## /verify — 검증 게이트

> **원칙**: 코드를 수정했으면 반드시 4단계를 모두 통과해야 한다.
> 하나라도 빠뜨리면 검증이 불완전하다. "통과했다"고 말하지 마라.

### 절차

// turbo-all

1. **Type Check**
   - `npx tsc --noEmit`
   - 0 errors 확인.

2. **Unit Test**
   - `npx vitest run`
   - 전체 통과 확인. 실패 시 수정 후 재실행.

3. **E2E Test**
   - `npx playwright test`
   - 전체 통과 확인. 실패 시 원인 분석.
   - E2E 실패가 코드 변경의 파급이면 수정한다.
   - E2E 실패가 기존 문제면 명시적으로 보고한다.

4. **Build**
   - `npx vite build` (또는 `npm run build`)
   - 빌드 성공 확인.

### 결과 보고

모든 단계 완료 후 아래 형식으로 보고한다:

```
| 단계       | 결과                    |
|-----------|------------------------|
| Type      | ✅ 0 errors             |
| Unit      | ✅ N/N passed           |
| E2E       | ✅ N/N passed (또는 ⚠️ M failed — 기존 이슈) |
| Build     | ✅ OK                   |
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
