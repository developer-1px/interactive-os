---
description: LLM 산출물의 well-formedness를 intent-preserving하게 보장하는 품질 게이트.
---

// turbo-all

## /fix — Well-formedness 검증 & 정정

> **목적**: LLM이 "완료"라고 했지만 실제로 돌아가지 않는 malformed code를 고친다.
> **범위**: Form(형태)만 고친다. Logic/Design(의도)은 건드리지 않는다.
> **구분**: `/fix` = 형식 정정, `/issue` = 문제 해결. 이 둘은 다르다.

### 핵심 제약: Intent-Preserving

> 코드가 **하려는 것**(intent)은 보존하고, **표현**(form)만 고친다.

✅ 허용 (Form 수정):
- 빠진 import/export 추가
- import 경로 오타 수정
- 중복 import 제거
- undefined 참조를 올바른 참조로 수정
- 누락된 파일 생성 (빈 stub)
- 오타 수정 (변수명, 함수명)

❌ 금지 (Logic/Design 수정):
- 함수 호출을 다른 함수로 교체
- `as any` 타입 우회
- 크래시 나는 컴포넌트 주석 처리/삭제
- 함수 시그니처 변경
- 조건 분기/로직 변경
- import를 "빌드 통과 목적으로" 삭제

### 절차

1. **정적 검증**
   - `npx tsc --noEmit` 실행 → 에러 목록 수집

2. **빌드 검증**
   - `npm run build` 실행 → 에러 목록 수집

3. **런타임 검증 — Playwright Smoke Test**
   - `npx playwright test src/tests/e2e/smoke.spec.ts` 실행
   - smoke.spec.ts는 `routeTree.gen.ts`의 `FileRoutesByFullPath`에서 라우트를 자동 추출
   - 각 라우트를 방문하여 `pageerror` 이벤트로 React 마운트 시 런타임 에러를 캡처

4. **에러 분류**
   - 수집된 에러가 **well-formedness 에러**(malformed)인지 판단한다.
   - well-formedness: import 해석 실패, undefined 참조, 중복 선언, 오타 등
   - correctness: 로직 오류, 설계 결함, 비즈니스 로직 버그 등

5. **Intent-preserving 수정**
   - well-formedness 에러만 수정한다.
   - 수정 후 1~3단계를 재실행하여 확인한다 (루프).

6. **범위 밖 에러 보고**
   - Form으로 고칠 수 없는 에러(correctness 문제)가 남으면:
   - "이 에러는 well-formedness 범위 밖입니다. `/issue`로 등록하세요." 보고하고 멈춘다.

7. **완료**
   - 모든 검증 통과 시: `✅ well-formedness 확인 완료` 보고.

### 호출 관계

```
/issue → /fix (검증 게이트로 호출) ✅
/project → /fix (구현 후 검증) ✅
/refactor → /fix (변환 후 검증) ✅
/poc → /fix (spike 후 검증) ✅
/fix → /issue ❌ (금지 — /fix는 문제 해결하지 않는다)
/fix → /divide ❌ (금지 — /fix는 분해하지 않는다)
```
