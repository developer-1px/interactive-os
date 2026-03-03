# Item.Content — ZIFT의 누락된 투영 표면

## Journey

**🧑 사용자**: APG Tabs 패턴 구현했는데 탭패널이 안 바뀐다. 왜?

**🤖 AI**: `os.useComputed`로 `selectedItems`를 읽지만 re-render 안 됨. OS가 `aria-selected`는 DOM에 투영하지만, Zone 외부 콘텐츠(tabpanel)에는 반응형 연결이 없다.

---

**🧑 사용자**: 애초에 ZIFT 가설이 틀렸던 걸까?

**🤖 AI**: ZIFT는 상호작용 모델로서 올바르다(aria-selected 투영 증거). 빠진 건 **투영 표면(Projection Surface)** — Zone 외부에서 Item 상태에 의존하는 콘텐츠. `Item.Region`은 이것의 expand-only 구현.

---

**🧑 사용자**: Radix에서 쓰이는 용어를 전부 나열해봐.

**🤖 AI**: Radix 전수 조사 → 핵심 패턴: **Trigger ↔ Content 쌍**. Content = "Item 상태에 의해 가시성이 결정되는 외부 콘텐츠". ZIFT에 이 개념이 없다.

---

**🧑 사용자**: ARIA의 모든 요소를 나열하고 매핑해봐.

**🤖 AI**: ARIA 6가지 구조 카테고리 전수 매핑. ZIFT는 5개 커버, **카테고리 3 (Content Panel)** 만 누락. tabpanel, region, tooltip content 등.

---

**🧑 사용자**: ZIFTC를 추가해야 해? 아니면 Item.Content?

**🤖 AI**: **Item.Content**. 이유: Content는 자체 상호작용 없음(보이거나 숨겨질 뿐), Item에 종속, top-level primitive 자격 없음.

---

**🧑 사용자**: Item.Content로 통일하고 ARIA를 Zone 역할에 따라 알아서?

**🤖 AI**: 맞다. OS가 Zone 역할을 보고 자동 결정: 가시성 기준(expand/select), ARIA role(tabpanel/region), aria-labelledby, tabindex, Item→Content `aria-controls` 역주입. 앱은 `for={itemId}`만 선언.

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | `Item.Region`을 `Item.Content`로 일반화. Zone 역할에 따라 가시성(expand/select)과 ARIA 속성을 OS가 자동 투영 |
| **📊 Data** | ARIA 전수 매핑에서 "Content Panel" 카테고리 누락 확인. Radix Trigger↔Content 쌍 패턴. `Item.Region` expand-only 제한 |
| **🔗 Warrant** | Content는 Item에 종속적(자체 상호작용 없음)이므로 Item의 하위 구성이 올바른 위치. Zone 역할이 이미 roleRegistry에 정의되어 있어 가시성 기준 자동 결정 가능 |
| **📚 Backing** | Radix UI (업계 표준 headless lib) — 모든 컴포넌트에서 `Content`라는 통일된 이름으로 이 개념 제공 |
| **⚖️ Qualifier** | 🟢 Clear |
| **⚡ Rebuttal** | Item→Content `aria-controls` 역주입은 새로운 엔진 로직 필요. 기존 Item.Region 사용처 마이그레이션 필요 |
| **❓ Open Gap** | 없음 |
