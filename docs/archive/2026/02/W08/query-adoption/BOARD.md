# BOARD — query-adoption

## 🔴 Now
(없음 — T1 통합으로 실질 목표 달성)

## ⏳ Done
- [x] T1: findItemElement 통합 — `338ce29`
  - 3개 구현 → 1개 공유 유틸 (itemQueries.ts)
  - 4-effects: 30줄 중복 제거
  - BuilderCursor: findItemInZone 중복 제거
- [x] T2: BuilderCursor 재평가 — DOM API 7→4 달성
  - 나머지(getBoundingClientRect, ResizeObserver 등)는 기하학/렌더링 영역 → 정당
- [x] T3: 4-effects focus/scroll — findItemElement 통합으로 해결
(없음)

## 💡 Ideas
- Field.tsx의 `getElementById` 1건도 정리 가능
