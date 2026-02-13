# Stream Inspector 개선 논의 대화록

> **일시**: 2026-02-07 15:00  
> **참석자**: 기획자(PM), 디자이너(UX), 개발자(FE)  
> **안건**: Stream Inspector의 Input 가독성 및 UX 개선

---

## 🎙️ 논의 시작

**PM**: 자, 오늘 안건은 Stream Inspector 개선이야. 지금 Inspector 열어보면 INPUT, COMMAND, STATE, EFFECT가 다 같은 레벨로 쭉 나열되거든. 근데 사실 사용자 입장에서 보면 **모든 건 Input에서 시작**하잖아. 키보드를 눌렀으니까 커맨드가 나가고, 상태가 바뀌고, 이펙트가 실행되는 거지. 근데 지금은 그 인과관계가 눈에 안 들어와.

**UX**: 맞아. 나도 디버깅할 때 "이 COMMAND가 어떤 Input 때문에 나왔지?" 하고 위로 스크롤하면서 찾게 돼. INPUT 행이 다른 행이랑 시각적으로 너무 비슷해서.

**FE**: 코드 한번 볼까. 지금 `EventStream.tsx` 보면…

```tsx
const TYPE_STYLES = {
  INPUT:   { bg: "bg-[#f0faf8]", border: "border-[#e0f2ef]" },
  COMMAND: { bg: "bg-[#f0f6fc]", border: "border-[#dce8f5]" },
  STATE:   { bg: "bg-[#fef9f0]", border: "border-[#f5eacc]" },
  EFFECT:  { bg: "bg-[#f9f0fc]", border: "border-[#ecdff5]" },
};
```

색 차이는 있는데 미세해. 10px 폰트에 연한 배경색이면 사실 바로 안 보여.

---

## 📌 Issue 1: Input을 기준점으로 시각 강조

**PM**: 그래서 첫 번째 제안. INPUT 행을 **앵커(Anchor)** 처럼 취급하자. "여기서부터 새 사이클이다"를 눈으로 바로 알 수 있게.

**UX**: 왼쪽에 accent bar를 넣으면 어떨까? 크롬 DevTools의 console.group() 느낌으로. 3px 정도 teal 색 세로 바.

**FE**: CSS로 `border-left: 3px solid #16a085` 하면 되겠네. 간단해.

**UX**: 그것만으론 부족해. **상단 여백**도 줘야 해. 지금은 `space-y-0.5`라서 모든 행 간격이 2px인데, INPUT 행 위에만 8px을 주면 자연스럽게 그룹이 나뉘어 보여.

**PM**: 좋아. 그리고 INPUT 아래에 딸려오는 COMMAND, STATE, EFFECT는 살짝 **들여쓰기**하면?

**UX**: 맞아. INPUT은 `padding-left: 8px`, 나머지는 `padding-left: 20px`. 그러면 시각적 계층이 생겨.

**FE**: 근데 들여쓰기를 하려면 "이 COMMAND가 어떤 INPUT에 속하는지" 알아야 하잖아. 지금 Store에는 그런 관계가 없어.

**PM**: 꼭 데이터 레벨에서 안 해도 돼. 렌더링할 때 "INPUT이 나오면 거기서부터 다음 INPUT 전까지가 그 그룹"으로 시각적으로만 처리하면 되지.

**FE**: 아, 그러면 Store는 건드릴 필요 없고 `EventStream.tsx`에서 렌더링 로직만 바꾸면 되겠다. OK.

---

## 📌 Issue 2: Mouse 감지 추가

**PM**: 두 번째. 지금 Inspector에 키보드 입력만 로깅되고 마우스는 안 돼. `FocusSensor.tsx` 보면 `handleKeyDown`은 있는데 마우스용은 없어.

**FE**: 사실 `sense()` 함수가 이미 `mousedown`을 처리하고 있거든. 거기서 FOCUS, SELECT 커맨드를 dispatch해. 근데 그 **앞단에서 INPUT 로그를 안 남기는** 거야.

**UX**: 그러면 `handleKeyDown`이랑 대칭적으로 `handleMouseDown` 만들면 되겠네?

**FE**: 응. capture phase에서 먼저 로깅하고, 그 다음에 `sense()`가 처리하는 흐름.

```typescript
const handleMouseDown = (e: MouseEvent) => {
  InspectorLog.log({
    type: "INPUT",
    title: "mousedown",
    icon: "mouse-pointer",
    inputSource: "mouse",  // ← 새 필드
    details: { target: (e.target as HTMLElement).id || "unknown" },
  });
};
```

**PM**: `mousemove`나 `wheel`도 필요할까?

**FE**: 처음에는 `mousedown`만. move는 **양이 폭발**해서 Inspector가 죽을 수 있어.

**UX**: 동의. mousedown이면 클릭 기준으로 충분해.

---

## 📌 Issue 3: Keyboard / Mouse 구분 표시

**PM**: 세 번째. Input이 키보드인지 마우스인지 구분되게 해줘.

**UX**: 아이콘으로 바로 구분하자. 키보드는 `⌨ keyboard` 아이콘, 마우스는 `🖱 mouse-pointer`. 레이블도 다르게: `KEY` vs `MOUSE`.

**FE**: `LogEntry`에 `inputSource` 필드를 optional로 추가하면 되겠다.

```typescript
export interface LogEntry {
  // ... 기존 필드
  inputSource?: "keyboard" | "mouse";
}
```

**UX**: 색깔도 분리하고 싶어. 키보드는 기존 teal(`#16a085`), 마우스는 오렌지 계열(`#e67e22`).

**PM**: 마우스 Input이 너무 눈에 띄면 키보드 디버깅할 때 방해되지 않을까?

**UX**: 오히려 좋아. "아, 여기서 마우스로 클릭했구나" 하고 바로 알 수 있으니까. 지금은 COMMAND 로그에서 `FOCUS` 나오면 키보드로 이동한 건지 클릭한 건지 구분이 안 되잖아.

**PM**: 설득됐어. 진행하자.

---

## 📌 Issue 4: Input 100개 기준 페이지네이션

**PM**: 네 번째. 로그가 쌓이면 스크롤이 너무 길어져. Input 기준으로 100개마다 초기화하자.

**FE**: 지금 `MAX_LOGS = 100`이 이미 있긴 한데, 이건 **전체 로그** 100개야. Input 하나에 COMMAND, STATE가 따라오면 실제 Input은 30~40개밖에 안 담겨.

**PM**: 그래서 "Input 카운트 기준"이라는 거야. `inputCount`를 별도로 세서, Input이 100개 쌓이면 clear.

**FE**: Store에 `inputCount`랑 `pageNumber` 추가하고, `addLog`에서 체크하면 돼.

**UX**: 초기화될 때 갑자기 확 사라지면 UX가 안 좋은데…

**FE**: 부드러운 전환은 나중에 고민하자. 일단은 즉시 clear + 새 페이지 시작. 헤더에 `Page N` 뱃지만 추가하면 "아, 넘어갔구나" 알 수 있어.

**PM**: 이전 페이지로 돌아가는 기능은?

**FE**: 일단 없이 가자. 이건 **실시간 디버깅 도구**니까 과거 데이터를 보관할 필요는 없어. 나중에 요구가 생기면 그때.

**PM**: 동의.

---

## 📌 Issue 5: 후속 Command 없는 Input 병합

**PM**: 마지막. 텍스트 타이핑할 때 `a`, `b`, `c`, `d`… 이렇게 키마다 한 줄씩 나오면 스트림이 난장판이야. 커맨드 연결 안 되는 Input들은 하나로 묶자.

**FE**: 로직을 정리하면: Input이 왔는데 바로 다음 로그가 COMMAND가 아니면 → 병합 후보. 연속된 병합 후보들을 하나의 블록으로.

**UX**: 어떻게 보여줄까? 블록 안에 키 시퀀스를 나열하면?

```
┃  ⌨  KEY  h e l l o  (5 keys)    14:03:30
```

**FE**: `<kbd>` 스타일 인라인 뱃지로 각 키를 보여주면 예쁘겠다.

**PM**: 잠깐, 판단 기준이 "다음 로그가 COMMAND인가"인데… 비동기 이슈는 없어? 키를 눌렀는데 COMMAND가 약간 늦게 오면?

**FE**: 좋은 지적이야. 두 가지 방법이 있어:
1. **시퀀스 기반**: 로그 배열에서 다음 항목이 COMMAND인지 체크. 간단하지만 비동기 지연에 약해.
2. **시간 기반**: Input 후 50ms 이내에 COMMAND가 안 오면 병합 대상. 정확하지만 구현 복잡.

**PM**: 우리 OS 커맨드는 동기 dispatch 아니야?

**FE**: 맞아. `sense()` → `dispatch()` → `InspectorLog.log(COMMAND)` 다 동기야. 비동기 import lazily하고 있긴 한데, Input 로깅도 동일한 비동기 패턴이라 순서는 보장돼.

**PM**: 그러면 시퀀스 기반으로 충분하겠다.

**FE**: OK. 그리고 이 병합 로직은 **Store를 안 건드리고** `EventStream.tsx`의 `useMemo`에서 렌더링 시 그룹핑하면 돼. 원본 데이터는 그대로 두고.

**UX**: 좋아. 원본 보존하면 나중에 "펼쳐보기" 같은 기능도 추가할 수 있고.

---

## 🔧 구현 순서 합의

**PM**: 정리하자. 구현 순서 어떻게 할까?

**FE**: 의존성 기준으로:

| 순서 | 작업 | 파일 |
|------|------|------|
| 1단계 | `LogEntry`에 `inputSource` 추가 + Store에 `inputCount`, `pageNumber` | `InspectorLogStore.ts` |
| 2단계 | Mouse INPUT 로깅 + Keyboard에 `inputSource` 태깅 | `FocusSensor.tsx` |
| 3단계 | Input Anchor 디자인 (왼쪽 바, 여백, indent) | `EventStream.tsx` |
| 4단계 | Input Coalescing 렌더링 | `EventStream.tsx` |
| 5단계 | Pagination UI | `EventStream.tsx` |

**UX**: 3단계부터 눈에 보이는 변화니까 거기까지 빨리 갔으면 좋겠어.

**PM**: 1~3단계를 한 사이클로 치고, 4~5단계를 두 번째 사이클. 동의?

**FE**: 동의. 1~3이 기반 작업이고 4~5는 그 위에 얹는 거니까.

---

## ✅ 결론

**PM**: 오케이, 합의 사항 정리.

1. **Input = 앵커**. 왼쪽 accent bar + 상단 여백 + COMMAND/STATE indent로 시각 계층화.
2. **Mouse INPUT 추가**. `FocusSensor`에 `handleMouseDown` 로깅. mousedown만 우선.
3. **Keyboard/Mouse 구분**. `inputSource` 필드, 아이콘·레이블·컬러 분리.
4. **Input 100개 페이지네이션**. `inputCount` 기반 자동 clear + `Page N` 뱃지.
5. **Input Coalescing**. COMMAND 안 따라오는 연속 키는 한 블록. 렌더링 레벨 그룹핑.

**UX**: 이것만 되면 디버깅 체감이 확 달라질 거야.

**FE**: 코어 로직은 안 건드리고 Inspector 안에서만 변경이라 리스크도 적어.

**PM**: 좋아. 그럼 바로 시작하자. 수고들!

---

> **회의 종료: 15:10**  
> **다음 단계**: [계획서](file:///Users/user/Desktop/interactive-os/docs/0-inbox/2026-02-07_Stream_Inspector_Enhancement.md) 기반 구현 착수
