# builder-v3

| Key | Value |
|-----|-------|
| Claim | 빌더를 "단일 페이지 에디터"에서 "콘텐츠 운영 플랫폼"으로 도약시킨다 |
| Before | 단일 페이지 에디터 (builder-v2) |
| After | Page Lifecycle + Template + Diff + Version History + Block Library + Search + Media Library |
| Size | Heavy |
| Risk | ⚠️ 기획만 한다. 개발하지 않는다. OS 개발 우선. 나중에 /auto로 자동 개발 예정 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | Page Lifecycle 기획 | Draft→Published→Archived 상태 전이, BDD 6 scenarios | ✅ | spec/page-lifecycle.md |
| T2 | Page Template & 복제 기획 | 복제 + 템플릿 생성, BDD 6 scenarios | ✅ | spec/page-template.md |
| T3 | Content Diff 기획 | Draft vs Published 시각화, BDD 7 scenarios | ✅ | spec/content-diff.md |
| T4 | VISION.md Next 섹션 갱신 | v3 방향 반영 | ✅ | — |
| T5 | Version History 기획 | 타임라인 + 롤백 + 배포 메모, BDD 7 scenarios | ✅ | spec/version-history.md |
| T6 | Block Library 기획 | 재사용 블록 저장/삽입, BDD 6 scenarios | ✅ | spec/block-library.md |
| T7 | Content Search & Replace 기획 | 페이지 내/전체 검색, BDD 7 scenarios | ✅ | spec/content-search.md |
| T8 | Media Library 기획 | 이미지 자산 관리, BDD 8 scenarios | ✅ | spec/media-library.md |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | OS State Machine primitive — 페이지 상태 전이를 OS 레벨로 추상화? | 아키텍처 결정 |
| U2 | Named Snapshot — 커널 History 모듈 확장 | 기술적 가능성 |
| U3 | Tree Diff — NormalizedCollection diff 연산 | 구현 방식 |
