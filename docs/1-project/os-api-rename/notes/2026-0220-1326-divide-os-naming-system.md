# /divide — OS 네이밍 체계 분석

> **대상**: OS 커맨드 32개, 훅 3개, 진입점 `kernel`, barrel export `index.ts`
> **목적**: 분석 보고서. 코드 수정이 아니라 뭘 고칠지 분류하는 것.

---

## Step 1: 대상 분석

### 커맨드 접두어 현황 (총 32개)

| 접두어 | 변수명 | 디버그 문자열 | 일치? |
|--------|--------|-------------|:-----:|
| `OS_` | `OS_COPY` | `"OS_COPY"` | ✅ |
| `OS_` | `OS_PASTE` | `"OS_PASTE"` | ✅ |
| `OS_` | `OS_CUT` | `"OS_CUT"` | ✅ |
| `OS_` | `OS_DELETE` | `"OS_DELETE"` | ✅ |
| `OS_` | `OS_UNDO` | `"OS_UNDO"` | ✅ |
| `OS_` | `OS_REDO` | `"OS_REDO"` | ✅ |
| `OS_` | `OS_MOVE_UP` | `"OS_MOVE_UP"` | ✅ |
| `OS_` | `OS_MOVE_DOWN` | `"OS_MOVE_DOWN"` | ✅ |
| `OS_` | `OS_CHECK` | `"OS_CHECK"` | ✅ |
| `OS_` | `OS_SELECT_ALL` | `"OS_SELECT_ALL"` | ✅ |
| `OS_` | `OS_CLIPBOARD_SET` | `"OS_CLIPBOARD_SET"` | ✅ |
| ❌ 없음 | `NAVIGATE` | `"OS_NAVIGATE"` | ❌ |
| ❌ 없음 | `EXPAND` | `"OS_EXPAND"` | ❌ |
| ❌ 없음 | `FOCUS` | `"OS_FOCUS"` | ❌ |
| ❌ 없음 | `SELECT` | `"OS_SELECT"` | ❌ |
| ❌ 없음 | `ACTIVATE` | `"OS_ACTIVATE"` | ❌ |
| ❌ 없음 | `TAB` | `"OS_TAB"` | ❌ |
| ❌ 없음 | `ESCAPE` | `"OS_ESCAPE"` | ❌ |
| ❌ 없음 | `RECOVER` | `"OS_RECOVER"` | ❌ |
| ❌ 없음 | `SYNC_FOCUS` | `"OS_SYNC_FOCUS"` | ❌ |
| `FIELD_` | `FIELD_START_EDIT` | `"OS_FIELD_START_EDIT"` | ❌ |
| `FIELD_` | `FIELD_COMMIT` | `"OS_FIELD_COMMIT"` | ❌ |
| `FIELD_` | `FIELD_CANCEL` | `"OS_FIELD_CANCEL"` | ❌ |
| `SELECTION_` | `SELECTION_SET` | `"OS_SELECTION_SET"` | ❌ |
| `SELECTION_` | `SELECTION_ADD` | `"OS_SELECTION_ADD"` | ❌ |
| `SELECTION_` | `SELECTION_REMOVE` | `"OS_SELECTION_REMOVE"` | ❌ |
| `SELECTION_` | `SELECTION_TOGGLE` | `"OS_SELECTION_TOGGLE"` | ❌ |
| `SELECTION_` | `SELECTION_CLEAR` | `"OS_SELECTION_CLEAR"` | ❌ |
| `OVERLAY_` | `OVERLAY_OPEN` | `"OS_OVERLAY_OPEN"` | ❌ |
| `OVERLAY_` | `OVERLAY_CLOSE` | `"OS_OVERLAY_CLOSE"` | ❌ |
| `STACK_` | `STACK_PUSH` | `"OS_STACK_PUSH"` | ❌ |
| `STACK_` | `STACK_POP` | `"OS_STACK_POP"` | ❌ |

**결과**: 11개만 일치, 21개 불일치. 디버그 문자열은 전부 `OS_` 접두어인데 변수명은 제각각.

### 사용 범위 분석

| 커맨드 그룹 | 앱에서 직접 import? | 실제 사용처 |
|------------|:------------------:|-----------|
| `NAVIGATE`, `SELECT`, `EXPAND` | ❌ 거의 없음 | OS 내부 + keybinding → 앱은 bind()로 간접 사용 |
| `SELECTION_*` 5개 | ❌ 없음 | OS 내부 (clipboard, delete) + 테스트만 |
| `OS_COPY/CUT/PASTE` | ❌ 없음 | Collection facade가 래핑 |
| `FIELD_*` | ❌ 없음 | keybinding + Zone 내부 |
| `OS_UNDO/REDO` | ✅ 앱이 `onUndo/onRedo`에 사용 | `app.ts` bind() |

> **핵심 발견**: 앱이 직접 import해서 쓰는 커맨드가 거의 없다. 대부분 OS 내부 소비.

---

## Step 3: Cynefin 도메인 판정

### Clear — 자명한 해법

| # | 항목 | 해법 | 증명 방법 |
|---|------|------|----------|
| C1 | 변수명 ↔ 디버그 문자열 불일치 | 변수명을 디버그 문자열과 일치시킴 (`NAVIGATE` → `OS_NAVIGATE`) | tsc + grep "변수명 = 디버그문자열" |
| C2 | `kernel` → `os` 변수명 | `export const os = kernel` alias 추가 or rename | tsc |

### Complicated — 분석하면 좁혀짐

| # | 항목 | 트레이드오프 |
|---|------|------------|
| K1 | 접두어 전략 통일 | **방향 A**: 전부 `OS_` (일관성 ↑, 길이 ↑) vs **방향 B**: 전부 접두어 제거 (짧음, 디버그 혼란) |
| K2 | `SELECTION_*` 5개 통합 | `SELECT` 하나로 mode 통합 가능하나, 앱은 안 쓰고 OS 내부만 사용 → 내부 리팩토링 |
| K3 | 훅 네이밍 + 접근 경로 | `useFocusExpansion` → `os.useExpansion()` or `kernel.hooks.expansion()` |

### Complex — 설계 결정 필요

| # | 항목 | 왜 Complex인가 |
|---|------|---------------|
| X1 | `kernel` vs `os` 정체성 | `createKernel`은 범용 라이브러리(kernel 패키지). `kernel.ts`에서 인스턴스를 만들어 `os/`에 두었는데, 변수명은 `kernel`. **내부 구현체 이름(kernel)과 외부 역할(OS)이 충돌**. 단순 rename이 아니라 아키텍처적 의사결정 |

---

## 분해 결론

```
OS 네이밍 체계
├── [Clear] C1. 변수명 = 디버그 문자열 일치 → 기계적 rename
├── [Clear] C2. kernel alias → export const os = kernel
├── [Complicated] K1. 접두어 전략 → 방향 결정 후 일괄 적용
├── [Complicated] K2. SELECTION_* 내부 통합 → SELECT mode 확장
├── [Complicated] K3. 훅 재설계 → os.* 네임스페이스
└── [Complex] X1. kernel vs os 정체성 → 아키텍처 결정 필요
```

### 권장 실행 순서

1. **X1 먼저 결정** → kernel? os? 둘 다? → 이름이 정해져야 나머지 rename 방향이 결정
2. **K1 결정** → 접두어 전부 `OS_`? 전부 없이? → C1의 방향이 결정
3. **C1 + C2 실행** → 기계적 rename
4. **K2 + K3** → 내부 리팩토링 (앱 영향 없음)

### 질문 (사용자에게)

> **X1**: `createKernel`이라는 범용 라이브러리 이름은 유지하되, 앱이 쓰는 인스턴스 변수만 `os`로 바꾸면 충분한가? 아니면 패키지 이름 자체를 바꿔야 하는가?
