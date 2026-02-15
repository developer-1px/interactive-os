# Todo Keyboard Dogfooding — PRD

> Created: 2026-02-15
> Phase: Definition

---

## 배경

Todo 앱은 Interactive OS의 **첫 번째 개밥먹기(dogfooding) 대상**이다.
OS 프레임워크(Zone, FocusGroup, Command Pipeline, defineApp)가 실제 앱에서
키보드만으로 완전한 워크플로우를 제공할 수 있는지 직접 증명하는 프로젝트이다.

이전 프로젝트(`todo-app`, `todo-v3-migration`)에서 v5 native 앱 전환과
multi-select/transaction/clipboard 기반 구축은 완료되었다.
이제 **실제 사용자 시나리오로 키보드 퍼스트를 검증**하는 단계이다.

## 목표

**키보드만으로 Todo 앱의 모든 핵심 워크플로우를 완수**할 수 있어야 한다.
마우스 없이 30분 동안 Todo 앱을 사용하면서, 발견되는 마찰(friction)을 0으로 만드는 것이 이 프로젝트의 목표이다.

## 범위

### In Scope

1. **코어 CRUD**: 생성, 읽기, 수정, 삭제 — 키보드만으로
2. **네비게이션**: ↑↓ 리스트 이동, Tab Zone 전환, 사이드바↔리스트
3. **클립보드**: ⌘C/⌘X/⌘V — 복사, 잘라내기, 붙여넣기
4. **Multi-select**: ⇧↑/⇧↓ 범위 선택, ⌘A 전체 선택, 벌크 삭제/복사
5. **편집**: Enter 진입, Escape 취소, 인라인 편집
6. **Undo/Redo**: ⌘Z/⌘⇧Z — transaction 기반
7. **순서 변경**: ⌘↑/⌘↓
8. **사이드바**: 카테고리 선택, 순서 변경
9. **포커스 복원**: 삭제/붙여넣기/Undo 후 올바른 위치로 포커스 이동

### Out of Scope (이 프로젝트에서 안 함)

- Board View 2D 네비게이션
- 컨텍스트 메뉴 (⇧F10)
- 서브태스크
- 날짜 선택기
- 태그/라벨 자동완성
- 검색/필터

## 사용자 시나리오 (Dogfooding Checklist)

### Scenario 1: 일상 입력
1. Tab으로 Draft 필드 진입
2. "회의 준비" 입력 → Enter
3. ↓ 이동 → Space로 완료 토글
4. Enter로 편집 진입 → 텍스트 수정 → Enter로 저장

### Scenario 2: 정리
1. ↑↓로 삭제할 항목 이동
2. Backspace로 삭제
3. 포커스가 다음/이전 항목으로 올바르게 이동하는지 확인
4. ⌘Z로 실행 취소 → 삭제된 항목 복원 확인

### Scenario 3: 복사/이동
1. 항목 포커스 → ⌘C → ↓ 이동 → ⌘V
2. 복제된 항목 확인, 포커스가 새 항목으로 이동하는지 확인
3. ⌘X → 다른 위치 → ⌘V (잘라내기-붙여넣기)

### Scenario 4: 벌크 작업
1. ⇧↓ 3번 → 3개 항목 범위 선택
2. Backspace → 3개 한번에 삭제
3. ⌘Z → 3개 한번에 복원 (transaction)

### Scenario 5: 사이드바 조작
1. Tab으로 사이드바 진입
2. ↑↓로 카테고리 이동
3. Enter로 카테고리 선택
4. ⌘↑/⌘↓로 카테고리 순서 변경

## 기술 제약

- 이전 Todo v5 (`defineApp` 기반)가 이미 구현되어 있음
- multi-select, transaction, clipboard 커맨드는 커밋 완료 (`d14414c`)
- 테스트: unit 153개 통과 중
- Playwright E2E는 별도 추가 예정
