# Spec — react-antipattern

> 한 줄 요약: os-react의 Radix 호환 Dialog.tsx 래퍼를 삭제하고, 소비자를 OS primitive(ModalPortal + triggers)로 전환한다.

## T1: Dialog.tsx 삭제 + 소비자 ModalPortal 전환

### 1. 기능 요구사항

**Story**: OS 개발자로서, Dialog.tsx를 삭제하고 싶다. 그래야 os-react가 thin projection layer 원칙을 지키기 때문이다.

**Use Case — 주 흐름:**
1. Dialog.tsx를 삭제한다
2. 7개 소비자를 ModalPortal + zone.bind({ triggers }) 패턴으로 전환한다
3. 기존 dialog/alertdialog headless 테스트가 그대로 통과한다
4. tsc, lint, 전체 테스트가 통과한다

**Scenarios (Given/When/Then):**

Scenario: Dialog.tsx 삭제 후 빌드 성공
  Given Dialog.tsx가 삭제되었다
  And 7개 소비자가 ModalPortal 패턴으로 전환되었다
  When tsc -b를 실행한다
  Then 타입 에러가 0이다

Scenario: Dialog.tsx 삭제 후 기존 테스트 regression 없음
  Given Dialog.tsx가 삭제되었다
  And 소비자가 ModalPortal 패턴으로 전환되었다
  When vitest run을 실행한다
  Then dialog.layer.test.ts가 PASS한다
  And alertdialog.layer.test.ts가 PASS한다
  And 전체 테스트에서 새로운 FAIL이 없다

Scenario: 전환된 소비자가 동일한 overlay 동작을 수행
  Given TodoToolbar에서 Dialog를 ModalPortal로 전환했다
  When 트리거 버튼을 클릭한다
  Then overlay가 열린다 (OS_OVERLAY_OPEN dispatch)
  And Escape를 누르면 overlay가 닫힌다 (OS_OVERLAY_CLOSE dispatch)

Scenario: 전환된 소비자에서 Dialog compound API 흔적 없음
  Given 모든 소비자 전환 완료
  When codebase에서 "Dialog.Trigger", "Dialog.Content", "Dialog.Close"를 grep한다
  Then 매칭 0건이다

### 2. 범위 밖 (Out of Scope)

- ModalPortal.tsx 자체의 리팩토링 (이미 존재하고 동작함)
- 다른 AP(AP-1~AP-3, AP-5~AP-8) — 별도 태스크
- Dialog의 headless 동작 변경 — headless는 이미 정상, L2 래퍼만 제거
