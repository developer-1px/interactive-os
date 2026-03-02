# /doubt 결과 (1라운드 수렴)

## 라운드 요약
| Round | 🔴 제거 | 🟡 축소 | ↩️ 자기교정 | 수렴? |
|:-----:|:------:|:------:|:---------:|:----:|
| 1     | 1      | 1      | 발생      | Y    |

## 🔴 제거 (총 1건)
- `HighlightOverlay.tsx` 및 `INSPECTOR_SET_HIGHLIGHT` 커맨드, `highlightedNodeId` 상태: (round 1)
  - **이유 (과잉처리 - Overprocessing)**: 마우스 호버 시 대상 엘리먼트를 시각적으로 강조하는 기능(Transient Visual Effect)을 구현하기 위해 React 상태(`highlightedNodeId`), OS 커맨드, 전용 투영 컴포넌트(`HighlightOverlay`), 그리고 `scroll`/`resize` 전역 이벤트 리스너까지 동원했다.
  - **Chesterton's Fence**: "DOM 직접 조작을 없애고 선언적 투영을 지향한다"는 T4의 설계 목적(spec) 때문에 도입했으나, 순수 시각 레이아웃 효과를 위해 브라우저의 네이티브 렌더링(`data-*` 속성 + CSS)이 제공하는 성능(zero-lag 스크롤 추적)과 단순함을 포기하고 무거운 렌더링 사이클을 태우는 것은 명백한 구조적 낭비다. 일시적 시각 효과는 DOM 속성 조작으로 처리하는 것이 옳다.

## 🟡 축소/병합 (총 1건)
- `UnifiedInspector.tsx` 하이라이트 로직: (round 1)
  - **변경 내용**: `os.dispatch(INSPECTOR_SET_HIGHLIGHT)` 대신, 가벼운 유틸리티 함수 `highlightElement(id, active)`로 복귀하여 대상 요소의 `dataset`과 `style`만 직접 토글하도록 축소.

## 🟢 유지 (3건)
- `InspectorScrollUI.Zone` & `Trigger`: (round 1)
  - **존재 이유**: `onActivate` 제스처를 선언형으로 OS에 위임하는 핵심 패턴.
- `isUserScrolled` & `scrollTick` (App State): (round 1)
  - **존재 이유**: 스크롤 자동화 상태를 View 라이프사이클 밖에서 통제하기 위한 필수 브릿지.
- `selectFilteredTransactions` (Selector 분리): (round 1)
  - **존재 이유**: 렌더링 최적화를 위해 파생 데이터 연산을 View 외부로 분리한 T2의 성과로 유효함.

## 📊 Before → After (누적)
- 항목 수: 3 (커맨드, 상태, 전용 투영기) → 0 (−3)
