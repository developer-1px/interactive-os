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
- [ ] T8: ArrowDown gap 해소 — 검색 결과를 listbox zone으로 전환하거나, dialog inputmap에 Arrow key noop 추가

## Done
- [x] T1: app.ts overlay 선언 + searchOpen/openSearch/closeSearch 제거 — tsc 0 | 13e0bfa8 ✅
- [x] T2: DocsSearch.tsx useOverlay + closeOverlay 전환 (이미 커밋 상태) — tsc 0 ✅
- [x] T3: "/" 키바인딩 → OS_OVERLAY_OPEN dispatch — tsc 0 | 13e0bfa8 ✅
- [x] T4: headless 테스트 4건 PASS — overlay open(click/key), close, re-open | 6e2bf993 ✅
- [x] T5: DocsSearch 수동 backdrop → ModalPortal 전환 — tsc 0 | 47da1d5a ✅
- [x] T6: headless Escape 테스트 — OS_ESCAPE → OS_OVERLAY_CLOSE | 6 tests PASS ✅
- [x] T7: ArrowDown gap 검증 — **OS gap 발견**: dialog zone에 inputmap 없어 Arrow key가 OS_NAVIGATE로 leak | 테스트로 증명 ✅

## Unresolved
- **OS GAP (T7)**: dialog role에 inputmap이 없어 ArrowDown이 OS global keybinding(OS_NAVIGATE)으로 leak → activeZoneId가 overlay에서 navbar로 변경됨. 브라우저에서는 React onKeyDown의 preventDefault가 보호하지만, headless에는 React 없음. 해소 방안: (A) dialog inputmap에 Arrow key noop 추가, (B) 검색 결과를 listbox zone으로 전환
- 콘텐츠 로딩(content/error useState)은 OS 관심사인가, 앱 고유 책임인가?
- 섹션 스크롤(os.subscribe + scrollIntoView)을 OS effect로 전환할 수 있는가?
- 외부 폴더(File System API)는 OS 범위 밖인가?

## Ideas
- DocsSearch OS overlay 전환 성공 후, 같은 패턴으로 MermaidBlock 확대 보기 추가
- virtual:docs-meta를 별도 모듈로 분리하여 테스트 자동 분기
- 장기적으로 DocsViewer를 100% OS 기반 앱 레퍼런스로 발전
