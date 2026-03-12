---
description: 새 OS 기능이나 앱 유형의 설계 초기에 사용. 컴파일되지 않는 이상적 API 사용 코드를 먼저 작성하고 18개 컨셉맵으로 완전성을 검증한다.
---

## /usage — Usage Spec (Design Spike)

> **학문적 근거**: Readme-Driven Development (Tom Preston-Werner) + Wishful Thinking Programming (SICP) + Conceptual Integrity (Fred Brooks).
> **핵심 원칙**: 구현 전에 "완성된 사용자 코드"를 먼저 쓰고, 컨셉맵으로 빈칸을 찾는다.

> **분류**: 리프. `/discussion`에서 진입하거나 직접 호출.
> **산출물**: `usage-spec.md` — 이상적 코드 + 컨셉맵 대입표 + 빈칸 목록.

## Why

> 구현하면서 설계를 검증하면, 설계가 틀어졌을 때 코드가 레거시가 된다.
> Design Spike는 코드 0줄로 설계를 검증한다.
> **레거시가 쌓이지 않고, Goal이 문서로 남는다.**

## Step 0: 컨셉맵 로드

`docs/2-area/praxis/concept-map.md`를 `view_file`로 읽는다.

- 18개 개념 영역을 체크리스트로 사용할 것이다.
- ZIFT 관할인 영역만 검증 대상.

## Step 1: 대상 선정

검증할 **앱 유형**을 선택한다.

| 유형 | 데이터 구조 | 대표 앱 |
|------|-----------|---------|
| Flat List | 단일 목록 | Todo |
| Tree | 계층 구조 | Builder, File Explorer |
| Grid | 2D 테이블 | Spreadsheet, Kanban |
| Form | 속성 편집 | Settings, Inspector |

- 첫 Usage Spec은 **가장 단순한 유형**부터 시작한다.
- 유형당 1개의 Usage Spec을 작성한다.

## Step 2: 이상적 Usage 코드 작성

**이 코드는 컴파일되지 않는다.** "이렇게 쓰고 싶다"는 소망을 표현하는 설계 문서다.

규칙:
1. 앱 개발자(또는 LLM)가 **이것만 보고 앱을 만들 수 있어야** 한다.
2. OS가 **보장하는 것**을 주석으로 명시한다.
3. 앱이 **직접 해야 하는 것**도 주석으로 명시한다.
4. 실현 가능성은 고려하지 않는다. **이상**을 쓴다.

```typescript
// ── 예시: Flat List (Todo) ──

const app = defineApp("todo", {
  entity: {
    text: { type: "string", mode: "inline" },
    done: { type: "boolean" },
    priority: { type: "number", min: 1, max: 5 },
  },
  structure: "list",
  // OS 보장: ↑↓ 탐색, Home/End, Tab, Multi-select,
  //          Inline edit, Toggle, Spinbutton,
  //          Add/Delete/Reorder, Undo/Redo, Copy/Paste,
  //          ARIA 자동 투영
});
```

## Step 3: 컨셉맵 대입 검증

컨셉맵 18개 영역 중 ZIFT 관할 영역을 순회하며, Usage 코드가 각 영역을 커버하는지 확인한다.

```markdown
## 컨셉맵 대입표

| # | 영역 | 커버 여부 | Usage에서의 표현 | 빈칸/의문 |
|---|------|----------|-----------------|----------|
| 1 | Topology | ✅ | structure: "list" | |
| 2 | Navigation | ✅ | list → ↑↓ 자동 | Home/End 옵션? |
| 3 | Focus | ✅ | 자동 | autoFocus 선언 필요? |
| 4 | Selection | ❓ | multi-select 옵션은? | select config 필요 |
| 5 | Activation | ❓ | onAction은 어디서? | |
| 6 | Field | ✅ | entity 속성으로 자동 | enum/date 미지원 |
| ... | ... | ... | ... | ... |
```

**빈칸(❓)이 발견될 때마다**:
1. Usage 코드에 선언을 추가해서 해결할 수 있는가?
2. OS 내부 구현으로 자동 해결이 가능한가?
3. 근본적으로 모델이 부족한가?

→ 3번이면 **모델 확장 후보**로 기록.

## Step 4: 빈칸 목록 정리

```markdown
## 빈칸 목록 (Gap List)

### 자동 해결 가능 (OS 내부)
- [ ] Navigation: Home/End는 list면 자동 제공

### 선언 추가 필요 (API 확장)
- [ ] Selection: multi-select 옵션 필요 → options.select?

### 모델 부족 (근본 설계 필요)
- [ ] Field: enum type 미지원. combobox/radiogroup 어떻게?
- [ ] CRUD: Add 커맨드는 어디서 선언?
```

## Step 5: 반복

1. 빈칸을 해결하도록 Usage 코드를 수정한다.
2. Step 3을 다시 수행한다.
3. **빈칸 0이 될 때까지 반복.**

빈칸 0 = Usage Spec 완성.

## Step 6: 저장 + 사용자 승인

- 저장: `docs/1-project/[프로젝트명]/usage-spec.md`
- 또는 cross-cutting이면: `docs/2-area/praxis/usage-spec-[type].md`

✅ 승인 → 이 Usage Spec이 프로젝트의 **Goal**이 된다.
❌ 수정 → Step 2로.

## ⛔ Gate

**Usage Spec 승인 없이 해당 영역의 구현 착수 금지.**

## 규모별 스케일

| 규모 | 필수 |
|------|------|
| **Heavy** | 이상적 코드 + 컨셉맵 18개 전수 대입 + 빈칸 목록 |
| **Light** | 이상적 코드 + ZIFT 관할 핵심 5개(Topology, Navigation, Field, Selection, CRUD) 대입 |
