# Discussion Journey — Modal은 누구의 책임인가?

> **Date**: 2026-02-11 (08:09 → 11:37)  
> **주제**: ZIFT의 첫 시련 — Modal의 아키텍처적 귀속

---

## Milestone 1: 문제 분해 — "Modal은 3개가 아니라 5개의 관심사다"

**전환점**: 처음에 Modal을 Visual / Focus / Lifecycle 3가지로 분해했으나, 사용자가 2가지를 추가 지적.

- Trigger와 Modal Open의 연결 (현재 `onClick`으로 ZIFT 우회)
- Overlay on/off 상태의 소유자 (현재 App의 `useState`)

→ Modal의 관심사가 **5개**로 확장. 그 중 2개가 "어느 레이어에도 속하지 않은 고아 상태"임을 발견.

---

## Milestone 2: "Trigger → Open"은 이미 있는 패턴

**전환점**: `<Trigger onPress={OS_OPEN_MODAL("xxx")}>` — Trigger의 기존 `onPress` 메커니즘으로 Modal Open을 해결할 수 있다. ZIFT Trigger 변경 불필요.

→ Modal Open은 **Kernel Command 추가**만으로 해결. ZIFT 자체는 이미 준비되어 있었다.

---

## Milestone 3: Trigger.Portal — "선언 = 등록"

**전환점**: Modal 묘지(body 끝에 줄줄이 매달린 Modal들) 경험에서 출발. Trigger와 Content가 co-located 되어야 한다.

→ `Trigger.Portal` — Trigger 안에 overlay content를 선언. ID 기반 Registry 불필요.

---

## Milestone 4: "Trigger하면 Open된다" — Overlay 통합 원칙

**전환점**: Modal뿐 아니라 ContextMenu, Tooltip, Popover 전부 같은 원칙. Trigger의 `role`이 트리거 메커니즘(click/hover/contextmenu)을 결정.

→ Zone의 role preset과 **대칭적 설계**. Toast만 Command-Overlay로 별도 분류.

---

## Milestone 5: Passive Primitive 재정의

**전환점**: "Trigger가 Portal의 visibility를 제어하면 stateful 아닌가?" → 사용자: "Passive = effect/로직 없이 선언적. 관리는 OS의 몫."

→ 앱 코드에 `useState`, `useEffect`, `onClick` **0줄**. 완전 선언적 API 확정.

---

## Milestone 6: Trigger.Dismiss — 닫기의 대칭성

**전환점**: 열기는 선언적(role)인데 닫기는 명령적(`onPress={OS_CLOSE}`)이라 비대칭. + Nested 시 어떤 overlay를 닫는지 모호.

→ `Trigger.Dismiss` — "가장 가까운 부모 overlay 닫기". 커맨드 이름 불필요. ONE prescribed way.

---

## Milestone 7: LLM 친화 원칙 확정

**전환점**: "LLM은 매직을 모른다" + "LLM은 외울까?"

→ 3가지 원칙 확정:
1. **매직 금지** — 모든 의도는 명시적 마커
2. **W3C에 있으면 role, 없으면 컴포넌트** — LLM 사전 지식 기준
3. **Core 커버리지 = LLM 품질 상한선** — Core가 없으면 `useState+onClick` 회귀

---

## Milestone 8: W3C 정렬 확인

**전환점**: HTML Popover API(`popovertarget`), Invoker Commands(`commandfor`)가 ZIFT와 같은 방향으로 표준화 중임을 발견.

→ ZIFT는 웹 플랫폼 진화 방향과 정렬. 미래 네이티브 API로 Core 마이그레이션 가능.

---

## Milestone 9: Radix 인터페이스 계승 (결정적 전환)

**전환점**: "나는 학습을 없애고 싶다" → "TestBot이 Playwright를 한 것처럼, Radix의 인터페이스를 계승하되 ZIFT Kernel을 이식하면 된다"

→ LLM 학습 비용 = **정확히 0**. Radix를 알면 이미 ZIFT를 아는 것.

---

## Milestone 10: 3층 아키텍처 확정

**전환점**: "완성된 컴포넌트는 MUI의 문법을 따른다"

→ 3층 구조:
- **Layer 3** (MUI): `<Dialog open>` — 완성, drop-in
- **Layer 2** (Radix): `<Dialog.Root><Dialog.Trigger>...` — headless, 조립
- **Layer 1** (ZIFT): `<Trigger><Zone>...` — 엔진

Build order: **반드시 밑에서 위로** (Layer 1 → 2 → 3).

---

## 최종 결론

> **"Radix를 ZIFT로 만들어봐"**

이 한 문장이 1.5시간 논의의 결론이자 실행 지침이다.


---

# Discussion Conclusion — Modal은 누구의 책임인가?

> **Date**: 2026-02-11  
> **Duration**: ~1.5h (08:09 → 11:37)

---

## Why

ZIFT(Zone-Item-Field-Trigger) 프레임워크가 Modal이라는 **첫 번째 경계 사례**에 직면했다. Modal은 "시간적으로 생기고 사라지는 공간"이라 ZIFT의 "정적 공간" 가정과 충돌한다. 이 충돌을 어떻게 해결할 것인가?

## Intent

ZIFT의 4개 원형을 유지하면서 **모든 Overlay**(Dialog, Menu, Tooltip, Popover...)를 커버하는 설계를 발견하고, **LLM이 학습 비용 0으로 사용할 수 있는** 인터페이스를 설계하고 싶었다.

## Warrants (완결)

### 아키텍처 원칙

| # | Warrant |
|:---|:---|
| W1 | ZIFT = 정적 공간의 포커스 관리 Facade (Zone, Item, Field, Trigger) |
| W3 | Zone `role="dialog"` → 내부 포커스(trap, autoFocus, ESC, restore)는 이미 ZIFT |
| W5 | Overlay의 on/off 상태는 Kernel이 소유해야 함 (`overlays.stack`) |
| W15 | **Passive Primitive**: 구조만 선언, 모든 관리는 OS |
| W19 | 열기/닫기 모두 선언적. Trigger(열기) + Trigger.Dismiss(닫기) |

### Overlay 설계

| # | Warrant |
|:---|:---|
| W7 | Trigger와 Content는 co-located (Modal 묘지 방지) |
| W8 | Trigger의 `role`이 트리거 메커니즘 결정 (click/hover/contextmenu) |
| W10 | Overlay = Trigger-Overlay(선언적) + Command-Overlay(Toast, 명령적) |
| W13 | Trigger가 Portal을 children으로 소유 → "선언 = 등록" |
| W23 | Nested overlay는 stack. Dismiss = top pop. ID 지정 불필요 |
| W27 | OS 기본 기능은 ONE prescribed way. 커맨드 노출 금지 |
| W28 | Facade(`Trigger.Dismiss`) / Core(`OS_DISMISS(id)`) 이중 구조 |

### LLM 친화 설계

| # | Warrant |
|:---|:---|
| W18 | **Core Layer 커버리지 = LLM 코드 품질 상한선** |
| W30 | **매직 금지**. 모든 의도는 명시적 마커로 선언 |
| W31 | 명시적의 기준 = W3C/ARIA 명세 존재 여부. 있으면 role, 없으면 컴포넌트 |
| W35 | LLM 사전 지식: ARIA ★★★★★, Radix ★★★★★, MUI ★★★★★+ |
| W37 | TypeScript namespace merge → `Trigger.` 자동완성이 Portal, Dismiss 노출 |

### 전략적 결론

| # | Warrant |
|:---|:---|
| W38 | `Trigger` = Root. namespace merging. Radix 5단 → ZIFT 4단 |
| W43 | **Radix 인터페이스 계승 + ZIFT Kernel 이식** = TestBot-Playwright 전략 |
| W44 | **3층**: MUI(완성) / Radix(headless) / ZIFT(engine) |
| W45 | **Bottom-up**: Kernel → Radix Interface → MUI Interface |

---

## 한 줄 요약

> **Radix의 인터페이스를 그대로 계승하되 ZIFT Kernel 위에 구축하면, LLM은 학습 비용 0으로 접근성 완전한 UI를 만들 수 있다.**
