# 1-listen 파이프라인 전수 구조 분석

| 원문 | 1-listener의 파이프라인의 개념을 MECE하게 표로 만들어줘 |
|------|-------|
| 내(AI)가 추정한 의도 | **경위**: sense-purity 프로젝트에서 senseMouse 이름/구조 일관성 논의 중 발생. **표면**: 전체 파이프라인을 표로 정리. **의도**: 이름·구조 비대칭을 전수 식별하여, 아키텍처 부채와 정당한 비대칭을 구분 |
| 날짜 | 2026-02-26 |
| 상태 | 분석 완료 |

## 1. 개요

1-listen는 W3C UI Events 스펙 기준으로 폴더링된 DOM 어댑터 계층이다.
모든 리스너는 **Sense → Resolve → Dispatch** 3단 파이프라인을 따른다:
- **Sense**: DOM 이벤트에서 순수 데이터 객체를 추출 (어댑터)
- **Resolve**: 순수 데이터 → 커맨드 결정 (순수 함수, 테스트 가능)
- **Dispatch**: 커맨드를 커널에 전달 (부수 효과)

## 2. MECE 파이프라인 표

### 2.1 Listener × 파이프라인 단계

| W3C Module | Listener 파일 | Sense | Resolve | 비고 |
|------------|---------------|-------|---------|------|
| **Pointer Events** | `pointer/PointerListener.tsx` | 인라인 (`senseMouse.ts` import) | `pointer/resolvePointer.ts` | Gesture FSM (IDLE→PENDING→CLICK/DRAG) |
| **Mouse Events** | (PointerListener가 대행) | `shared/senseMouse.ts` → `resolveMouseDown()` | `mouse/resolveMouse.ts` | mousedown 시맨틱 (focus+select) |
| **Mouse Events** (click) | (PointerListener가 대행) | PointerListener 인라인 | `mouse/resolveClick.ts` | click 시맨틱 (activate) |
| **Mouse Events** (drag) | (PointerListener가 대행) | `shared/senseMouse.ts` → `resolveDropPosition()` | — (직접 dispatch) | drop position 계산 |
| **Keyboard Events** | `keyboard/KeyboardListener.tsx` | `senseKeyboard()` (인라인) | `keyboard/resolveKeyboard.ts` | ZIFT Responder Chain |
| **Focus Events** | `focus/FocusListener.tsx` | `senseFocusIn()` (인라인) | — (직접 dispatch) | OS_SYNC_FOCUS |
| **Clipboard Events** | `clipboard/ClipboardListener.tsx` | 인라인 | `clipboard/resolveClipboard.ts` | copy/cut/paste |
| **Input Events** | `input/InputListener.tsx` | 인라인 | — (직접 dispatch) | IME composition |
| **(legacy)** | ~~`drag/DragListener.tsx`~~ | — | — | PointerListener로 대체 |

### 2.2 Sense 함수 × 순수 분리 현황

| Sense 함수 | 위치 | 순수 interface | 순수 함수 | DOM 어댑터 | 테스트 |
|------------|------|---------------|----------|-----------|--------|
| `senseMouseDown` | `shared/senseMouse.ts` | `MouseDownSense` ✅ | `resolveMouseDown()` ✅ | `senseMouseDown()` ✅ | 8 tests ✅ |
| `getDropPosition` | `shared/senseMouse.ts` | `DropSenseInput` ✅ | `resolveDropPosition()` ✅ | `getDropPosition()` ✅ | 5 tests ✅ |
| `senseKeyboard` | `keyboard/KeyboardListener.tsx` | `KeyboardInput` ✅ | `resolveKeyboard()` ✅ | `senseKeyboard()` (인라인) | ⚠️ sense 자체 미분리 |
| `senseFocusIn` | `focus/FocusListener.tsx` | — ❌ | — ❌ | `senseFocusIn()` (인라인) | ❌ |
| `senseClipboard` | `clipboard/ClipboardListener.tsx` | `ClipboardInput` ✅ | `resolveClipboard()` ✅ | 인라인 | ⚠️ sense 함수 미추출 |

### 2.3 Resolve 함수 × Input 타입

| Resolve 함수 | Input 타입 | Output | 순수 | 테스트 |
|-------------|-----------|--------|------|--------|
| `resolveMouseDown` | `MouseDownSense` | `MouseInput \| null` | ✅ | 8 tests |
| `resolveMouse` | `MouseInput` | `ResolveResult` | ✅ | 20 tests |
| `resolveClick` | `ClickInput` | `ResolveResult` | ✅ | 12 tests |
| `resolvePointerDown` | `PointerInput` | `GestureState` | ✅ | 6 tests |
| `resolvePointerMove` | `PointerMoveInput` | `GestureState` | ✅ | (included above) |
| `resolvePointerUp` | `GestureState` | `GestureResult` | ✅ | (included above) |
| `resolveDropPosition` | `DropSenseInput` | `Drop \| null` | ✅ | 5 tests |
| `resolveKeyboard` | `KeyboardInput` | `ResolveResult` | ✅ | 14 tests |
| `resolveClipboard` | `ClipboardInput` | `ClipboardResult` | ✅ | — |

### 2.4 이름 비대칭 분석

| 비대칭 | 현재 | 대칭적 대안 | 판정 |
|--------|------|-----------|------|
| 파일명: `senseMouse.ts` (Mouse) ↔ 소비자: `PointerListener` | `shared/senseMouse.ts` | `shared/sensePointer.ts` | **정당** — sense 대상이 Mouse 시맨틱 (mousedown/click). Pointer는 전달 메커니즘 |
| Keyboard: `senseKeyboard()` 인라인 ↔ Mouse: `senseMouseDown()` 별도 파일 | Keyboard는 Listener에 인라인 | `shared/senseKeyboard.ts` 분리 | **정당한 비대칭** — Keyboard sense는 DOM 탐색이 적음 (ROI 낮음) |
| Focus: `senseFocusIn()` 인라인, resolve 없음 | 직접 dispatch | `resolveFocus.ts` 분리 | **개선 가능** — 하지만 분기가 2줄뿐 (ROI 매우 낮음) |
| `resolveMouseDown` ↔ `resolveMouse` 이름 혼동 | 별도 함수 | `resolveMouseDown` → `extractMouseInput` | **개선 가능** — 역할이 다름 (sense→input 변환 vs input→command 변환) |

## 3. 결론 / 제안

1. **현재 비대칭의 대부분은 정당하다.** DOM 탐색 복잡도에 비례하여 sense를 분리한 것은 실용적.
2. **`resolveMouseDown` 이름은 혼동 가능.** `resolveMouse`(input→command)와 역할이 다르므로 `extractMouseInput` 또는 유지하되 문서에 역할 차이를 명시.
3. **legacy `drag/DragListener.tsx`는 삭제 대상.** PointerListener에 흡수 완료.

## 4. Cynefin 판정

🟢 **Clear** — 구조가 이미 확립, 비대칭의 정당성도 분석 완료. 이름 변경은 선택.

## 5. 인식 한계

- 이 분석은 정적 분석에 기반. `DragListener.tsx`의 런타임 사용 여부는 import 검색으로만 확인.
- 테스트 커버리지 수치는 `vitest run` 결과에서 추출했으나, 커버리지 %는 측정하지 않음.

## 6. 열린 질문

1. `resolveMouseDown`을 `extractMouseInput`으로 rename할 것인가? (혼동 방지 vs 변경 비용)
2. `drag/DragListener.tsx`를 지금 삭제할 것인가?

> **3줄 요약**
> 1-listen는 6개 W3C 모듈 기준으로 Sense→Resolve→Dispatch 파이프라인을 따른다.
> sense 분리 수준은 DOM 탐색 복잡도에 비례하며, Mouse(분리 완료), Keyboard(인라인/정당), Focus/Clipboard(인라인/ROI 낮음)로 나뉜다.
> `senseMouse.ts`의 이름은 Mouse 시맨틱을 감지하므로 정당하며, `resolveMouseDown`↔`resolveMouse` 이름 혼동이 유일한 개선 후보다.
