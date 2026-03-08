# Plan: no-restricted-imports — @os-core 경계 강제

> Discussion Claim: `no-restricted-imports`로 `@os-core` import를 src/apps·pages에서 ERROR로 차단하면 가장 큰 pit-of-success 구멍이 닫힌다.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `eslint.config.js`: `src/apps/`, `src/pages/` 섹션 | `@os-core/*` import 제한 없음 | `no-restricted-imports` ERROR: `@os-core/*` 패턴 차단. `src/inspector/` 제외 | Clear | — | `npx eslint src/pages/ src/apps/ --max-warnings=0` exit 0 | 기존 lint config 깨짐 |
| 2 | `src/pages/layer-showcase/patterns/AlertDialogPattern.tsx:11` | `import { OS_OVERLAY_OPEN } from "@os-core/4-command/overlay/overlay"` | `import { OS_OVERLAY_OPEN } from "@os-sdk/os"` | Clear | →#1 | tsc 0 | — |
| 3 | `src/pages/layer-showcase/patterns/DialogPattern.tsx:13` | 동일 @os-core import | `import { OS_OVERLAY_OPEN } from "@os-sdk/os"` | Clear | →#1 | tsc 0 | — |
| 4 | `src/pages/layer-showcase/patterns/ListboxDropdownPattern.tsx:11` | 동일 | 동일 | Clear | →#1 | tsc 0 | — |
| 5 | `src/pages/layer-showcase/patterns/MenuPattern.tsx:11` | 동일 | 동일 | Clear | →#1 | tsc 0 | — |
| 6 | `src/pages/layer-showcase/patterns/NestedPattern.tsx:12` | 동일 | 동일 | Clear | →#1 | tsc 0 | — |
| 7 | `src/pages/layer-showcase/patterns/PopoverPattern.tsx:11` | 동일 | 동일 | Clear | →#1 | tsc 0 | — |
| 8 | `src/pages/os-test-suite/patterns/OverlayPattern.tsx:15` | 동일 | 동일 | Clear | →#1 | tsc 0 | — |
| 9 | `.agent/rules.md:89` | `<Zone>, <Item>, <Field>, <Trigger>` | `<Zone>, <Item>, <Field>` — Trigger 제거 | Clear | — | 문서 정합성 | — |

## MECE 점검

1. CE: #1(lint rule) + #2-8(위반 수정) + #9(stale doc) = 목표 달성 ✓
2. ME: 중복 없음 ✓
3. No-op: 없음 ✓

## 라우팅

승인 후 → `/go` (기존 프로젝트 `lint-zero`) — T6: no-restricted-imports 경계 강제
