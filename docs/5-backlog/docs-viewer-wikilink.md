# Docs Viewer: Wikilink + 백링크

`[[문서]]` 문법으로 문서 간 양방향 참조를 지원한다.

- 마크다운 내 `[[slug]]` 링크 파싱
- 양방향 백링크 수집
- 사이드바 또는 문서 하단에 "이 문서를 참조하는 문서" 표시

Origin: docs-viewer-features Ideas

---

## /wip 분석 이력 (2026-03-12)

### 분석 과정

#### 턴 1: /divide
- **입력**: wikilink + backlink 기능 on DocsViewer
- **결과**: DocsViewer os-migration T8 (ArrowDown gap) Hold 상태. DocsViewer 기반 기능 → 같은 blocker
- **Cynefin**: Complex — T8 미해소

### Open Gaps (인간 입력 필요)

- [ ] Q1: DocsViewer os-migration T8 해소 후 진행 가능 — docs-dashboard Q1과 동일 blocker

### 다음 /wip 시 시작점

T8 해소 후 → `/divide`로 wikilink 파싱 + 백링크 수집 + UI 표시를 WP로 분해
