# OS 계약 감사 — Tabs Pattern (Item.Content) Session

> 감사일: 2026-03-02
> 대상: `TabsPattern.tsx`, `AccordionPattern.tsx`, `bind.ts`, `activate.ts`, `select.ts`
> 감사자: Red Team (LLM)

---

## Step 1: 위반 전수 열거

```bash
grep -rnE "useState|useEffect|onClick|onMouseDown|onChange|onKeyDown|..."
```

### 앱 코드 (TabsPattern.tsx)

| # | 파일:줄 | 위반 패턴 | 코드 스니펫 | 분류 |
|---|---------|----------|------------|------|
| 1 | TabsPattern.tsx:17 | `useState` | `import { useState } from "react"` | ⚪ |
| 2 | TabsPattern.tsx:162 | `useState` | `const [mode, setMode] = useState<"auto" \| "manual">("auto")` | ⚪ |
| 3 | TabsPattern.tsx:189 | `onChange` | `onChange={() => setMode("auto")}` | ⚪ |
| 4 | TabsPattern.tsx:202 | `onChange` | `onChange={() => setMode("manual")}` | ⚪ |

### AccordionPattern.tsx

0건.

### OS 코드

| # | 파일:줄 | 패턴 | 판정 |
|---|---------|------|------|
| 1 | bind.ts:96 | `React.useEffect` | ⚪ OS 내부 Zone 등록 — 정당한 OS 구현 |

---

## Step 2: 분류

### 4건 — ⚪ 정당한 예외

**사유**: `useState`와 `onChange`는 데모 페이지의 Activation Mode Toggle(Automatic ↔ Manual 전환 라디오 버튼)에 사용. 이 상태는:

1. **OS는 관여하지 않는 view-level 상태** — auto/manual 모드 전환은 "어떤 Zone을 보여줄지"를 결정하는 순수 React 렌더 분기
2. **ZIFT 프리미티브와 무관** — 탭의 선택/포커스/네비게이션은 모두 OS가 관리
3. **인터랙션 state가 아님** — radio button은 OS Zone 밖의 form 요소

> **선례 기준**: AlertPattern의 `useState`/`onClick`과 다름. Alert는 OS 커맨드(trigger→dismiss)를 수동 구현한 LLM 실수. 이 경우는 데모 페이지의 설정 UI.

---

## Step 3: 0건 규칙 점검

### ✅ 1. 사용된 OS 프리미티브 전수

| 프리미티브 | 파일 | 용도 |
|-----------|------|------|
| `defineApp("apg-tabs")` | TabsPattern.tsx:77 | App 컨테이너 |
| `createZone("tablist-auto")` | TabsPattern.tsx:79 | Auto-activation zone |
| `createZone("tablist-manual")` | TabsPattern.tsx:85 | Manual-activation zone |
| `.bind({ role: "tablist" })` | TabsPattern.tsx:80,86 | UI 바인딩 |
| `UI.Zone` | TabsPattern.tsx:135 | Zone 렌더링 |
| `UI.Item` | TabsPattern.tsx:138 | Item 렌더링 |
| `UI.Item.Content` | TabsPattern.tsx:146 | **NEW** 패널 자동 visibility |
| `getContentRole()` | bind.ts:159 | ARIA role 결정 (tabpanel) |
| `getContentVisibilitySource()` | bind.ts:160 | 가시성 소스 (selected) |
| `os.useComputed()` | bind.ts:163 | 리액티브 selection 구독 |

### ✅ 2. 콜백 시그니처: 선언형 확인

앱에서 콜백을 등록하지 않음 — 100% OS 자동 관리.

### ✅ 3. bind() 메소드 존재 확인

tsc 0 — 모든 bind 메소드가 실제 존재.

### ✅ 4. os.dispatch 직접 호출

0건 — 앱이 OS를 직접 dispatch하지 않음.

---

## Step 6: 지표 보고

```
총 위반: 4건
  🔴 LLM 실수: 0건
  🟡 OS 갭: 0건
  ⚪ 정당한 예외: 4건 (데모 모드 토글 UI)
재감사: N/A (수정 없음)
```

---

## OS 변경 영향 분석

이 세션에서 OS 자체를 수정한 내역:

| 변경 | 영향 범위 | 검증 |
|------|----------|------|
| `bind.ts` — Item.Content 추가 | 모든 selectable/expandable Zone | accordion 12/12 ✅ |
| `bind.ts` — zoneName 직접 사용 | Item.Content가 Zone 밖에 렌더링될 때 | 브라우저 탭 패널 전환 ✅ |
| `activate.ts` — selection 경로 추가 | Enter 키로 선택 가능한 모든 Zone | 631/631 ✅ |
| `select.ts` — toggle disallowEmpty 추가 | toggle mode + disallowEmpty인 Zone | 631/631 ✅ |
| `roleRegistry.ts` — contentRoleMap 추가 | 순수 데이터 매핑 | tsc 0 ✅ |
