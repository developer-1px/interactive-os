# Discussion Journey: `dispatchToZone`은 이대로 괜찮은가?

> **Date**: 2026-02-12  
> **Duration**: ~15분

---

**🧑 사용자**: `dispatchToZone`은 이대로 괜찮은가?

**🤖 AI**: 코드를 분석해보니 `dispatchToZone`은 두 세계를 이어붙이는 브릿지 역할. 그런데 커널 바깥에서 커맨드 라우팅을 하고, `(entry as any)[propName]`으로 타입이 깨진다. 이상적인 흐름은 Sensor가 `OS_COPY()`만 dispatch하고, 커널 middleware가 Zone 바인딩을 resolve하는 구조 아닌가?

---

**🧑 사용자**: 자동으로 해야지 잘못된 구조라 생각해

**🤖 AI**: 확실하다. 그러면 `OS_COPY`의 `defineCommand` 핸들러가 Zone 바인딩을 resolve. 근데 `OS_COPY`는 커맨드인가, 이벤트인가?

---

**🧑 사용자**: OS_COPY는 OS의 책임이야

**🤖 AI**: OS_COPY는 커맨드 — OS가 실행 방법을 완전히 안다.  핸들러가 ZoneRegistry를 읽어야 하는데, ZoneRegistry는 커널 외부 side-channel. 허용하나?

---

**🧑 사용자**: 아니구나 Zone에 onCopy가 있어. 사실 앱에서 Copy를 구현해야지. 클립보드에 넣어주는 기능은 OS에서 제공하고

**🤖 AI**: **전환점** — 책임 분리 재정의. 실제 macOS 모델과 동일:
- 앱: 선택된 데이터 직렬화
- OS: 클립보드 인프라 제공

앱이 데이터를 준비한 후 OS에 어떻게 전달? Return model(순수) vs Write model(의존)?

---

**🧑 사용자**: effect가 있잖아.

**🤖 AI**: 맞다! 앱 커맨드는 순수 — `{ state, clipboardWrite: data }` 반환. Effect runner가 실제 I/O 실행. 이건 OS 커널의 **시스템 콜** 모델.

Copy(쓰기)는 동기 effect, Paste(읽기)는 비동기 — 비대칭?

---

**🧑 사용자**: 비동기라... 나중에 API도 해야겠지? effect를 이용해야지

**🤖 AI**: API 호출도 같은 패턴. Effect = 모든 I/O의 단일 통로 = **시스템 콜 인터페이스**.

현재 Effect 시스템 검토 결과: `defineEffect` handler는 `(value: V) => void`. async 함수도 호출 가능(fire-and-forget). handler 내에서 `kernel.dispatch()`로 re-dispatch 가능.

Paste 흐름에서 Zone resolve를 어디서? 두 방식 제시:
- **A**: 커맨드 핸들러에서 resolve, effect는 순수 I/O만
- **B**: effect에서 Zone resolve + I/O

---

**🧑 사용자**: 근데 표만 보면 A가 압승인데? 이거 정답이 있는 문제야?

**🤖 AI**: 솔직히 **A가 정답**. OS의 원칙을 일관 적용하면 수렴하는 구조. Effect는 순수 I/O, 라우팅은 커맨드 핸들러의 책임. 열린 질문처럼 포장했지만 표가 이미 답을 말하고 있다.

---

**🧑 사용자**: 이거 중요한 내용이야. inbox에 작성해줘. clipboard와 history와 restAPI 호출등의 usage 제안을 다양하게 작성해줘

→ `docs/0-inbox/2026-02-12_0200_Effect_Syscall_Model.md` 작성

---

**🧑 사용자**: 그래 닫고 마무리 해줘. 비동기 effect에 대해서는 새로 얘기하자. Redux도 결국 그거때문에 TanstackQuery가 나온거니까

---

## 한 줄 요약

> `dispatchToZone`은 시스템 콜 계층을 우회하는 계층 위반이며, Effect를 시스템 콜 인터페이스로 확립하면 앱은 순수 커맨드로 선언하고 OS가 실행하는 구조가 된다 — 다만 비동기 effect의 생명주기 관리(loading/error/retry)는 Redux→TanStack Query의 교훈처럼 별도 설계가 필요하다.


---

# Discussion Conclusion: `dispatchToZone`은 이대로 괜찮은가?

> **Date**: 2026-02-12  
> **Participants**: 사용자 + AI (Red Team 소크라테스)

## Why

`dispatchToZone`이 OS 아키텍처의 선언적·커맨드 기반 원칙과 일치하는지 의문이 제기되었다.

## Intent

`dispatchToZone`을 제거하고, OS-레벨 커맨드 → 앱 커맨드(순수) → Effect(OS 인프라)의 **시스템 콜 모델**로 전환한다.

## Warrants (완결)

| # | Warrant |
|---|---|
| W1 | 모든 인터랙션은 branded `BaseCommand` 타입으로 표현되어야 한다 |
| W2 | `dispatchToZone`은 `(entry as any)[propName]`으로 타입 안전성이 깨진다 |
| W3 | 커널 바깥에서 커맨드 라우팅을 하는 것은 명령적 패턴이며, 커널의 책임이다 |
| W4 | Sensor는 OS-레벨 의도(`OS_COPY` 등)만 선언하고, Zone→앱 커맨드 해석은 커널이 한다 |
| W5 | `OS_COPY`는 이벤트가 아니라 **커맨드**다 — OS가 실행 방법을 완전히 안다 |
| W6 | Copy 책임 분리: 앱 = "무엇을 복사할지" 결정, OS = "클립보드에 넣는 인프라" 제공 |
| W7 | 앱 커맨드는 순수하다 — side-effect는 **effect로 선언**하며, OS의 effect runner가 실행한다 |
| W8 | OS 인프라(클립보드 데이터 등)는 커널의 기존 메커니즘(context/middleware)으로 앱에 주입된다 |
| W9 | Effect는 모든 I/O(clipboard, API, storage)의 **단일 통로** — 시스템 콜 인터페이스 |
| W10 | 현재 effect 시스템은 fire-and-forget 비동기를 지원하며, handler 내 re-dispatch로 async→sync 체인 가능 |
| W11 | Effect는 순수 I/O만 담당한다. 라우팅(Zone resolve)은 커맨드 핸들러에서 해결한다 (방식 A 확정) |

## 설계 결정: 방식 A

Zone 바인딩 resolve는 **커맨드 핸들러**(순수 영역)에서, I/O는 **effect**(side-effect 영역)에서.

```
Sensor → OS_COPY → [커맨드 핸들러가 Zone resolve] → 앱 커맨드 dispatch
                                                      → 앱 핸들러가 { state, clipboardWrite: data } 반환
                                                        → Effect runner가 clipboard에 기록
```

## 미해결: 비동기 Effect 모델

> "Redux도 결국 비동기 때문에 TanStack Query가 나온 거니까"

현재 effect는 fire-and-forget이므로 loading/error/retry 같은 비동기 생명주기 관리가 없다. 이 부분은 별도 논의로 분리한다.

## 한 줄 요약

> **`dispatchToZone`은 시스템 콜 계층을 우회하는 계층 위반이다. Effect를 시스템 콜 인터페이스로 확립하면, 앱은 순수 커맨드로 "하고 싶은 것"을 선언하고, OS가 실행한다.**
