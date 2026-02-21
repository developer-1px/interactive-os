# [Closed] Field 편집 진입 시 기존 데이터 소실

- **Priority**: P1
- **Status**: Closed
- **Reporter**: User
- **Date**: 2026-02-21

## 원문

> Field에서 엔터시 편집모드로 전환시 기존 데이터가 사라지는 버그

## 환경

- OS: Interactive OS (localhost:5555)
- App: Todo
- Route: /todo

## 재현 단계

1. Todo 앱에서 아이템 클릭 → 포커스
2. Enter 키 → 편집 모드 진입
3. 기존 텍스트가 사라짐 (빈 필드)

## 기대 결과

편집 모드 진입 시 기존 텍스트가 contenteditable 필드에 그대로 보여야 함.

## 실제 결과

기존 텍스트가 사라지고 빈 필드가 표시됨.

## 관련 이슈

- lazy-resolution 프로젝트에서 OS_RECOVER 제거 후 발생 가능성 확인 필요
- Field commit 후 focus 복원 수정과 동일 세션
