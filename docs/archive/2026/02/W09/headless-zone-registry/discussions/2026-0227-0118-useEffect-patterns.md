# useLayoutEffect / useEffect 패턴 조사 및 Headless Zone Registry 논의

## Journey

**🧑 사용자**: useLayoutEffect useEffect 등을 OS에서 쓰고 있는 패턴들을 조사해봐

**🤖 AI**: 전수 조사 결과, `useLayoutEffect`는 브라우저 DOM 물리 제어(focus steal, innerText 덮어쓰기, ZoneRegistry/DOM 바인딩)에, `useEffect`는 커널 관찰 및 이벤트 스트림 수신(Listeners, FieldRegistry 동기화)에 쓰인다. 두 Hook의 선택은 "물리적 브라우저 세계 조작" vs "관념적 OS 커널 세계 동기화"의 SRP 반영.

---

**🧑 사용자**: FocusGroup에서 useLayoutEffect가 아니라 headless하게 Zone을 등록해야 하지 않겠어? 이건 레거시때의 철학인데?

**🤖 AI**: 정확한 지적. FocusGroup L383 `if(containerRef.current)` 가드가 DOM 없으면 Zone 등록을 거부한다. ZoneEntry 타입은 이미 `element?: HTMLElement | null`로 headless를 허용하지만, 생성자(FocusGroup)가 DOM에 종속되어 있다. Rule 2 (로직이 먼저, 뷰는 바인딩이다) 위반. 논리적 등록과 물리적 바인딩의 SRP 분리가 필요.

---

## Conclusion — Toulmin

| Toulmin | 내용 |
|---------|------|
| **🎯 Claim** | ZoneRegistry 등록은 DOM Element 렌더링에 종속되지 않아야 한다. 논리적 생명주기(Config 등록)와 물리적 바인딩(DOM 요소 연결)을 분리해야 headless 100%를 보장. |
| **📊 Data** | FocusGroup.tsx L383: `useLayoutEffect(() => { if (containerRef.current) { ZoneRegistry.register(...) } })` — DOM 없으면 Zone 미등록. defineApp.page.ts L145: headless `goto()`는 별도로 `ZoneRegistry.register()`를 직접 호출 — 이중 경로. |
| **🔗 Warrant** | Zone은 논리적 "상호작용 영토(Scope)"이지 물리적 `<div>`가 아니다. 코어(Config)가 먼저 존재하고, 어댑터(DOM)는 나중에 바인딩되어야 한다 (Hexagonal Architecture). |
| **📚 Backing** | rules.md Rule 2 (로직이 먼저, 뷰는 바인딩이다), Rule 5 (번역기는 번역만 한다), Rule 7 (앱은 의도를 선언하고, OS가 실행을 보장한다). Alistair Cockburn의 Ports & Adapters. |
| **⚖️ Qualifier** | Complicated — 방향은 확정, 분해 필요 |
| **⚡ Rebuttal** | FocusGroup의 `useLayoutEffect`에서 등록하면 DOM element가 확실히 존재하는 시점이라 race condition이 없다. 분리하면 element가 아직 없는 상태에서 등록되어 DOM 의존 코드(autoFocus querySelector 등)가 null을 받을 수 있다. 이 리스크는 element를 lazy하게 바인딩하는 설계로 해결 가능. |
| **❓ Open Gap** | FocusItem의 DOM focus steal(`useLayoutEffect`)도 같은 패턴의 레거시인가? 4-effects/focus와 FocusItem.useLayoutEffect의 이중 경로는 어디까지 정리할 것인가? |
