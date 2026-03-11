# os-migration

| Key | Value |
|-----|-------|
| Claim | DocsViewer의 React 직접 제어 패턴을 OS ZIFT 시스템으로 점진 마이그레이션하여, OS overlay 등의 실전 검증(개밥먹기)을 수행한다 |
| Before | DocsSearch: `searchOpen` useState, MermaidBlock: 정적 렌더링, 기타 React 직접 제어 |
| After | DocsSearch: `zone.overlay()` + `OS_OVERLAY_OPEN/CLOSE`, MermaidBlock: OS dialog overlay 확대 표시 |
| Size | Light |
| Risk | OS overlay가 동적 콘텐츠를 커버하지 못할 수 있음. DocsSearch 마이그레이션이 기존 동작을 깨뜨릴 수 있음 |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
| T1 | app.ts overlay 선언 + searchOpen/openSearch/closeSearch 제거 | tsc 0 | ✅ | 13e0bfa8 |
| T2 | DocsSearch.tsx useOverlay + closeOverlay 전환 | tsc 0 | ✅ | 커밋 완료 |
| T3 | "/" 키바인딩 → OS_OVERLAY_OPEN dispatch | tsc 0 | ✅ | 13e0bfa8 |
| T4 | headless 테스트 4건 PASS | overlay open(click/key), close, re-open | ✅ | 6e2bf993 |
| T5 | DocsSearch 수동 backdrop → ModalPortal 전환 | tsc 0 | ✅ | 47da1d5a |
| T6 | headless Escape 테스트 | OS_ESCAPE → OS_OVERLAY_CLOSE, 6 tests PASS | ✅ | PASS |
| T7 | ArrowDown gap 검증 | OS gap 발견: dialog zone에 inputmap 없어 Arrow key leak | ✅ | 테스트로 증명 |
| T8 | ArrowDown gap 해소 | 검색 결과를 listbox zone으로 전환하거나, dialog inputmap에 Arrow key noop 추가 | ⬜ | — |

## Unresolved

| # | Question | Impact |
|---|----------|--------|
| U1 | dialog role에 inputmap이 없어 ArrowDown이 OS global keybinding으로 leak | T8 블로커. 해소 방안: (A) dialog inputmap Arrow noop, (B) listbox zone 전환 |
| U2 | 콘텐츠 로딩(content/error useState)은 OS 관심사인가, 앱 고유 책임인가? | 추가 마이그레이션 범위 결정 |
| U3 | 섹션 스크롤(os.subscribe + scrollIntoView)을 OS effect로 전환할 수 있는가? | 추가 마이그레이션 범위 결정 |
| U4 | 외부 폴더(File System API)는 OS 범위 밖인가? | 범위 경계 |
