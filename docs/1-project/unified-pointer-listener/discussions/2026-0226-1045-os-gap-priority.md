# Discussion: OS Gap 우선순위와 Unified PointerListener 스코핑

> 날짜: 2026-02-26 10:40–10:45

## Journey

**🧑 사용자**: 백로그의 OS gap들을 하나씩 만들어보자.

**🤖 AI**: OS gap 4개(OG-001 Dropdown, OG-003 Listener 충돌, OG-004 drag-handle, OG-005 커서 메타) 중 OG-001(Dropdown Zone)을 추천. APG 스펙 존재 + 앱 임팩트 높음.

---

**🧑 사용자**: OG-003이 먼저. 정답이 있는 문제이면서 가장 하위 레이어니까.

**🤖 AI**: 동의. Gesture Recognizer는 업계 표준(iOS/Android). Phase 1 = 최하위 레이어, 기반 먼저. 초기 Complex 분류를 Complicated로 수정. OG-004(drag-handle)도 같은 프로젝트에 포함 제안.

---

**🧑 사용자**: 별개의 프로젝트로 관리하되, OG-004의 기능을 OG-003의 검증 수단으로 활용하자.

**🤖 AI**: 동의. OG-003 = 기존 동작 1:1 이식 + 통합, OG-004 = 새 기능(자동 주입). `data-drag-handle` 감지가 OG-003의 검증 시나리오 중 하나가 됨. 스코프 깔끔하게 분리, 의존 관계 자연스럽게 형성.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | MouseListener + DragListener를 단일 PointerListener로 통합한다. Gesture Recognizer 패턴. |
| **📊 Data** | MouseListener(`mousedown`/`click`)와 DragListener(`pointer*`)가 같은 물리 제스처를 경쟁 처리. `e.preventDefault()` 충돌 발생. W3C spec상 pointer events가 mouse events보다 먼저 fire. |
| **🔗 Warrant** | "같은 손가락, 같은 Listener." + Phase 1 = 최하위 레이어 → 기반 먼저 + Gesture Recognizer = 업계 표준(iOS UIGestureRecognizer, Android MotionEvent) |
| **📚 Backing** | W3C Pointer Events Level 2, W3C UI Events (Mouse §3.4), iOS UIGestureRecognizer, 기존 프로젝트 패턴(Sense/Translate 분리) |
| **⚖️ Qualifier** | Complicated — 방향(Gesture Recognizer)은 명확, MouseListener edge case 이식이 분석 필요 |
| **⚡ Rebuttal** | MouseListener 310줄의 모든 edge case(label, zone-only click, caret seeding, EDIT→EDIT 전이)를 빠짐없이 이식해야 함. 하나라도 누락하면 regression. |
| **❓ Open Gap** | FocusListener와 PointerListener 사이의 `dispatching` 플래그 동기화 방식 |

## References

- `docs/5-backlog/os-gaps.md`
- `docs/5-backlog/2026-0226-unified-pointer-listener.md`
- `docs/5-backlog/2026-0226-dnd-pipeline-gap-retrospect.md`
- `docs/5-backlog/2026-0218-1710-listener-sense-translate.md`
