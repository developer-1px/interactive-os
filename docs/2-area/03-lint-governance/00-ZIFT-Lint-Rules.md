# ZIFT 린트 거버넌스

> Interaction OS의 ZIFT 파이프라인 준수를 자동으로 검증하는 커스텀 ESLint 규칙 시스템.

## 개요

`eslint-plugin-pipeline` 플러그인은 `src/apps/` 디렉토리 내의 위젯 코드가 ZIFT(Zone-Item-Field-Trigger) 아키텍처를 준수하는지 정적으로 검증합니다. 앱 위젯에서 네이티브 DOM 이벤트 핸들러 직접 사용을 금지하고, 모든 사용자 상호작용이 OS 파이프라인을 통과하도록 강제합니다.

## 규칙 목록

| 규칙 | 심각도 | 목적 |
|---|---|---|
| `pipeline/no-handler-in-app` | warn | JSX에서 네이티브 on* 핸들러 사용 금지 |
| `pipeline/no-imperative-handler` | warn | addEventListener/removeEventListener 사용 금지 |
| `pipeline/no-pipeline-bypass` | warn | 파이프라인 우회 패턴 감지 |
| `pipeline/no-direct-commit` | warn | 직접 상태 커밋 금지 |

## 적용 범위

```
src/apps/**/*.tsx
```

`src/os/` 및 미들웨어 레이어는 대상 외 — OS 인프라는 DOM 접근이 정당한 영역.

---

## 규칙 상세

### `no-handler-in-app`

**목적**: JSX 어트리뷰트에서 `on*` 패턴의 네이티브 DOM 이벤트 핸들러를 감지합니다.

**탐지 대상**:
```tsx
// ❌ 위반
<button onClick={() => doSomething()} />
<input onChange={(e) => setState(e.target.value)} />
<div onDoubleClick={handler} />
```

**허용 패턴**:

1. **ZIFT 시맨틱 Props** — 프리미티브 컴포넌트의 명령 바인딩:

| 프리미티브 | 허용 Props |
|---|---|
| `Trigger` | `onPress` |
| `Field` | `onChange`, `onSubmit`, `onCancel`, `onCommit`, `onSync`, `onCancelCallback` |
| `Zone` | `onAction`, `onToggle`, `onSelect`, `onDelete`, `onCopy`, `onCut`, `onPaste`, `onUndo`, `onRedo` |
| `Item` | *(현재 없음, 확장 대비)* |

2. **Visual Handler Allowlist** — OS 상태에 영향 없는 순수 시각적 핸들러:
   - `onMouseEnter`, `onMouseLeave`
   - `onMouseOver`, `onMouseOut`
   - `onPointerEnter`, `onPointerLeave`

### `no-imperative-handler`

**목적**: `useEffect` 등에서 `addEventListener`/`removeEventListener`를 통한 명령적 DOM 이벤트 등록을 감지합니다.

**탐지 패턴**:
```tsx
// ❌ 위반 — 모든 형태의 addEventListener
document.addEventListener('keydown', handler);
window.addEventListener('copy', handler);
ref.current.addEventListener('click', handler);
el.addEventListener('scroll', handler);

// ❌ 위반 — removeEventListener도 탐지
window.removeEventListener('paste', handler);
```

---

## 올바른 수정 패턴

### onClick → Trigger

```diff
- <button onClick={() => dispatch(DeleteCard({ id }))}>
-   Delete
- </button>
+ <Trigger onPress={DeleteCard({ id })} asChild>
+   <button>Delete</button>
+ </Trigger>
```

### onChange (네이티브 input) → eslint-disable

ZIFT `Field`는 `contentEditable` 기반이므로 네이티브 `<input>`/`<textarea>`에는 적용 불가. eslint-disable + 사유 필수:

```tsx
{/* eslint-disable pipeline/no-handler-in-app -- Native <input> requires onChange */}
<input
  value={value}
  onChange={(e) => dispatch(UpdateTitle({ text: e.target.value }))}
/>
{/* eslint-enable pipeline/no-handler-in-app */}
```

### addEventListener → eslint-disable (OS 브릿지)

시스템 클립보드, 글로벌 키보드 등 OS 수준 API 접근이 필요한 경우만:

```tsx
// eslint-disable-next-line pipeline/no-imperative-handler -- OS bridge: clipboard API
window.addEventListener("copy", handleCopy);
```

### 로컬 UI 토글 → 커맨드 승격

```diff
- const [showMenu, setShowMenu] = useState(false);
- <button onClick={() => setShowMenu(!showMenu)}>

+ // appState.ts
+ bulkMenuOpen: "move" | "priority" | null;
+
+ // commands/selection.ts
+ export const ToggleBulkMenu = defineKanbanCommand({ ... });
+
+ // widget
+ <Trigger onPress={ToggleBulkMenu({ menu: "move" })} asChild>
+   <button>Move to</button>
+ </Trigger>
```

> [!CAUTION]
> **eslint-disable 판단 기준**: "로컬 state니까 괜찮다"는 사유가 아닙니다. 위젯 레이어에서 `onClick`은 **무조건 위반**입니다. eslint-disable은 ZIFT 프리미티브가 물리적으로 지원하지 않는 네이티브 요소(`<input>`, `<textarea>`, `<input type="date">`)와 OS 브릿지 패턴에만 허용됩니다.

---

## 파일 위치

- **플러그인**: `eslint-plugin-pipeline/index.js`
- **설정**: `eslint.config.js` (`src/apps/` 스코프)

---

## 감사 이력

| 날짜 | 내용 |
|---|---|
| 2026-02-07 | Red Team 감사: `no-imperative-handler` 규칙 신설, Visual Handler Allowlist 추가, ZIFT Allowlist 보강 (`onCut`, `onCommit`, `onSync`, `onCancelCallback`), BulkActionBar 커맨드 승격 |
