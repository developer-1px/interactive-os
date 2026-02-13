# PRD: OS 키바인딩 아키텍처 재설계

## 배경

VSCode식 전역 플랫 keymap(`todoKeys.ts`)이 v3 위젯 캡슐화 아키텍처와 충돌. 레거시 `clipboard.ts` 삭제 불가, 커맨드 참조 누수, `when` 조건 분산 등의 문제 야기.

## 목표

커맨드(when+handler) + 위젯 트리(keybindings) + Zone(on*) 3계층 키바인딩 구조로 전환한다.

## 성공 기준

1. `todoKeys.ts` 완전 제거
2. `clipboard.ts` 완전 제거
3. 모든 키바인딩이 Zone `on*` 또는 위젯 `keybindings`에 co-locate
4. 커맨드의 `when` 조건이 Trigger disabled 상태와 자동 연동
5. 기존 키바인딩이 동일하게 동작 (회귀 없음)

## 비목표

- `OS.Trigger` 즉시 폐기 (점진적 전환)
- 모든 앱을 v3로 마이그레이션 (Todo만 우선)
- Inspector 완전 구현 (named when은 구조만, UI는 후속)

## 산출물

| 산출물 | 설명 |
|--------|------|
| `define.context()` API | 앱 상태 조건에 이름을 부여, Inspector화 가능 |
| `define.command()` 확장 | `{ when, handler }` 시그니처 지원 |
| `WidgetConfig.keybindings` | 앱 커스텀 키바인딩 등록 메커니즘 |
| `createTrigger()` | 커맨드+when → UI 자동 연동 |
| Todo App 마이그레이션 | todoKeys.ts, clipboard.ts 제거 |

## 영향 범위

| 파일/모듈 | 변경 유형 |
|-----------|----------|
| `src/os/defineApp.ts` | WidgetConfig에 keybindings 추가 |
| `src/os/defineApp.ts` | define.context(), define.command() 확장 |
| `src/os/defineApp.ts` | createTrigger() 추가 |
| `src/os/keymaps/` | 앱 커스텀 keybindings 등록·해제 로직 |
| `src/apps/todo/app-v3.ts` | keybindings 선언 추가 |
| `src/apps/todo/features/todoKeys.ts` | 삭제 |
| `src/apps/todo/features/commands/clipboard.ts` | 삭제 |
| `src/apps/todo/tests/` | 테스트 마이그레이션 |

## 리스크

| 리스크 | 완화 |
|--------|------|
| 기존 키바인딩 회귀 | TDD — 현재 동작하는 키 조합 목록을 테스트로 먼저 작성 |
| define.command API 변경 | 하위 호환 — 기존 시그니처(name, deps, handler)도 유지 |
| 다른 앱에도 todoKeys 같은 파일이 있을 수 있음 | Todo만 우선 처리, 패턴 확립 후 확산 |
