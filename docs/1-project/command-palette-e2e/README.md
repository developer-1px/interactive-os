# command-palette-e2e — Command Palette E2E 완성

## WHY

Command Palette E2E 테스트 5개 중 3개가 실패하고 있다.
실패 원인은 테스트 코드 자체의 문제와 컴포넌트 구조 문제가 혼합되어 있다.
"이 OS 위에서 이 OS를 테스트한다" 원칙에 따라, E2E가 통과해야 기능이 증명된다.

## Goals

1. Command Palette E2E 테스트 5/5 통과
2. 화살표 네비게이션 (ArrowUp/Down) 정상 동작 확인 & 테스트 추가

## Scope

### In
- E2E 테스트 코드 수정 (locator, URL)
- QuickPick/Dialog 구조 중 pointer event 가로채기 문제 수정
- Escape 닫기 정상 동작 보장
- 화살표 네비게이션 테스트 추가

### Out
- QuickPick의 새 기능 추가
- 비주얼 디자인 변경
- 다른 E2E 테스트
