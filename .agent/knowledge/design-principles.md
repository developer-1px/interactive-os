# 설계 원칙

> 이 문서는 rules.md의 Pit of Success 원칙을 구체화하는 설계 판단 기준이다.
> 새 패턴을 만들거나, 아키텍처 선택지를 고를 때 참조한다.

---

## 엔트로피 원칙

1. **해결 = 엔트로피 감소. 동작하는 것은 해결이 아니다.** 변경 후 시스템의 고유 패턴 수가 늘었으면 그것은 해결이 아니라 악화다. 기존 메커니즘을 재사용하거나, 여러 특수 사례를 하나의 범용 메커니즘으로 대체해야 해결이다. 체크: "이 변경이 시스템에 새로운 유일한 패턴을 추가하는가?" 추가한다면 부채다.

2. **모든 산출물은 부채다.** 코드, 문서, 워크플로우 — 존재하는 것은 정당화되어야 한다. 만들면 유지 비용이 생기고, 현실과 불일치하면 결함이 된다. 미래를 위한 추측은 현재의 복잡성이다.

## 아키텍처 원칙

3. **로직이 먼저, 뷰는 바인딩이다.** 상태→조건→커맨드→뷰 바인딩 순서로 하향 정의한다. 코어(로직)가 먼저 존재하고, 어댑터(뷰)는 코어에 연결될 뿐이다. 코어는 어댑터 없이도 테스트 가능해야 한다 (Headless). — Hexagonal Architecture / Ports & Adapters (Alistair Cockburn)

4. **도메인은 도메인답게, UI는 UI답게, 경계에 순수 함수.** 도메인 자료구조(`DocItem[]`, `TodoEntity[]`)는 도메인 논리가 결정한다. UI 컴포넌트(Zone/Item)는 정규화된 포맷(`id`, `role`, `level`, `state`)만 이해한다. 도메인 데이터를 UI에 붙일 때는 경계의 순수 함수(Transform)로 변환한다. — CQRS Read Model

5. **번역기는 번역만 한다.** 입력을 커맨드로 바꾸는 자와, 커맨드를 실행하는 자는 서로를 모른다. — Single Responsibility Principle (Robert C. Martin)

6. **모든 변경은 하나의 문을 통과한다.** 상태 변경의 경로가 둘이면, 버그의 경로도 둘이다. — Command-Query Separation (Bertrand Meyer)

7. **앱은 의도를 선언하고, OS가 실행을 보장한다.** 앱 코드에 useState, useEffect, onClick이 0줄인 세계. — Hollywood Principle (Martin Fowler)

8. **OS는 행동을 제공하고, 형태는 앱이 결정한다.** 행동이 형태에 종속되면 보편성을 잃는다.

## 판단 원칙

9. **편의보다 명시적.** "상황에 따라 달라"는 매번 추론이 필요하고, "무조건 이 구조"는 제로 추론이다. 판단에는 체크리스트, 숫자, 분류 기준 등 검증 가능한 기준이 있어야 한다. — Pit of Success (Rico Mariani)

10. **이름은 법이다.** 하나의 개념에 하나의 이름. grep 한 번이면 모든 연결이 보여야 한다. — Ubiquitous Language (Eric Evans, DDD)

11. **표준은 행동 스펙이다. 구현 방법이 아니다.** W3C/APG가 정의한 행동은 따르되, 구현은 OS가 자체 메커니즘으로 제공한다.

12. **100% 타입.** 타입은 가드레일이다. Make Illegal States Unrepresentable (Yaron Minsky). `as unknown as` 캐스팅이 필요한 API는 타입이 현실을 반영하지 못하고 있다는 신호다.

13. **학습 비용을 0으로 만든다.** 이미 아는 것으로 새것을 표현한다. 이전 앱에서 배운 패턴이 다음 앱에서도 동일하게 동작해야 한다. — Principle of Least Astonishment (POLA)

## 상태 배치 원칙

14. **상태는 변경 주체에 따라 배치한다.** 유저 액션으로 바뀌는 상호작용 상태(focus, selection, expanded) → kernel state. 앱 로직으로 결정되는 선언 상태(disabled, role, config) → ZoneRegistry. "누가 바꾸는가"가 배치 기준이다.

15. **상태 변경은 신호(Signal)와 소음(Noise)으로 분리된다.** 빈번한 OS 이벤트(포커스, 키보드) 자체는 상태 변이를 일으키지 않는 한 소음이다. 유의미한 상태 변경(STATE_MUTATION)을 우선 노출해야 한다.

16. **참조는 쓸 때 보존하고, 읽을 때 해석한다 (Lazy Resolution).** 삭제·이동 시 참조 ID를 즉시 교체하면 원본이 영구 파괴되어 undo 시 복귀 불가. 원본 참조를 불변으로 보존하고, 소비 시점에 해석한다.

## 구현 원칙

17. **알려진 상호작용은 전수 열거 후 구현한다 (Spec-First, Enumerate-All).** 구현 전에 모든 케이스를 나열한다. 한 케이스만 구현하고 "동작하네"로 넘어가는 것은 금지. 순서: ① 플랫폼 선례에서 케이스 전수 열거 → ② 각 케이스를 테스트로 선언 → ③ 코드 작성.

18. **커맨드(Command)는 암묵적 프록시가 되어서는 안 된다.** A 커맨드 내부에서 편의를 위해 B 커맨드로 흐름을 하이재킹하면 SRP가 깨진다.

19. **변환 경계마다 독립된 실패 축이 있다.** 입력→커맨드, 커맨드→상태, 상태→화면 — 각 경계는 독립적으로 깨질 수 있다. 테스트가 어느 축을 검증하는지 명시한다.

20. **OS gap 발견 시 feature를 중단하고 OS 개선을 먼저 한다.** 모든 프로젝트의 목적은 앱의 완성이 아니라 OS의 완성이다. 판정 기준: "앱이 `os.dispatch`를 콜백 내에서 직접 호출해야 하면 OS gap."

21. **구현 전에 ZIFT 분류를 먼저 한다.** 새 패턴을 만들기 전에 "이것은 Zone/Item/Field/Trigger 중 무엇인가?"를 결정한다. 분류 기준은 "이것이 무엇을 하는가?":
    - 영역을 정의한다 → **Zone**
    - 데이터(정체성·위치·상태)를 표현한다 → **Item**
    - 값(boolean/number/string/enum)을 편집한다 → **Field**
    - 동작을 실행한다 → **Trigger**
    분류가 구현 방법을 결정한다. Field를 Zone+Item으로 구현하면 추상화 위반이다.

22. **DOM 부수효과는 defineEffect로 처리한다.** (Added: 2026-03-04) Command 실행 결과로 DOM focus 복원 등 물리 조작이 필요하면, command handler가 effect 이름+payload를 리턴하고 `defineEffect`가 동기 실행한다. React lifecycle(`useEffect`/`useLayoutEffect`) 대신 사용하면: (a) 같은 call stack 내 동기 실행 보장, (b) 컴포넌트 코드 0줄, (c) 타이밍 레이스 없음.

23. **ZIFT resolver는 ordered keymap chain이다.** (Added: 2026-03-04) Field·Trigger·Item·Zone 4개의 개별 resolver는 하나의 generic chain executor로 통합된다. 각 layer가 `(input, ctx) → Command | null` 인터페이스를 공유하고, 우선순위는 배열 순서로 보장한다. `when` 가드와 `isFieldActive`는 chain 위치로 자연 대체된다.

24. **Chain 리턴은 이진법: Command(NOOP 포함) = stop, null = pass.** (Added: 2026-03-04) chain에서 커맨드(NOOP 포함)가 리턴되면 체인 실행을 중단한다. null이면 다음 layer로 넘긴다. NOOP = "내가 이 키를 소유하지만 OS action은 없다" (예: block 편집 중 Enter → newline은 브라우저가 처리).

25. **Toggle = [close, open] chain.** (Added: 2026-03-04) 조건문(`isOpen ? close : open`)이 아니라 실행 순서가 toggle을 표현한다. `[OVERLAY_CLOSE, OVERLAY_OPEN]` chain에서 close가 성공(overlay open)하면 stop, 실패(overlay closed)하면 open 실행.

26. **resolveKeyboard = Layer[] first-wins loop.** (Added: 2026-03-04) resolveKeyboard의 본문은 guards + `Layer[]` loop이다. `Layer = (key) → {cmd, elementId} | null`. 각 layer builder(fieldLayer, triggerItemLayer, zoneLayer)가 context를 capture하고, 메커니즘 차이(함수/keymap/registry)는 layer 내부로 캡슐화된다. 메인 함수는 "어떻게 resolve하는지" 알 필요 없다.

27. **action은 축이다, activate/check/open/expand/select는 mode다.** (Added: 2026-03-04) 하나의 물리 입력(Space/Enter/Click)에 동시 활성되는 action은 항상 0개 또는 1개. 상호 배타적이면 직교 축이 아니라 하나의 축의 mode. onClick과 keys는 mode에서 자동 파생 (APG 10패턴 중 전부 keys=onClick).

28. **ZIFT primitive는 2개: Zone(공간) + Item(요소).** (Added: 2026-03-04) Field(편집 lifecycle)와 Trigger(overlay lifecycle)는 Item에 붙는 behavior이지 별도 primitive가 아니다. Trigger = action.mode="open"인 Item. Field = action.mode="none" + field config인 Item. per-item override = action override. 그것뿐.

29. **zone.item() = items map 빌더 + 핸들 반환.** (Added: 2026-03-04) 고정 이종 Zone(toolbar)은 zone.bind()의 items map으로 per-item action 설정. 동적 Zone(listbox)은 role preset으로 해결. zone.item()은 items map에 entry를 추가하면서 타입 안전 핸들을 반환하는 빌더 패턴.

30. **defineApp = Application Context. top-down only, bottom-up 금지.** (Added: 2026-03-04) 모든 Zone/Item/Action은 defineApp()으로부터 top-down으로 생성. Zone/Trigger/Item raw primitive는 public export 금지(internal only). 개발자 API = defineApp → createZone → bind 3단계만. bottom-up 직접 조립은 orphan zone(테스트·인스펙터 누락)을 유발한다.

31. **action = command 배열 직접. enum/mode 이중 관리 불필요.** (Added: 2026-03-04) activate.effect enum("toggleExpand","invokeAndClose","selectTab")과 action.mode enum은 command 배열로 대체. command는 순수 데이터 팩토리(`OS_CHECK() = { type: "OS_CHECK" }`)이므로 역방향 의존성 없음. roleRegistry → command → schema가 단방향. 예: `action: [OS_CHECK()]`, `action: [OS_ACTIVATE(), OS_OVERLAY_CLOSE()]`.

32. **useLayoutEffect는 DOM API 호출 전용. OS→OS init dispatch 금지.** (Added: 2026-03-05, Refined: 2026-03-05) useLayoutEffect의 정당한 용도: (a) DOM API 호출 (`el.focus()`, `el.innerText = x`), (b) **DOM→OS sync** — DOM에만 존재하는 값(contentEditable innerText 등)을 OS로 올리는 dispatch. 이것은 `<input onChange>`와 같은 패턴이다. **금지**: OS가 이미 아는 정보를 mount 타이밍에 다시 kernel로 dispatch하는 것(OS→OS init). 근거: OS_ZONE_INIT 타이밍 버그(2026-03-05). "mount 시 실행"이 필요한 의도는 `config.initial` 선언형으로 표현한다.

33. **OS_INIT_* command는 잘못된 전제의 산물. Zone state는 bind() 시점에 eager 생성한다.** (Added: 2026-03-05) `OS_ZONE_INIT`, `OS_INIT_SELECTION` 등 "mount 시 state가 없으니 미리 만들어야 한다"는 전제에서 파생된 command. bind() 시점에 zone state를 eager로 생성하면 전제 소멸 → command 불필요. `ensureZone`은 초기화가 아니라 방어 코드(빈 그릇). 의미 있는 초기 상태(selection, focus)는 첫 번째 command(OS_FOCUS의 followFocus)가 자연스럽게 만든다.

34. **Key는 Command의 속성이다.** (Added: 2026-03-06) 키바인딩은 별도 배열이 아니라 `command("name", handler, { key: "Meta+K" })`로 커맨드와 co-locate 선언한다. OS 커맨드(ArrowUp→NAVIGATE 등)의 키바인딩은 ARIA 스펙이 결정하므로 osDefaults.ts에 위치. 앱 커맨드의 키바인딩은 개발자가 command() 정의 시 key 옵션으로 선언. Keybindings 레지스트리는 앱에 노출되지 않는 OS 내부 구현(facade에서 export 금지).

35. **OS의 런타임 상태는 인스턴스에 귀속. 모듈 스코프 싱글톤 금지.** (Added: 2026-03-06) 커널은 `createKernel()` 팩토리로 설계되어 테스트마다 fresh instance 생성 가능. 키바인딩 맵 등 런타임 레지스트리도 동일하게 팩토리 패턴(`createKeybindingRegistry()`)이어야 한다. 모듈 스코프 싱글톤은 테스트 간 상태 누수의 구조적 원인. 판단 기준: "이 Map을 테스트마다 fresh로 만들 수 있는가?". 만들 수 없으면 설계 결함.

~~36.~~ (원칙 22와 중복 — 삭제)
