# Discussion: Block Tree & Tab Container

> 2026-02-20 11:13~11:31

## Journey

**🧑 사용자**: 빌더에 탭 메뉴를 추가하고 싶은데 어떻게 UI를 만들면 좋을지 같이 논의

**🤖 AI**: "탭 메뉴"가 빌더 레이아웃의 어느 위치에 들어가는 것인가? (사이드바 / 캔버스 상단 / 속성 패널 / 페이지 블록 안)

---

**🧑 사용자**: 탭에 따라 콘텐츠가 달라지는 페이지들이 있는데 이걸 빌더 내부에 녹여서 표현하려 한다. **탭뷰의 컨테이너 블록** 개념.

**🤖 AI**: 이건 데이터 모델의 계층화 문제다. 현재 `sections: SectionEntry[]`는 플랫. 컨테이너가 생기면 `children`이 필요해진다. 방식 A(중첩 children), B(플랫+parentId), C(컨테이너 별도 타입) 중 선택.

---

**🧑 사용자**: 두번 개발하지 않을 이상적인 구조를 만든다. **빌더는 웹의 모든 콘텐츠를 inline-edit으로 편집 가능하게 하는 보편 UI**.

**🤖 AI**: 핵심 발견 — **SectionEntry는 이미 Block의 원형이다.** type, fields, registry가 존재. 부족한 것은 `children` 뿐. 모든 성숙한 빌더(Webflow, Framer, Gutenberg)는 재귀적 Block Tree에 수렴한다.

---

**🧑 사용자**: Props 검증은 B(렌더러가 검증). 핵심은 **Builder Primitives로 편집 방식 고정**. 디자인은 자유, 웹 아이템(버튼, 링크, 글자, 이미지, 아이콘)은 제한적이니 조립만 하면 편집 가능.

**🤖 AI**: **Builder Primitives가 곧 Schema.** zod 불필요. 프리미티브 사용 자체가 "이 부분은 이렇게 편집된다"는 선언. 웹 콘텐츠의 편집 가능한 원자 값은 전부 문자열이므로 `fields: Record<string, string>` 유지 가능.

---

**🧑 사용자**: Builder Primitives에 Tab이 들어가야 하는데 어떻게 녹일 수 있나?

**🤖 AI**: Tab은 콘텐츠 프리미티브가 아니라 **구조 프리미티브**. Section/Group과 같은 계층. ARIA tablist 패턴 → ZIFT FocusGroup으로 매핑. Tabs/Accordion/Carousel은 "N개 자식, 조건부 가시성"이라는 동일 추상의 변형.

---

**🧑 사용자**: 탭 활성 상태는 보통 URL 바인딩. 새로 열면 첫 탭 기본.

**🤖 AI**: Clear. 런타임 관심사(로컬 상태 + URL 바인딩). 블록 데이터에 저장할 필요 없음.

---

**🧑 사용자**: 사이드바는 PPT처럼 indent를 살짝 줘서 트리 표현. 접기/펼치기도 가능.

**한 줄 요약**: "탭 메뉴 추가"에서 출발하여 **보편 Block Tree 모델 + Container 구조 프리미티브**라는 빌더의 근본 아키텍처를 발견했다.

---

## Conclusion

### Why
빌더가 웹의 모든 콘텐츠를 inline-edit으로 편집 가능하게 하려면, 현재의 플랫한 `SectionEntry[]`를 넘어 재귀적 블록 트리가 필요하다.

### Intent
**Design Block(자유) + Editing Overlay(고정)**의 분리로, 어떤 디자인이든 Builder Primitives로 감싸면 편집 가능하게 되는 보편 빌더 모델을 확립한다.

### Warrants
- W1. `SectionEntry`는 이미 Block의 원형 (type, fields, registry)
- W2. 부족한 것은 `children`(계층)과 타입 개방(string union → 레지스트리)
- W3. 모든 성숙한 빌더(Webflow, Framer, Gutenberg)는 재귀적 Block Tree에 수렴
- W4. ZIFT의 Zone/Item/Field가 Block 컨테이너/리프/편집에 1:1 대응
- W5. **Builder Primitives가 곧 Schema** — 별도 검증 레이어 불필요
- W6. **웹 콘텐츠의 편집 가능 원자 값은 전부 문자열** — `fields: Record<string, string>` 유지
- W7. **Tab은 구조 프리미티브** — Section/Group과 동일 계층
- W8. **Tabs/Accordion/Carousel은 동일 추상의 변형** ("N개 자식, 조건부 가시성")
- W9. 탭 활성 상태는 런타임(로컬 상태 + URL 바인딩)
- W10. 사이드바는 Block Tree의 시각적 투영 — indent + collapse로 트리 표현

**한 줄 요약**: Builder Primitives(유한한 편집 원자)로 감싸면 어떤 디자인이든 편집 가능해지는 보편 Block Tree 모델을 설계하고, Tab을 첫 번째 Container 구조 프리미티브로 구현한다.
