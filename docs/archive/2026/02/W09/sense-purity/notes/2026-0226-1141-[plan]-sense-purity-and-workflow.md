# Plan: Sense 순수화 + 워크플로우 파이프라인 확정

## Goal

Discussion Claim: sense 함수가 DOM 타입 대신 순수 interface를 받도록 변환하고,
/discussion → /plan → /go 파이프라인을 확정한다.

## 변환 명세표

### Part A: 워크플로우 갱신

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| A1 | `discussion.md`: Gate 테이블 | Clear → `/plan` → `/go` | Clear → `/plan`. 갈래 언급 제거 | Clear | — | 문서 리뷰 | — |
| A2 | `discussion.md`: 6갈래 라우팅 | /discussion에 위치 | 삭제 (갈래는 /plan exit) | Clear | — | 문서 리뷰 | — |
| A3 | `plan.md`: Step 5 | "승인 → `/go`" | 승인 후 6갈래 라우팅 | Clear | →A2 | 문서 리뷰 | — |
| A4 | `plan.md`: 트리거 | "/inbox 분석 완료 후" 포함 | Clear에서만 진입 | Clear | — | 문서 리뷰 | — |

### Part B: Sense 순수화

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| B1 | `senseMouse.ts`: `handleSelectModeClick` | senseMouse.ts (Controller) | 삭제. PointerListener에 인라인 | Clear | — | tsc 0, 58 tests | — |
| B2 | `senseMouse.ts`: `seedCaretFromPoint` | senseMouse.ts (Side Effect) | PointerListener.tsx로 이동 | Clear | — | tsc 0, 58 tests | — |
| B3 | `senseMouse.ts`: `senseMouseDown` | `(HTMLElement, Event) → MouseInput` | `(MouseDownSense) → MouseInput` 순수함수 | Clear | →B1,B2 | +5 tests, 58 유지 | PointerListener 수정 |
| B4 | `senseMouse.ts`: `senseClick` + `ClickSense` | `(HTMLElement) → ClickSense` + handleSelectModeClick 가공 | 삭제. PointerListener에서 `ClickInput` 직접 조립 | Clear | →B1,B3 | tsc 0, 58 tests | — |
| B5 | `senseMouse.ts`: `getDropPosition` | `(Event, HTMLElement) → Drop` | `(DropSenseInput) → Drop` 순수함수 | Clear | — | +3 tests, 58 유지 | rect 정합성 |
| B6 | `MouseListener.tsx` | 310줄 (dead code) | 삭제 | Clear | →B3 | tsc 0, build OK | import 확인 |

## MECE 점검

- CE: A1~A4 → 워크플로우 파이프라인 확정 ✅ / B1~B6 → sense 순수화 완성 ✅
- ME: 중복 없음 ✅
- No-op: 없음 ✅

**전행 Clear ✅ — 승인 대기**

## 라우팅

승인 후 → `/go` (기존 프로젝트 sense-purity에 태스크 실행)
