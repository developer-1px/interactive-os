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
