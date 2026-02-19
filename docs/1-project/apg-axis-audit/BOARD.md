# BOARD — APG Axis Audit

## 🔴 Now
- [ ] T3: 갭 분석 — 현재 구현 vs 발견된 축 비교, 빠진/잘못된 기본값 식별
  - [x] 매트릭스 작성 완료 (apg-axis-matrix.md)
  - [ ] resolveRole() 코드와 매트릭스 대조
- [ ] T4: 테스트 인코딩 — 각 축의 APG 요구사항을 unit test로 작성
- [ ] T5: 수정 — 테스트 실패 부분 구현 (tab.recovery, select.followsFocus 등)
- [ ] T6: /verify — tsc + unit + smoke

## ⏳ Done
- [x] T1: APG 패턴 전수조사 — 9개 축 발견 (apg-axis-matrix.md)
- [x] T2: 축 발견 + 문서화 — tabRecovery, selFollowsFocus, orientation, wrap, selectMode, tabBehavior, activate, dismiss, expand

## 💡 Ideas
- data-anchor의 retained focus에 대한 재검토 — APG 기준으로는 selection이 맞을 수 있음
- focus indicator vs selection indicator CSS 정책 수립
- resolveRole()이 새 축의 기본값을 자동 파생하도록 확장
