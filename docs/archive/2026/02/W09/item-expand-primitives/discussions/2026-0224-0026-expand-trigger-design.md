# Discussion: Item.ExpandTrigger + Item.ExpandContent

> 2026-02-23 23:07 ~ 00:26

## Journey

**🧑 사용자**: T7.3은 어떻게 할까?

**🤖 AI**: ExpandTrigger는 "Item 내 Sub-Action" 패턴. 현재 OS는 Item 내부 클릭을 구분 못함. Heavy 프로젝트 가능성.

---

**🧑 사용자**: 지금 Tree를 어떻게 구현하고 있지?

**🤖 AI**: 폴더 클릭 → onAction → selectDoc(isExpandable → skip). expand/collapse는 ArrowRight/Left만 가능. 클릭으로 expand 안 됨.

---

**🧑 사용자**: 100% 선언적이잖아? radix 스러운 선언적 방법을 생각해볼래?

**🤖 AI**: Radix Accordion 참조 → Item.Trigger + Item.Content compound component 제안.

---

**🧑 사용자**: Item.Trigger는 너무 피상적. 우리는 바닥 레이어를 제공한다가 목표잖아?

**🤖 AI**: data-os-expand 속성으로 OS pipeline 확장 제안.

---

**🧑 사용자**: 관습(convention)으로 해결하는 방식은 우아하지 못해

**🤖 AI**: 관습 base 거부 수용. 구조가 강제하는 설계 필요 인정.

---

**🧑 사용자**: Item.ExpandTrigger / Trigger.Expand를 만들건 radix하게 고민해봐

**🤖 AI**: ItemContext + Item.ExpandTrigger(클릭→expand) + Item.ExpandContent(조건렌더) 설계. data-expand-trigger는 Component 투사 (FocusItem의 data-focus-item과 동일 — 관습 아님).

---

**🧑 사용자**: Item.ExpandTrigger로 하자. Trigger만 하기엔 피상적이야.

**🤖 AI**: /naming 검토. Trigger.Dismiss 선례와 일치. 충돌 없음. 확정.

> **한 줄 요약**: render prop 기반 Tree를 Item.ExpandTrigger + Item.ExpandContent compound component로 선언화.

---

## Conclusion

### Why
현재 Tree는 render prop으로 `isFocused`/`isExpanded`를 직접 읽어 조건 분기 — 명령형. 바닥 레이어답게 선언적 합성으로 전환해야 함.

### Intent
ZIFT를 `Item.ExpandTrigger` + `Item.ExpandContent`로 확장하여 선언적 Tree를 substrate 레벨에서 가능하게 한다.

### Warrants
- W1. OS = substrate (Radix 아래). 컴포넌트가 아닌 프리미티브 제공
- W2. Convention(data-attr)으로 해결 금지 — 구조가 강제해야 함
- W3. `[Primitive].[Intent][Role]` 네이밍 패턴 — Trigger.Dismiss 선례
- W4. ItemContext가 parent scope를 자동 전달 — Radix의 Context 패턴
- W5. resolveMouse 확장: ExpandTrigger 클릭 = expand + focus (onAction 억제)
- W6. data-expand-trigger는 Component 투사 (관습 아님)

### Glossary
| 개념 | 코드 이름 | 패턴 |
|------|----------|------|
| 클릭→expand 토글 | `Item.ExpandTrigger` | `[Prim].[Intent][Role]` |
| expanded 조건 렌더 | `Item.ExpandContent` | `[Prim].[Intent][Role]` |
| parent Item scope | `ItemContext` | `[Prim]Context` |
| OS 커맨드 | `OS_TOGGLE_EXPAND` | `OS_[ACTION]` |

> **한 줄**: render prop Tree를 `Item.ExpandTrigger + ExpandContent` compound component로 선언화하되, substrate 레벨 프리미티브로 설계한다.
