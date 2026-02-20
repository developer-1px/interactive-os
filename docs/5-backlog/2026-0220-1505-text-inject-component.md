# Text Inject Component — 상태→뷰 투영 프리미티브

## Journey

**🧑 사용자**: `useComputed`가 아닌 `Text`나 `Attr`와 같은 inject component 아이디어가 떠올랐어.

**🤖 AI**: 렌더 최적화가 동기인가요, 아니면 선언적 대체가 목적인가요?

---

**🧑 사용자**: 아니, 디버깅의 핵심 문제야. 화면에 "hello 245"가 떡하니 찍혀있는데 이게 어디서 온 값인지 추적할 수가 없어. state monitor에서 값이 변했는데, 그게 화면 어디에 반영됐는지 모르는 게 너무 어려워.

**🤖 AI**: 핵심은 **관찰 가능성(Observability)**이군요. `useComputed`는 hook이라 컴포넌트 function body에 매몰되어 외부에서 구독 관계를 열거할 수 없고, 상태→뷰 하향식 추적이 불가능합니다. inject component는 구독 자체가 컴포넌트 트리에 노출됩니다.

---

**🧑 사용자**: bind에서 Text를 주면 되잖아. Field가 그 역할까지 하게 할까 했는데 너무 무겁고.

**🤖 AI**: SRP — Field(양방향 편집)과 Text(단방향 투영)는 관심사가 본질적으로 다릅니다.

---

**🧑 사용자**: Div, Span으로 쉽게? Frame? Text? 암튼 뭐든.

**🤖 AI**: 오컴의 면도날 — `Text` 하나 + `as` prop이 `Div`+`Span` 2개보다 단순합니다. "행동(투영)은 OS가, 형태는 앱이 결정한다."

---

**🧑 사용자**: Todo에 반영해보는건 어때?

**🤖 AI**: Todo의 useComputed 사용처를 분석하니 순수 텍스트 투영은 카테고리 이름 하나뿐. Builder가 더 적합합니다.

**🧑 사용자**: 그러게. 백로그에 두자. 좋은 아이디어라 생각하는데 필요할때가 오겠지.

> **한 줄 요약**: Text는 좋은 아이디어지만, 당장 효과를 볼 display-heavy 앱이 없어 백로그에 보관.

---

## Conclusion

### Why
`useComputed`(hook)는 상태→뷰 바인딩을 컴포넌트 function body에 숨겨, **상태 변경 → 화면 반영 지점**의 하향식 추적을 불가능하게 만든다. 이것이 디버깅 비용의 근원.

### Intent
`bind()`가 반환하는 프리미티브에 **순수 읽기 전용 투영 컴포넌트(Text)**를 추가하여, 상태→뷰 바인딩을 선언적이고 추적 가능하게 만든다.

### Warrants
1. "앱은 의도를 선언하고, OS가 실행을 보장한다" — 선언적 바인딩 확장
2. `When`이 이미 선례 — inject component 패턴
3. "로직이 먼저, 뷰는 바인딩이다" — Text는 바인딩의 가장 순수한 형태
4. "100% 관찰 가능" — 상태→뷰 투영 경로 추적 가능
5. SRP — Field(편집) vs Text(투영) 분리
6. 오컴의 면도날 — `Text`+`as`(1개 개체) > `Div`+`Span`(2개 개체)
7. "OS는 행동을 제공하고, 형태는 앱이 결정한다"

### 설계 스케치

```tsx
// bind()에서 반환
const { Zone, Item, Field, When, Text } = sidebar.components;

// 사용
<Text selector={(s) => s.data.title} />                      // <span>
<Text selector={(s) => s.data.title} as="h1" className="t" /> // <h1>
```

### 적용 시점
display-heavy UI(Builder Properties Panel 등)가 본격화될 때 구현. `useComputed`는 escape hatch로 유지.

> **한 줄 요약**: Text는 `bind()`의 새 프리미티브로, 상태→뷰 투영을 선언적·추적 가능하게 만드는 "가장 단순한 관찰 가능성 프리미티브"다.
