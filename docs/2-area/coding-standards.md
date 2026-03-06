# 표준: 코딩 & 아키텍처

## 1. 안티노이즈 원칙
인간과 AI 모두를 위한 고신호 작업 공간을 유지하기 위해:
- **배럴 파일 금지**: `index.ts` 파일을 지양합니다. "인덱스 지옥"을 만들고 파일 검색을 비효율적으로 만듭니다.
- **엄격한 심볼 매칭**: 파일명은 내보내는 주요 심볼과 정확히 일치해야 합니다 (예: `TodoEngine.tsx`는 `TodoEngine`을 내보냄).

## 2. 네이밍 규칙

### 약어
**모호한 약어**(나쁨)와 **표준 약어**(좋음)를 구분합니다.

#### ✅ 허용되는 표준 약어
- `ctx` (Context)
- `cmd` (Command)
- `id` (Identifier)
- `ref` (Reference)
- `props` (Properties)
- `e` (Event)

#### ❌ 지양하는 모호한 약어
- `cat` → `category` 사용
- `val` → `value` 사용
- `nav` → `navigation` 사용
- `idx` → `index` 사용
- `err` → `error` 사용

## 3. AI 안전 구문 (Expect 패턴)
로직 빌더와 어설션에는 커스텀 빌더보다 **E2E 스타일 구문**을 선호합니다.
- **규칙**: `Rule().item().isValid()` 대신 `Expect(item).toBeValid()` 사용.
- **근거**: LLM이 Jest/Playwright 패턴에 대해 집중적으로 훈련되어 있습니다. 이 "훈련 세트 편향"에 맞추면 생성 신뢰성이 크게 향상되고 할루시네이션이 감소합니다.
