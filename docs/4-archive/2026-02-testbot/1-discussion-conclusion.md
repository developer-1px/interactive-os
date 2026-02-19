# TestBot — Discussion Conclusion

## 핵심 논증

### Claim
TestBot은 "Playwright의 대체재"가 아니라 **"Playwright와 동일한 테스트를 시각적으로 시연하는 어댑터"**다.

### Evidence
1. **테스트 코드 한 벌로 두 곳에서 실행**: Playwright(터미널, 자동화) + TestBot(브라우저, 시각 검증)
2. **Shim parity 달성**: Todo E2E 12/12 PASS — Playwright와 동일 결과
3. **v1 탐험이 증명한 것**: Visual Verification이 핵심 가치, CDP 방향이 장기 목표

### Warrant
- 테스트 코드가 러너에 종속되면 유지보수 비용이 2배. API 정렬이 필수.
- LLM이 표준 Playwright API로 작성한 테스트를 그대로 사용할 수 있어야 AI 시대에 의미가 있다.
- 시각적 검증은 인간의 신뢰를 얻는 가장 직관적인 방법.

## 합의된 방향

1. **단기**: Shim 방식 강화 — 현재 구조에서 Playwright API 커버리지를 넓혀 더 많은 spec 실행
2. **장기**: CDP Remote Control — Node.js Playwright Runner가 브라우저를 직접 제어, TestBot은 시각화 레이어만 담당
3. **불변**: Visual Verification (커서, 버블, 스탬프)은 어떤 아키텍처에서든 유지
