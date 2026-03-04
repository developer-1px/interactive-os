# Plan: os-react/widgets 정화

> Discussion 결론: os-react는 OS 프리미티브만 포함. 개밥먹기 위젯은 소비자(src/) 옆에 배치.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `os-react/widgets/radix/Modal.tsx` (84줄) | os-react에 존재, 0 소비자 | 삭제 | 🟢 Clear | — | tsc 0, build OK | 없음 |
| 2 | `os-react/widgets/Kbd.tsx` (46줄) | os-react에 존재, 소비자 2곳 (CommandPalette, QuickPick) | 삭제. CommandPalette → `@inspector/shell/components/Kbd` import 변경 | 🟢 Clear | →#3 (QuickPick 이동 후 내부 import도 변경) | tsc 0 | CommandPalette, QuickPick import 경로 |
| 3 | `os-react/widgets/quickpick/QuickPick.tsx` (520줄) | `@os-react/6-project/widgets/quickpick/QuickPick.tsx` | `src/command-palette/QuickPick.tsx`로 이동 | 🟢 Clear | →#2 | tsc 0 | CommandPalette import 경로 변경, OCP test 경로 변경 |
| 4 | `os-react/widgets/toast/ToastContainer.tsx` (120줄) | `@os-react/6-project/widgets/toast/ToastContainer.tsx` | `src/widgets/ToastContainer.tsx`로 이동 | 🟢 Clear | — | tsc 0 | `__root.tsx` import 경로 변경 |
| 5 | `src/command-palette/CommandPalette.tsx:15` | `import { Kbd } from "@os-react/6-project/widgets/Kbd"` | `import { Kbd } from "@inspector/shell/components/Kbd"` | 🟢 Clear | →#2 | tsc 0 | — |
| 6 | `src/command-palette/CommandPalette.tsx:20` | `from "@os-react/6-project/widgets/quickpick/QuickPick"` | `from "./QuickPick"` (로컬 import) | 🟢 Clear | →#3 | tsc 0 | — |
| 7 | `src/routes/__root.tsx:4` | `from "@os-react/6-project/widgets/toast/ToastContainer"` | `from "@/widgets/ToastContainer"` | 🟢 Clear | →#4 | tsc 0 | — |
| 8 | `tests/script/devtool/ocp-violations.test.ts:86` | 경로 `"packages/os-react/src/6-project/widgets/quickpick/QuickPick.tsx"` | `"src/command-palette/QuickPick.tsx"` | 🟢 Clear | →#3 | test PASS | — |

## MECE 점검

1. **CE**: 8행 실행하면 os-react/widgets/에 Dialog만 남음 ✅
2. **ME**: 중복 없음 ✅
3. **No-op**: Before=After 없음 ✅

## 라우팅

승인 후 → `/go` (기존 프로젝트 `os-restructure`) — Meta 성격, 파일 이동+삭제+import 수정
