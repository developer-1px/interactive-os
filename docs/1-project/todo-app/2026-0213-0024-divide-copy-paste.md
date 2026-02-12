# /divide — Copy & Paste 수정

## 대상
Todo 앱에서 ⌘C / ⌘V (Copy & Paste)가 동작하지 않음.

## 분해 결과

| 조각 | 정답? | 증명 | 상태 |
|---|---|---|---|
| keybinding `Meta+C` → `OS_COPY` | ✅ 정답 | `keybindings.test.ts` 16/16 | 이미 통과 |
| ZoneRegistry에 `onCopy/onPaste` 등록 | ✅ 정답 | `zoneRegistry.test.ts` 9/9 | 이미 통과 |
| `OS_COPY` → ZoneRegistry lookup → `CopyTodo` dispatch | ✅ 정답 | `clipboard-commands.test.ts` 5/5 | **신규 테스트** |
| `CopyTodo` 내부 `new ClipboardItem()` | ❌ **crash** | `ReferenceError: ClipboardItem is not defined` | **수정 완료** |
| `OS_PASTE` → `PasteTodo` round-trip | ✅ 정답 | `clipboard-commands.test.ts` Copy→Paste | 통과 |

## 근본 원인

`CopyTodo` / `CutTodo` 명령 핸들러 내부:

```ts
navigator.clipboard.write([
  new ClipboardItem({...})  // ← 여기서 sync throw
]).catch(...);               // ← async catch만 있음
```

`new ClipboardItem()`이 지원되지 않는 환경에서 **동기 예외**를 던지면, `.catch()`는 Promise rejection만 잡기 때문에 **kernel dispatch 전체가 crash**.

인메모리 `clipboardData`는 crash 이전에 세팅되지만, `return { state: ctx.state }`에 도달하지 못해 kernel이 상태 업데이트를 완료하지 못함.

## 수정 내용

`clipboard.ts`의 `CopyTodo`, `CutTodo`에서 `navigator.clipboard.write()`를 `try-catch`로 감쌈:

```diff
  clipboardData = { todo: {...todo}, isCut: false };
- const jsonData = JSON.stringify(todo);
- navigator.clipboard.write([new ClipboardItem({...})])
-   .catch(() => navigator.clipboard.writeText(todo.text));
+ try {
+   const jsonData = JSON.stringify(todo);
+   navigator.clipboard.write([new ClipboardItem({...})])
+     .catch(() => navigator.clipboard.writeText(todo.text).catch(() => {}));
+ } catch {
+   navigator.clipboard?.writeText(todo.text)?.catch?.(() => {});
+ }
```

## 검증

| 테스트 | 결과 |
|---|---|
| `clipboard-commands.test.ts` (신규 5건) | ✅ 5/5 |
| `todo.test.ts` (기존 23건) | ✅ 23/23 |
| `os-commands.test.ts` (기존 9건) | ✅ 9/9 |
| `tsc --noEmit` | ✅ 0 errors |

## 남은 것

- 브라우저에서 실제 ⌘C / ⌘V 동작 확인 (수동 검증 필요)
