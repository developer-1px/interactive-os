# 🔴 Red Team: `src/os/` 폴더 구조 평가

> 2026-03-02 | Scope: `src/os/` 최상위 구조 + 2-depth

---

## As-Is (현재 13 folders)

```
src/os/
├── 1-listen/     P1 Sense        (8 sub-folders, 1 file)
├── 2-resolve/        P2 Intent       (8 files flat)
├── 3-inject/        P3 Context      (4 files)
├── 4-command/      P4 Resolve      (14 sub-folders)
├── 5-effect/       P5 Sync         (1 file)
├── core/            Kernel Infra    (2 files + 5 folders)
├── headless/        OS Brain        (4 files)
├── collection/      Data Library    (6 files)
├── widgets/         UI Adapters     (1 file + 3 folders)
├── defineApp/       App Framework   (7 files)
├── modules/         App Plugins     (4 files)
├── 6-project/      ZIFT            (3 files + 2 folders)
└── testing/         Verification    (7 files)
```

---

## Gap Analysis

| # | 공격 | As-Is | Gap | To-Be 제안 | 비용 | 판정 |
|---|------|-------|-----|-----------|------|------|
| **G1** | 번호 폴더가 비번호에 매몰 (`ls` 시 알파벳순) | 5 numbered + 8 unnumbered, 알파벳순 정렬 시 `collection/` ~ `widgets/`가 먼저 출현 | 파이프라인이 시각적으로 묻힘 | 비번호 폴더에 `_` prefix → `_core/`, `_headless/` 등. 알파벳순에서 숫자 뒤로 밀려나지 않고, **숫자 폴더가 항상 상단에 표시** | 파일명 변경 + import 갱신 ~50 files | 🟡 **중간** — 시각 효과 대비 변경 비용 |
| **G2** | `headless/` → `3-inject` 역방향 의존 | `headless/compute.ts` → `@os/3-inject/zoneContext` | core에서 분리했지만 의존 관계는 동일 | **Option A**: `headless/`를 `core/`로 복귀 (원상복구) <br> **Option B**: `zoneContext`의 순수함수 부분을 `headless/`로 이동하여 의존 역전 <br> **Option C**: 허용 — headless가 context를 읽는 것은 "계산에 입력이 필요한" 본질적 관계 | A: low, B: medium, C: 0 | 🟢 **Option C 수용** — 순수 계산이 context를 참조하는 것은 자연스러움 |
| **G3** | `widgets/`가 OS에 속할 이유 | Toast, Radix Dialog, QuickPick, Kbd — 전부 3rd party 래퍼 | ZIFT도 아니고 파이프라인도 아닌데 `src/os/`에 존재 | **`src/os/` 밖으로 이동**: `src/widgets/` or `src/shared/ui/` | import 갱신 ~7 files | 🔴 **실행 권장** — OS의 순수성 보장 |
| **G4** | `core/` 분해가 응집도 파괴 | "인프라가 어디에?" → 5곳(core, headless, collection, widgets, lib) 분산 | 원래 `core/` 1개 규칙이 사라짐 | **`headless/`와 `collection/`은 core로 복귀** + `widgets/`만 외부 이동. core가 "OS 인프라 전부"라는 단일 규칙 복원 | import 갱신 ~25 files | 🟡 **중간** — G3 해결 시 자동으로 완화 |
| **G5** | `2-resolve/` 내부 flat file dump | 8개 파일이 서브폴더 없이 flat 나열 | `4-command/`는 14개 서브폴더로 잘 분류됐는데 `2-resolve/`는 미정리 | `2-resolve/resolve/` (resolveFieldKey, resolveItemKey, keybindings), `2-resolve/normalize/` (getCanonicalKey, fieldKeyOwnership), `2-resolve/defaults/` (osDefaults, middlewares) | 파일 이동 + import ~15 files | ⚪ **선택적** — 8개 파일은 flat으로도 관리 가능한 규모 |
| **G6** | `3-inject/` 4개 파일의 독립 폴더 | files 4개뿐. `4-command/` 서브폴더 하나보다 작음 | 파이프라인 번호를 부여할 만큼의 규모인가? | **유지** — 규모가 아니라 **역할**로 번호를 부여. "Context Inject"는 "Resolve"와 다른 독립 단계. 파일이 적은 건 이 단계가 잘 추상화됐다는 의미 | 0 | 🟢 **수용** — 단계의 독립성이 파일 수보다 중요 |
| **G7** | `5-effect/` 파일 1개 | `index.ts` 단일 파일 | G6와 동일 질문 | **유지** — 동일 논거. FocusSync, ScrollIntoView 등 effect가 추가되면 자연스럽게 폴더 성장. 미리 collapse하면 나중에 다시 분리해야 | 0 | 🟢 **수용** |
| **G8** | `modules/` vs `defineApp/` 경계 | `defineApp/undoRedo.ts` vs `modules/history.ts` — 둘 다 history 관련 | 어디까지가 "핵심 API"이고 어디까지가 "플러그인"인가? | **명확화**: `defineApp/` = 앱 정의에 **필수**인 코어 API (bind, trigger, types). `modules/` = **선택적** 플러그인 (history, persistence, deleteToast). `undoRedo.ts`는 defineApp 내부에서 undo/redo **커맨드 팩토리**를 제공하므로 코어에 해당. `history.ts`는 커널 미들웨어 **등록**이므로 플러그인 | 0 — 문서화만 | 🟢 **수용** — 경계가 자의적이 아니라 "필수 vs 선택" 기준 |

---

## To-Be 제안 (실행 우선순위)

### Priority 1: `widgets/` OS 외부 이동 (G3)

```diff
 src/os/                    src/
-├── widgets/               ├── widgets/        ← OS 밖으로 이동
 ├── 1-listen/           os/
 ├── ...                    ├── 1-listen/
                            ├── ...
```

**이유**: OS의 정체성은 "인터랙션 커널"이다. Radix Dialog 래퍼는 OS가 아니라 UI 유틸이다.

### Priority 2: `headless/` + `collection/`  → `core/` 복귀 (G4)

```diff
 src/os/
-├── headless/
-├── collection/
 ├── core/
 │   ├── kernel.ts
 │   ├── appState.ts
+│   ├── headless/          ← 복귀
+│   ├── collection/        ← 복귀
 │   ├── types/
 │   ├── state/
 │   ├── registries/
 │   ├── middlewares/
 │   └── lib/
```

**이유**: Topology 개선보다 Concept 응집이 4-Lens에서 상위다 (Flow > Dependency > **Concept** > Topology). `core/` = "OS 인프라 전부"라는 단일 규칙이 더 가치가 높다.

**Topology 긴장 해소**: `core/` 안에서 **Tier 분류**를 README나 주석으로 문서화:

```
core/
├── [Boot]       kernel.ts, appState.ts
├── [Types]      types/, state/
├── [Runtime]    registries/, middlewares/
├── [Engine]     headless/
├── [Data]       collection/
└── [Util]       lib/
```

### Priority 3 (선택): 비번호 폴더 `_` prefix (G1)

```diff
 src/os/
 ├── 1-listen/
 ├── 2-resolve/
 ├── 3-inject/
 ├── 4-command/
 ├── 5-effect/
-├── core/
-├── defineApp/
-├── modules/
-├── 6-project/
-├── testing/
+├── _core/
+├── _defineApp/
+├── _modules/
+├── _6-project/
+├── _testing/
```

**효과**: `ls`에서 `1-`, `2-`, `3-`, `4-`, `5-`가 항상 최상단, `_`가 하단.
**비용**: import 갱신 ~200 files. 비용 대비 효과가 낮을 수 있음.

---

## To-Be 최종 구조 (P1+P2 적용 시)

```
src/os/  (10 folders)
├── 1-listen/     P1 Sense
├── 2-resolve/        P2 Intent
├── 3-inject/        P3 Context
├── 4-command/      P4 Resolve
├── 5-effect/       P5 Sync
├── core/            OS Infrastructure (kernel + headless + collection + types + registries + ...)
├── defineApp/       App Framework
├── modules/         App Plugins (optional)
├── 6-project/      ZIFT Primitives (Zone, Item, Field, Trigger, accessors)
└── testing/         Verification

src/widgets/         UI Adapters (toast, radix, quickpick, Kbd) — OS 밖
```

**점수 변화 예상**:

| 렌즈 | As-Is | To-Be | 변화 |
|------|-------|-------|------|
| Flow | 7 | 8 | 비번호 잡음 감소 |
| Dependency | 6 | 7 | headless→3-inject는 허용, widgets 분리로 외부 의존 제거 |
| Concept | 5 | **8** | "OS 인프라 = core" 단일 규칙 복원 |
| Topology | 7 | 7 | core 내부 Tier 분류로 보완 |
| **전체** | **6.25** | **7.5** | **+1.25** |

---

## 판정 요약

| 공격 | 결론 |
|------|------|
| G1 번호 매몰 | 🟡 P3로 후순위. `_` prefix 비용 높음 |
| G2 headless 의존 | 🟢 허용 (본질적 관계) |
| G3 widgets OS 소속 | 🔴 **P1 실행**: `src/widgets/`로 이동 |
| G4 core 분해 응집도 | 🟡 **P2 실행**: `headless/`, `collection/` → `core/` 복귀 |
| G5 2-resolve flat | ⚪ 선택적 (8 files 관리 가능) |
| G6 3-inject 4파일 | 🟢 허용 (역할 기준) |
| G7 5-effect 1파일 | 🟢 허용 (성장 여지) |
| G8 modules 경계 | 🟢 허용 (필수 vs 선택) |
