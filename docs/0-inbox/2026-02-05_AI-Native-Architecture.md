# AI-Native Architecture 개발 원칙

> **작성일**: 2026-02-05  
> **요청**: 개발 원칙 문서화

---

## 1. 개요 (Overview)

AI 에이전트와 함께 개발하는 시대에 맞춘 아키텍처 원칙.

**핵심 철학**:
> "AI가 실수해도 구조가 잡아주고, 깨져도 빠르게 복구할 수 있는 시스템"

---

## 2. 4가지 복원력 속성

| 속성 | 파이프라인이 어떻게 돕는가 |
|------|---------------------------|
| **관찰 가능성** (Observability) | 모든 단계가 명시적 → 로그/트레이싱 가능 |
| **검증 가능성** (Verifiability) | 각 단계가 순수 함수 → 입출력만 테스트 |
| **재현 가능성** (Reproducibility) | 불변 상태 + 액션 로그 → 정확히 같은 상태 재현 |
| **복구 가능성** (Recoverability) | 스냅샷 기반 → 언제든 이전 상태로 롤백 |

---

## 3. 핵심 원칙

### 3.1 요구사항의 불변 (Invariant Requirements)
- "Enter 키 → 저장", "ArrowDown → 다음 아이템" 같은 요구사항은 **변하지 않는다**
- 커맨드를 미리 등록 → AI가 "어떤 동작들이 가능한지" 명확히 파악
- 데이터 스키마는 왠만해서는 불변 → zod/TypeScript로 미리 정의

### 3.2 선언적 정의 (Declarative Definitions)
- Keymap = 키 → 커맨드 매핑 선언
- Registry = 모든 Command, Schema, Rule을 한 곳에 등록
- 코어 로직에서 Side Effect 완전 격리

### 3.3 Pure Functions Only
- AI가 작성하는 코드는 `(state, action) => state` 형태의 순수 함수
- 타입이 맞으면 OK. **타입이 곧 규칙**
- 전역 상태나 암묵적 의존성 금지

### 3.4 코드 = 테스트 (Self-Verifying Code)
- **타입이 곧 명세**: `Make Illegal States Unrepresentable`
- **스키마가 곧 검증기**: zod 스키마로 런타임 검증
- **불변식(Invariant) 내장**: Reducer에서 상태 불변식 직접 체크

### 3.5 AI 작업 분리 원칙
- AI는 **React + TypeScript를 가장 잘 한다** → 그 강점 활용
- **순수 함수만 작성하게 하라** → Side Effect, 외부 의존성은 구조가 처리
- **구조가 검증한다** → AI가 틀려도 타입/스키마/불변식이 잡아줌

---

## 4. 배경

AI 에이전트에 일을 시켜보니:
- 원샷으로 완벽하게 만들어 줄 거라는 기대 ❌
- 빠르게 만들고 **깨질걸 전제**로 하되 **복원력**으로 대응 ✅
- **관찰/검증/재현/복구** 가능한 구조가 필수

---

## 5. 제안 (Proposal)

### 즉시 적용
- [x] `.agent/rules.md`에 원칙 추가 완료

### 점진적 적용
1. **zod 스키마 도입** - 핵심 엔티티에 런타임 검증 (Todo 앱부터)
2. **invariant 함수 도입** - Reducer에서 상태 불변식 체크
3. **Effect 선언 패턴** - `{ state, effects }` 반환 구조
4. **Action 로깅 강화** - 디버깅용 액션 히스토리

---

## 6. 참고

- `.agent/rules.md` - AI-Native Architecture 섹션 참조
