# DocsViewer Space → Section Nav Discussion

## Journey

**🧑 사용자**: docsviewer에서 space를 누르면 다음 section으로 가는 기능 검토

**🤖 AI**: 코드 전수 조사 결과, 두 가지 중복 메커니즘 발견:
1. `DOCS_SCROLL_PAGE` (register.ts) — ArrowLeft/Right, 미들웨어 경유, h1~h3 스냅
2. `DOCS_NEXT_SECTION` / `DOCS_PREV_SECTION` (app.ts) — Space/Shift+Space, Zone keybinding

`DocsReaderUI` Zone이 어디에서도 마운트되지 않아 Space 바인딩은 dead code 상태.

---

**🧑 사용자**: 하나로 합칠까? 화살표 좌우는 PPT처럼, 스페이스바는 그냥 아래 스크롤.

**🤖 AI**: 두 메타포(PPT vs 스크롤)를 제시했으나...

---

**🧑 사용자**: 기능이 같아서 브라우저의 기능을 막고 섹션단위로 스크롤이 되도록 만들어줘.

**🤖 AI**: 수렴 — Space와 Arrow는 같은 기능(섹션 스크롤). `DOCS_SCROLL_PAGE` 단일 엔진으로 통합. Dead code 제거.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | `DOCS_SCROLL_PAGE`를 단일 섹션 네비게이션 엔진으로 유지. Space/Shift+Space를 keydown 리스너로 추가. Dead code 3건 제거 |
| **📊 Data** | 두 메커니즘이 존재하나 하나는 dead code. 기능이 동일(섹션 스냅 스크롤) |
| **🔗 Warrant** | 같은 기능 → 하나의 엔진 (엔트로피 감소, rules.md #1) |
| **📚 Backing** | Convention over Configuration — 동일 목적 경로가 둘이면 하나를 제거 |
| **⚖️ Qualifier** | Clear |
| **⚡ Rebuttal** | Space keydown 리스너는 OS 파이프라인 외부(DOM 직접). register.ts가 이미 이 패턴 사용 중이라 일관됨 |
| **❓ Open Gap** | 없음 |
