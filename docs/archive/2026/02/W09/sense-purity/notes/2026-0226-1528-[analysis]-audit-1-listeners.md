# audit: sense-purity 1-listeners

## 지표

```
총 위반: 12건
  🔴 Dead Code: 1건 → DragListener.tsx 삭제로 수정 완료
  🟡 OS 갭: 2건 → OG-006, OG-007 등록
  ⚪ 정당한 예외: 9건
재감사: 수정 후 🔴 0건 확인 ✅
```

## 위반 목록

| # | 파일 | 패턴 | 분류 | 이유 |
|---|------|------|------|------|
| 1 | InputListener | useEffect, document.addEventListener | ⚪ | OS 진입점 |
| 2 | FocusListener | useEffect, document.addEventListener, os.dispatch | ⚪ | OS 진입점 |
| 3 | KeyboardListener | useEffect, document.activeElement, window.addEventListener | ⚪ | OS 진입점 |
| 4 | ClipboardListener | useEffect, window.addEventListener, os.dispatch | ⚪ | OS 진입점 |
| 5 | PointerListener | useEffect, document.addEventListener, os.dispatch | ⚪ | OS 진입점 |
| 6 | PointerListener:132-139 | document.caretRangeFromPoint, getElementById, createRange | ⚪ | 브라우저 caret API 필수 |
| 7 | PointerListener:173-174,258-259 | document.body.style.cursor/userSelect | 🟡 OG-006 | drag cursor OS 미관리 |
| 8 | PointerListener:179 | document.querySelector("[data-zone=...]") | 🟡 OG-007 | zone element lookup API 없음 |
| 9 | PointerListener:223 | entry?.config?.activate?.onClick | ⚪ | ZoneRegistry 조회 |
| 10 | senseMouse.ts:129-130 | document.getElementById, querySelector | ⚪ | sense DOM 어댑터 |
| 11 | senseMouse.ts:217 | querySelectorAll | ⚪ | sense DOM 어댑터 |
| 12 | **DragListener.tsx** | 전체 | **🔴 삭제 완료** | PointerListener로 대체 후 삭제 누락 |
