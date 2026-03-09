# 의료계 인지 편향 대응 기법의 AI 워크플로우 적용

> 작성일: 2026-03-10
> 태그: analysis
> 우선순위: P2

## 문제 / 동기

의료계는 수십 년간 진단 오류(오진)를 줄이기 위해 전문가의 인지 편향(확증 편향, Premature Closure)을 막는 방법론을 연구해옴.
그 결과 "교육(Awareness)만으로는 편향을 막을 수 없고, 구조적 강제(Forcing Strategy)만이 유효하다"는 결론에 도달함.
이는 현재 우리가 구축한 AI 워크플로우(`/solve`, `/why`, `/diagnose`)가 LLM의 System 1(토큰 예측 관성)을 System 2(구조적 추론)로 강제 전환시키는 Cognitive Constraint 패턴과 완전히 동일한 맥락.

## 현재 상태

- `/solve`: 결론 전 제약 수집 우선, 반대 장점 평가 등 (Premature closure 방지)
- `/why`: 막혔을 때 강제 중단 및 전제 자체 의심 (Diagnostic Timeout)
- `/diagnose`: 코드 수정 없이 원인만 분석 (치료 충동 억제)

## 기대 상태

- 의료계의 검증된 기법들을 벤치마킹하여 현재 워크플로우를 고도화
- "System 2 Forcing" 패턴 등 독창적 워크플로우 설계에 대한 이론적 철학 정립

## 접근 방향 (조사 결과 기반)

1. **"Until Proven Otherwise" (최악 시나리오 선평가)**
   - `/solve`에 가장 위험한 대안을 우선적으로 기각하지 않도록 하는 안전장치 추가 검토.
2. **"Not Yet Diagnosed" (미확정 상태 공식화)**
   - `/diagnose`나 `/solve`의 판정 결과에 억지로 결론을 내리지 않는 "미확정(Open Gap)" 상태를 명시적으로 도입.
3. **10초 Pause의 힘**
   - 워크플로우 전개 시 복잡한 추가 절차보다는, 단순히 "의도적으로 멈추고 묻는(/reflect, /why Step 1)" 행위 상시화.
4. **체크리스트 경량화**
   - TWED 체크리스트(Threat, What else, Evidence, Disposition influence) 등의 핵심 요소만 차용하여 과잉 프로세스 방지.

## 관련 항목

- `/research` 조사: 의료 진단의 인지 편향 대응 기법 × AI 워크플로우 (2026-03-09)
- `.agent/workflows/solve.md`, `.agent/workflows/diagnose.md`, `.agent/workflows/why.md`
