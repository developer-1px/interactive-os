# Interactive OS 네이밍 컨벤션 감사 (Naming Convention Audit)

| 항목 | 내용 |
|------|------|
| **원문** | OS의 파일과 구조 네이밍에 대한 일관성과 철학을 만들고 싶어 |
| **내(AI)가 추정한 의도** | 에이전트가 제로 추론으로 파일/폴더 이름을 결정할 수 있는 검증 가능한 네이밍 체계를 확립하고 싶다 |
| **날짜** | 2026-02-17 |
| **상태** | 초안 (Draft) |

---

## 1. 개요 (Overview)

프로젝트 전체(`src/`, `packages/`, `docs/`, `scripts/`, `vite-plugins/`)의 파일·폴더 네이밍 패턴을 수집하고, **일관된 것**, **의도는 있으나 불일치한 것**, **암묵적으로 수렴 중인 것**을 분류했다.

---

## 2. 분석 (Analysis)

### 2.1 파일 케이스(Case) 패턴 전수조사

#### ✅ 일관된 것 (Consistent)

| 규칙 | 패턴 | 적용 범위 | 예시 |
|------|------|-----------|------|
| **React 컴포넌트 → PascalCase** | `ComponentName.tsx` | 전체 | `QuickPick.tsx`, `Dialog.tsx`, `GlobalNav.tsx`, `ListView.tsx`, `TaskItem.tsx` |
| **타입/스키마 → PascalCase** | `TypeName.ts` | `os/schema/` 전체 | `FocusDirection.ts`, `FocusIntent.ts`, `BaseCommand.ts`, `OSState.ts`, `LogicNode.ts` |
| **Store/Registry → PascalCase** | `NameStore.ts` / `NameRegistry.ts` | inspector, os | `InspectorStore.ts`, `InspectedElementStore.ts`, `GroupRegistry.ts`, `FieldRegistry.ts` |
| **순수 함수/로직 → camelCase** | `functionName.ts` | os 전체 | `focusFinder.ts`, `cornerNav.ts`, `typeahead.ts`, `getCanonicalKey.ts`, `loopGuard.ts` |
| **커맨드 핸들러 → camelCase (동사)** | `verb.ts` | `os/3-commands/` 전체 | `activate.ts`, `escape.ts`, `delete.ts`, `move.ts`, `undo.ts`, `redo.ts` |
| **단위 테스트 → kebab-case.test.ts** | `topic.test.ts` | `tests/unit/` 전체 | `clipboard-commands.test.ts`, `multi-select-commands.test.ts`, `sync-focus.test.ts` |
| **E2E 테스트 → kebab-case.spec.ts** | `topic.spec.ts` | `tests/e2e/` 전체 | `todo.spec.ts`, `focus-showcase.spec.ts`, `builder-spatial.spec.ts` |
| **index.ts → barrel export** | `index.ts` | 전체 | 모든 폴더 |
| **CSS 파일 → kebab-case** | `name.css` | 전체 | `docs-viewer.css`, `codeTheme.css` (⚠ 1건 예외) |

**관찰**: 파일 확장자별 케이스 규칙이 **암묵적으로 잘 정착**되어 있다.
- `.tsx` → PascalCase (컴포넌트)
- `.ts` (타입/클래스) → PascalCase
- `.ts` (함수/유틸) → camelCase
- `.test.ts` / `.spec.ts` → kebab-case

#### ⚠ 의도는 있으나 불일치한 것 (Inconsistent)

| 불일치 | 현재 상태 | 수렴 방향 추정 |
|--------|----------|---------------|
| **dot.notation 파일** | `defineApp.bind.ts`, `defineApp.trigger.ts`, `defineApp.types.ts`, `defineApp.widget.ts`, `defineApp.testInstance.ts` | 하나의 모듈(`defineApp`)을 관심사별로 분해한 의도. **독특하지만 독자적 패턴**으로 일관됨 ✅ |
| **Middleware 파일** | `historyKernelMiddleware.ts`, `macFallbackMiddleware.ts`, `typeaheadFallbackMiddleware.ts` | camelCase + `Middleware` 접미사 — 일관됨 ✅ but `fieldKeyOwnership.ts`는 접미사 없음 |
| **유틸 파일명** | `docsUtils.ts` vs `fsAccessUtils.ts` vs `utils.ts` | camelCase + `Utils` — 있기도 하고 없기도 함 |
| **CSS 파일** | `docs-viewer.css` (kebab) vs `codeTheme.css` (camelCase) | 1건 불일치 |
| **Showcase 테스트 컴포넌트** | `ActivateTest.tsx`, `NavigateTest.tsx` 등 | PascalCase + `Test` 접미사 — **showcase 전용 패턴** |
| **features 폴더 하위** | `todo_details/` (snake_case) | 프로젝트 전체에서 **유일한 snake_case 폴더** |

---

### 2.2 폴더 케이스 & 네이밍 패턴

#### ✅ 일관된 것

| 규칙 | 패턴 | 예시 |
|------|------|------|
| **테스트 폴더** | `tests/` → `unit/` + `e2e/` | 모든 모듈에서 동일 구조 |
| **앱 폴더** | kebab-case 단수 | `todo/`, `builder/` |
| **OS 명령 하위** | kebab-case 단수 (동사/도메인) | `clipboard/`, `expand/`, `field/`, `focus/`, `navigate/`, `overlay/`, `selection/` |
| **packages** | kebab-case 단수 | `kernel/`, `surface/` |
| **docs PARA 폴더** | `N-category` (번호+kebab) | `0-inbox/`, `1-project/`, `2-area/`, `3-resource/`, `4-archive/`, `5-backlog/` |
| **프로젝트 폴더** | kebab-case | `builder-mvp/`, `os-prd/`, `field-key-ownership/` |

#### ⚠ 불일치: 단수 vs 복수

| 현재 이름 | 형태 | 역할 | 동일 레벨 대응 |
|-----------|------|------|---------------|
| `widgets/` | **복수** | 뷰 컴포넌트 모음 | `model/` (단수) — 같은 앱 내 |
| `features/` | **복수** | 기능 단위 모음 | `tests/` (복수) — 일관 |
| `primitives/` | **복수** | 빌딩 블록 모음 | 같은 레벨에 단수 없음 — 일관 |
| `stores/` | **복수** | 스토어 모음 | `panels/` (복수) — 일관 |
| `keymaps/` | **복수** | 키맵 정의 모음 | `middleware/` (단수), `registry/` (단수), `schema/` (단수) |
| `model/` | **단수** | 도메인 모델 | `widgets/` (복수) — **불일치** |
| `schema/` | **단수** | 스키마 정의 | `keymaps/` (복수) — **불일치** |

**관찰**: "여러 파일이 들어있는 컬렉션" 폴더의 단수/복수가 혼재. `tests/`는 항상 복수이나, 나머지는 일관된 규칙이 없다.

#### ⚠ 불일치: 번호 접두사

| 위치 | 패턴 | 의도 |
|------|------|------|
| `src/os/` | `1-listeners/`, `2-contexts/`, `3-commands/`, `4-effects/`, `5-hooks/`, `6-components/` | **파이프라인 실행 순서**를 파일시스템에 인코딩 |
| `docs/` | `0-inbox/`, `1-project/`, `2-area/`, `3-resource/`, `4-archive/`, `5-backlog/` | **PARA 분류 체계**의 우선순위 인코딩 |
| 기타 모든 곳 | 번호 접두사 없음 | — |

**관찰**: 번호 접두사는 **"순서가 의미인 곳"에서만** 사용. 일관성 있음 ✅. 단, OS 파이프라인에서만 사용되고 kernel/surface에는 없다.

---

### 2.3 구조적 역할 표현 방식

#### 파일의 역할 표현 — 접두사 vs 접미사 vs 폴더

| 역할 | 현재 방식 | 예시 |
|------|----------|------|
| 타입 정의 | **PascalCase 파일명 = 타입명** (파일이 곧 타입) | `FocusDirection.ts` |
| 타입 정의 (대량) | **dot.notation + `types`** | `defineApp.types.ts` |
| 앱 등록 | **`register.ts`** (동일 이름으로 통일) | `command-palette/register.ts`, `docs-viewer/register.ts` |
| 앱 정의 | **`app.ts`** (동일 이름으로 통일) | `todo/app.ts`, `builder/app.ts` |
| 테스트 | **폴더 분리** (`tests/unit/`, `tests/e2e/`) | 전체 일관 ✅ |
| 셀렉터 | **`selectors.ts`** | `todo/selectors.ts` |
| 트리거 | **`triggers.ts`** | `todo/triggers.ts` |
| 모델 | **`model/` 폴더** | `todo/model/` |
| 위젯 (뷰) | **`widgets/` 폴더** | `todo/widgets/` |

**관찰**: 앱 내부 구조(`app.ts`, `selectors.ts`, `triggers.ts`, `model/`, `widgets/`)가 **Todo와 Builder에서 동일 패턴**으로 수렴 중. 이것은 `defineApp`이 강제하는 구조적 컨벤션.

---

### 2.4 라우트 네이밍

| 패턴 | 예시 |
|------|------|
| **TanStack Router 파일 기반** | `_minimal.tsx` (레이아웃), `playground.focus.tsx` (nested) |
| **dot으로 중첩 표현** | `playground.aria.tsx`, `playground.command-palette.tsx`, `playground.kernel.tsx` |
| **Page 컴포넌트** | `TodoPage.tsx`, `BuilderPage.tsx`, `DocsPage.tsx`, `KernelLabPage.tsx` |

**관찰**: 라우트 파일은 TanStack Router 컨벤션 강제 ✅. Page 컴포넌트는 `XxxPage.tsx` 패턴 일관 ✅.

---

### 2.5 docs 문서 네이밍

| 패턴 | 예시 | 일관성 |
|------|------|--------|
| **문서 파일** | `YYYY-MMDD-HHmm-[type]-kebab-title.md` | `/inbox` 워크플로우로 생성된 것 ✅ |
| **프로젝트 메타** | `BOARD.md`, `PRD.md` | 대문자 — 프로젝트 루트 메타파일 ✅ |
| **상태/마이그레이션** | `STATUS.md`, `MIGRATION_MAP.md` | 대문자 — 시스템 메타파일 ✅ |
| **프로젝트 폴더명** | kebab-case | `builder-mvp/`, `os-prd/` ✅ |

---

## 3. 수렴 방향 추정 (Emerging Conventions)

현재 프로젝트가 **암묵적으로 수렴하고 있는** 컨벤션을 정리하면:

### 📐 Convention 초안

```
=== 파일 케이스 규칙 ===

1. React 컴포넌트          → PascalCase.tsx        (Zone.tsx, QuickPick.tsx)
2. 타입/인터페이스/클래스    → PascalCase.ts         (FocusState.ts, BaseCommand.ts)
3. 순수 함수/유틸/로직      → camelCase.ts          (focusFinder.ts, loopGuard.ts)
4. 커맨드 핸들러           → camelCase 동사.ts      (activate.ts, escape.ts, delete.ts)
5. 앱 정의 파일            → app.ts                (고정 이름)
6. 모듈 분해               → module.concern.ts     (defineApp.bind.ts, defineApp.types.ts)
7. Registry/Store          → PascalCase + 접미사.ts  (FieldRegistry.ts, InspectorStore.ts)
8. Middleware              → camelCase + Middleware.ts (historyKernelMiddleware.ts)
9. 단위 테스트             → kebab-case.test.ts
10. E2E 테스트             → kebab-case.spec.ts
11. CSS                    → kebab-case.css
12. barrel export          → index.ts              (고정)

=== 폴더 규칙 ===

13. 앱 폴더                → kebab-case (단수)     (todo/, builder/)
14. 도메인 모듈 폴더        → kebab-case (단수)     (navigate/, selection/, clipboard/)
15. 테스트 폴더            → tests/ → unit/, e2e/  (복수, 고정)
16. 뷰 컬렉션 폴더         → ??? (widgets? primitives? components?)
17. 순서 의미 폴더          → N-name/ (번호 접두사)  (1-listeners/, 0-inbox/)
18. docs 프로젝트           → kebab-case            (builder-mvp/, os-prd/)

=== 문서 규칙 ===

19. 시스템 메타파일          → UPPER_CASE.md         (STATUS.md, BOARD.md, PRD.md)
20. 분석/보고 문서           → YYYY-MMDD-HHmm-[type]-slug.md
```

---

## 4. 수렴 실패 지점 — 열린 질문이 필요한 곳

위 초안에서 **규칙으로 확정되지 않은 (Complex) 지점**들:

### Q1. 단수 vs 복수 폴더명

현재 혼재:
- 단수: `model/`, `schema/`, `middleware/`, `registry/`
- 복수: `widgets/`, `primitives/`, `keymaps/`, `stores/`, `panels/`

**선택지**:
- A) **전부 단수로 통일** — Go 언어 스타일. `widget/`, `keymap/`, `store/`. 심플.
- B) **전부 복수로 통일** — Rails 스타일. `models/`, `schemas/`, `middlewares/`. 영어 자연스러움.
- C) **역할 기준** — "도메인 모듈"은 단수, "아이템 컬렉션"은 복수. 매번 판단 필요.
- D) **현재 상태 유지** — 이미 정착된 것을 바꾸는 비용 > 일관성 이득.

### Q2. `widgets/` vs `components/` vs `primitives/` — 뷰 계층 어휘

현재 프로젝트에 3종의 "뷰 컨테이너" 이름이 공존:
- `widgets/` — 앱별 뷰 (todo의 `ListView.tsx`, `TaskItem.tsx`)
- `primitives/` — OS 레벨 빌딩 블록 (`Zone.tsx`, `Item.tsx`, `Field.tsx`)
- `components/` — 글로벌 공통 (`GlobalNav.tsx`)

이 3계층이 의도적인가? 아니면 하나로 통일하고 싶은가?

### Q3. `features/todo_details/` — snake_case 폴더

프로젝트 전체에서 **유일한 snake_case 폴더**. 단순 실수인지, feature 폴더의 의도적 네이밍인지?

### Q4. dot.notation (`defineApp.bind.ts`) — 다른 모듈에도 적용?

현재 defineApp에서만 사용. 이 패턴을 kernel이나 다른 대규모 모듈에도 적용할 것인가, defineApp 전용으로 둘 것인가?

### Q5. 번호 접두사의 적용 범위

현재 OS 파이프라인(`1-listeners/` ~ `6-components/`)과 docs PARA에서만 사용.
- 이 패턴을 **순서가 의미인 모든 곳**에 확대할 것인가?
- 아니면 현재 범위로 동결할 것인가?

### Q6. appSlice.ts — 이름의 정체성

`os/appSlice.ts`는 "Slice" 패턴(Redux-like). 프로젝트에서 이 이름은 유일. Kernel의 어휘와 정렬이 필요한가?

---

## 5. Cynefin 도메인 판정

🔴 **Complex**

네이밍 컨벤션의 개별 규칙 자체는 Complicated (분석하면 답이 좁혀짐)이지만, "이 프로젝트의 메타포(OS), 에이전트 친화성, 기존 코드와의 호환성"을 모두 만족하는 **전체 체계**를 설계하는 것은 정답이 하나가 아닌 Complex 의사결정이다.

---

## 6. 인식 한계 (Epistemic Status)

- 이 분석은 **파일명과 폴더 구조의 정적 관찰**에 기반한다. 각 파일의 내부 코드(export 이름, 변수명 등)의 일관성은 별도 감사가 필요하다.
- `docs/` 내 완료된 프로젝트(4-archive)의 네이밍은 조사하지 않았다.
- 외부 의존성(TanStack Router, Vite 등)이 강제하는 네이밍과 프로젝트 자체 네이밍을 구분했으나, 경계가 모호한 부분이 있을 수 있다.

---

## 7. 열린 질문 (Complex Questions)

1. **단수 vs 복수 폴더명**: 어떤 기준으로 통일하고 싶은가? (Q1)
2. **뷰 계층 어휘**: `widgets` / `primitives` / `components`의 3계층이 의도적 설계인가? (Q2)
3. **dot.notation 범위**: defineApp 전용인가, 프로젝트 패턴인가? (Q4)
4. **번호 접두사 범위**: 현재 범위로 동결인가, 확대인가? (Q5)
5. **이 감사의 우선순위**: 당장 리팩토링할 것인가, 먼저 규칙을 확정하고 **새 코드부터 적용**할 것인가?

---

**한줄요약**: 파일 케이스(PascalCase/camelCase/kebab-case)는 확장자별로 이미 잘 수렴해 있으나, 폴더 단수/복수, 뷰 계층 어휘(widgets/primitives/components), dot.notation 범위 등 5개 열린 질문에 대한 의사결정이 필요하다.
