# Discussion: PropertiesPanel → Accordion Form 전환

> 2026-02-24 10:03 | builder-v2 귀속

## Journey

**🧑 사용자**: Builder 우측 Form을 Section별로 접힘/펼침 가능하게 전체를 다 노출하고, 선택 시 보여주는 식으로 개선하고 싶다.

**🤖 AI**: Intent 추론 — "전체를 다 노출"의 범위가 (A) 선택된 블록의 속성 그룹 전부, (B) 페이지 전체 블록 리스트, (C) PropertyType별 카테고리 중 어떤 것인지 질문.

---

**🧑 사용자**: 현재 하나씩 클릭하는 방식은 좋아보이지만 불편하다. 뭐가 있는지 한눈에 알기 어렵고, 익숙해지면 한곳에 몰아서 수정하게 된다. URL slug, description 등 meta 정보는 아예 노출되지 않는다. 전체 정보를 하나의 form에서 보되, 노이즈가 되지 않게 섹션별 접힘/펼침이 있으면 좋겠다.

**🤖 AI**: Steel-manning — "초보자 UX vs 숙련자 UX" 문제. 현재는 초보자에만 맞춰져 있고, Alan Cooper의 "Perpetual Intermediates" 개념에 따르면 대부분의 시간은 중급자로 보냄. 전략 3가지 제시: (A) 대체, (B) 탭 전환, (C) 전체 Form + 자동 스크롤.

---

**🧑 사용자**: C가 맞다. Section은 좌측 Sidebar의 Block 모델을 그대로 우측에서도 가져가는 것이다.

**🤖 AI**: CQRS Read Model — `blocks[]`라는 하나의 도메인 데이터에서 좌측(Navigation View)과 우측(Form View)이 각각 독립적으로 프로젝션. Nested Accordion으로 children 계층도 반영. 6-step 구현 분해.

---

**🧑 사용자**: 전부 접힘/펼침을 두자. Page Meta는 하드코딩으로 최상단에 고정. 다국어도 알고만 있고, Panel을 Form으로 만드는 것에 집중.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | PropertiesPanel을 "요소별 Inspector"에서 "Block 단위 Accordion Form + Page Meta 고정 섹션"으로 전환한다. `blocks[]`를 순회하며 각 Block을 AccordionSection으로 렌더링. 캔버스 선택 시 해당 Section 자동 펼침 + 스크롤. |
| **📊 Data** | 현재 Panel은 선택된 아이템의 PropertyType에 따라 폼을 완전히 교체(switching). meta 정보(slug, description) 편집 불가. 숙련자가 일괄 편집 시 비효율적. |
| **🔗 Warrant** | 좌측 Sidebar의 Block 리스트가 곧 우측 Accordion의 목차 — 동일 데이터 모델의 이중 프로젝션(CQRS Read Model). children은 Nested Accordion으로 좌측과 대칭(POLA). |
| **📚 Backing** | Alan Cooper "Perpetual Intermediates" — 영원한 중급자를 위한 UI가 실사용의 대부분. Jakob Nielsen "Recognition over Recall". Figma/Framer의 Section-based Accordion이 산업 표준. rules.md #3 CQRS Read Model. |
| **⚖️ Qualifier** | Clear — 6-step 분해 완료, 각 step이 자명한 구현 |
| **⚡ Rebuttal** | children이 많은 블록(Services 6개 카드)에서 2단 접힘 UX 복잡도. 모든 블록 펼치면 스크롤 길어짐 → 기본 collapsed + 자동 펼침으로 대응. |
| **❓ Open Gap** | Page Meta 데이터 모델 확장(BuilderState에 meta 필드 추가)은 별도 태스크. 다국어 기능은 미래 스코프. |
