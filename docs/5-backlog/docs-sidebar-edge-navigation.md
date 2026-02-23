# Docs Sidebar — Zone Edge Navigation

## 요구사항

docs-sidebar-os에서 3개 독립 Zone (Recent, Favorites, Tree)을 키보드로 탐색할 때:

### 1. Edge Loop 방지
현재 Zone의 마지막 아이템에서 ArrowDown을 누르면 첫 아이템으로 루프하지 않아야 함.
(OS 기본 동작이 wrap인 경우 `navigate: { wrap: false }` 옵션 필요할 수 있음)

### 2. Seamless Passthrough
Zone의 끝에서 다음 Zone으로 자연스럽게 포커스 이동:
- Recent 마지막 아이템 → ArrowDown → Favorites 첫 아이템
- Favorites 마지막 → ArrowDown → Tree 첫 아이템
- Tree 첫 아이템 → ArrowUp → Favorites 마지막 아이템

### 관련
- `docs-sidebar-os` 프로젝트의 Ideas에 "3 Zone → 1 Zone 통합"이 있음
- Passthrough가 구현되면 통합 없이도 단일 Zone처럼 동작
- OS 레벨 기능인지, 앱 레벨 배선인지 판단 필요
