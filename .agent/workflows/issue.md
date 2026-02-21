---
description: 이슈를 자율적으로 분석→계획→수정→검증→재발방지까지 처리한다. 사용자 개입 0.
---

## /issue — 자율 이슈 해결 파이프라인

> 8D + Scientific Debugging + TDD Falsifiability. 완전 자율. LLM 비용 = 0.

### 원칙

1. **Falsifiability**: 수정 완료의 증거는 **Red→Green→Revert-Red** 3점 세트뿐이다.
2. **Root Cause, not Symptom**: 증상 테스트로 Green이 되면 shim이다. Red 테스트는 원인을 직접 검증해야 한다.
3. **Think before code, doubt after code**: 코드 전에 계획, 코드 후에 의심. Sunk cost가 판단을 흐리기 전에.
4. **Red Team = 환기**: /doubt의 가치는 수정 강제가 아니라 시야 확장. 실행만으로 가치 있다.

---

### Pipeline

```
D1. 등록     → docs/1-project/0-issue/YYYY-MM-DD_<slug>.md
D2. Triage   → P0(빌드불가) / P1(기능불가) / P2(대안존재) / P3(cosmetic)
D3. Diagnose → 코드 수정 없이 원인 분석. 관련 문서(PRD, Status) 먼저.
```

```
D4. Plan (재귀: 수렴까지 max 3회)
    ┌─ 계획: 뭘 / 어디서 / 왜 여기가 본질 / shim vs 본질
    ├─ 설계 냄새 4질문: 개체 증가? 내부 노출? 동일 버그 타 경로? API 확장?
    └─ /reflect: 영향 범위? 기존 메커니즘? 다른 환경?
        → gap 발견 시 계획 수정 후 재루프
```

```
D5. Red      → 근본 원인을 직접 검증하는 실패 테스트. 별도 파일.
D6. Green    → 계획대로 수정. 계획에서 벗어나면 D4로.
```

```
D7. Verify
    ├─ /doubt: shim인가? 다른 환경도? 기존 메커니즘?
    ├─ /review: 네이밍, 구조, rules.md
    ├─ Revert-Red: 수정 되돌렸을 때 테스트 다시 실패하는가? (논리적 확인)
    └─ /verify: tsc + vitest (관련 + 전체)
```

```
D8. Close    → 이슈 [Closed] + 해결 요약. 구조적 원인이면 /rules 추가.
```
