# Effect 기반 시스템 콜 모델 — `dispatchToZone` 제거 제안

> **Origin**: Discussion (2026-02-12) — `dispatchToZone`은 이대로 괜찮은가?

## 1. 개요

현재 `dispatchToZone`은 Sensor가 ZoneRegistry를 직접 뒤져서 앱 커맨드를 꺼내 dispatch하는 **계층 위반** 구조다.

**문제점**:
- `(entry as any)[propName]` — 타입 안전성 깨짐
- 커널 바깥에서 커맨드 라우팅 수행 (명령적 패턴)
- Clipboard-specific 디렉토리에 범용 Zone routing 로직이 위치

**제안**: Effect를 모든 I/O의 단일 통로(**시스템 콜 인터페이스**)로 확립하고, `dispatchToZone`을 제거한다.

## 2. 핵심 원칙

```
┌─────────────────────────────────────────┐
│  App Layer (순수 커맨드)                  │
│  "나는 이걸 하고 싶다" (effect 선언)       │
├─────────────────────────────────────────┤
│  Effect Runner (OS 인프라)               │
│  CLIPBOARD_WRITE, CLIPBOARD_READ        │
│  API_POST, API_GET, LOCAL_STORAGE ...   │
│  "실제 I/O 실행 → 결과를 dispatch"        │
├─────────────────────────────────────────┤
│  브라우저 / 네트워크 / 디스크              │
└─────────────────────────────────────────┘
```

| 원칙 | 설명 |
|---|---|
| Sensor는 OS 의도만 선언 | `kernel.dispatch(OS_COPY())` — Zone resolve를 하지 않음 |
| 커맨드 핸들러가 Zone 바인딩 resolve | OS_COPY handler가 activeZone의 onCopy를 찾아 dispatch |
| 앱 커맨드는 순수 | state 변경 + effect 선언만 반환 |
| Effect는 순수 I/O | 라우팅 안 함. 입력된 작업만 실행 |

## 3. Usage 제안

### 3-1. Clipboard — Copy

```typescript
// ─── OS Effect ───
const clipboardWrite = osGroup.defineEffect(
  "clipboardWrite",
  (data: string) => {
    navigator.clipboard.writeText(data);
  }
);

// ─── OS Command ───
const OS_COPY = kernel.defineCommand("OS_COPY", (ctx) => () => {
  const zoneId = ctx.state.os.focus.activeZoneId;
  if (!zoneId) return;
  const entry = ZoneRegistry.get(zoneId);
  if (!entry?.onCopy) return;
  return { dispatch: entry.onCopy };
});

// ─── App Command (Todo) ───
const TODO_COPY = todoGroup.defineCommand(
  "TODO/COPY",
  (ctx) => () => {
    const selected = ctx.state.todos.filter(t => t.selected);
    return {
      state: ctx.state,
      clipboardWrite: JSON.stringify(selected),
    };
  }
);

// ─── Sensor ───
const handleCopy = (e: ClipboardEvent) => {
  if (isInputActive()) return;
  kernel.dispatch(OS_COPY());
  e.preventDefault();
};
```

### 3-2. Clipboard — Paste (비동기)

```typescript
// ─── OS Effect ───
const clipboardRead = osGroup.defineEffect(
  "clipboardRead",
  async ({ onComplete }: { onComplete: AnyCommand }) => {
    const data = await navigator.clipboard.readText();
    kernel.dispatch(onComplete({ data }));
  }
);

// ─── OS Command ───
const OS_PASTE = kernel.defineCommand("OS_PASTE", (ctx) => () => {
  const zoneId = ctx.state.os.focus.activeZoneId;
  if (!zoneId) return;
  const entry = ZoneRegistry.get(zoneId);
  if (!entry?.onPaste) return;
  // Zone 바인딩을 resolve해서 effect에 전달 (방식 A)
  return { clipboardRead: { onComplete: entry.onPaste } };
});

// ─── App Command (Todo) ───
const TODO_PASTE = todoGroup.defineCommand(
  "TODO/PASTE",
  (ctx) => ({ data }: { data: string }) => {
    const items = JSON.parse(data);
    return {
      state: produce(ctx.state, draft => {
        draft.todos.push(...items);
      }),
    };
  }
);
```

### 3-3. Clipboard — Cut

```typescript
// ─── OS Command ───
const OS_CUT = kernel.defineCommand("OS_CUT", (ctx) => () => {
  const zoneId = ctx.state.os.focus.activeZoneId;
  if (!zoneId) return;
  const entry = ZoneRegistry.get(zoneId);
  if (!entry?.onCut) return;
  return { dispatch: entry.onCut };
});

// ─── App Command (Todo) ───
const TODO_CUT = todoGroup.defineCommand(
  "TODO/CUT",
  (ctx) => () => {
    const selected = ctx.state.todos.filter(t => t.selected);
    return {
      state: produce(ctx.state, draft => {
        draft.todos = draft.todos.filter(t => !t.selected);
      }),
      clipboardWrite: JSON.stringify(selected),
    };
  }
);
```

### 3-4. History — Undo / Redo

```typescript
// ─── OS Commands ───
const OS_UNDO = kernel.defineCommand("OS_UNDO", (ctx) => () => {
  const zoneId = ctx.state.os.focus.activeZoneId;
  if (!zoneId) return;
  const entry = ZoneRegistry.get(zoneId);
  if (!entry?.onUndo) return;
  return { dispatch: entry.onUndo };
});

const OS_REDO = kernel.defineCommand("OS_REDO", (ctx) => () => {
  const zoneId = ctx.state.os.focus.activeZoneId;
  if (!zoneId) return;
  const entry = ZoneRegistry.get(zoneId);
  if (!entry?.onRedo) return;
  return { dispatch: entry.onRedo };
});

// ─── App Command (Todo) ───
const TODO_UNDO = todoGroup.defineCommand(
  "TODO/UNDO",
  (ctx) => () => {
    const prev = ctx.state.history.pop();
    if (!prev) return;
    return {
      state: produce(ctx.state, draft => {
        draft.future.push(draft.todos);
        draft.todos = prev;
      }),
    };
  }
);
```

### 3-5. REST API — 비동기 저장 (Save)

```typescript
// ─── OS Effect (범용 API) ───
const apiPost = osGroup.defineEffect(
  "apiPost",
  async ({ url, body, onSuccess, onError }: {
    url: string;
    body: unknown;
    onSuccess?: AnyCommand;
    onError?: AnyCommand;
  }) => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (onSuccess) kernel.dispatch(onSuccess({ data }));
    } catch (err) {
      if (onError) kernel.dispatch(onError({ error: String(err) }));
    }
  }
);

// ─── App Command (Todo) ───
const TODO_SAVE = todoGroup.defineCommand(
  "TODO/SAVE",
  (ctx) => () => ({
    state: produce(ctx.state, draft => {
      draft.saving = true;
    }),
    apiPost: {
      url: "/api/todos",
      body: ctx.state.todos,
      onSuccess: TODO_SAVE_OK,
      onError: TODO_SAVE_FAIL,
    },
  })
);

const TODO_SAVE_OK = todoGroup.defineCommand(
  "TODO/SAVE_OK",
  (ctx) => ({ data }: { data: unknown }) => ({
    state: produce(ctx.state, draft => {
      draft.saving = false;
      draft.lastSaved = Date.now();
    }),
  })
);

const TODO_SAVE_FAIL = todoGroup.defineCommand(
  "TODO/SAVE_FAIL",
  (ctx) => ({ error }: { error: string }) => ({
    state: produce(ctx.state, draft => {
      draft.saving = false;
      draft.error = error;
    }),
  })
);
```

### 3-6. REST API — 비동기 로드 (Fetch)

```typescript
// ─── OS Effect (범용 API) ───
const apiGet = osGroup.defineEffect(
  "apiGet",
  async ({ url, onSuccess, onError }: {
    url: string;
    onSuccess?: AnyCommand;
    onError?: AnyCommand;
  }) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (onSuccess) kernel.dispatch(onSuccess({ data }));
    } catch (err) {
      if (onError) kernel.dispatch(onError({ error: String(err) }));
    }
  }
);

// ─── App Command (Todo) ───
const TODO_LOAD = todoGroup.defineCommand(
  "TODO/LOAD",
  (ctx) => () => ({
    state: produce(ctx.state, draft => {
      draft.loading = true;
    }),
    apiGet: {
      url: "/api/todos",
      onSuccess: TODO_LOAD_OK,
      onError: TODO_LOAD_FAIL,
    },
  })
);

const TODO_LOAD_OK = todoGroup.defineCommand(
  "TODO/LOAD_OK",
  (ctx) => ({ data }: { data: Todo[] }) => ({
    state: produce(ctx.state, draft => {
      draft.loading = false;
      draft.todos = data;
    }),
  })
);
```

### 3-7. LocalStorage — 자동 저장

```typescript
// ─── OS Effect ───
const localStorageWrite = osGroup.defineEffect(
  "localStorageWrite",
  ({ key, value }: { key: string; value: string }) => {
    localStorage.setItem(key, value);
  }
);

// ─── App Command (Todo) ───
const TODO_ADD = todoGroup.defineCommand(
  "TODO/ADD",
  (ctx) => (text: string) => {
    const next = produce(ctx.state, draft => {
      draft.todos.push({ id: uuid(), text, done: false });
    });
    return {
      state: next,
      localStorageWrite: {
        key: "todos",
        value: JSON.stringify(next.todos),
      },
    };
  }
);
```

## 4. 기존 코드 제거 대상

| 파일 | 변경 |
|---|---|
| `1-listeners/clipboard/dispatchToZone.ts` | **삭제** |
| `1-listeners/clipboard/ClipboardSensor.tsx` | `OS_COPY/CUT/PASTE` dispatch로 교체 |
| `2-contexts/zoneRegistry.ts` → `ZoneEntry` | `onCopy/onCut/onPaste` 타입을 `BaseCommand`로 강화 (`any` 제거) |
| `apps/todo/tests/TodoBot.tsx` | `dispatchToZone` 임포트 → `OS_COPY/CUT/PASTE` 사용 |

## 5. 결론

`dispatchToZone`은 시스템 콜 계층을 우회하는 계층 위반이다. Effect를 모든 I/O의 단일 통로로 확립하면:

1. **앱 커맨드가 순수**해진다 (state + effect 선언만)
2. **타입 안전성**이 보장된다 (`as any` 제거)
3. **테스트가 쉬워진다** (effect mock만으로 I/O 격리)
4. **확장성**이 생긴다 (REST API, WebSocket 등도 같은 패턴)

> **한 줄 요약**: Effect는 이 OS의 시스템 콜이다. 앱은 "하고 싶은 것"을 선언하고, OS가 실행한다.
