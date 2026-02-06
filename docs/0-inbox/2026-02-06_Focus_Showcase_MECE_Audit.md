# Focus Showcase MECE Audit Report

**작성일**: 2026-02-06  
**대상**: `/focus-showcase` 페이지  
**목적**: `types.ts`에 정의된 모든 FocusGroup 옵션과 실제 테스트 커버리지 비교 분석

---

## 1. 개요 (Overview)

`src/pages/focus-showcase/` 페이지는 FocusGroup 파이프라인(Sense → Intent → Update → Commit → Sync)의 동작을 검증하는 8개의 테스트 컴포넌트로 구성되어 있습니다.

### 현재 테스트 구성

| Test 파일 | 검증 대상 |
|-----------|----------|
| `NavigateTest.tsx` | orientation, loop, 2D spatial |
| `SelectTest.tsx` | mode, toggle, range, followFocus |
| `TabTest.tsx` | escape, trap, flow |
| `ActivateTest.tsx` | manual, automatic |
| `DismissTest.tsx` | escape: deselect/close |
| `AutofocusTest.tsx` | entry: first/last/restore, autoFocus |
| `AriaFacadeTest.tsx` | role passthrough, aria-* attributes |
| `AriaInteractionTest.tsx` | Trigger, Field, Selection primitives |

---

## 2. MECE 갭 분석 (Gap Analysis)

### 2.1 NavigateConfig 옵션

| 옵션 | types.ts 정의 | 테스트 커버리지 | 상태 |
|------|--------------|----------------|------|
| `orientation` | 'horizontal' \| 'vertical' \| 'both' | ✅ 모두 커버 | **OK** |
| `loop` | boolean | ✅ true/false 커버 | **OK** |
| `seamless` | boolean | ❌ **미테스트** | **GAP** |
| `typeahead` | boolean | ❌ **미테스트** | **GAP** |
| `entry` | 'first' \| 'last' \| 'restore' \| 'selected' | ⚠️ `'selected'` 미커버 | **PARTIAL** |
| `recovery` | 'next' \| 'prev' \| 'nearest' | ❌ **미테스트** | **GAP** |

> [!WARNING]
> **`seamless`**: Web Builder의 Block 간 경계 없는 네비게이션에 핵심 기능이나 showcase에서 검증되지 않음.

### 2.2 TabConfig 옵션

| 옵션 | types.ts 정의 | 테스트 커버리지 | 상태 |
|------|--------------|----------------|------|
| `behavior` | 'trap' \| 'escape' \| 'flow' | ✅ 모두 커버 | **OK** |
| `restoreFocus` | boolean | ❌ **미테스트** | **GAP** |

### 2.3 SelectConfig 옵션

| 옵션 | types.ts 정의 | 테스트 커버리지 | 상태 |
|------|--------------|----------------|------|
| `mode` | 'none' \| 'single' \| 'multiple' | ✅ single, multiple 커버 | **PARTIAL** (`none` 암묵적) |
| `followFocus` | boolean | ✅ RadioGroup 테스트 | **OK** |
| `disallowEmpty` | boolean | ⚠️ 선언은 있으나 **동작 검증 없음** | **GAP** |
| `range` | boolean | ✅ Shift+Click 테스트 | **OK** |
| `toggle` | boolean | ✅ Ctrl+Click 테스트 | **OK** |

### 2.4 ActivateConfig 옵션

| 옵션 | types.ts 정의 | 테스트 커버리지 | 상태 |
|------|--------------|----------------|------|
| `mode` | 'manual' \| 'automatic' | ✅ 모두 커버 | **OK** |

### 2.5 DismissConfig 옵션

| 옵션 | types.ts 정의 | 테스트 커버리지 | 상태 |
|------|--------------|----------------|------|
| `escape` | 'close' \| 'deselect' \| 'none' | ⚠️ `'none'` 미커버 | **PARTIAL** |
| `outsideClick` | 'close' \| 'none' | ❌ **미테스트** | **GAP** |

> [!IMPORTANT]
> `DismissTest.tsx` description에 `escape: 'refocus'` 옵션이 언급되어 있으나 **types.ts에 정의되지 않음** (문서-코드 불일치).

### 2.6 ProjectConfig 옵션

| 옵션 | types.ts 정의 | 테스트 커버리지 | 상태 |
|------|--------------|----------------|------|
| `autoFocus` | boolean | ✅ AutofocusTest | **OK** |
| `virtualFocus` | boolean | ❌ **미테스트** | **GAP** |

### 2.7 FocusIntent 타입 커버리지

| Intent 타입 | 테스트 커버리지 | 상태 |
|-------------|----------------|------|
| `NAVIGATE` | ✅ NavigateTest | **OK** |
| `TAB` | ✅ TabTest | **OK** |
| `SELECT` | ✅ SelectTest | **OK** |
| `ACTIVATE` | ✅ ActivateTest | **OK** |
| `DISMISS` | ✅ DismissTest | **OK** |
| `FOCUS` | ⚠️ 암묵적 (click) | **PARTIAL** |
| `POINTER` | ❌ **미테스트** | **GAP** |
| `EXPAND` | ❌ **미테스트** | **GAP** |

> [!CAUTION]
> **`EXPAND` Intent**가 types.ts에 정의되어 있으나 showcase에서 Tree/Accordion 확장 테스트가 **완전히 누락**됨.

---

## 3. 문서-코드 불일치 (Discrepancies)

| 위치 | 문제 |
|------|------|
| `DismissTest.tsx:48` | `escape: 'refocus'` 옵션 언급 → **types.ts에 없음** |
| `NavigateTest.tsx:72` | `wrapping` 옵션 언급 → **types.ts에 없음** (과거 레거시?) |

---

## 4. 결론 및 제안 (Conclusion & Recommendations)

### 4.1 Critical Gaps (즉시 추가 필요)

1. **ExpandTest.tsx** 신규 생성
   - Tree/Accordion 컴포넌트의 `EXPAND` intent 검증
   - `aria-expanded` 상태 projection 검증

2. **SeamlessNavigationTest.tsx** 신규 생성
   - Builder Block 간 경계 없는 네비게이션 검증
   - `navigate.seamless: true` 동작 확인

3. **OutsideClickTest** 추가
   - `dismiss.outsideClick: 'close'` 동작 검증

### 4.2 Partial Coverage 보완

| 현재 테스트 | 추가 케이스 |
|------------|------------|
| AutofocusTest | `entry: 'selected'` 케이스 추가 |
| DismissTest | `escape: 'none'` 기본값 검증 추가 |
| SelectTest | `disallowEmpty: true` 시 Escape로 deselect 불가 검증 |

### 4.3 Documentation Cleanup

- `DismissTest.tsx` description에서 `escape: 'refocus'` 제거 또는 types.ts에 추가
- `NavigateTest.tsx` description에서 `wrapping` 제거 또는 명확화

---

## 5. 우선순위 매트릭스

| 항목 | 영향도 | 구현 난이도 | 우선순위 |
|------|--------|------------|---------|
| EXPAND Test | 🔴 High | 🟡 Medium | **P0** |
| seamless Test | 🔴 High | 🔴 High | **P1** |
| outsideClick Test | 🟡 Medium | 🟢 Low | **P2** |
| virtualFocus Test | 🟡 Medium | 🟡 Medium | **P2** |
| 문서-코드 정합성 | 🟢 Low | 🟢 Low | **P3** |
