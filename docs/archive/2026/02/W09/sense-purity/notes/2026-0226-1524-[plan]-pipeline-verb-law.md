# [plan] 파이프라인 동사 법 제정 + rename

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `rules.md:네이밍` | 파이프라인 동사 규칙 없음 | `sense → extract → resolve` 동사 법 추가 | Clear | — | 육안 | 없음 |
| 2 | `senseMouse.ts:resolveMouseDown` | `export function resolveMouseDown(...)` | `export function extractMouseInput(...)` | Clear | →#1 | tsc 0 | 소비자 2곳 |
| 3 | `senseMouse.ts:내부호출` | `return resolveMouseDown({...})` | `return extractMouseInput({...})` | Clear | →#2 | tsc 0 | 없음 |
| 4 | `senseMouse.ts:코멘트` | `→ resolveMouseDown` | `→ extractMouseInput` | Clear | →#2 | 육안 | 없음 |
| 5 | `senseMouseDown.test.ts` | `resolveMouseDown` 전체 | `extractMouseInput` 전체 | Clear | →#2 | 8 tests PASS | 없음 |
| 6 | `senseMouse.ts:resolveDropPosition` | `export function resolveDropPosition(...)` | `export function extractDropPosition(...)` | Clear | →#1 | tsc 0 | 소비자 2곳 |
| 7 | `senseMouse.ts:내부호출` | `return resolveDropPosition({...})` | `return extractDropPosition({...})` | Clear | →#6 | tsc 0 | 없음 |
| 8 | `senseMouse.ts:코멘트` | `DropSenseInput → Drop result` | `Extract: DropSenseInput → Drop result` | Clear | →#6 | 육안 | 없음 |
| 9 | `resolveDropPosition.test.ts` | `resolveDropPosition` 전체 | `extractDropPosition` 전체 | Clear | →#6 | 5 tests PASS | 없음 |
| 10 | `senseMouse.ts:섹션 코멘트` | `Pure Function:` 접두사 | `Extract:` 접두사 | Clear | →#2 | 육안 | 없음 |

## MECE

- CE: 10행 실행 → 목표 달성 ✅
- ME: 중복 없음 ✅
- No-op: 없음 ✅

**전행 Clear ✅ — 승인 대기**

## 라우팅

승인 후 → `/go` (기존 프로젝트 sense-purity) — 파이프라인 동사 법 제정(Meta) + 기계적 rename(Light)
