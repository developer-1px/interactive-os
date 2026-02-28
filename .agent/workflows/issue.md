---
description: 이슈를 자율적으로 분석→계획→수정→검증→재발방지까지 처리한다. 사용자 개입 0.
---

## /issue — 자율 이슈 해결 파이프라인

> 8D + Scientific Debugging + TDD Falsifiability. 완전 자율. LLM 비용 = 0.

### 원칙

1. **Falsifiability**: 수정 완료의 증거는 **Red→Green→Revert-Red** 3점 세트뿐이다.
2. **Root Cause, not Symptom**: 증상 테스트로 Green이 되면 shim이다. Red 테스트는 원인을 직접 검증해야 한다.
3. **Design before code, doubt after code**: 코드 전에 **설계 문서**, 코드 후에 의심. Sunk cost가 판단을 흐리기 전에.
4. **Red Team = 환기**: /doubt의 가치는 수정 강제가 아니라 시야 확장. 실행만으로 가치 있다.

---

### Pipeline

```
D1. 등록     → docs/1-project/0-issue/YYYY-MM-DD_<slug>.md
D2. Triage   → P0(빌드불가) / P1(기능불가) / P2(대안존재) / P3(cosmetic)
D3. Diagnose → 코드 수정 없이 원인 분석. 관련 문서(PRD, Status) 먼저.
              Inspector 로그가 있으면: Diff: None + Effects: dispatch 패턴 = 커맨드가 실행됐으나 state 무변화 = 버그 증거.
              Inspector 없으면: 재현 시나리오를 직접 실행하여 Diff 흐름을 추적한다.
```

```
D4. Plan — 문서로 적는다. 머릿속 계획은 계획이 아니다.
    이슈 파일에 아래를 추가:
    ┌─ 근본 원인: (1문장)
    ├─ 해결 방향: (새 메커니즘 / 기존 메커니즘 재사용 / 설정 변경)
    ├─ 수정 파일 목록: (예상)
    ├─ 엔트로피 체크: "새로운 유일한 패턴을 추가하는가?" → Yes면 멈춤 (Project #1)
    ├─ 설계 냄새 4질문: 개체 증가? 내부 노출? 동일 버그 타 경로? API 확장?
    └─ /reflect: 영향 범위? 기존 메커니즘? 다른 환경?
        → gap 발견 시 계획 수정 후 재루프 (max 3회)

    ⛔ D4를 건너뛰고 D5/D6으로 가는 것은 금지.
    ⛔ OS 코드 수정이면 반드시 사용자에게 계획을 보고한 후 진행.

    📌 P3 Fast Path: 명명 불일치, 스타일, cosmetic 이슈라면 D5~D6을 건너뛰고
    D7로 직행한다. 판단 기준: "런타임 동작을 바꾸는가?" → No이면 fast path.
```

```
D5. Red Table → 버그 케이스를 해당 기능의 결정 테이블에 누락 행으로 추가한다.
               위치: docs/6-products/{app}/spec/{feature}.md
               형식: 9열 결정 테이블 (S/Zone/Given/When/Intent/Condition/Command/Effect/Then)
               규칙:
                 - Given에 버그를 유발한 조건을 명시한다. (예: depth=3+, nesting=deeply-nested, selection=multi)
                 - 추가된 행의 S 열 = 🔴 (Red 테스트 작성 예정)
                 - 추가된 행 옆에 🆕 마크로 이번 이슈에서 추가됨을 표시한다.
               ⛔ 표 없이 테스트 코드 작성 금지.
D6. Red Test  → D5에서 추가된 행(🔴)만 it()로 인코딩한다. vitest → 🔴 FAIL.
               근본 원인을 직접 검증하는 실패 테스트. 기존 통과 테스트는 건드리지 않는다.
               ⛔ 기존 it()를 수정하거나 삭제하지 않는다.
D7. Green    → 계획대로 수정. 완료 후 D5에서 추가한 행의 S 열을 🟢로 업데이트. 계획에서 벗어나면 D4로.
```

```
D8. Verify
    ├─ /doubt: shim인가? 다른 환경도? 기존 메커니즘?
    ├─ /review: 네이밍, 구조, rules.md
    ├─ Revert-Red: 수정 되돌렸을 때 테스트 다시 실패하는가? (논리적 확인)
    └─ /verify: tsc + vitest (관련 + 전체)
```

```
D9. Close    → 이슈 [Closed] + 해결 요약. 구조적 원인이면 /rules 추가.
```
