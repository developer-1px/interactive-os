# Inspector 통합 — PRD

## 배경

현재 Inspector는 여러 개의 분리된 패널로 구성되어 있다:
- **STATE 탭**: `EventStream` (트랜잭션 로그) + `DataStateViewer` (앱 데이터 JSON)
- **REGISTRY 탭**: `StateMonitor` (Focus/Zone 컨텍스트) + `KeyMonitor` + `RegistryMonitor`
- **UNIFIED 탭** (Vision): `UnifiedInspector` (Pipeline 기반 Trace Log)
- **SETTINGS 탭**: `OSStateViewer` (커널 OS 상태)

`EventStream`과 `DataStateViewer`가 STATE 탭에 고정 분할(fixed-height split)로 되어 있어 상황에 따라 한쪽만 더 보고 싶을 때 불편하다.

## 목표

1. `UnifiedInspector` 하위에 **Event Stream**과 **Store State**를 **접을 수 있는(collapsible) 섹션**으로 통합
2. 구 `StateMonitor` 패널 제거 (Focus/Zone 정보는 이미 Kernel 섹션에 포함)
3. 구 `DataStateViewer` 패널 제거 (Store 상태는 새로운 접이식 섹션에서 제공)
4. `CommandInspector`에서 불필요해진 `STATE` 탭 코드 정리

## 범위

### In-Scope
- `UnifiedInspector.tsx`에 접이식 Store State 패널 추가
- `CommandInspector.tsx`에서 STATE 탭의 `EventStream`+`DataStateViewer` 인라인 로직 제거
- `StateMonitor.tsx` 파일 삭제
- `DataStateViewer.tsx` 파일 삭제
- 관련 import/참조 정리

### Out-of-Scope
- Time Travel Debugging, Correlation ID 등 고급 기능
- EventStream 자체의 기능 변경
- REGISTRY 탭의 `KeyMonitor`/`RegistryMonitor` 변경
- TestBot, Element 패널 등 다른 탭

## 사용자 시나리오

1. Inspector를 열고 Vision(UNIFIED) 탭을 선택한다
2. Trace Log(이벤트 스트림)가 기본 표시된다
3. 하단의 "Store State" 토글을 클릭하면 전체 Store JSON이 접이식으로 펼쳐진다
4. 두 영역 모두 독립적으로 스크롤 가능
5. 구 STATE 탭은 UNIFIED 탭으로 역할이 통합되므로 제거됨

## 기술 제약
- `kernel.getState()`로 전체 커널 상태 조회 가능
- `todoSlice.getState()`로 앱 상태 조회 가능
- 기존 `UnifiedInspector`는 `Transaction[]` props만 받으므로, 상태 조회는 컴포넌트 내부에서 직접 수행
