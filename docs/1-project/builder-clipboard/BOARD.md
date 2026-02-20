# BOARD — builder-clipboard

## 🔴 Now
- [ ] T2: Clipboard Hygiene — /doubt 분석 기반 구조적 부채 해소
  - [x] Step 8: /tdd
  - [x] Step 9: /solve — P0+P1+P2 구현 완료
  - [ ] Step 15: /verify
  - Changes:
    - P0: ✅ clipboardWrite effect handler 등록 (4-effects/index.ts)
    - P1: ✅ OS_CLIPBOARD_SET + os.clipboard 제거 → _clipboardStore만 유지
    - P2: ✅ setTextClipboard→copyText, getClipboardPreview→readClipboard (인스턴스 메서드로 일관성 유지)
    - ✅ canvasOnCut export 추가 (기존 결함 수정)
    - ✅ clipboardSet.ts 삭제, OSState.clipboard 제거, initialOSState.clipboard 제거

## ⏳ Done
- [x] A: accept 인터페이스 — 이미 존재 (config.accept)
- [x] B: 섹션 clipboard (사이드바) — 이미 동작 (collectionBindings)
- [x] C: 캔버스 clipboard — pasteBubbling 기반 통합 완료
- [x] F2: pasteBubbling 순수함수 — 7 tests
- [x] T1: 캔버스 paste bubbling 통합

## 💡 Ideas / Future
- T3: 탭 컬렉션 독립 clipboard
- T4: cross-collection paste 고급 시나리오
- cross-app clipboard (빌더 → 다른 앱)
- 붙여넣기 미리보기 (ghost preview)
