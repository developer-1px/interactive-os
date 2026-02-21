# defineQuery 발견 — DOM API 프리 OS를 향한 논증

> /discussion 산출물 | 2026-02-21 09:14~09:36

---

## Journey

**🧑 사용자**: DOM API를 쓰고 있는 곳을 전부 찾아보자. 제거하지는 말고 분석과 의심만.

**🤖 AI**: `getBoundingClientRect()` 등 DOM API 사용처 전수 조사. `BuilderCursor.tsx`(커서 위치), `os/2-contexts/index.ts`(공간 내비), `inspector/`(디버그) 등에서 사용 중. 일부는 앱 레벨에서 직접 DOM을 호출하고 있어 의심 대상.

---

**🧑 사용자**: `getBoundingClientRect()`를 effect로 할 수 있는 방법은 없을까? DOM API를 직접 안 쓰고 선언적으로 값을 가져오는 방법을 만들고 싶어.

**🤖 AI**: Pull(지금) vs Push(선언적 목표) 전환 문제. ResizeObserver, CSS Anchor Positioning 등 브라우저 Push API 존재. 세 방향 제시 — A: 커널에 올리기, B: 새 훅, C: useComputed 확장.

---

**🧑 사용자**: context에서 inject하는 방향은? 외부에서 주입받는 거잖아.

**🤖 AI**: (자기교정) 이미 `os.defineContext()` + `ctx.inject(DOM_RECTS)` 패턴이 존재. 커맨드 안에서는 이미 DOM-free로 rect를 받고 있음. 빠진 것: 이 패턴의 React 컴포넌트 확장.

---

**🧑 사용자**: 이상적인 정답이 있는 문제야? 트레이드오프?

**🤖 AI**: Complicated — 분석하면 답이 좁혀짐. 컴포넌트가 새 rect를 필요로 하는 시점 = 커널 상태 변경 직후. 커널 상태 변경 → 재렌더 → Provider 동기 호출로 해결 가능. Observer 불필요.

---

**🧑 사용자**: useInject로 구현하고 싶은 게 아냐. OS에서 제공해야 하냐는 거야. DOM API 없이 왠만한 건 가능했으면 해서.

**🤖 AI**: (잘못된 논증) "OS가 기하학을 제공하는 것은 경계를 넘는다. 실제 OS도 rect를 제공하지 않는다."

---

**🧑 사용자**: 우리는 이미 `dom-rects`가 있잖아?

**🤖 AI**: (자기교정) 맞음. 이 OS는 공간 네비게이션이 보편 기능이므로 rect는 이미 인프라. `DOM_RECTS`가 이미 존재. "OS가 제공해야 하나"가 아니라 "이미 제공하는 것의 접근 경로를 넓혀야 하나"가 진짜 질문.

---

**🧑 사용자**: BuilderCursor는 React일까? OS일까?

**🤖 AI**: 280줄의 BuilderCursor.tsx를 분석. "포커스된 아이템의 시각적 하이라이트"는 보편 OS 기능. 현재 앱에 위치한 것은 OS 인프라 부재의 결과.

---

**🧑 사용자**: 커널에서 이런 게 가능하게 하려면? re-frame에서는 외부 API를 어떻게 다뤄?

**🤖 AI**: re-frame의 3기둥 — fx(Write), cofx(Read/Pull), sub(Subscribe). 이 OS도 모두 보유. 하지만 "외부 데이터 → 뷰"를 만들려면 매번 Listener + Command + State + Hook 4개를 만들어야 함.

---

**🧑 사용자**: re-frame 방식이 외면받았던 건 저걸 커맨드와 effect를 둘 다 만들어야 해서 그런 거지?

**🤖 AI**: 정확함. React Query가 4단계 배선을 1줄로 축소한 것이 혁신. 이 OS도 focus/selection에서 이미 "4단계를 OS가 캡슐화 → 앱에 훅 1개 노출" 패턴을 사용 중. rect도 같은 패턴의 확장.

**핵심 전환**: re-frame이 외면받은 게 아니라, **배선을 앱에게 시킨 것**이 외면받은 것.

---

**🧑 사용자**: 비동기도 가능할까? useQuery 같은 개념인 거 아냐?

**🤖 AI**: 맞음. `defineQuery`는 DOM rect(동기)뿐 아니라 HTTP, WebSocket, localStorage 등 모든 외부 데이터의 범용 구독 primitive. React Query의 커널 내재화.

---

**🧑 사용자**: 이제 effect 모델보다 훨씬 낫잖아?

**🤖 AI**: Effect(Write)는 이미 예외 경로로 축소됨(FocusItem.useLayoutEffect가 정상 흐름 처리). 커널에 빠져 있던 것은 "외부 세계 → 컴포넌트" 읽기 주경로. **`defineQuery`가 이 빈칸을 채운다.**

---

**한 줄 요약**: DOM API를 의심했더니, 커널의 빠진 primitive가 발견되었다 — re-frame의 네 번째 기둥 `defineQuery`.

---

## Conclusion

### Why
앱이 DOM API를 직접 호출하는 이유: OS가 "외부 세계 → 컴포넌트" 방향의 구독 경로를 제공하지 않기 때문.

### Intent
커널에 `defineQuery` primitive를 추가하여, 앱이 DOM API 없이 외부 데이터를 선언적으로 구독할 수 있게 한다.

### Warrants (전체)

| # | Warrant |
|---|---------|
| W1 | 프로젝트 철학: "앱은 의도를 선언하고, OS가 실행을 보장한다" (Hollywood Principle) |
| W2 | `getBoundingClientRect()`는 동기 Pull 모델 — 선언적 아키텍처와 불일치 |
| W3 | 기하학 정보는 브라우저에만 존재 — 완전 제거 불가, 추상화 수준이 진짜 질문 |
| W4 | 브라우저는 Push 기반 기하학 API를 이미 제공 (ResizeObserver 등) |
| W5 | 파이프라인에 "DOM → Component" 방향의 반응형 읽기 경로 부재 |
| W6 | 개체가 적은 쪽이 정답 (rules.md #10) |
| W7 | `defineContext`/`inject`가 이미 DOM→Command 브릿지로 확립. 기존 개념 확장 가능 |
| W8 | 컴포넌트가 새 DOM 값을 필요로 하는 시점 ≈ 커널 상태 변경 직후 |
| W9 | `useComputed` 재렌더 + Provider 동기 호출 결합으로 Observer 불필요 |
| W10 | 공간 네비게이션이 보편 기능인 이상, rect는 이 OS의 인프라. 이미 `DOM_RECTS`로 제공 중 |
| W11 | 인프라가 커맨드에서만 접근 가능하고 컴포넌트에서 접근 불가한 것은 비대칭 |
| W12 | BuilderCursor는 앱 코드이지만 본질은 보편 OS 기능. 앱에 위치한 것은 OS 부재의 결과 |
| W13 | OS 인프라 부재 → 앱이 280줄 명령형 코드로 자력갱생. "왜 OS가 제공해야 하나"의 실증적 증거 |
| W14 | rules.md #8: "OS는 행동을 제공하고, 형태는 앱이 결정한다" |
| W15 | re-frame 외부 데이터 패턴: 외부→Event→app-db→Subscription→View. 기존 primitive 조합 가능 |
| W16 | 이 OS의 커널은 re-frame 3기둥(fx, cofx, sub)을 이미 갖추고 있다 |
| W17 | re-frame의 문제는 모델이 아니라 ergonomics. 4단계 배선을 앱에게 시키면 외면받고, 프레임워크가 캡슐화하면 useQuery가 된다 |
| W18 | 이 OS는 이미 focus/selection에서 "4단계 OS 캡슐화 → 앱에 훅 1개 노출" 패턴 사용 중 |
| W19 | re-frame에 없는 빈칸: "외부 세계 → 뷰" 직행 경로. `defineQuery`가 이 빈칸을 채운다 |
| W20 | `defineQuery`는 동기/비동기 불문 범용 "외부 → 컴포넌트" 구독 primitive. DOM rect는 첫 사용처 |
| W21 | Effect(Write)는 이미 예외 경로. Query(Read)가 컴포넌트의 주경로이며 비어 있었다 |

### 한 줄 결론

**re-frame의 네 번째 기둥 `defineQuery`를 커널에 추가하면, 앱은 DOM API 없이 외부 세계를 선언적으로 구독할 수 있고, effect 중심의 현재 모델을 query 중심으로 전환할 수 있다.**
