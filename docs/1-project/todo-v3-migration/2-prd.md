# Todo v3 통합 마이그레이션 — PRD

## 배경

Todo 앱은 프레임워크 진화에 따라 3개 버전이 공존:

| 버전 | 패턴 | 위치 | 라우트 |
|------|------|------|--------|
| v1 | `todoSlice` + distributed commands | `widgets/` | `/` (메인) |
| v2 | `createModule` | `widgets-v2/` | `/playground/todo-v2` |
| v3 | `defineApp` + `createWidget` | `widgets-v3/` | `/playground/todo-v3` |

v3가 최신이자 최종 아키텍처. v1/v2는 마이그레이션 과정의 중간 산물.

## 목표

- v3를 유일한 Todo 앱으로 승격
- v1/v2 코드를 완전히 제거하여 코드베이스 단순화
- 기존 E2E/통합 테스트 유지

## 범위

### In-Scope
- v3 위젯을 `widgets/`로 승격 (접미사 제거)
- 메인 라우트(`/`)에서 v3 사용
- v1/v2 전용 파일 삭제
- Playground v2/v3 라우트 제거

### Out-of-Scope
- `features/commands/` 디렉토리 (OS 테스트가 의존)
- `features/todoKeys.ts` (키맵 시스템)
- `selectors.ts` (v3, OS 테스트가 사용)
- `app.ts` (todoSlice — OS 테스트가 의존)
- v3 기능 추가 (BoardView 등)

## 기술 제약

- `GlobalNav`가 `widgets/GlobalNav.tsx`에 위치 → 삭제 전 이동 필요
- OS 레벨 테스트(`os-commands.test.ts`, `clipboard-commands.test.ts`)가 `todoSlice`와 v1 commands를 직접 import → 유지 필수
