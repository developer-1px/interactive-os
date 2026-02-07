# Stream Inspector 개선 계획서

> **날짜**: 2026-02-07  
> **참여**: 기획자(PM) · 디자이너(UX) · 개발자(FE)

---

## 1. 개요 (Overview)

Stream Inspector(`EventStream.tsx`)는 OS 내부의 모든 이벤트를 시간순으로 보여주는 디버깅 도구이다. 현재 **INPUT / COMMAND / STATE / EFFECT** 4가지 타입을 동일 레벨로 나열하고 있어, 사용자 행동의 기준점을 빠르게 파악하기 어렵다. 아래 5가지 개선을 논의한다.

| # | 요구사항 | 핵심 키워드 |
|---|---------|-----------|
| 1 | INPUT 항목을 시각적으로 구분하여 "기준점" 역할 강조 | **Input Anchor** |
| 2 | Mouse 이벤트를 Focus 감지에 추가 | **Mouse Sense** |
| 3 | Input 타입을 Keyboard / Mouse로 분리 표시 | **Input Source** |
| 4 | Input 기준 100개 페이지네이션으로 초기화 | **Input Pagination** |
| 5 | 후속 Command가 없는 연속 Input은 하나의 블록으로 병합 | **Input Coalescing** |

---

## 2. 기획자 관점 (PM)

### 2-1. INPUT이 왜 기준인가?

사용자의 **의도(Intent)**는 항상 Input에서 시작된다. 키보드 `ArrowDown`을 눌렀을 때, OS는 `FOCUS.NEXT` Command를 발생하고, 그 결과 State가 변하고, Effect가 실행된다. 이 **Input → Command → State → Effect** 인과 체인에서 Input이 "1번 줄"이 되어야 디버깅이 쉽다.

### 2-2. 페이지네이션 기준

- **Input 100개 단위**로 페이지를 나눈다.
- 즉 100번째 Input이 발생하면 스트림을 자동으로 초기화(clear)한다.
- 헤더에 현재 페이지 번호(`Page 1`, `Page 2` …)를 표시한다.
- 이전 페이지로 돌아갈 필요는 없다 — 실시간 디버깅 도구이므로 최신 페이지만 유지.

### 2-3. Input Coalescing 정책

사용자가 텍스트를 타이핑할 때 매 키마다 별도 행이 생기면 스트림이 노이즈로 가득 찬다. 규칙:

1. Input(Keyboard) 이후 **50ms 이내에 COMMAND가 발생하지 않으면** → 다음 Input과 병합 후보.
2. 병합 후보가 연속되면 **하나의 "Input Block"**으로 묶어 표시한다.
3. Block 안에는 키 시퀀스를 한 줄로 나열: `a b c d e f` 형태.
4. **Modifier 키**(Shift, Ctrl, Meta, Alt)만 단독으로 눌린 경우도 병합 대상.

---

## 3. 디자이너 관점 (UX)

### 3-1. Input Anchor 디자인

```
┌──────────────────────────────────────────────────┐
│ ┃  ⌨  INPUT  ArrowDown         14:03:22          │  ← 왼쪽 강조 바
│ ┃           code: ArrowDown                       │
├──────────────────────────────────────────────────┤
│    ▸  COMMAND  FOCUS.NEXT       14:03:22          │  ← 일반 행 (indent)
│    ▸  STATE    activeItem: 3    14:03:22          │
├──────────────────────────────────────────────────┤
│ ┃  🖱  INPUT  mousedown         14:03:25          │  ← Mouse Input
│ ┃           target: #item-7                       │
├──────────────────────────────────────────────────┤
│    ▸  COMMAND  FOCUS            14:03:25          │
└──────────────────────────────────────────────────┘
```

**핵심 시각 요소:**

| 요소 | INPUT 행 | 비-INPUT 행 |
|------|---------|------------|
| 왼쪽 바 | `3px solid #16a085` (teal accent bar) | 없음 |
| 배경 | `#f0faf8` (현재 유지) | `transparent` |
| 상단 여백 | `margin-top: 8px` (그룹 분리) | `0` |
| 아이콘 | ⌨ (keyboard) / 🖱 (mouse) | 타입별 기존 아이콘 |
| indent | `padding-left: 8px` | `padding-left: 20px` |

### 3-2. Input Source 구분

- **Keyboard**: 아이콘 `keyboard`, 레이블 `KEY`, 컬러 `#16a085`
- **Mouse**: 아이콘 `mouse-pointer`, 레이블 `MOUSE`, 컬러 `#e67e22`

### 3-3. Coalesced Block

```
┌──────────────────────────────────────────────────┐
│ ┃  ⌨  KEY  h e l l o  (5 keys)  14:03:30        │
│ ┃                                                │
└──────────────────────────────────────────────────┘
```

- 단일 행, 키 시퀀스를 `<kbd>` 스타일로 인라인 표시.
- 뱃지로 키 개수 표시: `(5 keys)`

### 3-4. 페이지네이션 UI

- 헤더에 `Page N` 뱃지 추가 (기존 로그 카운트 옆).
- 100개 Input 도달 시 부드럽게 기존 로그 fade-out 후 초기화.

---

## 4. 개발자 관점 (FE)

### 4-1. 관련 파일 현황

| 파일 | 역할 | 수정 필요 |
|------|------|---------|
| [InspectorLogStore.ts](file:///Users/user/Desktop/interactive-os/src/os/features/inspector/InspectorLogStore.ts) | Zustand 로그 스토어 | ✅ inputCount, pagination, coalescing |
| [FocusSensor.tsx](file:///Users/user/Desktop/interactive-os/src/os/features/focus/pipeline/1-sense/FocusSensor.tsx) | DOM 이벤트 감지 (Phase 1) | ✅ Mouse INPUT 로깅 추가 |
| [EventStream.tsx](file:///Users/user/Desktop/interactive-os/src/os/app/debug/inspector/EventStream.tsx) | Stream UI 렌더링 | ✅ Anchor 디자인, Coalescing, Pagination |

### 4-2. InspectorLogStore 변경

```typescript
// LogEntry에 inputSource 필드 추가
export interface LogEntry {
  id: number;
  type: LogType;
  title: string;
  details?: any;
  timestamp: number;
  icon?: IconName;
  source?: string;
  inputSource?: "keyboard" | "mouse";  // NEW
}

// Store 상태에 pagination 추가
interface InspectorLogState {
  logs: LogEntry[];
  nextId: number;
  inputCount: number;   // NEW: INPUT 타입 카운트
  pageNumber: number;    // NEW: 현재 페이지

  addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void;
  clear: () => void;
}

// addLog 내부 — Input 100개 도달 시 자동 초기화
addLog: (entry) => set((state) => {
  const newEntry = { ...entry, id: state.nextId, timestamp: Date.now() };
  
  let newInputCount = state.inputCount;
  let newPageNumber = state.pageNumber;
  let newLogs = [newEntry, ...state.logs];
  
  if (entry.type === "INPUT") {
    newInputCount++;
    if (newInputCount > 100) {
      // 페이지 전환: 로그 초기화
      newLogs = [newEntry];
      newInputCount = 1;
      newPageNumber++;
    }
  }
  
  return {
    logs: newLogs,
    nextId: state.nextId + 1,
    inputCount: newInputCount,
    pageNumber: newPageNumber,
  };
}),
```

### 4-3. FocusSensor — Mouse INPUT 로깅

현재 `FocusSensor`의 `sense()` 함수에서 `mousedown` 이벤트를 처리하지만 Inspector에 INPUT으로 로깅하지 않는다. `handleKeyDown`과 대칭적으로 `handleMouseDown`을 추가한다.

```typescript
// FocusSensor.tsx — useEffect 내부에 추가
const handleMouseDown = (e: MouseEvent) => {
  import("@os/features/inspector/InspectorLogStore").then(({ InspectorLog }) => {
    const target = e.target as HTMLElement;
    InspectorLog.log({
      type: "INPUT",
      title: `mousedown`,
      details: {
        target: target.id || target.tagName.toLowerCase(),
        position: { x: e.clientX, y: e.clientY },
        button: e.button,
        modifiers: { shift: e.shiftKey, ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey },
      },
      icon: "mouse-pointer",
      source: "user",
      inputSource: "mouse",
    });
  });
};

// 기존 mousedown listener의 capture phase에서 로깅
document.addEventListener("mousedown", handleMouseDown, { capture: true });
```

기존 `handleKeyDown`에도 `inputSource: "keyboard"` 추가.

### 4-4. EventStream — Input Coalescing 로직

병합은 **렌더링 레벨**에서 처리한다 (Store는 원본 유지):

```typescript
// EventStream.tsx 내부 — useMemo로 그룹화
const groupedLogs = useMemo(() => {
  const groups: (LogEntry | LogEntry[])[] = [];
  let pendingInputs: LogEntry[] = [];

  // logs는 newest-first이므로 reverse 후 처리
  const chronological = [...logs].reverse();
  
  for (let i = 0; i < chronological.length; i++) {
    const log = chronological[i];
    
    if (log.type === "INPUT" && log.inputSource === "keyboard") {
      // 다음 항목이 COMMAND가 아니면 병합 후보
      const next = chronological[i + 1];
      if (!next || next.type !== "COMMAND") {
        pendingInputs.push(log);
        continue;
      }
    }
    
    // 병합 후보가 있었으면 flush
    if (pendingInputs.length > 0) {
      if (pendingInputs.length === 1) {
        groups.push(pendingInputs[0]);
      } else {
        groups.push([...pendingInputs]); // 배열 = coalesced block
      }
      pendingInputs = [];
    }
    
    groups.push(log);
  }
  
  // 마지막 잔여
  if (pendingInputs.length > 0) {
    groups.push(pendingInputs.length === 1 ? pendingInputs[0] : [...pendingInputs]);
  }
  
  return groups.reverse(); // 다시 newest-first
}, [logs]);
```

### 4-5. 구현 순서 (제안)

1. **Phase 1**: `InspectorLogStore` — `inputSource` 필드, `inputCount`, `pageNumber` 추가
2. **Phase 2**: `FocusSensor` — Mouse INPUT 로깅 + 기존 Keyboard에 `inputSource` 추가
3. **Phase 3**: `EventStream` — Input Anchor 디자인 (왼쪽 바, 여백, indent)
4. **Phase 4**: `EventStream` — Input Coalescing (그룹화 렌더링)
5. **Phase 5**: `EventStream` — Pagination UI (Page 번호, 자동 초기화)

---

## 5. 결론 / 제안 (Conclusion)

### 즉시 실행 가능

- 모든 변경은 **Inspector 내부**에 한정되어 OS 핵심 로직에 영향 없음.
- Store 변경이 최소화되어 있고, UI 변경은 `EventStream.tsx` 단일 파일.
- Coalescing은 렌더링 레벨에서 처리하므로 원본 로그 데이터 무결성 유지.

### 논의 필요 사항

> [!IMPORTANT]
> **Coalescing 타이밍**: 현재 "다음 항목이 COMMAND가 아니면 병합"으로 제안했으나, 시간 기반(50ms threshold)도 고려 가능. 어느 쪽이 디버깅에 더 유용한지 피드백 필요.

> [!NOTE]
> **Mouse Input 범위**: 현재 `mousedown`만 로깅 제안. `mousemove`, `wheel`, `contextmenu` 등도 추가할지는 추후 결정.
