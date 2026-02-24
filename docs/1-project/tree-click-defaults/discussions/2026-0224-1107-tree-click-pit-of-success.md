# Discussion: Tree Click — Pit of Success

> 2026-02-24 11:07 | tree-click-defaults 프로젝트 귀속

## Journey

**🧑 사용자**: 아코디언이 클릭 한번에 안열려. 쉐브론도 안되고. 트리를 만드는 방식을 LLM이 몇번이나 실패하는데, OS가 제공하는 부품이 직관적이지 못한 걸까?

**🤖 AI**: `getExpandableItems` 누락 시 silent failure, onClick 수동 설정 필요 등 5단계 조립 중 3개가 LLM 자연 패턴과 반대. Pit of Failure. `<Item expandable>` prop 제안.

---

**🧑 사용자**: 이미 더 쉬운 방법이 DocsViewer에 있잖아?

**🤖 AI**: (조사 실패 인정) DocsViewer가 정답 패턴: `getExpandableItems` + `activate: { onClick: true }` 모두 `bind()`에서 선언적으로 완결. LLM이 벤치마크를 참조 안 한 것이 근본 원인.

---

**🧑 사용자**: APG에서는 어떻게 되어있는지 확인해봐.

**🤖 AI**: APG 레퍼런스 구현 `treeitem.js`의 `handleClick`: expandable이면 즉시 toggle, leaf면 focus+select. 1클릭에 조건 없이 동작. 우리 OS tree preset에 `onClick: true`가 빠져있음.

---

**🧑 사용자**: application 모드(쉐브론만 expand)는 어떻게?

**🤖 AI**: page mode(기본) = `onClick: true`, application mode = `onClick: false` override. 지금은 page mode만. "필요할 때 만든다."

---

**🧑 사용자**: getExpandableItems 대신 정규화 방식이 있을텐데?

**🤖 AI**: NormalizedCollection의 `order` key = expandable items. 정규화하면 `getExpandableItems` 자동 도출.

---

**🧑 사용자**: Tree를 쓸거면 정규화 함수만 하나 짜면 되도록 만드는게 제일 좋다.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | tree role preset에 `onClick: true` + `followFocus: true` 기본 포함. 앱은 `role: "tree"` 선언만으로 클릭+키보드 expand가 동작. 장기적으로 NormalizedCollection에서 expandable 자동 도출. |
| **📊 Data** | APG `treeitem.js` handleClick: 1클릭 expand toggle. 현재 tree preset `onClick: false`. LLM 반복 실패. |
| **🔗 Warrant** | Pit of Success — 기본이 옳아야 LLM도 사람도 실수 안 함. APG가 증거. |
| **📚 Backing** | W3C APG Tree View pattern. rules.md #7 Pit of Success. NormalizedCollection (entities + order). |
| **⚖️ Qualifier** | Clear (preset 수정) + Complicated (collection 통합은 별도) |
| **⚡ Rebuttal** | application mode(chevron-only expand) 필요 시 `onClick: false` override |
| **❓ Open Gap** | NormalizedCollection 기반 `collection` prop API 설계 (별도 프로젝트) |
