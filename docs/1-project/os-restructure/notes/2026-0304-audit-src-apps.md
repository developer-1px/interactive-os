# Audit Report: src/apps/

## 위반 목록

| # | 파일:줄 | 위반 패턴 | 코드 스니펫 | 분류 |
|---|---------|----------|------------|------|
| 1 | `src/apps/todo/app.ts:268` | `os.dispatch` 직접 호출 | `os.dispatch(reorderTodo(info));` | 🟡 OS 갭 (OG-002) |
| 2 | `src/apps/todo/widgets/TaskItem.tsx:84` | `data-drag-handle` 수동 부착 | `data-drag-handle` | 🟡 OS 갭 (OG-004) |
| 3 | `src/apps/builder/app.ts:425` | `onClick` 설정 관련? (순수 설정 데이터) | `activate: { onClick: true, reClickOnly: true },` | ⚪ 정당한 예외 |
| 4 | `src/apps/builder/app.ts:517` | `onChange` 주석 | `* Used by PropertiesPanel's imperative onChange handlers.` | ⚪ 정당한 예외 (주석) |
| 5 | `src/apps/builder/primitives/BuilderImage.tsx:5` | `onChange` 주석 | `* Supports src swap via onChangeSrc callback.` | ⚪ 정당한 예외 (주석) |
| 6 | `src/apps/builder/primitives/BuilderImage.tsx:28` | `onChangeSrc` 타입 | `onChangeSrc?: (newSrc: string) => void;` | ⚪ 정당한 예외 (커스텀 Prop) |
| 7 | `src/apps/builder/primitives/BuilderImage.tsx:38` | `onChangeSrc` 구조 분해 할당 | `onChangeSrc,` | ⚪ 정당한 예외 (커스텀 Prop) |
| 8 | `src/apps/builder/primitives/BuilderTabs.tsx:13` | `useState`, `onClick` 주석 | `* No useState, no onClick — OS manages tab activation.` | ⚪ 정당한 예외 (주석) |
| 9 | `src/apps/builder/__tests__/unit/hierarchical-navigation.test.ts (여러 줄)` | `document.createElement`, `document.body` | test 파일 내 DOM 제어 | ⚪ 정당한 예외 (테스트) |
| 10 | `src/apps/builder/__tests__/unit/builder-interaction-spec.test.ts (여러 줄)` | `document.createElement`, `document.body` | test 파일 내 DOM 제어 | ⚪ 정당한 예외 (테스트) |
| 11 | `src/apps/builder/__tests__/unit/headless-smoke.test.ts (여러 줄)` | `os.dispatch` 직접 호출 | `cmds.forEach((c) => os.dispatch(c));` | ⚪ 정당한 예외 (테스트) |
| 12 | `src/apps/builder/hooks/useCursorMeta.ts:16` | `useEffect` import | `import { useEffect } from "react";` | 🟡 OS 갭 (OG-005) |
| 13 | `src/apps/builder/hooks/useCursorMeta.ts:20` | `useEffect` 호출 | `useEffect(() => {` | 🟡 OS 갭 (OG-005) |

## 분석

모든 위반 사항이 🟡 **OS 갭**(이미 알려짐)이거나 ⚪ **정당한 예외**(주석, 테스트, 순수 설정)로 밝혀졌습니다.

**0건 규칙**에 따라 아래 사항을 확인합니다.
1. 이번에 변경된 OS 프리미티브(`os-core/kernel.ts`)는 기존 계약(os instance)을 유지하되 React 바인딩만 `createReactBindings`로 병합하여 내보내는 역할만 수행했습니다.
2. 커맨드 호출 및 `os.getState/setState/subscribe` 등 모든 React 훅과 커널 상호작용 방식은 유지되었습니다.

결과적으로, 이번 OS 대규모 리팩토링 중 발생한 **새로운 🔴 LLM 실수 위반은 0건**입니다.
