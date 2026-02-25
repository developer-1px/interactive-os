# Discussion: Field Headless Input — 입력→커맨드 경계의 구조적 테스트 갭

> 2026-02-25 | 발단: Todo draft Enter 버그 (리그레션)

---

## Journey

**🧑 사용자**: Todo draft에 입력하고 Enter 시 입력이 안 되는 버그가 있다. 수정이 아니라 논의할 거다.

**🤖 AI**: Field.tsx가 DOM keydown을 직접 바인딩하고 `stopPropagation`으로 OS 파이프라인을 우회한다. 이는 Project #6 "모든 변경은 하나의 문을 통과한다"와 긴장 관계다.

---

**🧑 사용자**: 파이프라인 우회는 맞지만, 핵심은 **잡아내는 방법을 구조화**하고 싶다. 1000개 테스트가 이걸 못 잡았다.

**🤖 AI**: 검증 #16 "변환 경계마다 독립된 실패 축이 있다." 1000개 테스트가 커맨드→상태 축에 집중되어 있고, **입력→커맨드 경계**를 잡는 테스트가 빠져 있을 가능성.

---

**🧑 사용자**: Todo에서 Enter로 todo 생성하는 기본 시나리오 테스트는 어떻게 하고 있어?

**🤖 AI**: 조사 결과 — Unit/Integration(8파일)은 전부 `dispatch(addTodo())` 직통. E2E(4파일)만 draft+Enter 시나리오를 커버. E2E가 잡고 있는데 왜 리그레션을 놓쳤는가?

---

**🧑 사용자**: 우리는 E2E 부담을 줄이기 위해 headlessOS를 만들었다. headless 방식으로 E2E급 통합 테스트가 없는 거야?

**🤖 AI**: 핵심 발견: headlessOS에 `simulateKeyPress`는 있지만 **텍스트 입력 시뮬레이션이 없다.** FieldRegistry에 값을 넣는 메커니즘이 headless에 없어서, 통합 테스트 작성자는 `dispatch(addTodo())` 직통이 유일한 선택지였다. **인프라 갭**.

---

**🧑 사용자**: AppPage는 Playwright 인터페이스와 맞추는 구조인데 확인해봐.

**🤖 AI**: AppPage 인터페이스 확인:
- `keyboard.press()` ✓, `click()` ✓, `goto()` ✓, `attrs()` ✓, `query()/html()` ✓
- `keyboard.type()` ✗ **없음**, `fill()` ✗ **없음**
- "Same test code, different runtime" 약속이 **Field 입력에서 깨져 있다.**
- 설령 `type()`을 추가해도 `keyboard.press("Enter")`가 Field commit을 트리거하지 못함 — Field.tsx가 OS 파이프라인 밖에서 처리하므로.

---

**🧑 사용자**: 프로젝트로 만들자.

---

## Conclusion

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | AppPage에 `keyboard.type()` / `fill()` 추가 + Field Enter 처리를 OS 파이프라인으로 올리면, headless 통합 테스트가 입력→커맨드 경계를 검증할 수 있고, "Same test code, different runtime" 약속이 완성된다 |
| **📊 Data** | ① 1000개 테스트 중 입력→커맨드 경계를 잡는 것은 E2E뿐 (unit/integration은 dispatch 직통) ② AppPage에 keyboard.type/fill이 없다 ③ Field.tsx가 DOM keydown으로 Enter를 직접 처리하여 OS 파이프라인 밖에 있다 ④ headless `simulateKeyPress("Enter")`가 Field commit을 트리거하지 못한다 |
| **🔗 Warrant** | headless 통합 테스트가 입력→커맨드 경계를 검증하려면, (a) 텍스트 입력 수단과 (b) Enter→commit 경로가 모두 OS 파이프라인 안에 있어야 한다. 현재 (a)도 (b)도 없다 |
| **📚 Backing** | 검증 #16 "변환 경계마다 독립된 실패 축" / Project #6 "모든 변경은 하나의 문을 통과한다" / Goal #7 "앱은 의도를 선언하고, OS가 실행을 보장한다" / AppPage "Same test code, different runtime" 설계 선언 |
| **⚖️ Qualifier** | **Complicated** — 두 가지 갭(텍스트 입력 + Enter 파이프라인)을 메우면 해결 경로가 명확하다 |
| **⚡ Rebuttal** | ① Field Enter를 OS 파이프라인으로 올리면 IME 컴포지션(isComposing) 처리가 복잡해질 수 있다 ② 기존 Field.tsx DOM listener에 의존하는 코드가 있을 수 있다 (영향 범위 분석 필요) ③ E2E를 자주 돌리는 것으로도 리그레션 탐지는 가능하나, 피드백 루프가 느리다 |
| **❓ Open Gap** | ① Field Enter를 resolveKeyboard로 올릴 때 immediate/deferred mode 모두 커버 가능한가? ② FieldRegistry.updateValue()를 headless에서 직접 호출하는 것이 Playwright fill()과 동등한 추상화인가? ③ 다른 앱(builder, docs-viewer)의 Field도 같은 갭이 있는가? |

### Warrants 누적

| # | Warrant |
|---|---------|
| W1 | Field.tsx가 DOM keydown을 직접 바인딩하고 stopPropagation으로 OS 파이프라인을 우회한다 |
| W2 | 이는 Project #6 "하나의 문" 원칙과 긴장 관계다 ← supports W1 |
| W3 | 1000개 테스트 중 unit/integration은 입력→커맨드 경계를 미검증 — 검증 #16 "축별 독립 실패" |
| W4 | E2E에 해당 시나리오가 존재하지만 리그레션을 놓침 — 커버리지가 아닌 다른 원인 |
| W5 | headlessOS에 simulateKeyPress는 있지만 텍스트 입력 시뮬레이션이 없어서 통합 테스트가 이 경계를 테스트할 수 없다 — 인프라 갭 |
| W6 | headless simulateKeyPress("Enter")가 Field commit을 트리거할 수 없다 — Field가 OS 파이프라인 밖이므로 |
| W7 | Field Enter를 OS 파이프라인으로 올리면 headless 테스트가 구조적으로 가능하고, Project #6 + Goal #7에 부합 |
| W8 | AppPage가 "Same test code, different runtime"을 선언하지만 keyboard.type/fill이 없어서 Field 시나리오에서 약속이 깨져 있다 |
