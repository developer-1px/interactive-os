# RFC: Todo Dogfooding — OS 완전성 증명

> **규모**: Heavy
> **상태**: Active
> **시작**: 2026-02-21

## Summary

Todo 앱이 "데이터 스키마만 선언하면 SaaS급 앱이 된다"를 증명한다.
현재 CRUD/Clipboard/Undo/Field/MultiSelect만 커버하는 Todo를 확장하여,
Dialog, Context Menu, Toast, Search, DnD, Bulk Action 등
"당연한 기능"을 OS primitive만으로 구현한다.

## Motivation

> "데이터 스키마만 있으면 만들 수 있어야 하는게 interactive os의 증명이다."

현재 Todo는 기본 CRUD와 키보드 네비게이션만 검증한다.
실제 SaaS 앱에서 "당연하다"고 여겨지는 기능들 — 삭제 확인 다이얼로그, 우클릭 메뉴,
실행 취소 피드백 토스트, 검색/필터링, 드래그 정렬 — 이 빠져 있다.

이 기능들이 OS primitive만으로 자연스럽게 만들어지지 않으면,
OS는 "플랫폼"이 아니라 "키보드 네비게이션 라이브러리"에 불과하다.

**Todo가 "진짜 앱"이 되어야 OS가 "진짜 플랫폼"임이 증명된다.**

### 기존 검증 완료 영역

| OS Primitive | Todo에서의 사용 | 상태 |
|---|---|---|
| defineApp / createZone / bind | 앱 정의, 5-Zone 아키텍처 | ✅ |
| Collection Zone | Entity CRUD + ordering | ✅ |
| Clipboard | 구조적 복사/잘라내기/붙여넣기 | ✅ |
| Undo/Redo | History middleware | ✅ |
| Field | Draft input, edit input | ✅ |
| Multi-select | Shift+Arrow 범위 선택 | ✅ |
| Sidebar navigation | Category 선택 + 필터링 | ✅ |

### 검증 필요 영역

| OS 영역 | Todo 사용처 | OS VISION 상태 |
|---|---|---|
| Dialog / Modal | 삭제 확인, 카테고리 관리 | Next (예정) |
| Context Menu | 항목 우클릭 메뉴 | 미정 |
| Toast / Notification | 삭제 후 Undo 피드백 | 미정 |
| Search / Combobox | Todo 검색, 카테고리 필터 | Next (예정) |
| Drag & Drop | 항목 순서 드래그 변경 | Next (예정) |
| Bulk Action Bar | 다중 선택 → 일괄 액션 | 미정 |
| Date Picker | 마감일 입력 | 미정 |
| Export / Import | 데이터 내보내기/가져오기 | 미정 |

## Detailed Design

`prd.md` 참조.

## Drawbacks

- Todo가 벤치마크를 넘어 "실사용 앱"에 가까워지면 유지보수 부담 증가
- OS에 아직 없는 primitive (Dialog, DnD 등)는 OS 구현이 선행되어야 함
  → 이 프로젝트가 OS의 Next 로드맵을 견인하는 역할

## Alternatives

1. **Builder에서 검증** — Builder는 이미 복잡하고, 기본 CRUD 패턴 검증에 부적합
2. **새 앱을 만들어서 검증** — Todo가 이미 레퍼런스로 확립되어 있으므로 확장이 효율적
3. **하나씩 별도 프로젝트** — 태스크별 프로젝트는 오버헤드. 하나의 dogfooding 프로젝트로 통합

## Unresolved Questions

- OS에 Dialog primitive가 없으면 Todo에서 먼저 만들고 OS로 승격? 아니면 OS 먼저?
  → 원칙: OS Next 로드맵에 있으면 OS 먼저 → Todo에서 사용. 없으면 Todo에서 POC → OS 승격.
