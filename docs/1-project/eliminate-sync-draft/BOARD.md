# BOARD — eliminate-sync-draft

## 🔴 Now
- [ ] Phase 1: 영향 범위 분석 — draft/editDraft 읽는 곳 전수 조사
  - [ ] Step 2: /discussion — FIELD_COMMIT이 이미 해결하는 것과 syncDraft가 하는 것의 경계
  - [ ] Step 3: /prd — 요구사항 정의 (ListView value prop 대체 방안)
  - [ ] Step 4: /redteam — 제거 시 깨지는 시나리오 검증

## ⏳ Done

## 💡 Ideas
- onChange 콜백 자체를 optional로 만들고, Field가 onChange 없이도 동작하도록
- Builder 앱에서도 동일 패턴 예방
