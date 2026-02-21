# /doubt + /review: 유닛 테스트 커버리지 분석

> 2026-02-19 18:01 · 보고서 모드
> 대상: `src/**/tests/unit/**/*.test.ts` + `src/**/tests/integration/**/*.test.ts` (43개 파일)

---

## 1. 전체 지도: 소스 vs 테스트 매핑

### OS 레이어

| 모듈 | 소스 파일 | 유닛 테스트 | 통합 테스트 | 커버리지 판정 |
|------|:---------:|:----------:|:----------:|:----------:|
| **1-listeners/keyboard** | `resolveKeyboard.ts` | ✅ `resolveKeyboard.test.ts` | — | 🟢 |
| **1-listeners/mouse** | `resolveMouse.ts` | ✅ `resolveMouse.test.ts` | — | 🟢 |
| **1-listeners/clipboard** | `resolveClipboard.ts` | ✅ `resolveClipboard.test.ts` | — | 🟢 |
| **1-listeners/focus** | `FocusListener.tsx` | ❌ | — | 🔴 |
| **1-listeners/input** | `InputListener.tsx` | ❌ | — | 🔴 |
| **1-listeners** | `shared.ts` | ❌ | — | 🟡 |
| **2-contexts** | `index.ts`, `zoneRegistry.ts` | ✅ `zoneRegistry.test.ts` | — | 🟢 |
| **3-commands/navigate** | 7 파일 (`focusFinder`, `cornerNav`, `strategies`, `typeahead` 등) | ✅ 각각 있음 | ✅ `navigate.test.ts` | 🟢 |
| **3-commands/focus** | `focus.ts`, `recover.ts`, `stack.ts`, `syncFocus.ts` | ✅ 각각 있음 | ✅ `focus.test.ts` | 🟢 |
| **3-commands/selection** | `select.ts`, `selectAll.ts`, `selection.ts` | ✅ `selection.test.ts`, `multi-select-commands.test.ts` | — | 🟢 |
| **3-commands/tab** | 3 파일 | ✅ `tab.test.ts` | ✅ `tab.test.ts` (integration) | 🟢 |
| **3-commands/dismiss** | `escape.ts`, `resolveEscape.ts` | ✅ `escape.test.ts` | — | 🟢 |
| **3-commands/expand** | `index.ts`, `resolveExpansion.ts` | ✅ `expand.test.ts` | — | 🟢 |
| **3-commands/field** | `field.ts` | ✅ `field.test.ts` | — | 🟢 |
| **3-commands/overlay** | `overlay.ts` | ✅ `overlay.test.ts` | — | 🟢 |
| **3-commands/clipboard** | `clipboard.ts` | ✅ `clipboard-commands.test.ts` | — | 🟢 |
| **3-commands/interaction** | `activate.ts`, `check.ts`, `delete.ts`, `move.ts`, `undo.ts`, `redo.ts` | ✅ `os-commands.test.ts` | — | 🟡 |
| **3-commands/utils** | `buildZoneCursor.ts` | ✅ `zone-cursor.test.ts` | — | 🟢 |
| **4-effects** | `index.ts` | ❌ | — | 🔴 |
| **5-hooks** | `getCaretPosition.ts`, `useFieldHooks.ts`, `useFocusExpansion.ts` | ❌ | — | 🔴 |
| **6-components/field** | `Field.tsx`, `FieldRegistry.ts`, `Label.tsx` | ✅ `FieldRegistry.test.ts` | ✅ `field-registry.test.ts` | 🟡 |
| **6-components/primitives** | `Item.tsx`, `Root.tsx`, `Trigger.tsx`, `Zone.tsx` | ❌ | — | 🔴 |
| **6-components/base** | `FocusGroup.tsx`, `FocusItem.tsx` | ❌ | — | 🔴 |
| **6-components/radox** | `Dialog.tsx`, `Modal.tsx` | ❌ | — | 🔴 |
| **6-components/quickpick** | `QuickPick.tsx` | ❌ | — | 🔴 |
| **keymaps** | 6 파일 | ✅ 4개 테스트 | — | 🟢 |
| **middlewares** | `historyKernelMiddleware.ts` | ✅ `history.test.ts`, `transaction.test.ts` | — | 🟢 |
| **registries** | `roleRegistry.ts` | ✅ `roleHelpers.test.ts`, `rolePresets.test.ts` | — | 🟢 |
| **schemas** | 25 파일 (7 하위 디렉토리) | ❌ | — | 🔴 |
| **state** | `OSState.ts`, `initial.ts`, `utils.ts` | ❌ | — | 🔴 |
| **defineApp** | 5 파일 (`defineApp.ts`, `.bind.ts`, `.trigger.ts`, `.types.ts`, `.testInstance.ts`) | ❌ | — | 🔴 |
| **kernel** | `kernel.ts` | ❌ | — | 🔴 |
| **appSlice** | `appSlice.ts` | ❌ | — | 🔴 |
| **lib** | `loopGuard.ts` | ❌ | — | 🔴 |

### 앱 레이어

| 모듈 | 소스 파일 | 유닛 테스트 | 통합 테스트 | 커버리지 판정 |
|------|:---------:|:----------:|:----------:|:----------:|
| **apps/todo** | ~8 파일 | ✅ `todo.test.ts`, `eliminate-sync-draft.test.ts` | — | 🟡 |
| **apps/builder** | ~8 파일 | ✅ `builder.test.ts` | — | 🟡 |

### 기타 모듈

| 모듈 | 소스 파일 | 유닛 테스트 | 커버리지 판정 |
|------|:---------:|:----------:|:----------:|
| **command-palette** | 5 파일 | ✅ `command-palette.test.ts`, `fuzzyMatch.test.ts` | 🟢 |
| **inspector** | ~20 파일 | ✅ `inferPipeline.test.ts` (1개) | 🔴 |
| **docs-viewer** | 12 파일 | ✅ `docs-scroll.test.ts` (1개) | 🔴 |

---

## 2. /doubt 분석 (Round 1)

### 필터 체인 적용

#### 🔴 제거 후보 (쓸모가 있나?)

| # | 테스트 | 판정 | 이유 |
|:-:|--------|:----:|------|
| 1 | `eliminate-sync-draft.test.ts` | 🔴 | **과잉생산 (Lean: 재고)**. `syncDraft` 패턴은 `FieldRegistry`로 대체 완료 (conversation b2c663cd 참조). 이 테스트가 검증하는 대상이 더 이상 존재하지 않을 가능성 높음. |

#### 🟡 축소/재설계 후보

| # | 테스트 | 판정 | 이유 |
|:-:|--------|:----:|------|
| 2 | `os-commands.test.ts` | 🟡 재설계 | **형태가 맞나?** `interaction/` 디렉토리에 6개 커맨드(`activate`, `check`, `delete`, `move`, `undo`, `redo`)가 있지만 하나의 테스트 파일에 뭉쳐 있음. 커맨드별 분리 필요. |
| 3 | `docs-scroll.test.ts` | 🟡 축소 | **줄일 수 있나?** docs-viewer 12개 소스 중 스크롤 하나만 테스트. 존재 자체는 유효하나 이름이 범위를 오도함. |
| 4 | `inferPipeline.test.ts` | 🟡 축소 | **더 적게?** inspector ~20 소스 중 1개만 커버. 있는 것은 좋지만 커버리지 대비 거짓 안전감 유발. |

#### 🟢 유지

나머지 39개 테스트: 존재 이유 유효, 형태 적절, 대상 소스와 1:1 매핑됨.

### Chesterton's Fence

| # | Fence 질문 | 결과 |
|:-:|-----------|:----:|
| 1 | `eliminate-sync-draft.test.ts` — syncDraft 제거를 증명하기 위해 만들어짐 → 그 이유가 아직 유효한가? → FieldRegistry 마이그레이션 완료 후 이 테스트의 회귀 보호 가치는 소멸 → **✅ 제거 확정** |
| 2 | `os-commands.test.ts` — interaction 커맨드 통합 테스트 → 유효하나 형태가 맞지 않음 → **🟡 재설계** |
| 3-4 | 존재 이유 유효 → **🟢 유지** (축소 의견은 개선 제안으로 격하) |

---

## 3. /review 분석 (커버리지 관점)

### 🔴 철학 위반 — 테스트 없는 핵심 모듈

> Rule #1: "테스트가 먼저다. 테스트가 스펙이고, 통과가 증명이다."
> Rule #6: "안 쓰는 테스트는 정리한다. 죽은 테스트는 거짓 안전감을 준다."

| 심각도 | 의도 | 대상 | 설명 |
|:------:|:----:|------|------|
| 🔴 | `[Blocker]` | **schemas/** (25 파일, 테스트 0) | 커맨드 타입 정의, 포커스 스키마 등 시스템 전체의 타입 안전성 기반. 스키마 변경 시 회귀 감지 불가. |
| 🔴 | `[Blocker]` | **defineApp.\*** (5 파일, 테스트 0) | 앱 정의 팩토리. 모든 앱이 이 인터페이스로 생성됨. 변경 시 전 앱 파급. |
| 🔴 | `[Blocker]` | **kernel.ts** (테스트 0) | 디스패치 루프의 심장. 미들웨어 체인, 커맨드 라우팅 핵심. |
| 🔴 | `[Blocker]` | **appSlice.ts** (테스트 0) | 앱 상태 슬라이스. 리듀서 로직 검증 없음. |
| 🔴 | `[Blocker]` | **state/** (3 파일, 테스트 0) | `OSState`, initial state. 상태 구조 변경 회귀 보호 없음. |

### 🟡 네이밍/구조 위반

| 심각도 | 의도 | 대상 | 설명 |
|:------:|:----:|------|------|
| 🟡 | `[Suggest]` | **6-components/** 전체 | React 컴포넌트 6개(Zone, Item, Trigger, Root, FocusGroup, FocusItem) + 오버레이 3개(Dialog, Modal, QuickPick) 유닛 테스트 0. E2E에서 간접 커버되나, 컴포넌트 단위 로직(이벤트 핸들링, prop 매핑) 검증 부재. |
| 🟡 | `[Suggest]` | **5-hooks/** | `useFieldHooks`, `useFocusExpansion`, `getCaretPosition` — 순수 로직 추출 가능한 부분 테스트 없음. |
| 🟡 | `[Suggest]` | **4-effects/** | effect 체인 검증 없음. |
| 🟡 | `[Suggest]` | **lib/loopGuard.ts** | 루프 가드 — 에지 케이스가 중요한 유틸인데 테스트 없음. |

### 🔵 개선 제안

| 심각도 | 의도 | 대상 | 설명 |
|:------:|:----:|------|------|
| 🔵 | `[Suggest]` | **inspector/** | 20개 소스 중 1개 테스트. testbot은 별도 역할이므로 제외해도, panels/stores/shell 커버 0. |
| 🔵 | `[Suggest]` | **docs-viewer/** | 12개 소스 중 1개 테스트. `docsUtils.ts`, `fsAccessUtils.ts` 등 순수함수 테스트 가능. |
| 🔵 | `[Thought]` | **vitest.config.ts** | `coverage` 설정 미추가. `@vitest/coverage-v8`이 설치되어 있으나 config에 `coverage` 섹션 없음. 자동 추적 불가. |

### 🟢 Praise

| 의도 | 대상 | 설명 |
|:----:|------|------|
| `[Praise]` | **3-commands/** | 12개 하위 모듈 중 11개 유닛 테스트 보유. 통합 테스트 3개. 커맨드 레이어 커버리지 우수. |
| `[Praise]` | **keymaps/** | 6개 소스 중 4개 테스트. 키바인딩 해석 로직 잘 보호됨. |
| `[Praise]` | **1-listeners/resolve\*** | 3대 리졸버 모두 유닛 테스트 보유. 입력 파이프라인 변환 로직 검증됨. |

---

## 4. /doubt 결과 (1라운드 수렴)

| Round | 🔴 제거 | 🟡 축소 | ↩️ 자기교정 | 수렴? |
|:-----:|:------:|:------:|:---------:|:----:|
| 1     | 1      | 1      | —         | ✅   |

### 🔴 제거 (1건)
- **`eliminate-sync-draft.test.ts`**: syncDraft 패턴 폐기 완료 → 회귀 보호 대상 소멸. 죽은 테스트 = 거짓 안전감 (rule #6 위반).

### 🟡 재설계 (1건)
- **`os-commands.test.ts`**: interaction/ 6개 커맨드를 한 파일에 뭉침 → 커맨드별 분리 권고 (`activate.test.ts`, `check.test.ts` 등).

### 🟢 유지 (41건)
- 나머지 전부: 1:1 매핑, 존재 이유 유효.

### 📊 Before → After (테스트 파일 수)
- 유닛 테스트: 43 → 42 (−1 제거)
- 권고 분리: 1 → 6 (os-commands 분리 시 +5)
- 총: 43 → **47** (재설계 적용 시)

---

## 5. 커버리지 갭 요약: 우선순위별 로드맵

### Tier 1 — 지금 당장 (시스템 심장)

| 대상 | 소스 크기 | 테스트 난이도 | 사유 |
|------|:---------:|:----------:|------|
| `kernel.ts` | 2.1KB | 낮음 | 순수함수 디스패치. mock 쉬움 |
| `appSlice.ts` | 10.4KB | 중간 | 리듀서 로직. snapshot 테스트 가능 |
| `state/` (3 파일) | 2.3KB | 낮음 | 초기값 + 유틸. 가장 쉬움 |
| `defineApp.ts` + `.bind.ts` | 14KB | 중간 | 팩토리 패턴. 이미 `.testInstance.ts` 존재 |

### Tier 2 — 이번 스프린트 (안전망 확장)

| 대상 | 소스 크기 | 테스트 난이도 |
|------|:---------:|:----------:|
| `schemas/` 핵심 (command, focus) | ~10KB | 낮음 (타입 가드 테스트) |
| `lib/loopGuard.ts` | 5.1KB | 낮음 |
| `5-hooks/getCaretPosition.ts` | 1.6KB | 낮음 |

### Tier 3 — 점진적 (UI 컴포넌트)

| 대상 | 비고 |
|------|------|
| `6-components/primitives/` | E2E에서 간접 커버 중. 로직 추출 후 유닛 테스트 |
| `6-components/base/` | FocusGroup/FocusItem 이벤트 로직 |
| `6-components/radox/` | Dialog/Modal 상태 머신 |

---

## 6. vitest coverage 활성화 권고

현재 `vitest.config.ts`에 `coverage` 섹션이 없어 정량적 추적이 불가합니다.

```diff
 test: {
   include: [
     "src/**/tests/unit/**/*.test.ts",
     "src/**/tests/integration/**/*.test.ts",
   ],
   environment: "jsdom",
   globals: true,
+  coverage: {
+    provider: "v8",
+    include: ["src/os/**/*.ts", "src/apps/**/*.ts"],
+    exclude: ["**/*.test.ts", "**/*.spec.ts", "**/tests/**"],
+    reporter: ["text", "html"],
+    thresholds: {
+      statements: 50,
+    },
+  },
 },
```

> `@vitest/coverage-v8`이 이미 설치되어 있으므로 `npx vitest run --coverage`로 즉시 실행 가능합니다.
