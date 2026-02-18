# Discussion Journey: Keybinding `when` 조건의 재설계

> 2026-02-11 — Gap 4 논의 과정 대화록

---

**🤖 AI**: Gap 4 — 앱 레벨 keybinding `when` 조건. 현재 `when: "navigating" | "editing"` 만 지원하는데, 앱이 `isDraftFocused` 같은 커스텀 조건을 쓰려면 확장해야 한다. zone 분기는 scope routing으로 이미 해결되지 않나?

**🧑 사용자**: 일단 책임부터. 키보드는 커널의 책임도 아냐. OS는 인프라를 제공. 사용은 App이 한다.

> 💡 핵심 전환: Gap 4가 "커널이 when을 지원해야 한다"로 프레이밍된 것 자체가 틀렸다. 커널은 키보드를 모른다.

---

**🤖 AI**: 그러면 Gap 4는 커널이 아니라 OS keybinding 인프라의 문제. `activeZone === "sidebar"` 같은 건 scope routing으로 이미 해결 가능하지 않나?

**🧑 사용자**: `Expect("activeZone").toBe("sidebar")` — 맞아 이건 과거의 설계. 과거의 AI는 VS Code 기반 모델을 추천했었거든.

> 💡 VS Code `when` clause가 참조 모델이었음을 확인. flat namespace용 설계가 scope tree 위에 올라간 것.

---

**🤖 AI**: VS Code는 flat namespace라 `when`이 유일한 라우팅 수단이었지만, 이 OS는 scope tree + bubbling이 있으니 zone 분기가 불필요. `when`에 남는 건 `isDraftFocused` 뿐.

**🧑 사용자**: when 패턴이 구린 건 결국 키보드는 지금 focus를 받는 데서 처리하고 버블링을 하는 게 맞지.

> 💡 키보드 라우팅 = DOM 이벤트 모델. focused zone → bubble up. Top-down `when` routing은 잘못된 방향.

---

**🤖 AI**: 키맵을 누가 들고 있어야 하나? App vs Zone?

**🧑 사용자**: (zone이 들어야 한다는 전제 확인 후) 커맨드 팔레트는 App이라는 Zone에서 처리하면 돼.

---

**🤖 AI**: editing/navigating은 어느 레이어인가?

**🧑 사용자**: 2가지가 있어. OS level에서 keyboard가 IME 모드일 때 (부가정보도 줄 수 있고, chip 모드 등). 아니면 App의 state에서 정말 앱 상태를 관리할 때.

> 💡 `when`이 섞고 있던 3가지 관심사를 분리:
> 1. OS 게이트 (DOM focus + IME)
> 2. Scope routing (zone 분기)
> 3. App state 분기 (command handler)

---

**🤖 AI**: OS keyboard 상태를 `defineContext("os:keyboard")`로 제공하면 FocusInfo와 동일 패턴. keybinding resolver도 앱도 같은 context를 읽는다.

**🧑 사용자**: 좋아. 닫고 진행하자.

---

## 한 줄 요약

> **`when`은 VS Code의 flat namespace 해법을 scope tree 위에 올린 오설계였고, OS 게이트 / scope bubbling / context injection 3-layer로 자연 분해된다.**


---

# Discussion Conclusion: Keybinding `when` 조건의 재설계

> 2026-02-11 — Gap 4 논의 결론

## Claim

**VS Code 스타일의 `when` 조건 시스템은 scope tree를 가진 아키텍처에서 과잉 설계이며, 3개의 독립 레이어로 분해하여 대체한다.**

## Grounds (근거)

- 기존 `when`은 세 가지 관심사를 하나로 섞고 있었다:
  1. **OS 게이트**: 키보드가 input/IME로 가는지 scope chain으로 가는지
  2. **Zone 라우팅**: 어떤 zone이 키를 받는지 (sidebar vs listView)
  3. **App state 분기**: 앱 내부 상태에 따른 커맨드 선택 (isDraftFocused)

- VS Code는 flat namespace → `when`이 유일한 라우팅 수단
- 이 OS는 scope tree + bubbling → zone 라우팅이 이미 해결됨

## Warrant (논거)

| # | Warrant |
|---|---|
| W1 | 키보드는 공유 자원 — 같은 키가 상태에 따라 다른 일을 해야 한다 |
| W2 | Scope routing이 zone-level 분기를 대체할 수 있다 |
| W3 | 커널은 키보드를 모른다. `when`은 OS 인프라의 문제 |
| W4 | OS가 인프라를 제공하고, 앱이 사용하는 구조 |
| W5 | VS Code `when`은 flat namespace용. scope tree가 있으면 zone 분기가 불필요 |
| W6 | Zone이 키맵을 소유하면 mount/unmount가 자동 등록/해제 |
| W7 | 키보드 라우팅은 DOM 이벤트 모델과 동일: focused zone → bubble up |
| W8 | `when`은 top-down routing이었고, bottom-up bubbling이 올바른 모델 |
| W9 | `editing/navigating`은 OS 게이트 (DOM focus + IME), 앱 상태가 아님 |
| W10 | `when`은 3가지 관심사를 하나로 섞고 있었다 |
| W11 | OS keyboard 정보는 `defineContext`로 제공. FocusInfo와 동일 패턴 |
| W12 | `when: "editing/navigating"`은 게이트 로직으로 남되, context에서 읽는다 |

## Backing (해결 모델)

| 관심사 | 해결 메커니즘 | 레이어 |
|---|---|---|
| 키가 input으로 가나? | OS 게이트 — `defineContext("os:keyboard")` | OS |
| 어떤 zone이 받나? | Scope-specific keybinding 등록 + bubble | OS infra |
| zone 안에서 뭘 하나? | Command handler + context injection | App |

## Rebuttal (반론 대응)

- **"커맨드 정체성 문제"**: 하나의 ACTIVATE에 여러 분기 → transaction log에 전부 "ACTIVATE"로 찍힘
  - 대응: Zone별로 다른 커맨드를 등록하면 됨 (ADD_TODO, START_EDIT 등). ACTIVATE는 OS 레벨 generic action.
- **"Command Palette에서 전체 키맵 파악"**: Zone이 키맵을 소유하면 앱 차원 총 목록이 없음
  - 대응: 개밥먹기 시 재논의. Zone 등록 시 registry에 누적하면 해결 가능.

## 한 줄 요약

> **`when`은 flat namespace의 해법이었고, scope tree가 있는 아키텍처에서는 OS 게이트 + scope routing + context injection 3-layer로 자연 분해된다.**
