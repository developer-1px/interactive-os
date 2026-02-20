# BOARD — builder-clipboard

## 🔴 Now
- [ ] T1: 카드 컬렉션 collectionZone 선언 — pricing 섹션의 children을 동적 컬렉션으로 (Complicated)
  - [x] Step 2: /discussion
  - [x] Step 3: /prd
  - [x] Step 4: /redteam + /divide
  - [x] Step 5: /tdd — pasteBubbling 순수함수 + 7 tests
  - [ ] Step 6: /solve
- [ ] T2: 탭 컬렉션 collectionZone 선언 — tab-container의 children (T1과 동일 패턴)
- [ ] T3: Paste Bubbling — F1(레지스트리) + F2(bubbling 루프) + F3(캔버스 통합)
- [ ] T4: 캔버스 onPaste 교체 — quick hack → bubbling 기반으로 교체

## ⏳ Done
- [x] A: accept 인터페이스 — 이미 존재 (config.accept)
- [x] B: 섹션 clipboard (사이드바) — 이미 동작 (collectionBindings)
- [x] C: 캔버스 섹션 clipboard — quick hack 커밋됨 (T4에서 교체 예정)

## 💡 Ideas
- createCollectionZone이 ZoneHandle도 받게 API 확장
- cross-app clipboard
- 붙여넣기 미리보기 (ghost preview)
- 정적 아이템 값 교체
