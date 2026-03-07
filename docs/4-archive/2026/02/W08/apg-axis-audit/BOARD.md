# BOARD — APG Axis Audit

## 🔴 Now
(empty — all tasks done)

## ⏳ Done
- [x] T1: APG 패턴 전수조사 — 9개 축 발견 (apg-axis-matrix.md)
- [x] T2: 축 발견 + 문서화 — tabRecovery, selFollowsFocus, orientation, wrap, selectMode, tabBehavior, activate, dismiss, expand
- [x] T3: 갭 분석 — resolveTabEscapeZone이 navigate.entry를 무시하는 버그 발견
- [x] T4: 테스트 인코딩 — APG Tab Recovery 6개 테스트 추가 (unit/tab.test.ts)
- [x] T5: 수정 — ZoneOrderEntry 확장, resolveTabEscapeZone entry 분기 구현
- [x] T6: /verify — tsc ✅ + 673 tests pass ✅

## 💡 Ideas
- data-anchor의 retained focus에 대한 재검토 — APG 기준으로는 selection이 맞을 수 있음
- focus indicator vs selection indicator CSS 정책 수립
- resolveRole()이 새 축의 기본값을 자동 파생하도록 확장
