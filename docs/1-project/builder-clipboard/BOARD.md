# BOARD — builder-clipboard

## 🔴 Now
(T1 사이클 완료 — 다음 태스크 대기)

## ⏳ Done
- [x] A: accept 인터페이스 — 이미 존재 (config.accept)
- [x] B: 섹션 clipboard (사이드바) — 이미 동작 (collectionBindings)
- [x] C: 캔버스 clipboard — pasteBubbling 기반 통합 완료
- [x] F2: pasteBubbling 순수함수 — 7 tests
- [x] T1: 캔버스 paste bubbling 통합
  - buildCanvasCollections: 블록 트리에서 CollectionNode 자동 생성
  - resolveCanvasCopyTarget: 가장 가까운 동적 조상 해결
  - _getClipboardPreview: clipboard 타입 확인
  - findAcceptingCollection → sidebarCollection.paste (tree-aware)
  - /review 4건 수정, /verify 통과

## 💡 Ideas / Future
- T2: 탭 컬렉션 독립 clipboard (현재는 sidebarCollection의 tree-aware paste로 커버)
- T3: cross-collection paste 고급 시나리오
- cross-app clipboard (빌더 → 다른 앱)
- 붙여넣기 미리보기 (ghost preview)
- 정적 아이템 값 교체
