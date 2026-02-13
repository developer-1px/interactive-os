# Builder OS 개밥먹기 PRD

## 1. 배경 (Background)

`defineApp`/`createWidget`는 Todo v3에서 검증되었다. 그 다음 질문:

> 이 패턴이 **CMS/빌더**처럼 flat한 key-value 콘텐츠 편집에도 자연스러운가?

현재 빌더는 OS를 쓰지 않는다:
- 4개 NCP 블록이 각각 `useState`로 데이터 관리 (OS 밖의 상태)
- `PropertiesPanel`은 하드코딩된 mock 폼 (데이터 연동 없음)
- `BuilderPage`는 DOM을 직접 탐색하여 타입을 추론 (OS 방식이 아님)

## 2. 목표 (Goals)

1. **개밥먹기**: `defineApp`/`createWidget`을 빌더에 적용하여, Todo와 다른 도메인에서의 사용 패턴을 발견한다.
2. **단위 테스트 우선**: `BuilderApp.create()`로 모든 상태 변경을 순수 함수 테스트로 증명한다. 브라우저 없이.
3. **OS 사용법 보고**: 적용 과정에서 발견한 패턴, 마찰, 개선점을 보고한다.

## 3. 범위 (Scope)

### In-Scope
- `BuilderApp` defineApp 정의 + unit tests
- NCP 블록 4개: `useState` → `BuilderApp.useComputed` + 커맨드
- `PropertiesPanel`: mock → 실제 데이터 바인딩
- OS 사용법 발견 보고서

### Out-Scope
- UI/UX 대폭 변경, 새 블록 추가
- Undo/Redo, 블록 추가/삭제/정렬
- 브라우저 기반 E2E 테스트 (기존 것은 유지, 새로 만들지 않음)

## 4. 핵심 질문 — 개밥먹기로 답해야 할 것

| # | 질문 | 답변 시점 |
|---|------|-----------|
| 1 | Todo는 엔티티(id → object) 구조. 빌더는 flat key-value 구조. `defineApp` 상태 모델은 두 패턴 다 자연스러운가? | app.ts 구현 시 |
| 2 | `createWidget`의 Zone/Field 선언이 빌더의 "캔버스 + 패널" 이중 위젯 구조에 적합한가? | widget 분리 시 |
| 3 | `OS.Field`의 `onCommit` → 커맨드 디스패치 플로가 인라인 편집과 패널 편집을 동시에 만족시킬 수 있는가? | PropertiesPanel 연동 시 |
| 4 | selector로 "현재 선택된 요소의 데이터"를 파생하는 것이 자연스러운가? | selector 구현 시 |

## 5. 성공 기준

- `vitest`에서 빌더 단위 테스트 전체 통과
- 패널에서 값 수정 → 캔버스 반영 (하나의 커맨드)
- OS 사용법 보고서 제출
