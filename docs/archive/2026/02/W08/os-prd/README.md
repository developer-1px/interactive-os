# os-prd

> OS 레이어의 진실의 원천(Single Source of Truth). 모든 동작 계약을 명세표로 관리한다.

## WHY

커널은 `defineCommand`/`defineEffect`/`defineContext`의 명시적 계약으로 견고하다.
OS는 dogfooding으로 유기적으로 자라면서 암묵적 동작이 쌓였다.
Tab `tabEscape` 미등록 effect; escape 미구현; flow 경계 미처리 — 이들은 "사양 부재"의 증상이다.

## WHAT

**OS PRD** = 하나의 문서에 모든 동작 계약을 담는 명세표.
코드가 이 문서를 따르고, 테스트가 이 문서를 검증한다.

### 구성

1. **SPEC.md** — 진실의 원천
   - Command Behavior Table: 모든 커맨드의 입력/출력/사이드이펙트
   - Config Behavior Matrix: 설정값 조합 × 예상 동작
   - Keymap Table: 키 → 커맨드 매핑
   - Effect Contract: 등록된 effect의 계약
   - ARIA Role Preset Table: role → config 매핑

2. **BOARD.md** — 작업 추적
3. **discussions/** — 설계 의사결정 기록

## Principles

1. **한 곳에서 관리**: SPEC.md가 변경되면 코드와 테스트가 따라간다
2. **표가 우선**: 산문보다 표. 기계적으로 검증 가능해야 한다
3. **코드에서 역추적**: 현재 구현을 사실 그대로 기록한 뒤, 의도와 불일치하는 부분을 식별한다
