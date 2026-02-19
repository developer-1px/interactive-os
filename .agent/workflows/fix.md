---
description: LLM 산출물의 well-formedness를 intent-preserving하게 보장하는 품질 게이트.
---

// turbo-all

## /fix — Well-formedness 검증 & 정정

> **목적**: LLM이 "완료"라고 했지만 실제로 돌아가지 않는 malformed code를 고친다.
> **범위**: Form(형태)만 고친다. Logic/Design(의도)은 건드리지 않는다.
> **구분**: `/fix` = 형식 정정, `/issue` = 문제 해결. 이 둘은 다르다.
> **분류**: 리프. 다른 워크플로우를 호출하지 않는다.

### 핵심 제약: Intent-Preserving

> 코드가 **하려는 것**(intent)은 보존하고, **표현**(form)만 고친다.

✅ 허용 (Form 수정):
- 빠진 import/export 추가
- import 경로 오타 수정
- 중복 import 제거
- undefined 참조를 올바른 참조로 수정
- 누락된 파일 생성 (빈 stub)
- 오타 수정 (변수명, 함수명)
- **lazy 주석으로 생략된 코드 복원** (`// ... remains the same ...` 등)

❌ 금지 (Logic/Design 수정):
- 함수 호출을 다른 함수로 교체
- `as any` 타입 우회
- 크래시 나는 컴포넌트 주석 처리/삭제
- 함수 시그니처 변경
- 조건 분기/로직 변경
- import를 "빌드 통과 목적으로" 삭제

### 절차

0. **Git 상태 확인**
   - `git diff --stat HEAD`로 working tree의 변경 파일을 확인한다.
   - 큰 변경이 있는 파일은 반드시 최신 상태를 기준으로 작업한다.
   - 구 버전 파일에 수정을 적용하면 의도치 않은 코드 손실이 발생한다.

1. **Lazy 주석 사전 탐지**
   - `grep -rn "// \.\.\." src/ --include="*.ts" --include="*.tsx"` 로 lazy 주석 스캔.
   - 발견되면 git history에서 원본을 복원한다.
   - 이 패턴은 tsc/build를 통과하지만 런타임에서 크래시하므로 정적 검증만으로는 잡히지 않는다.

2. **에러 수집**
   - `npx tsc --noEmit` 실행하여 타입 에러를 수집한다.
   - 에러가 없으면 → Step 5(완료)로.

3. **에러 분류**
   - 수집된 에러가 **well-formedness 에러**(malformed)인지 판단한다.
   - well-formedness: import 해석 실패, undefined 참조, 중복 선언, 오타 등
   - correctness: 로직 오류, 설계 결함, 비즈니스 로직 버그 등

4. **Intent-preserving 수정**
   - well-formedness 에러만 수정한다.
   - 수정 후 Step 2로 돌아가 재확인한다 (루프).

5. **범위 밖 에러 보고**
   - Form으로 고칠 수 없는 에러(correctness 문제)가 남으면:
   - "이 에러는 well-formedness 범위 밖입니다." 보고하고 멈춘다.

6. **완료**
   - 모든 에러 해소 시: `✅ well-formedness 확인 완료` 보고.
