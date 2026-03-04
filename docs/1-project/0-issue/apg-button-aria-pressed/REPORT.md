## /divide Report — APG Button toggle은 `aria-pressed`를 투영해야 한다

### Problem Frame

| | 내용 | 확신 |
|---|------|-----|
| **Objective** | Toggle button이 W3C APG 스펙대로 `aria-pressed`를 투영한다 | 🟢 |
| **Constraints** | OS 기존 `aria-checked` 경로를 깨지 않는다 (checkbox, switch, radio 등 기존 소비자 보호) | 🟢 |
| **Variables** | `CheckConfig`에 `aria` 필드를 추가할 것인가, `computeFieldAttrs`에서 childRole 기반 자동 분기할 것인가 | 🟡 |

### Backward Chain

| Depth | Subgoal | 충족? | Evidence | 미충족 시 전제조건 |
|-------|---------|-------|----------|--------------------|
| 0 | **Toggle button이 `aria-pressed`를 투영한다** | ❌ | `aria-pressed` 문자열이 OS packages에 0건 | → A, B, C, D, E |
| 1 | **A. `computeFieldAttrs`가 role 기반으로 `aria-pressed` 방출** | ❌ | [compute.ts:82-84](file:///Users/user/Desktop/interactive-os/packages/os-core/src/3-inject/compute.ts#L82-L84) — `check.mode === "check"` → 항상 `aria-checked` | → A1, A2 |
| 2 | A1. `computeFieldAttrs`에 childRole 정보가 전달된다 | ❌ | [compute.ts:148-158](file:///Users/user/Desktop/interactive-os/packages/os-core/src/3-inject/compute.ts#L148-L158) — `FieldAttrsInput`에 `childRole` 없음 | 🔨 **WP1** |
| 2 | A2. `aria-pressed` 분기 조건이 정의되어 있다 | ❌ | `CHECKED_ROLES` set에 `button` 미포함 (올바름), `PRESSED_ROLES` 개념 부재 | 🔨 **WP2** |
| 1 | **B. `ItemAttrs` 타입에 `aria-pressed` 존재** | ❌ | [headless.types.ts:26](file:///Users/user/Desktop/interactive-os/packages/os-core/src/3-inject/headless.types.ts#L26) — `aria-checked` 만 있음 | 🔨 **WP3** |
| 1 | **C. `CheckConfig`가 `aria-pressed` 모드를 지원** | ❌ | [FocusGroupConfig.ts:141-148](file:///Users/user/Desktop/interactive-os/packages/os-core/src/schema/types/focus/config/FocusGroupConfig.ts#L141-L148) — `mode: "check" \| "select" \| "none"`, `aria` 필드 없음 | 🔨 **WP4** |
| 1 | **D. TestBot script가 `aria-pressed` 검증** | ❌ | [button.ts:13](file:///Users/user/Desktop/interactive-os/packages/os-devtool/src/testing/scripts/apg/button.ts#L13) — `aria-checked` 검증 중 | 🔨 **WP5** |
| 1 | **E. Headless test가 올바르게 `aria-pressed` 기대** | ✅ | [button.apg.test.ts:82-86](file:///Users/user/Desktop/interactive-os/tests/apg/button.apg.test.ts#L82-L86) — 이미 `aria-pressed` 기대 (현재 FAIL 상태) | — |

### Work Packages

| WP | Subgoal | 왜 필요한가 (chain) | 파일 | Evidence |
|----|---------|-------------------|------|----------|
| **WP1** | `computeFieldAttrs`에 childRole 전달 | Goal ← A ← A1 | `compute.ts` | `FieldAttrsInput`에 `childRole` 없음 |
| **WP2** | `aria-pressed` 분기 로직 | Goal ← A ← A2 | `compute.ts` | childRole이 `button`이면 `aria-pressed`, 아니면 `aria-checked` |
| **WP3** | `ItemAttrs` 타입에 `aria-pressed` 추가 | Goal ← B | `headless.types.ts` | 타입 부재 |
| **WP4** | `CheckConfig.aria?: "checked" \| "pressed"` 추가 | Goal ← C | `FocusGroupConfig.ts` | 선례: `SelectConfig.aria?: "selected" \| "checked"` |
| **WP5** | TestBot script `aria-checked` → `aria-pressed` 수정 | Goal ← D | `button.ts` | 잘못된 속성 검증 |

### 설계 판단: WP4의 필요성

> **⚠️ WP2와 WP4는 택일이 아니라 조합 문제다.**

| 접근 | 장점 | 단점 |
|------|------|------|
| **A. childRole 기반 자동 분기** (WP1+WP2만) | 선언 변경 불필요 | `computeFieldAttrs`가 roleRegistry에 의존 (계층 위반 가능) |
| **B. `CheckConfig.aria` 명시** (WP4+WP2) | `SelectConfig.aria`와 동일 패턴, 선언적, 계층 깨끗 | consumer가 `aria: "pressed"` 명시 필요 |
| **C. 하이브리드** (WP4 + rolePreset에서 자동 설정) | 최선 — toolbar preset에 `check: { mode: "check", aria: "pressed" }` | WP1 불필요 |

**제 판단: C (하이브리드).** `CheckConfig`에 `aria` 필드를 추가하되, `rolePresets`의 `toolbar`에 기본값을 설정. `computeFieldAttrs`가 이 값만 읽으면 되므로 계층 위반 없음. WP1은 불필요해짐.

### 최종 WP 목록 (C 접근 기준)

| WP | 내용 | 크기 |
|----|------|------|
| **WP3** | `ItemAttrs` 타입에 `"aria-pressed"?: boolean` 추가 | S |
| **WP4** | `CheckConfig.aria?: "checked" \| "pressed"` 추가, DEFAULT_CHECK 유지 | S |
| **WP2'** | `computeFieldAttrs`에서 `aria` 필드 읽어서 `aria-checked` vs `aria-pressed` 분기 | S |
| **WP-Preset** | `toolbar` rolePreset에 필요 시 설정, 또는 `ButtonPattern`의 bind options에 `check: { mode: "check", aria: "pressed" }` 추가 | S |
| **WP5** | TestBot script 수정 | S |

### Residual Uncertainty

- 🟡 **WP-Preset 위치**: `toolbar` rolePreset에 `check.aria: "pressed"` 를 넣을 것인가? toolbar의 모든 item이 button은 아닐 수 있다(menuitem 등 혼합). 앱 레벨(`ButtonPattern`)에서 bind options로 명시하는 게 더 안전할 수 있다. → **사용자 확인 필요**
