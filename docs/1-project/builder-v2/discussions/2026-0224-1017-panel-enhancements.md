# Discussion: Panel 고도화 — 양방향 동기화 + OS Accordion + 스크롤 안정화

> 2026-02-24 10:17 | builder-v2 귀속

## Journey

**🧑 사용자**: Form Field focus 시 캔버스 커서가 동기화되었으면 좋겠다.

**🤖 AI**: 현재 캔버스→패널 단방향만 구현됨. 역방향(패널→캔버스)을 추가하면 양방향 동기화 완성. DOM focus 충돌을 피하기 위해 별도 highlight state(전략 B) 제안.

---

**🧑 사용자**: 필드 단위로 동기화. Form 편집과 inline 편집은 의도가 다르니 edit는 각자 유지, highlight만 동기화.

**🤖 AI**: Selection vs Focus 분리 원칙과 일치. Figma Layer↔Canvas 양방향이 정확한 선례.

---

**🧑 사용자**: 우측 패널 키보드가 안 되네? OS 기반이 아닌 거지?

**🤖 AI**: 맞다. 순수 React + 네이티브 HTML. rules.md "이 OS 위에서 이 OS를 만든다" 위반. 전체 OS화 vs 부분 OS화 제안.

---

**🧑 사용자**: Form은 냅둬. Accordion만 OS Zone/Item으로 — 이미 구현된 기능이니 더 단순할 것.

**🤖 AI**: 정확한 관심사 분리. Accordion 헤더 = OS Zone/Item (Arrow/Enter), Form 필드 = 네이티브 (Tab flow). 좌측 SectionSidebar와 동형(isomorphic) 구조.

---

**🧑 사용자**: 스크롤이 막 되니까 정신없다.

**🤖 AI**: 세 가지 원인 분리 — 동시 다발 펼침, 과도한 자동 스크롤, 긴 section. Exclusive accordion vs 스크롤 억제 질문.

---

**🧑 사용자**: 스크롤은 무조건 section 헤더 단위로만.

**🤖 AI**: 자동 스크롤 앵커를 section 헤더로 한정. 필드 레벨 미세 스크롤 제거. 예측 가능한 discrete jump.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | 3가지 고도화: (1) Accordion 헤더를 OS Zone/Item으로 전환하여 키보드 네비게이션 확보, (2) 패널 필드 focus → 캔버스 highlight 양방향 동기화 (edit 상태는 분리), (3) 자동 스크롤은 섹션 헤더 단위로만 |
| **📊 Data** | 현재 캔버스→패널 단방향만 구현. 패널은 순수 React로 키보드 네비게이션 불가. 자동 스크롤이 필드 단위까지 추적하여 패널이 불안정. |
| **🔗 Warrant** | Accordion 네비게이션과 Form 편집은 다른 관심사. highlight와 edit도 다른 관심사. 좌측 Sidebar와 동형 구조로 OS Zone/Item 재사용 가능. |
| **📚 Backing** | Figma Layer↔Canvas 양방향 동기화. Selection vs Focus 분리 원칙. SectionSidebar의 Zone/Item/useExpanded 패턴. |
| **⚖️ Qualifier** | Clear — 모두 기존 패턴의 적용 |
| **⚡ Rebuttal** | OS Zone 내 네이티브 input의 Tab flow 충돌 가능성 → Field.Editable + tab:"flow"로 이미 해결된 문제 |
| **❓ Open Gap** | 없음 |
