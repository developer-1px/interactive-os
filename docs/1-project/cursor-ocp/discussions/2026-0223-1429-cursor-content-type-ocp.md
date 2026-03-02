# Discussion: BuilderCursor 분류 축 전환 + OCP

## Journey

**🧑 사용자**: builderCursor의 태그와 색상의 종류라고 하는건 블록의 종류가 아니라 Text Icon Section Image Button등 컨텐츠의 종류야

**🤖 AI**: 현재 `TYPE_COLORS`가 블록 타입(hero, news…)으로 분류하고 있지만, `PropertyType`이 이미 컨텐츠 분류 체계를 정의하고 있고, `6-project/` 구조가 이를 물리적으로 증명. 각 필드 아이템이 자신의 PropertyType을 어떻게 선언해야 하는지?

---

**🧑 사용자**: 맞아. 그리고 cursor에서 분기하거나 색상을 만들면 OCP하지 못해 이점도 해결하고 싶어

**🤖 AI**: Cursor가 소비자인데 역산 로직까지 갖고 있는 것이 문제. OCP = 선언하는 쪽이 메타 소유, 소비자는 읽기만. 메커니즘: A(ZoneRegistry 확장) vs B(앱 레벨 CursorRegistry). 관할권은?

---

**🧑 사용자**: B지 이건 빌더의 기능이고 책임이지 OS의 문제가 아니야

**🤖 AI**: 명확. Builder 내부에 경량 `Map<itemId, { tag, color }>`. 포커스 변경이 이미 리렌더 트리거이므로 별도 반응성 불필요. 등록 API는 명령형(useEffect) vs 선언형(상수)?

---

**🧑 사용자**: 명령형 선언형 중에서는 언제나 선언형을 먼저 고려해

**🤖 AI**: 각 프리미티브가 `CURSOR_META` 상수로 정체를 선언 + `useCursorMeta(id, META)` 호출 1줄. 등록/해제는 훅이 캡슐화. 색상은 프리미티브가 하드코딩 vs 팔레트 자동 해결?

---

**🧑 사용자**: 프리미티브가 하드코딩해도 괜찮아. 대단히 재사용까지는 필요없어 이건 정말로 빌더 전용이니까

---

**한 줄 요약**: 블록 타입 역추론에서 선언형 컨텐츠 타입 레지스트리로, BuilderCursor를 순수 소비자로 전환하는 OCP 리팩토링.

---

## Conclusion

### Why
커서가 보여주는 정보의 본질은 "어느 블록에 있는가"가 아니라 **"무엇을 다루고 있는가"**이다. Hero 안에서든 News 안에서든, 사용자가 편집하는 것은 text, icon, button, image의 구분이 중요하다.

### Intent
BuilderCursor의 색상/태그를 **컨텐츠 타입 기반**으로 전환하되, Cursor 코드 자체는 어떤 컨텐츠 타입이 있는지 **알 필요가 없는** OCP 구조를 만든다.

### Warrants

1. **W1**: 커서 = "지금 무엇을 다루고 있는가" 표시. 블록 타입이 아니라 컨텐츠 타입.
2. **W2**: `PropertyType`이 이미 컨텐츠 분류 체계를 정의.
3. **W3**: `6-project/` 구조가 이 분류를 물리적으로 증명.
4. **W4**: OCP = 선언하는 쪽이 메타 소유, 소비자는 읽기만.
5. **W5**: Hollywood Principle — 프리미티브 → Cursor 방향.
6. **W6**: 관할권: Builder 내부 문제, OS 확장 불필요.
7. **W7**: 포커스 변경이 리렌더 트리거이므로 Map 충분.
8. **W8**: 선언형 우선: 프리미티브는 상수로 정체를 선언, lifecycle은 훅이 캡슐화.

**한 줄 요약**: 프리미티브가 자신의 컨텐츠 타입을 선언하고, BuilderCursor는 읽기만 하는 선언형 OCP 구조.
