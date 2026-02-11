# ⌘K Command Palette — PRD

## 1. 개요 (Overview)

**문제**: 현재 프로젝트에 15개 이상의 라우트가 등록되어 있으나, 라우트 간 이동이 번거롭다. GlobalNav에 모든 라우트가 노출되지 않아 URL을 직접 입력하거나 DevTools를 사용해야 한다.

**해결**: macOS Spotlight / VS Code ⌘K 스타일의 **Command Palette**를 구현하여, 어디서든 ⌘K로 빠르게 라우트를 검색·이동할 수 있게 한다.

**Dogfooding 목표**: OS 전체 스택(Kernel → Commands → Keybindings → Dialog → Zone → Item → Field → Kbd)을 실전에서 검증한다.

---

## 2. 사용자 스토리

| # | As a | I want to | So that |
|---|------|-----------|---------|
| 1 | 개발자 | ⌘K를 눌러 Command Palette를 열고 | 현재 위치에 관계없이 빠르게 이동할 수 있다 |
| 2 | 개발자 | 텍스트를 입력하여 라우트를 fuzzy 검색하고 | 정확한 경로를 외우지 않아도 찾을 수 있다 |
| 3 | 개발자 | ↑/↓로 결과를 탐색하고 Enter로 이동하면 | 마우스 없이 키보드만으로 네비게이션할 수 있다 |
| 4 | 개발자 | ESC로 팔레트를 닫으면 | 작업 흐름이 끊기지 않는다 |

---

## 3. 핵심 기능

### 3.1 트리거
- **⌘K** (Meta+K) 글로벌 단축키로 팔레트 열기/닫기 (토글)
- OS `Keybindings.register()` 패턴 활용

### 3.2 검색
- 텍스트 입력 시 fuzzy matching으로 라우트 필터링
- 매칭 결과를 점수 순으로 정렬
- 빈 입력 시 전체 라우트 표시

### 3.3 네비게이션
- ↑/↓ 키로 결과 리스트 탐색 (OS Zone + Item)
- Enter 키로 선택된 라우트로 실제 `router.navigate()` 이동
- 이동 후 팔레트 자동 닫힘

### 3.4 UI/UX
- `OS.Dialog` 기반 모달 오버레이
- 상단: 검색 입력 (OS.Field 또는 native input)
- 하단: 필터된 라우트 리스트 (OS.Zone + OS.Item)
- 각 라우트 항목에 경로 표시
- 단축키 힌트 표시 (OS.Kbd)

---

## 4. 스코프

### In Scope (이번 Spike)
- ⌘K 트리거 (글로벌 키바인딩)
- TanStack Router의 `routeTree`에서 라우트 목록 추출
- Fuzzy search 필터링
- ↑/↓/Enter 키보드 네비게이션
- `router.navigate()`로 실제 이동
- OS 커맨드 기반으로 네비게이션 연결 (확장성)

### Out of Scope
- 라우트 외 OS 커맨드 실행 (향후 확장)
- 최근 방문 라우트 우선 정렬
- 라우트별 아이콘/메타데이터
