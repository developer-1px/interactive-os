# Retrospective — field-key-ownership

> 날짜: 2026-02-16
> 세션 목표: Draft 필드 Tab/Arrow 네비게이션 버그 수정
> 결과: FIELD_DELEGATES_TO_OS (allowlist) 모델 구현, 19/19 E2E 통과

## 🔧 개발 과정

### Keep 🟢
- E2E `page.evaluate` + `capture:true` spy로 `defaultPrevented` 추적 → 5분 내 원인 특정
- Git checkout bisect로 regression 커밋 특정 (ea92487 → 967efc2)
- MECE 4-프리셋 매트릭스가 설계 완전성 검증에 효과적

### Problem 🔴
1. **CONSUMES(blocklist) → DELEGATES_TO_OS(allowlist) 전환**: 매트릭스에서 "Space는 Field 소유"를 이미 정의했지만, 코드 모델(blocklist)이 이를 반영하지 못함. 3커밋 후 발견.
2. **E2E 늦게 실행**: 키보드 리스너 변경 후 unit만 돌리고 E2E 스킵.
3. **DOM zone order 미확인**: Tab forward가 list→sidebar라고 가정.

### Try 🔵
1. 키 소유권 설계 시 "ambiguous key(Space, Enter, Backspace)" 체크리스트로 매트릭스와 코드 모델 대조
2. KeyboardListener 변경 시 전체 E2E 즉시 실행
3. zone escape 테스트 전 DOM순서 사전 확인

## 🤝 협업 과정

### Keep 🟢
- /go 자율 루프로 3사이클 연속 진단→수정→검증

### Problem 🔴
1. `git stash`로 "기존 버그"라고 잘못 보고 (stash에 변경분 포함되어 불정확)
2. /retrospect를 인라인으로 대충 수행

### Try 🔵
1. regression 판단 시 `git checkout <commit> -- .`로 정확한 비교
2. /retrospect는 반드시 독립 실행 (→ /go 워크플로우에 반영 완료)

## ⚙️ 워크플로우

### Keep 🟢
- /go의 Known/Open/Constrained 분류와 커밋 3건 탈출 조건

### Problem 🔴
- /go 5단계 /retrospect가 인라인으로 스킵 가능한 구조

### Try 🔵
- /go 5단계에 "절차 전부 수행" 명시 (→ 반영 완료)

## 핵심 교훈

> **Blocklist는 안전하지 않다.** "나열하지 않은 것 = 상대에게 넘긴다"는 모델에서, 나열하지 않은 것이 의도치 않게 넘어갈 수 있다. Allowlist("명시적으로 넘기는 것만 나열")가 항상 더 안전하다.
