# 전수 조사: OS tsx 파일 — Adapter Contract 위반 감사

| 항목 | 내용 |
|------|------|
| **원문** | tsx로 되어 있는 OS와 React의 접점 파일들을 전부 전수 조사해 |
| **내(AI)가 추정한 의도** | |
| 경위 | FocusGroup /doubt에서 "611줄인데 통로여야 한다" 발견. FocusGroup만이 아닐 것. |
| 표면 | 모든 OS tsx의 adapter contract 위반 전수 조사. |
| 의도 | headless simulator의 시뮬레이션 범위를 정확히 측정하고, 어떤 파일이 얼마나 얇아질 수 있는지 전체 그림 파악. |
| **날짜** | 2026-02-27 |
| **프로젝트** | headless-simulator |

## 전체 현황: 20 tsx 파일, 4,465줄

### Adapter Contract 판정 기준

```
✅ DECLARE — Props를 OS에 등록 (변환 없이)
✅ BIND    — DOM ref를 OS에 전달 (DOM 조회 없이)
✅ PROJECT — OS state를 JSX에 반영 (계산 없이)
✅ NOTIFY  — lifecycle을 OS에 알림 (결정 없이)

❌ DISCOVERY   — 아이템/요소를 찾는 로직
❌ COMPUTATION — attrs/state를 계산하는 로직
❌ DECISION    — 조건 분기/비즈니스 결정
```

## 1-listen (4 파일, 614줄) — 별도 카테고리

Listener는 adapter가 아니라 **OS ↔ Browser Event bridge**. DOM 이벤트를 OS 커맨드로 변환하는 것이 정당한 역할.

| 파일 | 줄 | DOM 접점 | 위반? | 비고 |
|------|-----|---------|-------|------|
| **PointerListener.tsx** | 308 | 14 | 🟡 | 가장 두꺼움. findFocusableItem에서 DOM traversal. resolveMouse/resolveClick은 순수 함수로 분리되어 있음. DOM→OS 변환 자체가 역할이므로 **정당하나 두꺼움** |
| **KeyboardListener.tsx** | 151 | 3 | 🟢 | resolveKeyboard는 순수. listener는 얇음 |
| **ClipboardListener.tsx** | 95 | 7 | 🟢 | clipboard API 접근은 browser-only 정당 |
| **FocusListener.tsx** | 72 | 3 | 🟢 | 얇고 단순 |
| **InputListener.tsx** | 40 | 2 | 🟢 | 가장 얇음 |

**소결**: Listener는 대체로 건강. PointerListener만 약간 두꺼우나, DOM→OS 변환이 본질적 역할.

## 6-components/base (2 파일, 873줄) — 핵심 위반 영역

| 파일 | 줄 | DOM 접점 | 위반 | 위반 상세 |
|------|-----|---------|------|-----------|
| **FocusGroup.tsx** | 610 | 2 (querySelectorAll×2) | 🔴 심각 | DISCOVERY: getItems/getLabels DOM scan (30줄) · DECISION: autoFocus 분기 · CONVERSION: buildZoneEntry (57줄) · Phase 1/2 이중 등록 |
| **FocusItem.tsx** | 263 | 2 (.focus(), scrollIntoView) | 🟡 중간 | COMPUTATION: isActiveFocused, tabIndex, role, expandable 전부 여기서 계산 (= computeAttrs 중복) · `.focus()` 호출은 browser-only 정당 |

### FocusItem 상세

```
현재 FocusItem이 하는 일:

L120-160: State 계산 — isFocused, isGroupActive, isSelected, isExpanded 전부 useComputed
L161:     COMPUTATION — isActiveFocused = isFocused && isGroupActive
L163-175: DECISION — .focus() 호출 여부 결정 (useLayoutEffect)
L188-194: COMPUTATION — effectiveRole, useChecked, expandable 결정
L197-228: PROJECT — sharedProps 구성 (aria-current, tabIndex, aria-selected 등)

문제: L197-228의 attrs 구성이 headless.ts:computeAttrs와 사실상 동일한 로직.
      두 곳에서 같은 계산 = 불일치 가능 = 거짓 GREEN 원인.
```

**FocusItem 이상적 형태**:
```tsx
const FocusItem = ({ id, children }) => {
  const attrs = os.useAttrs(id);     // PROJECT: computeAttrs를 구독
  useDomFocus(id, attrs);            // BIND: .focus() 호출 (browser-only)
  return <div {...attrs}>{children}</div>;  // PROJECT
};
```
현재 263줄 → 목표 ~30줄.

## 6-components/primitives (4 파일, 1,000줄)

| 파일 | 줄 | DOM 접점 | 위반 | 비고 |
|------|-----|---------|------|------|
| **Zone.tsx** | 306 | 0 | 🟡 중간 | FocusGroup의 wrapper. callback props 18개를 그대로 패스스루. **FocusGroup이 얇아지면 자동으로 얇아짐** |
| **Trigger.tsx** | 433 | 0 | 🟡 중간 | DECISION: overlay 분기 로직 (dialog/menu/popover), children 분류 (portal vs trigger). 복잡하지만 이것은 composition 패턴 — 부분적 정당 |
| **Item.tsx** | 226 | 0 | 🟢 양호 | FocusItem wrapper + render props. COMPUTATION은 os.useComputed로 subscriber만. 얇음 |
| **Root.tsx** | 45 | 0 | 🟢 양호 | 가장 얇음. 이상적 adapter |

## 6-components/field (4 파일, 943줄)

| 파일 | 줄 | DOM 접점 | 위반 | 비고 |
|------|-----|---------|------|------|
| **Field.tsx** | 491 | 1 (innerRef.innerText) | 🔴 심각 | **가장 Complex한 파일**. COMPUTATION: handleCommit validation, auto-commit, DOM sync. DECISION: mode(immediate/deferred) 분기, blur 처리. React hooks 23개 |
| **FieldInput.tsx** | 209 | 0 | 🟡 중간 | input element wrapper. 일부 DECISION (validation) |
| **FieldTextarea.tsx** | 206 | 0 | 🟡 중간 | textarea wrapper. FieldInput과 거의 동일 |
| **Label.tsx** | 64 | 0 | 🟢 양호 | 얇음 |

### Field.tsx 특이사항

Field는 FocusGroup과 다른 종류의 문제:
- FocusGroup: OS logic이 React에 갇힘 → OS로 이동 가능
- Field: **contentEditable** 특성상 DOM sync가 본질적으로 필요
- contentEditable의 innerText 동기화, selection range 관리는 browser-only DOM 조작
- 완전한 headless화가 어려운 영역 (브라우저 IME, selection API 의존)

## 6-components/기타 (6 파일, 1,042줄)

| 파일 | 줄 | DOM 접점 | 위반 | 비고 |
|------|-----|---------|------|------|
| **QuickPick.tsx** | 520 | 3 | 🔴 심각 | **applicatione-level 컴포넌트가 OS layer에 있음**. DECISION: filter, typeahead, key handler. Fit 위반 — 이것은 OS가 아니라 앱 |
| **Dialog.tsx** | 207 | 0 | 🟢 양호 | 얇은 dialog wrapper |
| **Modal.tsx** | 84 | 0 | 🟢 양호 | 얇은 modal wrapper |
| **ToastContainer.tsx** | 105 | 0 | 🟢 양호 | 순수 projection |
| **Kbd.tsx** | 66 | 0 | 🟢 양호 | 순수 UI |

## 종합 감사 결과

### 위반 등급 분류

| 등급 | 파일 | 줄 | 핵심 위반 |
|------|------|-----|----------|
| 🔴 **심각** | FocusGroup.tsx | 610 | Discovery, Decision, Conversion |
| 🔴 **심각** | Field.tsx | 491 | Computation, Decision, DOM sync |
| 🔴 **심각** | QuickPick.tsx | 520 | Fit (OS에 있으면 안 됨), Decision |
| 🟡 **중간** | FocusItem.tsx | 263 | Computation (computeAttrs 중복) |
| 🟡 **중간** | Zone.tsx | 306 | 패스스루 두께 (FocusGroup 종속) |
| 🟡 **중간** | Trigger.tsx | 433 | Decision (overlay 분기) |
| 🟡 **중간** | FieldInput.tsx | 209 | Decision (validation) |
| 🟡 **중간** | FieldTextarea.tsx | 206 | Decision (validation) |
| 🟡 **중간** | PointerListener.tsx | 308 | 두꺼움 (정당하나 축소 가능) |
| 🟢 **양호** | 나머지 11파일 | 854 | 위반 없음 또는 경미 |

### Before → After 목표

| | Before | After (목표) |
|---|--------|-------------|
| **총 줄 수** | 4,465줄 | ~2,200줄 (−50%) |
| **🔴 심각** | 3 파일, 1,621줄 | 0 파일 |
| **시뮬레이션 불가 영역** | FocusGroup Phase 2 + FocusItem attrs + Field DOM sync | Field DOM sync만 (본질적) |

### headless-simulator 관점 우선순위

| 순위 | 파일 | 효과 | 난이도 |
|------|------|------|--------|
| **1** | FocusGroup.tsx | e2e 25 FAIL 해결 + 시뮬 범위 대폭 축소 | 🟡 |
| **2** | FocusItem.tsx | computeAttrs 단일 원천 → attrs 중복 제거 | 🟢 |
| **3** | QuickPick.tsx | OS layer에서 app layer로 이동 | 🟢 |
| **4** | Zone.tsx / Trigger.tsx | FocusGroup 축소 후 자동 개선 | 자동 |
| **5** | Field.tsx | 본질적 DOM 의존 — 장기 과제 | 🔴 |

---

> **20 tsx 파일 전수 조사: 🔴 3개(1,621줄), 🟡 6개(1,725줄), 🟢 11개(1,119줄).**
> **FocusGroup + FocusItem이 headless 거짓 GREEN의 주범. Field는 본질적 DOM 의존으로 장기 과제.**  
> **QuickPick은 OS layer Fit 위반 — 앱으로 이동 대상.**
