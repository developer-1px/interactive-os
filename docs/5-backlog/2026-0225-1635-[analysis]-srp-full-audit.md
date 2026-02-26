# SRP 전수 조사 보고서

| 항목 | 내용 |
|------|------|
| **원문** | 우리 OS 개발 중에 SRP 원칙을 어긴게 있는지 확인하고 싶어 전수 조사해봐 |
| **내(AI)가 추정한 의도** | 커맨드 하이재킹, 리스너 월권, 뷰-로직 혼합 등 구조적 부채가 코드베이스에 잠재해있는지 rules.md 기준으로 체계적 가시화 |
| **날짜** | 2026-02-25 16:35 |
| **상태** | 분석 완료, 사용자 판단 대기 |

---

## 1. 개요

`rules.md`에 명시된 6개 SRP 관련 조항(#5, #6, #9, #11, #13, 검증#9)을 근거로, 7개 검사 축 × 8개 레이어를 정적 분석하여 전수 조사.

### 검사 축 정의

| 축 | 정의 | rules.md 근거 |
|:--:|------|:---:|
| **V1** | 커맨드 하이재킹 — A 커맨드 내부에서 B 커맨드를 dispatch | #13 |
| **V2** | 번역기 월권 — Listener가 순수 번역 이외의 로직 수행 | #5 |
| **V3** | 뷰-로직 혼합 — 컴포넌트가 상태 변이 로직 보유 | Project#2 |
| **V4** | 상태 배치 오류 — 변경 주체와 배치 위치 불일치 | #11 |
| **V5** | 다중 책임 — 파일이 2개 이상의 변경 이유를 가짐 | SRP 원론 |
| **V6** | DOM 직접 조작 — OS 코드에서 DOM API 직접 사용 | 검증#9 |
| **V7** | 엔트로피 증가 — `eslint-disable`, `as any`, 예외적 패턴 | Project#1 |

---

## 2. 전수 조사 결과표

### 범례
- 🔴 **Violation** — 명확한 SRP 위반. 분리 필요.
- 🟡 **Suspect** — 위반 가능성. 검토 필요.
- 🟢 **Clean** — 위반 없음.
- **—** — 해당 축이 적용되지 않는 레이어.

---

### Layer 1: `3-commands/` (커맨드 핸들러)

| 파일 | LOC | V1 | V2 | V3 | V4 | V5 | V6 | V7 | 코멘트 |
|------|:---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|--------|
| `navigate/index.ts` | 211 | 🔴 | — | — | 🟢 | 🟡 | 🟢 | 🟢 | **V1: `OS_EXPAND`를 `dispatch`로 위임.** APG Tree 패턴 구현이지만, Navigate가 "이동 + 확장"이라는 두 가지 책임을 진다. 또한 selection(range) 로직까지 내장해 V5 의심. |
| `interaction/activate.ts` | 61 | 🔴 | — | — | 🟢 | 🟡 | 🟢 | 🟢 | **V1: `OS_EXPAND`를 `dispatch`로 위임.** Activate가 "활성화 + 확장 토글"이라는 두 가지 행동. rules.md #13을 정면 위반하지만, APG가 "Enter로 expandable 토글"을 스펙으로 요구해서 정당한 예외일 수 있음. |
| `field/cancel.ts` | 59 | 🟡 | — | — | 🟢 | 🟢 | 🟢 | 🟢 | **V1: `queueMicrotask(() => os.dispatch(command))` — 앱 커맨드를 비동기 dispatch.** 직접 하이재킹은 아니지만, 커맨드 내부에서 다른 커맨드를 트리거하는 패턴. Bridge 소명이 문서화되어 있어 제한적 허용. |
| `field/startEdit.ts` | 67 | 🟡 | — | — | 🟢 | 🟡 | 🟢 | 🟢 | **V1: cancel과 동일한 `queueMicrotask(dispatch)` 패턴.** 또한 V5: "이전 필드 커밋 + 캐럿 복원 + 새 필드 활성화"의 세 가지 관심사가 한 핸들러에 합쳐져 있음. |
| `selection/select.ts` | 97 | 🟢 | — | — | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** 단일 책임(선택 상태 변경). `onSelect` 콜백 dispatch는 커맨드가 아닌 앱 콜백이므로 허용. |
| `dismiss/escape.ts` | 75 | 🟢 | — | — | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** `switch`로 모드별 분기하지만 모두 "dismiss"라는 단일 책임. `onDismiss` 콜백도 위임 패턴. |
| `expand/` | — | 🟢 | — | — | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** 순수한 expand/collapse 상태 변경. |
| `clipboard/` | — | 🟢 | — | — | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** copy/cut/paste 각각 단일 파일, 단일 책임. |
| `interaction/check.ts` | — | 🟢 | — | — | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** checked 토글 단일 책임. |
| `interaction/delete.ts` | — | 🟢 | — | — | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** |
| `toast/toast.ts` | — | 🟢 | — | — | 🟢 | 🟢 | 🟢 | 🟡 | V7: `as any` 1회 (타입 캐스팅). 사소하지만 기록. |

---

### Layer 2: `1-listeners/` (입력 해석기)

| 파일 | LOC | V1 | V2 | V3 | V4 | V5 | V6 | V7 | 코멘트 |
|------|:---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|--------|
| `mouse/MouseListener.tsx` | 309 | — | 🟡 | — | — | 🟡 | 🟢 | 🟢 | **V2: `seedCaretFromPoint` — 번역 + 캐럿 좌표 계산이 혼합.** 또한 `handleSelectModeClick`가 "재클릭 시 활성화" 판단까지 수행. V5: sense + resolve + dispatch 세 관심사를 한 파일에 담고 있으나, 파이프라인 문서화가 잘 되어 있어 구조적 의도는 명확. |
| `keyboard/` | — | — | 🟢 | — | — | 🟢 | 🟢 | 🟢 | **깨끗.** 키보드 → keybinding 해석만 수행. |
| `clipboard/` | — | — | 🟢 | — | — | 🟢 | 🟢 | 🟢 | **깨끗.** 클립보드 이벤트 → OS 커맨드 번역. |
| `input/` | — | — | 🟢 | — | — | 🟢 | 🟢 | 🟢 | **깨끗.** |
| `focus/` | — | — | 🟢 | — | — | 🟢 | 🟢 | 🟢 | **깨끗.** |

---

### Layer 3: `6-components/` (OS 컴포넌트)

| 파일 | LOC | V1 | V2 | V3 | V4 | V5 | V6 | V7 | 코멘트 |
|------|:---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|--------|
| `base/FocusGroup.tsx` | 558 | — | — | 🟡 | 🟢 | 🔴 | 🟢 | 🟢 | **V5: 558줄에 Context 정의 3개(Zone, Focus, deprecated Compat) + buildZoneEntry + FocusGroup 컴포넌트.** 최소 3개의 변경 이유(Context 구조, Registry 등록 로직, 렌더링). 가장 큰 OS 컴포넌트 파일. |
| `field/Field.tsx` | 490 | — | — | 🟡 | 🟡 | 🔴 | 🟢 | 🟡 | **V3: `useState(isParentEditing)` — OS가 관리해야 할 상태를 로컬로 관리.** V5: Registry 등록 + 값 동기화 + auto-commit + 유효성 검증 + 스타일 6가지 관심사. V7: `eslint-disable` 1회. V4: `isParentEditing`은 OS 포커스 상태에서 파생되어야 하는데 `useState`+`useLayoutEffect`로 로컬 관리. |
| `quickpick/QuickPick.tsx` | 519 | — | — | 🟡 | 🟡 | 🔴 | 🟢 | 🟢 | **V4: `useState(query)` — 검색 쿼리를 OS가 아닌 로컬 상태로 관리.** V5: 필터링 로직 + 렌더링 + 키바인딩 + Zone 등록이 한 파일. OS 철학("앱 코드에 useState 0줄")에 가장 정면으로 위배. |
| `primitives/Trigger.tsx` | 417 | — | — | 🟢 | 🟢 | 🔴 | 🟢 | 🟡 | **V5: Base Trigger + Portal(Dialog 래핑) + Dismiss가 한 파일에 공존.** 세 가지 컴포넌트의 변경 이유가 독립적(Trigger 클릭, Portal 렌더링, Dismiss 닫기). V7: `eslint-disable` 1회, `as any` 1회(Portal props). |
| `primitives/Item.tsx` | 249 | — | — | 🟢 | 🟢 | 🟡 | 🟢 | 🟢 | **V5: Item + ExpandTrigger + CheckTrigger 서브 컴포넌트.** 관련 컴포넌트이긴 하지만 독립적으로 변경될 수 있음. |
| `primitives/Zone.tsx` | 305 | — | — | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** |
| `field/FieldInput.tsx` | 209 | — | — | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** |
| `field/FieldTextarea.tsx` | 206 | — | — | 🟢 | 🟢 | 🟡 | 🟢 | 🟢 | V5: FieldInput과 거의 동일한 구조 — 중복 코드 냄새. 통합 가능한 후보. |
| `radox/Dialog.tsx` | — | — | — | 🟢 | 🟢 | 🟢 | 🟢 | 🟡 | V7: `as any` 1회 (`child.type` 비교), `as unknown as ReactElement` 1회. |
| `toast/ToastContainer.tsx` | — | — | — | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** |

---

### Layer 4: `defineApp*.ts` (앱 정의 모듈)

| 파일 | LOC | V1 | V2 | V3 | V4 | V5 | V6 | V7 | 코멘트 |
|------|:---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|--------|
| `defineApp.ts` | 363 | — | — | — | 🟢 | 🟡 | 🟢 | 🟡 | V5: Condition/Selector 팩토리 + registerCommand + createZone + bind + useComputed가 한 파일. 이미 `.bind.ts`, `.trigger.ts`, `.page.ts` 등으로 분해되었지만 남은 코어도 5가지 역할. V7: `as unknown as` 3회 (Brand 타입 캐스팅, 의도적 설계). |
| `defineApp.bind.ts` | — | — | — | — | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** 바인딩 전담. |
| `defineApp.trigger.ts` | — | — | — | — | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** |
| `defineApp.page.ts` | 319 | — | — | — | 🟢 | 🟡 | 🟢 | 🟢 | V5: AppPage 인터페이스 + 팩토리 + keyboard/mouse/attrs 헬퍼. 관련 관심사이지만 300줄+ 크기. |
| `defineApp.testInstance.ts` | — | — | — | — | 🟢 | 🟢 | 🟢 | 🟡 | V7: `as any` 5회 (테스트 인프라, 커맨드 핸들러 등록 시 타입 우회). |
| `defineApp.undoRedo.ts` | 207 | — | — | — | 🟢 | 🟢 | 🟢 | 🟡 | V7: `eslint-disable` 2회 + `as any` 2회. |

---

### Layer 5: `collection/` (컬렉션 모듈)

| 파일 | LOC | V1 | V2 | V3 | V4 | V5 | V6 | V7 | 코멘트 |
|------|:---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|--------|
| `createCollectionZone.ts` | 629 | 🟢 | — | — | 🟢 | 🔴 | 🟢 | 🟢 | **V5: 629줄. CRUD(remove/move/duplicate) + Clipboard(copy/cut/paste) + Focus recovery + collectionBindings 생성까지.** 최소 3개의 독립적 변경 이유. 프로젝트 내 가장 큰 단일 파일. `collectionZone.core.ts`(360줄)로 타입/ops를 분리했지만 메인 팩토리가 여전히 비대. |
| `collectionZone.core.ts` | 359 | — | — | — | 🟢 | 🟢 | 🟢 | 🟢 | **깨끗.** 타입 + ops + 유틸리티. 잘 분리됨. |

---

### Layer 6: `middlewares/` (미들웨어)

| 파일 | LOC | V1 | V2 | V3 | V4 | V5 | V6 | V7 | 코멘트 |
|------|:---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|--------|
| `historyKernelMiddleware.ts` | 292 | — | — | — | 🟢 | 🟡 | 🟢 | 🟡 | V5: Noise Filtering + Snapshot Capture + Undo/Redo Apply + Transaction(groupId) 관리 = 4가지 관심사. V7: `eslint-disable` 1회 (`@typescript-eslint/no-unused-vars`). |

---

### Layer 7: `appSlice.ts` + `headless.ts` + `createOsPage.ts` (인프라)

| 파일 | LOC | V1 | V2 | V3 | V4 | V5 | V6 | V7 | 코멘트 |
|------|:---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|--------|
| `appSlice.ts` | 313 | — | — | — | 🟢 | 🔴 | 🟢 | 🟢 | **V5: App State 등록 + Persistence Middleware 생성 + Reset All 유틸 = 3가지 변경 이유.** Persistence는 별도 파일로 분리 가능한 독립 관심사. |
| `headless.ts` | 355 | — | — | — | 🟢 | 🔴 | 🟢 | 🟢 | **V5: State Readers + simulateKeyPress + simulateClick + computeAttrs + Clipboard Shim + Observer 6가지 관심사.** 공유 유틸이지만 변경 이유가 너무 다양. |
| `createOsPage.ts` | 482 | — | — | — | 🟢 | 🟡 | 🟢 | 🟢 | V5: OsPage 인터페이스 + 팩토리 + Mock 셋업 + goto 헬퍼. headless와 짝을 이루므로 관련성은 높음. |

---

### Layer 8: `apps/` (앱 코드)

| 파일 | LOC | V1 | V2 | V3 | V4 | V5 | V6 | V7 | 코멘트 |
|------|:---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|--------|
| `todo/app.ts` | 528 | 🟢 | — | — | 🟢 | 🟡 | 🟢 | 🟢 | V5: App 정의 + Selector 7개 + Zone 바인딩 2개 + 커맨드 10+개가 한 파일. Collection facade가 CRUD를 흡수하여 커맨드 수가 줄었지만, 여전히 거대한 단일 app.ts. 다만 앱 코드의 "단일 모듈" 패턴은 FSD 구조에서 허용 범위일 수 있음. |
| `builder/app.ts` | 524 | 🟢 | — | — | 🟢 | 🟡 | 🟢 | 🟢 | V5: todo와 동일 패턴. 2개 Collection + canvas bindings + canvasClipboard 로직. `buildCanvasCollections`는 독립 유틸로 분리 가능한 후보. |

---

## 3. 요약 대시보드

### 위반 유형별 집계

| 축 | 🔴 Violation | 🟡 Suspect | 비고 |
|:--:|:-----------:|:----------:|------|
| **V1** 커맨드 하이재킹 | **2** | 2 | `navigate→expand`, `activate→expand`. Bridge 패턴(`field/*.ts`)은 Suspect. |
| **V2** 번역기 월권 | 0 | **1** | `MouseListener`의 seedCaretFromPoint |
| **V3** 뷰-로직 혼합 | 0 | **3** | `Field`, `FocusGroup`, `QuickPick` |
| **V4** 상태 배치 오류 | 0 | **2** | `Field.useState(isParentEditing)`, `QuickPick.useState(query)` |
| **V5** 다중 책임 | **6** | 7 | 가장 빈번한 위반 유형. `createCollectionZone`, `FocusGroup`, `Field`, `Trigger`, `appSlice`, `headless` |
| **V6** DOM 직접 조작 | **0** | 0 | 🎉 **완벽 클린.** DOM API 직접 사용 0건. |
| **V7** 엔트로피 증가 | 0 | **6** | `as any` 총 50+회 (대부분 테스트 코드), 프로덕션은 ~10회. `eslint-disable` 7회. |

### Top 5 위험 파일 (복합 위반)

| 순위 | 파일 | LOC | 위반 축 수 | 핵심 문제 |
|:---:|------|:---:|:--------:|----------|
| 1 | `createCollectionZone.ts` | 629 | V5×1 | CRUD + Clipboard + Focus recovery가 한 파일 |
| 2 | `6-components/field/Field.tsx` | 490 | V3 + V4 + V5 + V7 | OS 상태를 `useState`로 관리, 6가지 관심사 혼합 |
| 3 | `6-components/base/FocusGroup.tsx` | 558 | V3 + V5 | Context 3개 + buildEntry + 컴포넌트가 한 파일 |
| 4 | `3-commands/navigate/index.ts` | 211 | V1 + V5 | Navigate 내부에서 Expand dispatch + selection 로직 내장 |
| 5 | `headless.ts` | 355 | V5×1 | 6가지 관심사(Readers, KeyPress, Click, Attrs, Clipboard, Observer) |

---

## 4. 결론 / 제안

### 즉시 정리 가능 (Clear — 자명한 분리)

1. **`FocusGroup.tsx`**: Context 정의(ZoneContext, FocusContext)를 별도 `contexts.ts`로 추출. `buildZoneEntry`를 별도 유틸로 분리. → 558줄 → ~300줄 예상.
2. **`Trigger.tsx`**: Portal과 Dismiss를 `TriggerPortal.tsx`, `TriggerDismiss.tsx`로 분리. → 417줄 → ~200줄 예상.
3. **`appSlice.ts`**: `createPersistenceMiddleware`를 `middlewares/persistenceMiddleware.ts`로 분리.
4. **`headless.ts`**: State Readers / Simulation / ComputeAttrs / Observer를 각각 분리.

### 토론 필요 (Complicated — 분석하면 답이 좁혀짐)

5. **`navigate/index.ts`의 V1**: APG Tree 스펙이 "ArrowRight = expand"를 요구하므로, Navigate 내부에서 OS_EXPAND를 dispatch하는 것이 진짜 하이재킹인지 아니면 "W3C 스펙 구현"인지 판정 필요.
6. **`createCollectionZone.ts`**: CRUD / Clipboard / FocusRecovery를 어떤 단위로 나눌지. facade 패턴의 정당한 범위는 어디까지인지.
7. **`Field.tsx`의 V4**: `isParentEditing`을 OS 상태로 올릴지, 현재의 로컬 `useState` + `useLayoutEffect` 패턴이 성능상 필요한지.
8. **`QuickPick.tsx`의 V4**: QuickPick 자체가 OS 프리미티브인데, `query` 상태를 OS에 올리면 모든 QuickPick 인스턴스의 쿼리가 OS 상태에. 이게 올바른 방향인지.

### 허용 가능한 예외 (as any)

- **테스트 코드의 `as any` (~40회)**: 테스트 편의를 위한 모킹. `config: {} as any` 등. 타입 안전한 테스트 헬퍼로 교체하면 제거 가능하지만, 우선순위는 낮음.
- **Brand 타입의 `as unknown as` (defineApp.ts 3회)**: 의도적 설계. Type Brand 패턴의 필수적 캐스팅.

---

## 5. Cynefin 도메인 판정

🟡 **Complicated**

rules.md에 SRP 기준이 명확히 정의되어 있고, 정적 분석으로 위반을 식별할 수 있다. 다만 APG 스펙과의 충돌(V1 navigate/activate), facade 패턴의 적정 범위(V5 collection) 등 일부 항목은 맥락 판단이 필요하여 Clear는 아님.

---

## 6. 인식 한계

- 이 분석은 **정적 코드 분석**에 기반. 런타임 시 커맨드 간 암묵적 의존 (예: 미들웨어를 통한 간접 상호작용)은 감지하지 못했다.
- `apps/` 하위 페이지 컴포넌트 (`pages/builder/PropertiesPanel.tsx` 706줄 등)는 OS 코드가 아니므로 검사 범위에서 제외했다.
- `as any` 카운트는 grep 기반이며, 일부는 타입 추론 컨텍스트에서 정당할 수 있다.

---

## 7. 열린 질문

1. **Navigate→Expand dispatch**: APG 스펙 준수를 위한 정당한 위임인가, 아니면 `navigate` 커맨드가 "navigation only"를 보장하고 expand는 별도 경로(keybinding 분기)로 처리해야 하는가?
2. **QuickPick의 `useState(query)`**: OS 프리미티브 안에서 로컬 상태를 쓰는 것을 금지해야 하는가? 아니면 "일시적 UI 상태"는 OS 상태와 별개로 허용하는가?
3. **Field의 `isParentEditing`**: 이것은 OS 포커스 시스템의 누락된 기능인가 (OS가 "부모 편집 중" 상태를 제공해야 하는데 안 하고 있는 것), 아니면 필드 컴포넌트의 내부 구현 세부사항인가?
4. **`createCollectionZone` 629줄**: Clipboard 로직을 분리하면 collection의 응집도가 깨지는가? cut-after-paste 등의 교차 관심사를 어떻게 처리하는가?

---

> **한줄요약**: V6(DOM 직접 조작)은 완벽 클린이지만, V5(다중 책임) 6건이 가장 심각하며, 특히 `createCollectionZone`(629줄)과 `Field.tsx`(490줄, 복합 위반 4축)이 최우선 분리 대상.
