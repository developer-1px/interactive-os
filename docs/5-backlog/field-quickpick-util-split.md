# Field/QuickPick 유틸 함수 분리

> 원래 os-restructure #6-8. Phase 2(tsx 로직 추출)의 잔여.
> 긴급하지 않아 backlog로 이관.

## 목표

Field.tsx, QuickPick 관련 유틸 로직을 tsx에서 분리하여 os-core로 이동.
tsx를 최대한 얇은 bypass 통로로 만든다 (Zone.tsx/Item.tsx가 모범 사례).
