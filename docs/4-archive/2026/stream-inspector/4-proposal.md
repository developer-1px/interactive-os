# Inspector 통합 — 기술 제안서

## 구현 방향

### 핵심 아이디어
`UnifiedInspector.tsx`의 이벤트 목록(Trace Log) 하단에 **접이식(collapsible) Store State 패널**을 추가한다.
기존 `RawDataToggle` 컴포넌트와 동일한 패턴으로, 토글 버튼 클릭 시 전체 Store JSON을 펼쳐 보여준다.

### 변경 범위

#### 1. `UnifiedInspector.tsx` — Store State 섹션 추가
- `InspectorAdapter`에서 `kernel.getState()`를 호출하여 전체 상태를 `storeState` prop으로 전달
- `UnifiedInspector` 컴포넌트 하단(line 179 영역, `flex-1 overflow-y-auto` div)에 접이식 섹션 추가
- 기존 `RawDataToggle` 패턴을 재활용하여 일관된 UI 유지

#### 2. `InspectorAdapter.tsx` — storeState prop 추가
- `kernel.getState()`로 전체 상태를 가져와 `UnifiedInspector`에 전달
- 기존 `transactions` prop과 함께 전달

#### 3. `CommandInspector.tsx` — STATE 탭 제거 및 정리
- STATE 탭의 인라인 렌더링(`EventStream` + `DataStateViewer`) 제거
- STATE case를 switch문에서 삭제
- `DataStateViewer`, `EventStream`, `StateMonitor`, `todoSlice` import 제거
- `InspectorActivityBar`에서 STATE 탭을 아이콘 목록에서 제거

#### 4. 파일 삭제
- `StateMonitor.tsx` — Focus/Zone 상태가 이미 Transaction Kernel 섹션에 포함됨
- `DataStateViewer.tsx` — Store JSON이 새 접이식 패널로 대체됨

### 리스크
- `todoSlice.getState()` 대신 `kernel.getState()` 전체를 보여주면 데이터가 매우 클 수 있음
  → 대안: root 키별 접이식으로 구현하거나, 초기에는 collapsed로 시작

### 대안
- 별도 탭 유지하되 통합 → 거부: 사용자 요청이 통합 방향
- `EventStream` 자체를 `UnifiedInspector`에 인라인 → 과잉: EventStream은 380줄, 별도 유지가 합리적
