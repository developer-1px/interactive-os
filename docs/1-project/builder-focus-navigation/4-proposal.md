# Proposal: Builder Focus Navigation Restoration

## 1. 구현 방향 (Implementation Direction)
분석 결과 식별된 3가지 "단절 지점"을 순차적으로 연결하여 기능을 복원한다. 기존 파이프라인(`FocusListener` → `Command` → `Zone` → `Dom`)은 유효하므로, 연결 고리(Context, State Subscription)만 복구하면 된다.

## 2. 변경 범위 (Changes)

### [Critical] Context Provider 주입 (Step 1)
- **대상**: `src/os-new/2-contexts/index.ts` 또는 `Zone` 컴포넌트 내부.
- **내용**: `NAVIGATE` 커맨드가 의존하는 `DOM_ITEMS`, `DOM_RECTS`, `ZONE_CONFIG`가 Zone 마운트 시점에 올바르게 주입되도록 수정한다. Zone 내부에서 아이템을 등록(register)할 때 이 Context들이 갱신되는지 확인한다.

### [Major] BuilderPage 선택 상태 연동 (Step 2)
- **대상**: `src/pages/BuilderPage.tsx`.
- **내용**:
    - `useState<PropertyType>("text")` 제거.
    - 하드코딩된 투명 클릭 영역(`<div onClick=...>`) 제거.
    - `kernel.useComputed`를 사용하여 `os.focus.zones["builder-canvas"].focusedItemId`를 구독.
    - 선택된 Item ID를 기반으로 `selectedType`을 도출 (Item의 `data-level` 속성 등 활용).

### [Minor] 선택 시각화 스타일링 (Step 3)
- **대상**: `src/pages/builder/*.tsx` (블록 컴포넌트들).
- **내용**: `[data-focused="true"]` CSS 속성 셀렉터가 정상 작동하는지 확인하고, 필요 시 스타일 보정.

## 3. 리스크 (Risks)
- **Context 갱신 타이밍**: React Render Cycle과 Zone Item 등록 타이밍 간의 불일치로 초기 네비게이션이 실패할 가능성. (`useEffect` 의존성 점검 필요).
- **E2E 테스트 깨짐**: 기존 테스트가 과거 구현(FocusDebugOverlay 등)에 의존했다면 수정이 필요할 수 있음.

## 4. 대안 (Alternatives)
- **Context Provider 위치**: Zone 내부가 아니라 상위 `BuilderCanvas` 레벨에서 관리할 수도 있으나, Zone별 격리가 필요하므로 Zone 레벨 주입이 적절함.
