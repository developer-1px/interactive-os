# 오답노트: Dialog Keyboard UX (2026-02-22)

> 같은 실수를 반복하지 않기 위한 기록.

## 문제

Dialog에서 Enter로 버튼 실행, Tab으로 포커스 이동이 안 됨.

## 오답 #1: DOM `.click()` 호출

```
진단: DialogZone에 onAction이 없다
→ 잘못된 분기: "onAction에서 DOM querySelector + .click()"
→ 왜 틀렸나: ZIFT 원칙 + rules 검증 #9 위반. OS 코드에서 DOM 직접 조작.
→ /reflect에서 발견, 되돌림.
```

**실패 패턴**: "기존 메커니즘이 없다 → 우회하자"
**올바른 분기**: "기존 메커니즘이 없다 → 새 메커니즘을 설계하자"

## 오답 #2: 브라우저 native behavior에 위임

```
진단: APG dialog 패턴에서 Tab/Enter는 native tabbable elements에서 동작
→ 잘못된 분기: "OS가 Enter를 가로채지 않으면 브라우저가 알아서 한다"
→ 왜 틀렸나: OS를 만든 이유가 "브라우저에 위임하지 않기 위해"다.
  Goal #7: "앱은 의도를 선언하고, OS가 실행을 보장한다"
  Goal #8: "OS는 행동을 제공하고"
  브라우저에 위임 = OS 존재 이유 부정.
```

**실패 패턴**: "표준이 이렇게 하니까 우리도 그렇게 하자" → 표준의 구현 방법을 따라가는 게 아니라 **표준의 행동 스펙만 따르고 구현은 OS가 해야 한다**
**올바른 분기**: APG가 "Enter로 button이 활성화된다"고 정의 → OS가 이 행동을 자체 메커니즘으로 제공

## 올바른 방향 (아직 미구현)

**A안: item-level actionCommand**

- FocusItem에 `actionCommand` prop 추가
- Zone의 onAction 시 해당 item의 actionCommand를 lookup → dispatch
- TriggerDismiss의 `onPress`가 자연스럽게 actionCommand가 됨
- 엔트로피 체크: 기존 command dispatch 패턴 재사용. 새 유일 패턴 없음.

이것이 OS의 올바른 해결: **OS가 item별 다른 action을 지원하는 메커니즘을 제공.**

## 교훈

1. "기존 기능이 없다 → 우회" 금지. "새 기능 설계"가 올바른 분기.
2. "브라우저가 할 수 있다 → 위임" 금지. OS가 해야 할 일을 브라우저에 돌려보내지 않는다.
3. APG는 **행동 스펙**이다. **구현 방법**이 아니다. 행동은 따르되 구현은 OS가 한다.
