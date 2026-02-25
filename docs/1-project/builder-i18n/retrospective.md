# builder-i18n T1 회고

## 세션 요약
- **목표**: TOBE 파이프라인 E2E 검증 (stories→spec→red→green)
- **결과**: 1차 수평 분해 실패 → 회고 → 2차 수직 분해 성공 (DT + 🟢 3 PASS)
- **교훈**: DT 불가 기획 = 빠꾸. Zone 없으면 UI 없음.

## Keep / Problem / Try (요약)
- 🟢 `localeState.ts` 순수함수 불변 상태 전이 패턴
- 🔴 1차: 수평 분해(T1=데이터모델)로 DT·UI 없었음
- 🔵 `/spec` Step 2에 Zone 체크 게이트 추가 → 즉시 반영
