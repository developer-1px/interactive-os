# Todo Keyboard Dogfooding

> Created: 2026-02-15
> Phase: Execution

---

## WHY

Todo 앱은 Interactive OS의 **첫 번째 개밥먹기(dogfooding) 대상**이다.
OS 프레임워크(Zone, FocusGroup, Command Pipeline, defineApp)가 실제 앱에서
키보드만으로 완전한 워크플로우를 제공할 수 있는지 직접 증명하는 프로젝트이다.

## Goals

**키보드만으로 Todo 앱의 모든 핵심 워크플로우를 완수**할 수 있어야 한다.
마우스 없이 30분 동안 Todo 앱을 사용하면서, 발견되는 마찰(friction)을 0으로 만드는 것이 목표.

## Scope

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

### Out of Scope

- Board View 2D 네비게이션
- 컨텍스트 메뉴 (⇧F10)
- 서브태스크, 날짜 선택기, 태그/라벨
- 검색/필터

## Acceptance Criteria (Dogfooding Checklist)

### SC-1: 일상 입력
1. Tab으로 Draft 필드 진입
2. "회의 준비" 입력 → Enter
3. ↓ 이동 → Space로 완료 토글
4. Enter로 편집 진입 → 텍스트 수정 → Enter로 저장

### SC-2: 정리
1. ↑↓로 삭제할 항목 이동
2. Backspace로 삭제
3. 포커스가 다음/이전 항목으로 올바르게 이동하는지 확인
4. ⌘Z로 실행 취소 → 삭제된 항목 복원 확인

### SC-3: 복사/이동
1. 항목 포커스 → ⌘C → ↓ 이동 → ⌘V
2. 복제된 항목 확인, 포커스가 새 항목으로 이동하는지 확인
3. ⌘X → 다른 위치 → ⌘V (잘라내기-붙여넣기)

### SC-4: 벌크 작업
1. ⇧↓ 3번 → 3개 항목 범위 선택
2. Backspace → 3개 한번에 삭제
3. ⌘Z → 3개 한번에 복원 (transaction)

### SC-5: 사이드바 조작
1. Tab으로 사이드바 진입
2. ↑↓로 카테고리 이동
3. Enter로 카테고리 선택
4. ⌘↑/⌘↓로 카테고리 순서 변경

## 성공 기준

| 지표 | 현재 값 | 목표 값 |
|------|---------|---------|
| Dogfooding 시나리오 통과율 | 미측정 | 5/5 (100%) |
| 키보드로 불가능한 핵심 작업 | 미측정 | 0개 |
| Unit 테스트 유지 | 158개 ✅ | ≥ 158개 |
| 포커스 복원 정확도 | 미측정 | 100% |

## 기술 컨텍스트

- Todo v5 (`defineApp` 기반) 구현 완료
- multi-select, transaction, clipboard 커맨드 커밋 완료 (`d14414c`)
- Native clipboard 보존 (`ca109e2`)
- Unit tests 158개 통과 중
