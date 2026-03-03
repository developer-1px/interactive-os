# os-restructure — Phase 2: tsx 로직 추출

## Context

tsx를 최대한 얇은 bypass 통로로 만든다. Zone.tsx/Item.tsx가 모범 사례.
규모: **Meta** (파일 이동 + 함수 추출, 새 기능 없음)

## Now
- [ ] #1: 5-effect → os-core 이동 (역의존 해소)
- [ ] #2: 1-listen/*.ts 순수 7파일 → os-core 이동
- [ ] #3: KeyboardListener.tsx — senseKeyboard() 추출
- [ ] #4: PointerListener.tsx — 핸들러 로직 추출
- [ ] #5: ClipboardListener.tsx — sense 로직 추출
- [ ] #6-8: Field/QuickPick 유틸 함수 분리

## Done
(Phase 1 완료: T1~T8, 패키지 물리 분리)
