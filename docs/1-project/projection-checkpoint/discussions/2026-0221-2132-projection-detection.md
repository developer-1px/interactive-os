# Discussion: 투영 버그 감지 — headless에서 DOM 존재를 어떻게 아는가?

> 2026-02-21 20:42 ~ 21:32

## Journey

**🧑 사용자**: Inspector 로그를 첨부. Backspace → `OS_DELETE` → `requestDeleteTodo` → `OS_OVERLAY_OPEN` 파이프라인이 정상 동작하지만, TodoApp에서 Dialog가 안 뜬다.

**🤖 AI**: 파이프라인은 정확하고, `TriggerPortal`이 `os.overlays.stack`을 구독하므로 React가 re-render해서 `<dialog>`를 보여줘야 한다. 하지만 실제 브라우저 확인이 필요하다.

---

**🧑 사용자**: 브라우저 열어줄 테니 직접 확인해봐.

**🤖 AI**: 브라우저에서 확인. `document.querySelectorAll('dialog').length === 0`. State는 설정됐지만 DOM에 dialog가 없다. 원인: `createCompoundTrigger`에서 `Dialog.Content`를 새 함수로 래핑 → `DialogRoot`의 reference identity check(`child.type === DialogContent`) 실패 → `Trigger.Portal` 미생성.

**🤖 AI**: 한 줄 수정. `const ContentComponent = Dialog.Content;` — 래핑 제거. Dialog 정상 동작 확인.

---

**🧑 사용자**: 이런 걸 검증할 수 있는 장치를 어떻게 만드나?

**🤖 AI**: Headless 테스트가 이 버그를 잡을 수 있었는가? State만으로는 불가능 — state가 맞으니까.

**🧑 사용자**: LLM이 무엇을 알았어야 했나를 중심으로.

**🤖 AI**: LLM의 병목은 Repair가 아니라 Detection이다. 신호가 없으면 코드를 볼 이유가 없다.

**🧑 사용자**: 화면에 나와야 할 DOM이 전부 나와 있는지만 알았어도?

**🤖 AI**: 맞다. 실패 신호 = State와 DOM의 불일치. 둘 다 알아야 불일치를 발견한다.

---

**🧑 사용자**: `createPage(ListView)` 이런 방법은?

**🤖 AI**: Headless + projection checkpoint를 단일 API로. RTL과 패러다임이 다르다: 행동 먼저, DOM은 checkpoint.

**🧑 사용자**: 이상과 현실을 구분해라.

**🤖 AI**: 핵심 결정 3개 — 렌더 엔진, State 격리, 질의 API.

**🧑 사용자**: 아키텍처는 바꿔도 된다. 되기만 하면 돼. 목적은 LLM 자율 개발의 가드레일.

---

**🧑 사용자**: `renderToString` 말고 VDOM 직접 쓰면 안 되나?

**🤖 AI**: hooks가 있으면 reconciler 없이 불가. `renderToString`이 최소 비용으로 reconciler를 돌리는 방법.

**🧑 사용자**: React 팀은 왜 VDOM 출력을 버렸나?

**🤖 AI**: 유지보수 비용 (두 개의 reconciler), 구현 디테일 테스트 경계, JSDOM을 대안으로 제시.

**🧑 사용자**: `renderToString` 방식으로 `createPage`를 만들자.

---

**한 줄 요약**: State만으로는 투영 버그를 감지할 수 없다. `createPage(Component)`에 `renderToString` 기반 projection checkpoint를 통합하여, LLM이 브라우저 없이도 state-DOM 불일치를 감지할 수 있게 한다.

---

## Conclusion

### Why
LLM의 자율 개발 루프에서 가장 큰 병목은 **Detection**이다. state가 맞지만 투영이 깨지는 배선 버그는 headless에서 신호가 없어 영원히 감지되지 않는다.

### Intent
headless 테스트에 DOM 존재 검증(projection checkpoint)을 최소 비용으로 추가하여, LLM이 브라우저 없이 **감지 → 진단 → 수정 → 재검증** 루프를 완성할 수 있게 한다.

### Warrants

- W1. Headless 테스트는 파이프라인 정확성의 증명이다
- W14. State 정확성 ≠ Projection 정확성. 배선 버그는 별도 축
- W18. LLM의 병목은 Detection. 신호가 없으면 코드를 볼 이유가 없다
- W19. State 검증만으로는 배선 버그의 실패 신호를 생성할 수 없다
- W20. 실패 신호 = State와 DOM의 불일치
- W21. DOM 정보 없는 headless는 투영 버그에 대해 blind
- W22. React VDOM은 JS 객체. 브라우저 없이 검사 가능
- W23. `renderToString`은 React를 1회 실행해 HTML 반환. 최소 비용 경로
- W24. `createPage(Component)` = headless + projection checkpoint 통합
- W25. RTL은 DOM-centric, createPage는 Pipeline-centric
- W28. 목적은 LLM 자율 개발의 가드레일
- W29. 구현 디테일은 "되기만 하면 된다"

### 한 줄 요약
**`createPage(Component)` + `renderToString` = LLM이 브라우저 없이 state-DOM 불일치를 감지하는 최소 비용 가드레일.**
