# Kernel State Scoping — 논의 여정

> 대화에서 거쳐온 이정표와 전환점 기록

## 이정표 1: Gap 분석에서 출발

**논의**: Phase 2(Todo 마이그레이션) 진행 중 발견한 5개 구조적 Gap 중
Gap 1("앱 커맨드가 전체 커널 state를 알아야 함")에 대한 논의 시작.

**전환점**: 사용자가 "group에서 scope 제한을 하는데, OS state 접근도 제한해야 하지 않나?"라고
질문. 단순한 ergonomics 문제가 **격리 원칙 위반**으로 재정의됨.

---

## 이정표 2: A+C가 자명한가?

**논의**: A(scoped state view) + C(context injection)가 초기 설계에 이미 있었는데,
이게 "좋은 선택"인지 "유일한 정답"인지.

**전환점**: "앱 커맨드가 OS state에 쓰기를 해야 할 때는?" → 사용자: "앱 effect는
다른 데 영향을 못 주지만, 버블링은 된다. dispatch가 있으니까. 같은 말이야."
→ **dispatch effect bubbling = 유일한 합법적 cross-scope 쓰기 경로**라는 메커니즘 확립.

---

## 이정표 3: 세 원칙에서 연역 도출

**논의**: A+C가 자명한 이유를 연역적으로 정리.

- 격리 원칙: 앱은 자기 state만 읽고 쓴다
- 버블링 원칙: 하위에서 처리 못 하면 상위로 전파
- 커맨드 유일성: 직접 mutation 없이 dispatch로만 변경

**전환점**: 이 세 원칙을 인정하면 A+C+dispatch bubbling이 **유일한 해**로 도출.

---

## 이정표 4: "모든 것은 scope + bubbling" 확인

**논의**: 커널의 모든 메커니즘(command, effect, context, middleware)이
scope + bubbling을 따르는데 state만 예외라는 관찰.

**전환점**: 사용자 확인 — "원래 모든 구조가 scope + bubbling 되도록 설계했다.
effect도 context도 마찬가지." → state는 설계 "결정"이 아니라 설계 "미완성".

---

## 이정표 5: Resolution vs Ownership (핵심 발견)

**논의**: "그러면 state는 버블링을 해야 하나?"라는 사용자의 시험 질문.

**전환점**: State는 **lookup(탐색)**이 아니라 **ownership(소유)**의 문제.
- Resolution(command/effect/context): scope + bubbling — "누가 처리하나?"
- Ownership(state): scope only — "이 데이터는 누구 것인가?"

State 버블링은 의미 없다. 데이터 소유권은 항상 확정적이므로 탐색이 필요 없다.

**이 구분이 대화의 가장 중요한 발견.**

---

## 이정표 6: 누락 원인 규명

**논의**: 왜 이걸 놓쳤는가?

**결론**: 커널 리팩토링 시점에 앱 커맨드가 커널에 없었다. GLOBAL scope 하나뿐인
상태에서는 state scoping이 필요한 상황 자체가 발생하지 않았음.
`apps` slice 추가로 multi-scope 진입 시 비로소 드러남.

---

## 여정 요약

```
Gap 1 (ergonomics)
  → 격리 원칙 위반으로 재정의
    → A+C 자명성 검증
      → dispatch bubbling = 유일한 cross-scope 경로
        → 세 원칙에서 연역 도출
          → "모든 것은 scope + bubbling" 확인
            → ⭐ Resolution vs Ownership 구분 발견
              → state = ownership → scoping만 필요
                → 누락 원인: 단일 scope 시절에는 불필요했음
```
