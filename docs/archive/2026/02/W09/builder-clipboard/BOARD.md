# BOARD — builder-clipboard

## 🔴 Now
(T2 완료 — 다음 태스크 대기)

## ⏳ Done
- [x] A: accept 인터페이스 — 이미 존재 (config.accept)
- [x] B: 섹션 clipboard (사이드바) — 이미 동작 (collectionBindings)
- [x] C: 캔버스 clipboard — pasteBubbling 기반 통합 완료
- [x] F2: pasteBubbling 순수함수 — 7 tests
- [x] T1: 캔버스 paste bubbling 통합
- [x] T2: Clipboard Hygiene (02-21)
  - P0: clipboardWrite effect 등록 (4-effects/index.ts)
  - P1: OS_CLIPBOARD_SET + os.clipboard dual write 제거 → _clipboardStore 단일화
  - P2: setTextClipboard→copyText, getClipboardPreview→readClipboard (인스턴스 메서드)
  - canvasOnCut export (기존 결함 수정)
  - clipboardSet.ts 삭제, ClipboardState 제거

## 💡 Ideas / Future
- T3: 탭 컬렉션 독립 clipboard
- T4: cross-collection paste 고급 시나리오
- cross-app clipboard (빌더 → 다른 앱)
- 붙여넣기 미리보기 (ghost preview)
