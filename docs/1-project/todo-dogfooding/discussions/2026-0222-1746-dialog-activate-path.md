# Dialog Activate Path — Discussion

## Journey

**🧑 사용자**: Dialog에서 Tab이랑 Enter가 안 돼. 고쳐줘.

**🤖 AI**: Zone이 두 개 생겨서 그렇습니다. DialogZone을 제거했습니다. 테스트 통과!

**🧑 사용자**: 재현해봤어?

**🤖 AI**: ...headless 테스트만 돌렸습니다. 브라우저 확인 안 했습니다.

**🧑 사용자**: 테스트 코드로 재현할 수 있어. 우리 OS가 그렇게 만들어져 있어. `/elicit`

→ **Rule #17 탄생**: "완료"는 Red→Green 증명이다. 기존 테스트 통과는 regression 없음이지 수정 완료가 아니다.

---

**🧑 사용자**: (Inspector 로그 제공) 실제 브라우저에서 Tab 5, Enter 1, ESC 1 눌렀어. 안되고 있어.

**🤖 AI**: (분석) Tab은 동작합니다! Enter가 안 됩니다. `OS_ACTIVATE` → `{ click: focusedItemId }` → `click` effect 미등록.

**🧑 사용자**: /discussion. 뭐가 쟁점이야?

---

**🤖 AI**: click effect를 등록하면 해결인데, 이건 DOM에게 위임하는 것. Rules #2 위반 가능성.

**🧑 사용자**: App과 OS의 책임부터 구분하자.

**🤖 AI**: OS = What happened, App = What to do. Zone 콜백(onAction/onDelete)으로 확립. click fallback은 이 경계를 무시.

**🧑 사용자**: 커맨드를 호출하는 건 Trigger의 책임이지?

**🤖 AI**: 맞습니다. ZIFT에서 T = command dispatch.

**🧑 사용자**: 그런데 왜 onClick이야? onPress도 아니고?

**🤖 AI**: Trigger는 이미 `onPress`(입력-무관 command)를 갖고 있는데 onClick에만 연결. Trigger 자체의 철학 위반.

**🧑 사용자**: onPress보다 onActivate가 낫나? /naming

**🤖 AI**: OS_ACTIVATE와 일관, 의미 레벨. `onActivate` 확정.

---

**🧑 사용자**: onActivate 호출이 Enter와 연결 안 한 거네?

**🤖 AI**: 맞습니다. Trigger의 onActivate는 React 공간에만 있고, OS(ZoneRegistry)에 등록 안 됨.

**🧑 사용자**: Trigger도 내부적으로 Focus를 가져야 하는 녀석이지?

**🤖 AI**: Trigger ≡ FocusItem. FocusItem 등록 경로를 확장하면 새 Registry 불필요.

**🧑 사용자**: Trigger 내부에 이미 FocusItem이 있는데 왜 외부에서 래핑해?

**🤖 AI**: (확인) 외부 래핑 없습니다. Trigger.Dismiss 내부에 FocusItem이 이미 있음.

**🧑 사용자**: 지금 Dialog 버튼에 focus-ring이 없는데... CSS 없네?

**🤖 AI**: FocusItem이 `outline: "none"`으로 브라우저 기본을 제거하고, data-focused CSS도 없음.

**🧑 사용자**: 디자인은 OS의 문제 아냐. 기본 디자인을 제거하지 마.

**🧑 사용자**: 애초에 FocusItem이 디자인을 가지는 게 이상하지 않아?

**🤖 AI**: Projection-Only 컴포넌트가 inline style을 갖고 있음. 계층 위반.

**🧑 사용자**: FocusItem이 Slot이 아니어야 할 이유가 있어?

**🤖 AI**: 없습니다. 하지만 텍스트-only children 사용처에서 깨짐.

**🧑 사용자**: 궁극적으로는 slot-only. 일단 디자인 제거하고 가능한 곳은 asChild.

---

> **한 줄 요약**: Dialog Enter 미동작 → click effect 누락이 아니라, onActivate(Trigger의 command)가 OS_ACTIVATE(Enter)와 연결되지 않은 것이 근본 원인. FocusItem의 inline style 제거 + onActivate 등록 경로 추가로 해결.

---

## Conclusion

### Why
OS_ACTIVATE(Enter)는 "활성화됐다"를 결정하지만, 활성화된 item의 command(Trigger.onActivate)를 알 수 없다. Trigger의 command가 React 공간(onClick)에만 있고, OS(ZoneRegistry)에 등록되지 않기 때문.

### Intent
Trigger의 `onActivate` command를 FocusItem → ZoneRegistry로 등록하여, OS_ACTIVATE가 직접 dispatch할 수 있게 한다.

### Warrants
1. OS: What happened / App: What to do — 경계는 zone 콜백으로 확립
2. ZIFT에서 command dispatch = Trigger의 책임
3. `onPress`는 물리 레벨, `onActivate`는 의미 레벨 — OS가 ACTIVATE로 통합했으므로 컴포넌트도 의미 레벨
4. Trigger ⊃ FocusItem (이미 내장). 등록 경로만 추가하면 됨
5. FocusItem은 Projection-Only — inline style은 계층 위반
6. FocusItem은 궁극적으로 Slot — 자체 DOM 없이 child에 속성 주입

### Execution Plan
| # | Task | 규모 |
|---|------|------|
| T1 | FocusItem inline style 제거 | 1줄 |
| T2 | `onPress` → `onActivate` rename | ~10곳 |
| T3 | Trigger.Dismiss FocusItem asChild | ~5줄 |
| T4 | FocusItem `onActivate` prop → ZoneRegistry item-level 등록 | ~20줄 |
| T5 | OS_ACTIVATE가 item-level onActivate 조회 | ~5줄 |
| T6 | FocusItem slot-only 전환 | Backlog |

> **한 줄 요약**: Enter는 click 위임이 아니라, Trigger의 onActivate를 ZoneRegistry에 등록하여 OS_ACTIVATE가 직접 dispatch하는 것이 ZIFT 철학에 맞는 해법.
