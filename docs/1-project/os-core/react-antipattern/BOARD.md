# react-antipattern

## Context

Claim: os-react(3,210줄)에 행동 로직이 갇혀있다. LLM의 React 관성이 원인. headless로 추출하여 thin projection layer(<1,000줄)로 축소한다.

Before → After:
- Dialog.tsx 259줄 (Radix 호환 래퍼) → 삭제. overlay는 headless `zone.overlay()` + 앱 포탈로 해결
- Zone.tsx useLayoutEffect에서 상태 초기화 + dispatch → headless `initZoneState()` 함수로 추출
- Field.tsx 482줄 + FieldInput 211줄 + FieldTextarea 208줄 → headless `fieldCore.ts`로 행동 추출, React는 DOM 투영만
- useEffect 37개 → ≤3개, useState 2개 → 0개, 4-command import 17개 → 0개

Risks:
- headless 추출 시 기존 테스트(141파일 ~1,465개)가 깨질 수 있음
- Dialog.tsx 삭제 시 이를 사용하는 앱/showcase가 있으면 동시 수정 필요
- AP 간 의존관계가 있어 순서를 잘못 잡으면 중간에 빌드 불가

파일럿: AP-4(Dialog.tsx 삭제)를 먼저 수행하여 파이프라인 검증. 성공 후 스케일업.

## Now
- [ ] T1: Dialog.tsx 삭제 + 소비자 7개 ModalPortal 전환 — 크기: M, 의존: —

## Done

## Unresolved
- AP 간 최적 실행 순서 — /plan에서 코드 조사 후 확정
- ~~Dialog.tsx 소비자~~ → 7개 확인됨 (showcase 3 + command-palette 1 + todo 2 + focus-showcase 1)
- headless Field 추출의 API 설계 — /spec에서 결정

## Ideas
- import 방향 제한 lint rule (os-react → 4-command 금지)
- React 컴포넌트 100줄 초과 시 자동 경고
- contract test: os-react 컴포넌트가 headless 순수 투영인지 자동 검증
