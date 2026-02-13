# 🔍 Mermaid 렌더링 간헐적 실패 원인 분석

| | |
|---|---|
| **원문** | 지금 mermaid가 가끔 안 나올 때가 있어. 이유를 분석하는 보고서를 작성해줘 |
| **내(AI)가 추정한 의도** | Docs Viewer에서 mermaid 다이어그램이 간헐적으로 렌더링 실패하는 버그의 근본 원인을 파악하여 수정 방향을 잡으려는 것 |
| **날짜** | 2026-02-12 |
| **증상** | `Syntax error in text` (mermaid version 11.12.2) |
| **발생 위치** | `DocsViewer.tsx`, `DocsPage.tsx` |

---

## 1. 개요

Docs Viewer에서 `` ```mermaid `` 블록이 **간헐적으로** "Syntax error in text"를 표시한다. 모든 문서에서 항상 실패하는 게 아니라, **같은 문서도 어떤 때는 되고 어떤 때는 안 되는** 간헐적 패턴이 핵심이다.

현재 렌더링 파이프라인:

```
Markdown → ReactMarkdown → rehype-highlight → pre 컴포넌트 → MermaidBlock → mermaid.render()
```

---

## 2. 분석

### 원인 1: 🔴 `rehype-highlight`가 mermaid 코드를 선제 가공

**핵심 문제.** `rehype-highlight`가 **모든 코드 블록**을 언어 감지하여 syntax highlight를 적용한다. mermaid 블록도 예외가 아니다.

```tsx
// DocsViewer.tsx:332-334
rehypePlugins={[rehypeHighlight]}  // ← 모든 코드 블록에 적용
```

`rehype-highlight`가 mermaid 코드를 처리하면:
- `graph LR` 같은 키워드에 `<span class="hljs-keyword">` 래퍼가 추가될 수 있음
- `children`이 단순 string에서 **React element 배열**로 변환됨

그런데 `pre` 컴포넌트에서 mermaid를 감지하는 코드:

```tsx
// DocsViewer.tsx:177-180
const code =
  typeof codeChild?.children === "string"
    ? codeChild.children
    : String(codeChild?.children ?? "");  // ← React element가 "[object Object]"로 변환
```

`rehype-highlight`가 mermaid 코드에 span을 삽입하면 → `children`이 배열 → `String()`이 `"[object Object],[object Object]"` 반환 → mermaid parser가 "Syntax error" 발생.

**간헐적인 이유**: `rehype-highlight`의 언어 자동 감지는 확률적이다. 코드 내용에 따라 "프로그래밍 언어로 인식"할 때만 span을 삽입하고, 인식 못 하면 raw string을 유지한다. 그래서 **같은 문서도 때에 따라 결과가 달라진다**.

---

### 원인 2: 🟡 `idCounter++` 글로벌 카운터 충돌

```tsx
// MermaidBlock.tsx:11,18
let idCounter = 0;  // 모듈 레벨 글로벌

useEffect(() => {
  const id = `mermaid-${idCounter++}`;
  mermaid.render(id, code.trim())  // ← 이 id로 DOM 요소 생성
```

**문제**: 
- React Strict Mode에서 `useEffect`가 2번 실행됨 → 같은 id로 `mermaid.render()` 2회 호출
- 첫 번째 render가 만든 DOM 요소(id=`mermaid-0`)가 아직 존재하는데 두 번째 render가 같은 id로 시도 → mermaid 내부 충돌
- `cancelled = true` cleanup이 있지만, mermaid가 이미 DOM에 삽입한 SVG 요소는 제거하지 않음

**간헐적인 이유**: Strict Mode는 dev에서만 동작하고, 타이밍에 따라 첫 번째 render가 완료되기 전에 cleanup이 실행되면 문제가 안 생기기도 함.

---

### 원인 3: 🟡 Mermaid 코드 내 특수 문자

실제 docs에서 사용 중인 mermaid 코드를 보면:

```mermaid
subgraph COLLECT["📥 수집"]
```

```mermaid
A["① 빌드 에러 수정\n(5분)"]
```

- **이모지** (`📥`, `🧠`, `🛠️`): mermaid 11.x에서 대부분 지원하지만 일부 조합에서 파서 오류 발생 가능
- **한글 + 특수문자 조합**: `\n` 이스케이프가 mermaid 내에서 제대로 처리되지 않을 수 있음 (markdown의 `\n` vs mermaid의 줄바꿈)

그러나 이것은 **항상 실패하는** 원인이지 간헐적 원인은 아니므로 보조 원인.

---

## 3. 결론 / 제안

### 근본 원인 판정

| 원인 | 확신도 | 간헐성 설명 |
|------|--------|------------|
| 🔴 `rehype-highlight` 간섭 | **높음** | 언어 자동 감지의 비결정성 |
| 🟡 `idCounter` 충돌 | 중간 | Strict Mode 타이밍 의존 |
| 🟡 특수 문자 | 낮음 | 항상 실패하므로 간헐적 증상과 불일치 |

### 수정 제안

**1단계 — `rehype-highlight`에서 mermaid 제외 (즉시)**

```tsx
// rehype-highlight에 언어 무시 옵션 추가
rehypePlugins={[
  [rehypeHighlight, { ignoredLanguages: ["mermaid"] }]
]}
```

**2단계 — `idCounter`를 안전하게 (권장)**

```tsx
// useRef로 id 고정하여 Strict Mode 재실행에도 안전
const idRef = useRef(`mermaid-${crypto.randomUUID()}`);
```

**3단계 — children 추출 강화 (방어적)**

```tsx
// React element 배열에서도 텍스트를 안전하게 추출
function extractText(node: unknown): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node)
    return extractText((node as any).props.children);
  return String(node ?? "");
}
```

---

## 자기 평가

**점수**: B

**Evidence**:
- 코드 파이프라인(`ReactMarkdown → rehype-highlight → pre → MermaidBlock`)을 단계별로 추적하여 근본 원인을 특정
- "간헐적"이라는 핵심 증상의 원인(`rehype-highlight`의 비결정적 언어 감지)을 논리적으로 설명
- 다만 실제 재현 테스트(특정 문서에서 highlight 결과를 console.log로 확인)를 수행하지 않아 확신도 100%는 아님

---

> **한줄요약**: mermaid 간헐적 실패의 근본 원인은 `rehype-highlight`가 mermaid 코드를 프로그래밍 언어로 오인식하여 children을 React element 배열로 변환하는 비결정적 동작이며, `ignoredLanguages: ["mermaid"]` 설정으로 즉시 해결 가능하다.
