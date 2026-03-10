# os-migration

## Context

Claim: DocsViewer의 React 직접 제어 패턴을 OS ZIFT 시스템으로 점진 마이그레이션하여, OS overlay 등의 실전 검증(개밥먹기)을 수행한다.

Before → After:
- DocsSearch: `searchOpen` useState → `zone.overlay()` + `OS_OVERLAY_OPEN/CLOSE`
- MermaidBlock: 정적 렌더링 → 클릭 시 OS dialog overlay로 확대 표시
- 기타 React 직접 제어 (content loading, scroll, external folder)는 OS 관심사 판단 후 결정

Risks:
- OS overlay가 동적 콘텐츠(mermaid 블록 수)를 자연스럽게 커버하지 못할 수 있음 → gap 발견 시 중지하고 논의
- DocsSearch 마이그레이션이 기존 동작을 깨뜨릴 수 있음 → headless 테스트로 보호

## Now
- [ ] T4: headless 테스트 — overlay lifecycle (열기/닫기/재열기) — 크기: S, 의존: →T2,T3

## Done
- [x] T1: app.ts overlay 선언 + searchOpen/openSearch/closeSearch 제거 — tsc 0 | 13e0bfa8 ✅
- [x] T2: DocsSearch.tsx useOverlay + closeOverlay 전환 (이미 커밋 상태) — tsc 0 ✅
- [x] T3: "/" 키바인딩 → OS_OVERLAY_OPEN dispatch — tsc 0 | 13e0bfa8 ✅

## Unresolved
- 콘텐츠 로딩(content/error useState)은 OS 관심사인가, 앱 고유 책임인가?
- 섹션 스크롤(os.subscribe + scrollIntoView)을 OS effect로 전환할 수 있는가?
- 외부 폴더(File System API)는 OS 범위 밖인가?

## Ideas
- DocsSearch OS overlay 전환 성공 후, 같은 패턴으로 MermaidBlock 확대 보기 추가
- 장기적으로 DocsViewer를 100% OS 기반 앱 레퍼런스로 발전
