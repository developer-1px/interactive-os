# Discussion: Focus Recovery → Zone Item Registry → Kernel Items

## Journey

**🧑 사용자**: focus쪽 test도 이제 headless하게 만들어봐.

**🤖 AI**: focus 테스트가 구체적으로 어떤 레이어를 가리키나요? OS 커맨드 단위, APG 계약, 앱 통합, 투영 — 이미 상당 부분 headless인데.

---

**🧑 사용자**: 삭제 후 포커스 유지는 잘 되다가 다이얼로그 과정을 추가하니 안되고 하는것을 보면서 설계가 탄탄하지 못한가 싶어서 스트레스를 받았어.

**🤖 AI**: `confirmDeleteTodo`를 보니 4개 OS 커맨드를 앱이 직접 오케스트레이션하고 있다. OS가 담당하면 되고, 앱이 담당하면 깨진다 — 이것은 Hollywood Principle 위반.

---

**🧑 사용자**: (B)가 맞지. 그런데 다이얼로그 오픈/닫기는 앱의 특성인데 OS에서 어떻게 제공해줄건데? 중간에 더 복잡한 단계들이 추가된다면?

**🤖 AI**: OS는 중간 단계를 몰라도 된다. Rules #15 Lazy Resolution — 참조를 pop 시점에 현재 상태 기준으로 해석하면 중간 단계가 뭐든 상관없다.

---

**🧑 사용자**: 이건 그런데 선언적으로 안돼? 순서가 중요하지만 중요하지 않은 문제이잖아?

**🤖 AI**: (전환점) 순서는 OS의 구현 디테일이지 앱의 관심사가 아니다. 포커스 복구는 명시적 커맨드가 아니라 **상태 변경의 파생 효과(derived effect)**여야 한다. `remove`에서는 이미 이렇게 동작한다.

---

**🧑 사용자**: 해법을 다양하게 풀어볼까? 선택은 하지 말아봐.

**🤖 AI**: 5개 해법 나열 (A: pop시 resolve, B: Zone resolveFocus 계약, C: Computed State, D: Effect Bag, E: 최소 fallback). 4개 직교 축으로 정리.

---

**🧑 사용자**: 우선 널리 알려진 해법이나 표준이 있어?

**🤖 AI**: (전환점) Flutter `FocusScopeNode` — 부모 Scope가 자식 삭제 시 자동 복구. APG Dialog — trigger 소멸 시 "logical" 위치로. re-frame — 효과를 데이터로 선언. **Flutter가 가장 직접적 선례.**

---

**🧑 사용자**: 그러면 우리는 Flutter 패턴을 왜 못하는데?

**🤖 AI**: 못하는 이유가 없다. 유일한 gap: `applyFocusPop`이 10줄짜리 함수인데, resolve를 안 넣은 것뿐. 타이밍 한 틱 차이만 해결하면 된다.

---

**🧑 사용자**: 오컴의 면도날 규칙에 대입해봐. 맞아?

**🤖 AI**: (전환점) 과잉 설계하고 있었다. stale focusedItemId는 overlay pop만의 문제가 아니라 범용 문제(필터, undo, 서버 갱신...). **시나리오별 복구 코드 자체가 엔트로피 증가.** FocusGroup이 렌더할 때 자식 존재 확인 — 새 개체 0.

---

**🧑 사용자**: 그러면 더 low한 설계문제를 풀어야 하는거야? 그게 뭔데?

**🤖 AI**: **Zone이 자기 자식 목록을 모른다.** 이게 전부. Flutter의 FocusScopeNode가 동작하는 이유는 자식 목록을 알기 때문.

---

**🧑 사용자**: 어째서 우리는 Zone이 자식을 모르게 설계가 되었지?

**🤖 AI**: 의도적이었다. Rules #11 "복제본을 동기화하려는 순간이..." — 앱 상태의 아이템을 OS에 복제하면 동기화 지옥. 네비게이션은 DOM 쿼리로 복제 없이 동작했다.

---

**🧑 사용자**: 맞아. 그런데 그것도 이상해. 초창기에는 DOM이 진실의 원천이었다가 이후에는 100% headless라는 컨셉으로 전부 inject하도록 했는데. DOM 관찰은 DOMRect 때문이지 DOM으로 children을 알고자 한게 아닐텐데?

**🤖 AI**: (최종 전환점) **`DOM_ITEMS`가 레거시.** 프로덕션에서 `querySelectorAll("[data-item-id]")`로 DOM에서 읽고, headless 테스트에서는 mock으로 속이고 있다. headless 원칙대로라면 아이템은 kernel state에 있어야 한다.

---

**🧑 사용자**: 큰 수술이겠구만. 화이팅이야!

---

> **한 줄 요약**: "포커스 테스트를 headless로"에서 출발해, 포커스 복구 합성 → Zone 자식 인식 → DOM_ITEMS 레거시 발견까지 5단계를 거쳐, **"아이템 목록을 kernel state로 올리면 4개 문제가 동시에 해결된다"**는 결론에 도달.

---

## Conclusion

### Why
포커스 복구가 오버레이 합성에서 깨지는 근본 원인은 **Zone이 자기 자식을 모르기 때문**이고, 그 이유는 `DOM_ITEMS`가 아직 DOM querySelectorAll에 의존하는 레거시이기 때문.

### Intent
아이템 목록을 DOM이 아닌 **kernel state**에서 관리하면:
1. Zone이 자식을 알게 되어 **stale focus 자동 감지**
2. `applyFocusPop`이 삭제된 아이템을 자동 resolve → **포커스 복구 자동화**
3. headless 테스트에서 mock 불필요 → **진짜 headless**
4. 앱의 수동 오케스트레이션 제거 → **엔트로피 감소**

### Warrants (최종)
- W1. `createPage` + `pressKey`/`click`/`attrs`는 검증된 headless 테스트 패턴
- W2. Rules #17: headless 재현 가능해야 한다
- W3. OS가 담당하면 포커스 복구 동작, 앱이 담당하면 깨짐
- W4. `confirmDeleteTodo` 4-command 오케스트레이션은 엔트로피 증가
- W5. Rules #15 Lazy Resolution: 스택 참조를 pop 시점에 현재 상태 기준으로 해석
- W7. 포커스 복구는 명시적 커맨드가 아니라 파생 효과(derived effect)
- W8. Rules #7 Hollywood Principle: 앱은 의도를 선언, OS가 실행 보장
- W10. Flutter FocusScopeNode가 확립된 업계 선례
- W11. APG Dialog: "logical work flow"로 복구 — 알고리즘은 플랫폼 책임
- W15. Occam's Razor: stale focusedItemId는 범용 문제, 범용 해법 하나로
- W17. 근본 원인: Zone이 자식 아이템 목록을 모른다
- W18. Zone이 자식을 모르는 것은 Rules #11(복제본 금지)의 의도적 결과 — 하지만 headless 전환 후에는 state가 truth
- W20. DOM은 기하(DOMRect) 전용. 구조(children)를 DOM에서 읽는 것은 headless 위반
- W21. `DOM_ITEMS`의 프로덕션 구현이 querySelectorAll — 이것이 레거시
- W22. 아이템 목록을 kernel state로 올리면 4개 문제가 동시에 해결

> **한 줄 요약**: DOM_ITEMS를 kernel state로 올리는 것이 Zone 자식 인식 → stale focus 자동 감지 → 포커스 복구 자동화 → headless 완성의 열쇠다.
