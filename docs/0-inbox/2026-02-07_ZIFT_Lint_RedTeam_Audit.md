# ZIFT Handler Lint (`no-handler-in-app`) 레드팀 감사 리포트

> **날짜**: 2026-02-07  
> **대상**: `eslint-plugin-pipeline/index.js` — `noHandlerInApp` 규칙  
> **범위**: `src/apps/**/*.{ts,tsx}` (eslint.config.js 기준)

---

## 1. 개요 (Overview)

`pipeline/no-handler-in-app` 규칙은 **ZIFT Passive Projection** 원칙을 강제하기 위해, `src/apps/` 내 컴포넌트에서 네이티브 DOM 이벤트 핸들러(`onClick`, `onKeyDown` 등) 사용을 경고합니다.

이 리포트는 현행 체크 로직의 **바이패스 벡터(우회 경로)** 와 **허용목록 불일치**를 레드팀 관점에서 분석합니다.

---

## 2. 발견된 취약점 (Findings)

### 🔴 Critical — 완전 우회 가능

#### 2.1 `addEventListener` 우회 (Imperative Bypass)

린트는 **JSX 어트리뷰트만 검사**합니다. `useEffect` + `addEventListener`로 등록되는 imperative 핸들러는 전혀 감지하지 못합니다.

```tsx
// ✅ 린트 통과 — 하지만 ZIFT 위반
useEffect(() => {
  document.addEventListener("keydown", handleKeyDown, true);
  return () => document.removeEventListener("keydown", handleKeyDown, true);
}, []);
```

**실제 위반 사례 (현재 코드베이스):**
- `src/apps/kanban/widgets/CardActionMenu.tsx:170` — `document.addEventListener("keydown", ...)`
- `src/apps/todo/features/clipboard/ClipboardManager.tsx:93-94` — `window.addEventListener("copy/paste", ...)`

> [!CAUTION]
> 이 3건은 **현재 경고 없이 통과**하고 있으며, 가장 심각한 ZIFT 위반입니다.

---

#### 2.2 `ref.current` 직접 조작 우회

```tsx
// ✅ 린트 통과 — JSX에 핸들러 없음
const ref = useRef<HTMLDivElement>(null);
useEffect(() => {
  ref.current?.addEventListener("click", handler);
}, []);
```

린트의 AST 범위가 JSXAttribute에 한정되어 있어, ref를 통한 DOM 접근도 완전히 우회됩니다.

---

### 🟠 High — Allowlist 불일치

#### 2.3 `Item` 컴포넌트 allowlist 누락

`ZIFT_ALLOWED_PROPS`에 **`Item`이 등록되어 있지 않습니다**.

```js
const ZIFT_ALLOWED_PROPS = {
  Trigger: new Set(["onPress"]),
  Field: new Set(["onChange", "onSubmit", "onCancel"]),
  Zone: new Set([...]),
  // ❌ Item 없음!
};
```

현재 `Item`은 시맨틱 command prop이 없어 문제가 없지만, **향후 `Item`에 command prop이 추가되면** 린트가 오탐(false positive)을 발생시킵니다. 방어적으로 빈 Set이라도 등록해두는 것이 좋습니다.

---

#### 2.4 `Zone`의 `onCut` allowlist 누락

Zone 컴포넌트는 실제로 `onCut` prop을 지원합니다:

```tsx
// Zone.tsx:52
onCut?: BaseCommand;
```

하지만 린트의 allowlist에는 **`onCut`이 포함되어 있지 않습니다**:

```js
Zone: new Set([
  "onAction", "onToggle", "onSelect", "onDelete",
  "onCopy", "onPaste", "onUndo", "onRedo",
  // ❌ onCut 누락!
]),
```

> [!WARNING]
> `<Zone onCut={...}>` 사용 시 잘못된 경고가 발생합니다 (false positive).

---

#### 2.5 `Field`의 `onCommit`, `onSync`, `onCancelCallback` 미등록

Field 컴포넌트는 다음 callback props를 지원합니다:

```tsx
onCommit?: (value: string) => void;     // Field.tsx:102
onSync?: (value: string) => void;       // Field.tsx:103
onCancelCallback?: () => void;          // Field.tsx:104
```

이 중 `onCommit`과 `onSync`는 `on[A-Z]` 패턴에 매칭되지만 allowlist에 없습니다.

> `onCancelCallback`은 소문자 `C`이후 이어지므로... 아닙니다, `onC`의 `C`가 대문자이므로 매칭됩니다. 정확히 `onCancelCallback` → `on` + `C`(대문자) → 매칭. 하지만 allowlist에는 `onCancel`만 있으므로, `onCancelCallback`은 false positive를 발생시킵니다.

---

### 🟡 Medium — 탐지 범위 한계

#### 2.6 Spread 연산자를 통한 은닉

```tsx
// ✅ 린트 통과
const handlers = { onClick: () => console.log("bypassed") };
return <div {...handlers} />;
```

ESLint의 JSXAttribute 방문자는 **`JSXSpreadAttribute`를 방문하지 않으므로**, spread로 전달된 핸들러는 감지 불가합니다. 이는 ESLint 정적분석의 본질적 한계이지만, `JSXSpreadAttribute`에 경고를 발행하는 보조 규칙을 고려할 수 있습니다.

---

#### 2.7 `onMouseEnter` / `onMouseLeave` 허용 정책 부재

현재 앱 코드에서 실제로 사용 중:

```tsx
// src/apps/todo/widgets/TaskItem.tsx:47-48
onMouseEnter={() => setIsHovered(true)}
onMouseLeave={() => setIsHovered(false)}
```

이들은 `on[A-Z]` 패턴에 매칭되어 **경고가 발생해야 합니다**. KI 문서에서는 _"Purely visual handlers (e.g., onMouseEnter for tooltips) are allowed but should be audited"_ 라고 기술하고 있으나, 현재 린트에는 **이에 대한 예외 처리가 없습니다**.

두 가지 선택지:
1. **명시적 허용**: 순수 시각적 핸들러를 전역 allowlist에 추가
2. **현행 유지**: 경고를 발행하되 `eslint-disable` 주석으로 개별 허용 (감사 추적에 유리)

---

#### 2.8 네이티브 HTML 엘리먼트 오탐 (False Positive Scope)

린트는 **모든 JSX 엘리먼트**를 대상으로 합니다. ZIFT 컴포넌트 내부가 아니더라도 `<div onClick={...}>` 같은 네이티브 엘리먼트 사용도 경고합니다.

```tsx
// ZIFT 경계 밖의 순수 UI 유틸리티에서도 경고 발생
function ColorPicker() {
  return <div onClick={() => pickColor("red")} /> // ⚠️ 경고
}
```

이것은 **의도된 동작**일 수 있으나, 엄격함의 수준을 명확히 문서화할 필요가 있습니다. `src/apps/` 디렉토리에 있는 모든 컴포넌트에서 네이티브 핸들러를 금지하는 것이 정책이라면 현행이 맞지만, ZIFT 프리미티브 내부에서만 금지하는 것이 의도라면 scope 축소가 필요합니다.

---

## 3. 심각도 요약

| # | 취약점 | 심각도 | 유형 | 현재 영향 |
|---|--------|--------|------|-----------|
| 2.1 | `addEventListener` 우회 | 🔴 Critical | False Negative | 3건 실제 위반 미탐지 |
| 2.2 | `ref.current` 직접 접근 | 🔴 Critical | False Negative | 잠재적 |
| 2.3 | `Item` allowlist 누락 | 🟠 High | Future FP | 향후 확장 시 오탐 |
| 2.4 | `onCut` allowlist 누락 | 🟠 High | False Positive | 즉시 (사용 시) |
| 2.5 | `onCommit`/`onSync`/`onCancelCallback` 누락 | 🟠 High | False Positive | 즉시 (사용 시) |
| 2.6 | Spread 연산자 우회 | 🟡 Medium | False Negative | 잠재적 |
| 2.7 | Visual handler 정책 미정 | 🟡 Medium | Policy Gap | 2건 모호 |
| 2.8 | 네이티브 엘리먼트 scope | 🟡 Medium | Design Decision | 정책 명확화 필요 |

---

## 4. 제안 (Proposals)

### 즉시 조치 (Quick Fix)

1. **Allowlist 동기화**: `onCut`을 Zone allowlist에 추가, `onCommit`/`onSync`/`onCancelCallback`을 Field allowlist에 추가
2. **`Item` 방어적 등록**: `Item: new Set([])` 추가

### 단기 개선 (Short-term)

3. **`addEventListener` 감지 규칙 신설**: `CallExpression`에서 `addEventListener` 호출을 탐지하는 보조 규칙 `pipeline/no-imperative-handler` 추가
4. **Visual handler 정책 확정**: `onMouseEnter`/`onMouseLeave`를 전역 시각적 핸들러 allowlist로 관리하거나, eslint-disable 정책으로 문서화

### 장기 과제 (Long-term)

5. **Spread attribute 경고**: `JSXSpreadAttribute`에 대한 advisory 경고 규칙 추가 검토
6. **ZIFT 경계 인식(Scope-aware)**: 컴포넌트가 ZIFT 프리미티브 내부에 있는지 판별하는 context-aware 분석 (복잡도 높음)

---

*Generated: 2026-02-07T10:38:43+09:00*
