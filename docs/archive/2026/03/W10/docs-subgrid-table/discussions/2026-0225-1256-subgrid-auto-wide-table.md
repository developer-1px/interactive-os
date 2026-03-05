# Subgrid Auto-Wide Table — Discussion Conclusion

## Journey

**🧑 사용자**: docsviewer에서 subgrid를 이용해서 table은 가로로 더 크게 보일 수 있도록 디자인을 해줘

**🤖 AI**: 현재 table이 `max-w-5xl` prose 영역 안에 갇혀있는 문제를 확인. subgrid 기반 full-bleed vs breakout 접근법 제시. "어떤 범위의 넓게?"를 질문.

---

**🧑 사용자**: 무조건 넓은게 아니라 auto하게 넓게 하고 싶은데?

**🤖 AI**: **핵심 전환점.** "Auto-wide" = `width: max-content` 시맨틱. content-driven sizing 식별. 3단 테이블 스펙(좁으면 prose, 중간이면 breakout, 넓으면 full) 제시. subgrid의 역할: named grid line으로 max-width를 자동 바인딩.

---

**🧑 사용자**: 최소는 prose만큼 채워야지

**🤖 AI**: `min-width: 100%` (prose 폭) 확정. 최종 스펙: `max(prose-width, min(content-width, full-width))`.

---

**🧑 사용자**: /project

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | DocsViewer content wrapper를 CSS Grid named lines (`full` / `prose`)로, MarkdownRenderer를 subgrid로 전환하여 table만 content-driven auto-wide로 렌더링한다 |
| **📊 Data** | table이 `max-w-5xl` > `max-w-3xl`(docs-content) > `max-w-4xl`(table wrapper) 다층 제약에 갇혀 BOARD.md 같은 다열 테이블 가독성 저하 |
| **🔗 Warrant** | `width: max-content` + `min-width: prose` + `max-width: full`로 content-driven sizing 달성. subgrid로 부모 트랙 참조하여 sidebar 변동 등에 자동 대응 |
| **📚 Backing** | CSS Subgrid (CSS Grid Level 2, W3C CR). Full-bleed layout 패턴 (Ryan Mulligan, Kevin Powell 등) |
| **⚖️ Qualifier** | **Complicated** — subgrid + ReactMarkdown children 상호작용 분석 필요하지만 패턴 확립됨 |
| **⚡ Rebuttal** | ReactMarkdown의 모든 children이 grid item이 되므로 예상치 못한 레이아웃 문제 가능. 단, 이미 요소별 max-w 클래스가 있어 grid-column 전환이 자연스러움 |
| **❓ Open Gap** | code block, image 등으로 확장 시 같은 메커니즘 사용 가능하나 이번 스코프는 table만 |
