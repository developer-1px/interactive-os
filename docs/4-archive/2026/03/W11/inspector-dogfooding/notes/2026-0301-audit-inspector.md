# /audit — Inspector Dogfooding (2026-03-01) (Revised)

> **감사 대상**: `src/inspector/` 전체 (T1~T4 수정 파일 + 미수정 devtool 패널)
> **Red Team 판정 기준**: AUDITBOOK §1-A/B/C

---

## 위반 전수 열거 및 분류

### A. UnifiedInspector.tsx (T1~T4 수정 대상)

| # | 줄 | 위반 패턴 | 코드 스니펫 | 분류 | 근본 원인 |
|---|-----|----------|------------|------|----------|
| 1 | 241 | `useState` | `const [manualToggles, setManualToggles] = useState<Set<number>>(new Set())` | 🟡 OS 갭 | 트랜잭션 펼침/접힘은 App 상태로 이관 가능하나, T5 분할과 함께 처리 예정 |
| 2 | 242 | `useState` | `const [traceOpen, setTraceOpen] = useState(true)` | 🟡 OS 갭 | 섹션 Accordion 상태. OS에 Inspector용 collapse 프리미티브 없음 |
| 3 | 243 | `useState` | `const [storeOpen, setStoreOpen] = useState(false)` | 🟡 OS 갭 | 위와 동일 |
| 4 | 326 | `useEffect` | scrollTick 변화 감지 → scrollToBottom 호출 | 🟡 OS 갭 | OS에 "상태 변화 → DOM side-effect" 반응형 파이프라인 없음. App이 useEffect로 브릿지할 수밖에 없음 |
| 5 | 341 | `useEffect` | 새 트랜잭션 도착 시 auto-scroll | 🟡 OS 갭 | 위와 동일. |
| 6 | 302 | `querySelector` | `el.querySelector('[data-tx-index]:last-of-type')` | ⚪ 정당한 예외 | scroll target DOM 탐색 — OS가 스크롤 대상 해석 불가 |
| 7 | 321 | `os.dispatch` | `os.dispatch(setScrollState(...))` | 🟡 OS 갭 | `onScroll` 제스처를 커맨드로 선언하는 방법이 OS에 없음 |
| 8 | 433 | `onClick` | `onClick={() => handleToggleGroup(group)}` | 🟡 OS 갭 | 동적 리스트(group) 트리거 등록 부재. ZIFT Zone/Item으로 전환 (T5 과제) |
| 9 | 476 | `onClick` | `onClick={expandAll}` | 🟡 OS 갭 | expandAll은 로컬 setState 호출. |
| 10 | 484 | `onClick` | `onClick={collapseAll}` | 🟡 OS 갭 | 위와 동일 |
| 11 | 590 | `os.dispatch` | `onClick={() => os.dispatch(INSPECTOR_SCROLL_TO_BOTTOM())}` | 🔴 LLM 실수 | `app.ts`에 `InspectorScrollUI` Zone과 Trigger를 명시적으로 만들었으나 View에서 사용하지 않고 직접 이벤트와 dispatch를 바인딩함. |
| 12 | 748 | `onClick` | `onClick={onToggle}` (트랜잭션 행 토글) | 🟡 OS 갭 | Item 토글 = manualToggles local state. |
| 13 | 749 | `onKeyDown` | Enter/Space 토글 | 🟡 OS 갭 | 위와 동일 구조 |
| 14 | 774-775 | `os.dispatch` | Highlight hover dispatch | 🟡 OS 갭 | ZIFT의 `TriggerBinding`은 `onActivate` (click/enter)만 지원하며, `onHover`/`onMouseEnter` 지원 없음 |
| 15 | 776 | `onClick` | `e.stopPropagation()` | ⚪ 정당한 예외 | 이벤트 버블 차단 (OS에 해당 메커니즘 없음) |
| 16 | 803 | `onClick` | Copy to clipboard | 🟡 OS 갭 | Clipboard 커맨드가 Inspector에 없음 |
| 17 | 959 | `onClick` | CollapsibleSection onToggle | 🟡 OS 갭 | 섹션 상태가 로컬 |
| 18 | 984 | `useState` | `useState<Record<...>>` (snapshot) | 🟡 OS 갭 | DOM 감시 측정을 계속하는 프리미티브 없음 |
| 19 | 989 | `useEffect` | snapshot update effect | 🟡 OS 갭 | 위와 동일 |
| 20 | 995-997 | `querySelector/getElementById` | snapshot DOM 탐색 | 🟡 OS 갭 | 위와 동일 |

### B. HighlightOverlay.tsx (T4 신규)

| # | 줄 | 위반 패턴 | 코드 스니펫 | 분류 | 근본 원인 |
|---|-----|----------|------------|------|----------|
| 21 | 1 | `useEffect, useState` | import | ⚪ 정당한 예외 | DOM Overlay 대상의 bounding client rect를 읽고, scroll 및 resize 이벤트에 순수하게 반응하는 것은 브라우저 DOM API 측정이 필수임. (OS에 `useElementRectById` 같은 Hook이 제공되지 않음) |
| 22 | 9 | `useState` | `useState<DOMRect \| null>(null)` | ⚪ 정당한 예외 | 위와 동일. |
| 23 | 11 | `useEffect` | DOM 위치 추적 effect | ⚪ 정당한 예외 | 위와 동일. |
| 24 | 19-21 | `querySelector/getElementById` | highlight 대상 탐색 | ⚪ 정당한 예외 | DOM 위치를 읽는 것은 View 레이어의 정당한 책임 |
| 25 | 34-35 | `addEventListener` | scroll/resize 리스너 | ⚪ 정당한 예외 | DOM 위치 추적은 브라우저 API 필수 |

---

## 분류 요약

```
총 위반 (T1~T4 수정 범위): 25건
  🔴 LLM 실수:     1건 (#11: ScrollToBottom Button)
  🟡 OS 갭:        18건 (#1~5, #7, #8, #9, #10, #12, #13, #14, #16~20, #26)
  ⚪ 정당한 예외:   6건 (#6, #15, #21~25)
```

---

## 🔴 LLM 실수 — 근본 원인 진단

| # | 위반 | 근본 원인 | 루프백 |
|---|------|----------|--------|
| 11 | 스크롤 버튼 `os.dispatch` 직접 호출 | Bind 잘못됨 — `InspectorScrollUI` Trigger를 만들어 두고 안 씀 | → `/bind` |

**근본 원인**: `/bind` 단계에서 만들어둔 `Trigger.Element` 래퍼 렌더러를 사용하지 않고, React 원시 엘리먼트에 직접 `onClick`과 `os.dispatch`를 박는 `useState`/이벤트 브릿지를 습관적으로 작성함.

---

## 🟡 OS 갭/정당한 예외 정리 (배움)

- **Hover 트리거 부재**: ZIFT Trigger는 Click/Enter(`onActivate`)만 지원함. `onMouseEnter`는 OS 커맨드를 dispatch 하는 선언형 파이프라인이 없으므로 직접 dispatch가 최선임. (=> 🟡 OS 갭)
- **Overlay State 관리**: DOM Node의 물리적 크기(`getBoundingClientRect()`)를 계속 추적하여 렌더링하려면 App 수준 State가 아니라 View 레이어의 `useEffect`/`window.addEventListener("scroll")`을 사용할 수 밖에 없음. (=> ⚪ 정당한 예외)
- **ScrollEvent 리스너**: `onScroll`은 커맨드로 선언할 방법이 OS에 없음. (=> 🟡 OS 갭)
