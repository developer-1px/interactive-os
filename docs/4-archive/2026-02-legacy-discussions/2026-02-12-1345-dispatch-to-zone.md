# Discussion Journey: dispatchToZone 제거

> **일시**: 2026-02-12 13:36~13:45

---

**🧑 사용자**: `dispatchToZone` 계층 위반부터 해결해봐. 구조적인 모순을 해결하고 나머지는 정리하자. 끝나면 `AnyCommand`를 할거야.

**🤖 AI**: 구현 계획서를 작성. OS_COPY/OS_CUT/OS_PASTE 커맨드를 만들고, ClipboardListener와 TodoBot을 교체하고, dispatchToZone을 삭제하는 방안 제시.

**🧑 사용자**: 아니야. 뭘 해야할지 설명해줄래. 회의실로.

> *→ 바로 코드를 치기 전에, 왜 이렇게 해야 하는지 이해를 맞추자는 의미.*

---

**🤖 AI**: dispatchToZone의 문제: 리스너가 커널을 우회해서 ZoneRegistry를 직접 탐색 → 앱 커맨드를 꺼내 dispatch. 리스너가 "라우팅 로직"까지 갖고 있는 구조.

**🧑 사용자**: 맞아. 우리가 **제거해야할 대상이지 수정해야할 대상이 아냐.**

> *→ 핵심 구분: 리팩토링(수정)이 아니라 elimination(제거).*

---

**🤖 AI**: 제거하면 남는 질문은 "그 역할을 누가 대신 하는가?" — A) 커널 커맨드 신설 vs B) 인라인 resolve. B는 구조적 문제 그대로이므로 A가 답.

**🧑 사용자**: "지금 copy를 어떻게 하면 될까?" 를 고민하면 이 문제가 풀리는거지?

> *→ 추상적 "dispatchToZone 제거" → 구체적 use case "copy를 어떻게?"로 치환.*

---

**🤖 AI**: copy 흐름: 리스너 → "OS야, 복사해" → 커널이 Zone resolve → 앱 커맨드 연쇄 dispatch. copy 하나를 풀면 cut/paste/undo/redo 전부 같은 패턴.

**🧑 사용자**: 일단 정답이 있는 것부터 말해봐.

---

**🤖 AI**: 정답인 것들: ① dispatchToZone 삭제 ② ClipboardListener 유지 ③ Zone onCopy 바인딩 구조 유지 ④ ZoneEntry `any` → `AnyCommand` ⑤ TodoBot 헬퍼 교체. 남는 설계 결정은 "ClipboardListener에서 뭘 호출하느냐" — 커널 커맨드(A).

**🧑 사용자**: OS_COPY는 OS의 커맨드이고 리스너도 OS것이니 일단 리스너는 OS_COPY를 던지면 그만. OS_COPY를 처리하는건 Zone에서 버블링으로 알아서 커맨드를 받으면 뭐할지 알지만, **어떻게 받는지는 kernel이 해주는 구조.**

---

**🤖 AI**: *(잘못된 분석)* 제 계획은 OS_COPY 핸들러가 ZoneRegistry를 직접 읽는 것인데, 말씀하신 모델은 커널 버블링. 하지만 현재 onCopy는 핸들러 등록이 아닌 커맨드 객체 저장이라 Gap이 있다...

**🧑 사용자**: **이상하네? 그러면 다른 커맨드는 버블링을 어떻게 하고 있는거야? 키 바인딩은? 포커스는?**

> *→ 결정적 질문. "Gap이 있다"는 주장이 맞다면, 이미 동작하는 NAVIGATE/ACTIVATE도 같은 Gap이 있어야 한다.*

---

**🤖 AI**: *(코드 확인 후)* ACTIVATE가 정확히 같은 패턴:
```typescript
const ACTIVATE = kernel.defineCommand("OS_ACTIVATE", (ctx) => () => {
  const { activeZoneId } = ctx.state.os.focus;
  // zone 정보를 읽고 → 적절한 동작을 dispatch
});
```
Gap이 있다고 한 건 **틀렸다**. 기존 패턴을 그대로 따르면 된다.

**🧑 사용자**: 맞아. 레거시가 있으니까 계속 LLM이 혼동을 하는거지. rule에도 그런게 있어?

---

**🤖 AI**: *(CLAUDE.md 확인)* CLAUDE.md 아키텍처 섹션이 완전히 레거시 — `1-sensor`, `2-command`, `3-store`, `4-effect`, `runOS()` 등 삭제된 구조를 설명. 반면 rules.md에는 "Listener = 번역기" 원칙이 이미 제대로 기술되어 있음.

**🧑 사용자**: 포함시켜 (CLAUDE.md 업데이트도).

---

## 한 줄 요약

> **"dispatchToZone을 어떻게 고칠까?"가 아니라 "copy를 어떻게 하면 되는가?"로 문제를 재정의하니, NAVIGATE/ACTIVATE가 이미 쓰는 기존 패턴이 그대로 정답이었고, AI가 혼동한 원인은 CLAUDE.md의 레거시 설명이었다.**


---


# Discussion: dispatchToZone 제거 — 결론

> **일시**: 2026-02-12 13:36~13:45

## Why

`dispatchToZone`은 **리스너가 커널을 우회해서 ZoneRegistry를 직접 탐색하고 앱 커맨드를 실행하는 계층 위반**이다. 수정이 아닌 **제거** 대상이다.

## Intent

기존 NAVIGATE/ACTIVATE/ESCAPE가 이미 사용하는 **"Listener → OS Command → 커널이 Zone resolve"** 패턴을 clipboard에도 동일하게 적용한다. 새로운 구조를 발명하는 것이 아니라 **기존 패턴을 따르는 것**이다.

## Warrants

| # | 논거 |
|---|---|
| W1 | Listener = 번역기 — 이벤트 선언만 하고 라우팅에 관여하지 않는다 (rules.md 대원칙 2) |
| W2 | `(entry as any)[propName]` — 직접 레지스트리 접근은 타입 안전성을 깨뜨린다 |
| W3 | dispatchToZone의 두 책임(active zone 조회 + 커맨드 resolve)은 이미 커널이 수행 가능 — 불필요한 중간자 |
| W4 | copy 하나를 올바르게 풀면 cut/paste/undo/redo 모두 동일 패턴으로 해소 |
| W5 | Zone의 onCopy 바인딩 등록 구조는 선언적이므로 유지 |
| W6 | 핵심 대립은 "편의성 vs 원칙" — 커널 우회를 허용하면 선례가 된다 |
| W7 | NAVIGATE/ACTIVATE/ESCAPE가 이미 "OS 커맨드 → zone resolve" 패턴 사용 — Gap 없음 |
| W8 | CLAUDE.md의 레거시 아키텍처 설명이 AI에게 잘못된 컨텍스트를 제공하여 혼동 유발 |

## 한 줄 요약

> **dispatchToZone은 리스너가 커널을 우회하는 불필요한 중간자이며, 기존 NAVIGATE/ACTIVATE 패턴을 clipboard에 동일하게 적용하면 제거된다.**
