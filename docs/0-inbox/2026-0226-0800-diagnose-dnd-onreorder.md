# 🔍 삽질 일지: DnD onReorder — BuilderApp.dispatch is not a function

> 날짜: 2026-02-26
> 실행 명령: 브라우저 Inspector + console.log 디버깅
> 결과: 1건 수정 (OS_DRAG_END → onReorder 호출 경로)

## 증상
사이드바에서 블록 드래그 시:
- `OS_DRAG_START` ✅ 발화
- `OS_DRAG_OVER` ✅ 반복 발화 (시각 피드백 동작)
- `OS_DRAG_END` ❌ Inspector에 안 잡힘 — 드롭 후 순서 변경 없음

## 즉시 수정한 것들
1. `SectionSidebar.tsx`: `data-drag-handle` 누락 → 추가
2. `NCPFeatureCardsBlock.tsx`, `NCPRelatedServicesBlock.tsx`: `<p>` → `<div>` (HTML nesting 경고)
3. `DragListener.tsx`: `e.preventDefault()` 추가 (pointerup 보장)

## 삽질 과정

### 1차: data-drag-handle 누락
- DragListener를 읽어보니 `[data-drag-handle]` 속성이 있어야 드래그 시작
- 사이드바 아이템에 이 속성이 없었음 → 추가
- **결과**: OS_DRAG_START는 발화하게 됨, 하지만 드롭 후 변화 없음

### 2차: reorderBlocks 재귀 미지원
- `ge-footer`를 `ge-section-footer` 위로 드래그 → 같은 배열인지 의심
- reorderBlocks가 top-level만 검색한다고 판단 → 재귀적으로 수정
- **결과**: 나중에 확인하니 둘 다 실제론 top-level이었음. 재귀 수정은 맞지만 이게 원인은 아님

### 3차: pointerup 미발화 의심
- Inspector 로그에 OS_DRAG_END가 한 번도 안 나옴
- `e.preventDefault()` 추가 → 여전히 안 됨
- console.log 디버깅 추가
- **결과**: `pointerup { hasDrag: true, started: true }` → pointerup은 잘 발화됨!

### 4차: **근본 원인 발견**
```
Uncaught TypeError: BuilderApp.dispatch is not a function
    at Object.onReorder (app.ts:182:16)
```
- `onReorder` 콜백에서 `BuilderApp.dispatch(reorderBlockCommand(info))` 호출
- `BuilderApp`(AppSlice)에는 `dispatch` 메소드가 없음 → `os.dispatch` 사용해야 함
- 그런데 더 근본적 문제: `onReorder`만 `void` 콜백으로 설계되어 앱이 직접 dispatch해야 하는 **명령형** 패턴
- 다른 콜백(`onAction`, `onDelete` 등)은 커맨드를 **리턴**하면 OS가 dispatch하는 **선언형** 패턴

## 원인 추정 — 5 Whys

1. 왜 드롭 후 순서가 안 바뀌나? → `OS_DRAG_END` handler에서 `onReorder` 호출 중 에러 발생
2. 왜 에러? → `BuilderApp.dispatch is not a function`
3. 왜 잘못된 API? → `/bind` 단계에서 LLM이 `BuilderApp.dispatch`로 코드 생성
4. 왜 LLM이 틀렸나? → `onReorder`가 `void` 콜백이라 앱이 직접 dispatch해야 하는 패턴 → LLM이 dispatch 방법을 추측
5. 왜 void 콜백이었나? → OS DnD 시스템 초기 설계 시 다른 콜백(onAction 등)의 선언형 패턴을 따르지 않음

→ **근본 원인**: `onReorder` 시그니처가 OS 콜백 계약(선언형: 커맨드 리턴)을 위반하고 있었음
→ **확신도**: 높음

## 수정 내역

| 파일 | 변경 |
|------|------|
| `zoneRegistry.ts` | `onReorder` 리턴 타입 `void` → `BaseCommand \| BaseCommand[]` |
| `FocusGroup.tsx` | props + buildZoneEntry params 시그니처 동일하게 변경 |
| `OS_DRAG_END` (drag/index.ts) | 리턴된 커맨드를 `os.dispatch`로 처리 |
| `app.ts` | `os.dispatch(reorderBlockCommand(info))` → `reorderBlockCommand(info)` (커맨드 리턴) |

## 파이프라인 교훈

| 단계 | 놓친 것 |
|------|---------|
| `/bind` | `BuilderApp.dispatch` 존재 여부 미검증 |
| `/audit` | OS 콜백 패턴(선언형 vs 명령형) 불일치 미탐지 |
| 전체 | E2E smoke (실제 드래그→드롭→상태변경) 미검증 |
