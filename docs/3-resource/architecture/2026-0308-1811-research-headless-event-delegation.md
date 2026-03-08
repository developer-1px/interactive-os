# Research: 순수 속성 투영과 글로벌 이벤트 위임 기반의 Headless UI

## 📋 메타 데이터
- **Date**: 2026-03-08
- **Intent**: React의 상향식 이벤트 종속(Bottom-up)을 탈피하여, 단일 글로벌 리스너와 순수 데이터 속성(`data-*`, `aria-*`)만으로 동작하는 사실상의 업계 표준(De facto) 패턴과 대안을 조사.
- **Scope**: React Headless UI(Prop-getter), Stimulus JS(Data-Action Delegation), 웹 컴포넌트 이벤트 구조

## 👑 De facto Standard: "Action-centric Event Delegation" (Stimulus 방식)
React 생태계 밖의 선언적 UI 프레임워크(특히 Basecamp의 Stimulus JS나 HTMX)에서는 이 방식이 이미 **사실상의 표준(De facto)**으로 자리 잡고 있습니다.
- **개념**: 개별 DOM 엘리먼트에 `addEventListener`나 `onClick`을 바인딩하지 않고, `data-action="click->todo#remove"`와 같은 선언적 데이터 속성만 마크업에 주입합니다.
- **작동 방식**: 최상단의 단일 글로벌 리스너가 모든 이벤트를 캡처(Event Bubbling)한 뒤, `event.target.closest('[data-action]')`을 역추적하여 전역에서 중앙 통제 방식으로 로직(커맨드)을 실행합니다.
- **장점**: 렌더링 오버헤드가 제로이며, 프레임워크 생명주기와 이벤트 핸들링이 완벽히 분리(Decoupling)됩니다. DOM 노드가 추가/삭제될 때마다 리스너를 붙였다 뗄 필요도 없습니다.

## 🔄 Alternatives: "Pure State Render Props" (React 생태계)
React 내의 Headless UI 라이브러리(Headless UI, Downshift 등)는 전통적으로 이벤트를 포함한 객체를 반환하는 Prop-getter(`...getButtonProps()`) 방식을 더 많이 썼습니다. 그러나 최근에는 상태와 이벤트를 분리하는 대안적 흐름이 관찰됩니다.
- **개념**: 컴포넌트 래퍼를 제공하는 대신 Render Prop(함수)을 통해 UI의 현재 '상태(State)' 객체만 내려주고, 이벤트 연결은 개발자나 상위 컨텍스트(Zone)에 위임하는 방식입니다.
- **장점**: 컴포넌트 계층(Nesting Hell)이 사라지고 "어떤 상태가 투영되는지" 투명하게 노출됩니다.
- **한계**: 컴포넌트 레벨에서의 강제성이 없기 때문에, 결국 개발자가 하위 개별 노드에 다시 `onClick`을 직접 붙이게 되는 유혹(Pit of failure)에 노출되기 쉽습니다.

## 🚫 Anti-patterns: "The Wrapper Component Hell"
"Headless 상태를 캡슐화한다"는 명목으로 `<Trigger asChild><button/></Trigger>`처럼 무의미한 래퍼(Wrapper) 컴포넌트를 계속 쌓아 올리는 패턴.
- **문제점**: React DevTools 트리를 알아볼 수 없게 만들고(Div Soup / Component Hell), 렌더링 오버헤드를 발생시키며, 이벤트를 내부에서 가로채는지 투과시키는지(Magic) 직관적으로 예측하기 어렵게 만듭니다.

---

## 🔬 놀라운 발견 (Surprising Findings)
**"Prop-getter는 생각보다 함정(Trap)이 많다"**
React 진영의 범용적인 `...getProps()` 방식은 우아해 보이지만, 실제로는 객체 내부에 `onClick`, `onKeyDown` 같은 리액트 합성 이벤트를 몰래 구워서 반환하는 방식입니다. 이는 겉보기엔 Headless지만 파이프라인 관점에선 엄청난 **이벤트 종속(Coupling)**을 유발합니다.
따라서 사용자님이 원했던 "진정한 Pit of Success" (오직 데이터 식별자만 넘기고 행동 통제는 글로벌 파이프라인에서 캡처)를 달성하려면, **React 표준 방식(Prop-getter)을 버리고 Stimulus JS 방식의 "Action-centric Event Delegation" 사상을 채택해야 합니다.** 사용자님의 통찰이 정확히 이 현대적 성능 최적화 패턴의 핵심을 짚고 있었습니다.

## 🏷️ 명명된 패턴 (Named Patterns)
1. **`"Action-Centric Spread"`** (가칭) — React의 `...spread` 문법을 사용하지만, 이벤트 콜백은 일절 배제하고 오직 `data-trigger-id` 식별자와 `aria-*` 상태만 주입하여 모든 동작 감지를 OS의 SENSE 파이프라인(Event Delegation)으로 강제하는 패턴.
2. **`"Wrapper Component Hell"`** — 순수 투영 로직임에도 불구하고 React `asChild` 관성에 묶여 무의미한 래퍼 컴포넌트가 중첩되는 안티패턴.

## ❓ 후속 질문 (Follow-up Questions)
- Trigger 컴포넌트 래퍼를 완전히 제거하고 `...zone.triggers.myAction(id)` 형태의 순수 속성 반환 함수로 전환하면 완벽합니다. 그런데, **이 방식을 도입한다면 기존 `<Item>`이나 `<Field>` 역시 점진적으로 컴포넌트에서 순수 속성 투영(Action-Centric Spread) 방식으로 전환해야 할까요?** 이 대칭성을 어떻게 풀어갈지가 다음 숙제입니다.

---

| 요소 | 내용 |
|------|------|
| **⚖️ Cynefin** | 🟢 **Clear** (사용자 의견을 뒷받침하는 외부 우수 분리 사례 확인) |
| **🚀 Next** | 사용자 피드백 대기 및 `/project` 또는 `/blueprint` 방향 수립 |
