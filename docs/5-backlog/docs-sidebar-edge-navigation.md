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

---

## /wip 분석 이력 (2026-03-12)

### 분석 과정

#### 턴 1: /divide
- **입력**: cross-zone passthrough 요구사항 + OS 인프라 현황
- **결과**:
  - DocsViewer os-migration T8 (ArrowDown gap) Hold 상태 — 같은 blocker
  - Cross-zone passthrough 자체가 OS gap — navigate 옵션 확장 또는 새 메커니즘 필요
  - `os-gaps.md`에 관련 항목 존재 가능성 있음
- **Cynefin**: Complex — OS 아키텍처 결정 필요 (Zone 경계를 넘는 키보드 nav)

### Open Gaps (인간 입력 필요)

- [ ] Q1: Cross-zone passthrough는 OS 레벨 기능인가, 앱 배선인가? — 해소 시 구현 위치 결정
- [ ] Q2: DocsViewer T8 선행 해소 필요 — docs-dashboard, wikilink과 동일 blocker

### 다음 /wip 시 시작점

T8 해소 + Q1 해소 후 → `/blueprint`로 OS navigate 확장 vs 앱 배선 설계
