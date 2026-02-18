# PRD: Test Structure Convention

## 배경

프로젝트에 테스트가 3개 레이어(Vitest Unit, TestBot, Playwright E2E)로 흩어져 있어 한눈에 파악이 불가능하다. "폴더구조=멘탈구조" 원칙에 따라, 물리적 파일 구조를 정비하고 이를 시각화하는 대시보드를 만든다.

## 목표

1. **모든 테스트를 `{slice}/tests/{unit,testbot,e2e}/` 구조로 통일**
2. **`/playground/tests` 라우트에 테스트 대시보드 구축** (프로젝트별 건강도 시각화)

## 범위

### In Scope
- 기존 테스트 파일 마이그레이션 (새 디렉토리 구조로 이동)
- Vitest/Playwright config 경로 업데이트
- import 경로 수정
- 테스트 대시보드 UI (정적 discovery + 프로젝트별 그룹화)

### Out of Scope
- 새 테스트 작성
- 테스트 실행 기능 (대시보드에서 run)
- TestBot 레이어 추가 (빈 폴더만 생성)

## 확장자 컨벤션
| 확장자 | 레이어 | 설명 |
|--------|--------|------|
| `*.test.ts` | Unit | Vitest (headless kernel) |
| `*.testbot.tsx` | TestBot | OS 내장 브라우저 테스트 |
| `*.spec.ts` | E2E | Playwright |

## 현재 상태 → 목표 상태

### 마이그레이션 대상

| 현재 위치 | 목표 위치 |
|-----------|----------|
| `src/apps/todo/tests/todo.test.ts` | `src/apps/todo/tests/unit/todo.test.ts` |
| `src/apps/todo/tests/todo.v3.test.ts` | `src/apps/todo/tests/unit/todo.v3.test.ts` |
| `src/apps/builder/tests/builder.test.ts` | `src/apps/builder/tests/unit/builder.test.ts` |
| `src/os/3-commands/os-commands.test.ts` | `src/os/3-commands/tests/unit/os-commands.test.ts` |
| `src/os/3-commands/utils/resolveFocusId.test.ts` | `src/os/3-commands/tests/unit/resolveFocusId.test.ts` |
| `src/os/2-contexts/zoneRegistry.test.ts` | `src/os/2-contexts/tests/unit/zoneRegistry.test.ts` |
| `src/os/keymaps/keybindings.test.ts` | `src/os/keymaps/tests/unit/keybindings.test.ts` |
| `src/command-palette/command-palette.test.ts` | `src/command-palette/tests/unit/command-palette.test.ts` |
| `src/command-palette/fuzzyMatch.test.ts` | `src/command-palette/tests/unit/fuzzyMatch.test.ts` |
| `src/docs-viewer/docs-scroll.test.ts` | `src/docs-viewer/tests/unit/docs-scroll.test.ts` |
| `src/inspector/panels/inferPipeline.test.ts` | `src/inspector/tests/unit/inferPipeline.test.ts` |
| `e2e/todo/todo.spec.ts` | `src/apps/todo/tests/e2e/todo.spec.ts` |
| `e2e/builder/builder-spatial.spec.ts` | `src/apps/builder/tests/e2e/builder-spatial.spec.ts` |
| `e2e/aria-showcase/*.spec.ts` | `src/pages/aria-showcase/tests/e2e/*.spec.ts` |
| `e2e/command-palette/*.spec.ts` | `src/command-palette/tests/e2e/command-palette.spec.ts` |
| `e2e/focus-showcase/*.spec.ts` | `src/pages/focus-showcase/tests/e2e/focus-showcase.spec.ts` |
| `e2e/playground/*.spec.ts` | `src/pages/playground/tests/e2e/dialog.spec.ts` |
| `e2e/smoke.spec.ts` | `src/tests/e2e/smoke.spec.ts` (전역) |

## 기술 제약
- Vitest config의 `include` 패턴 변경 필요
- Playwright config의 `testDir` 변경 필요
- 기존 import 경로 깨짐 가능성
