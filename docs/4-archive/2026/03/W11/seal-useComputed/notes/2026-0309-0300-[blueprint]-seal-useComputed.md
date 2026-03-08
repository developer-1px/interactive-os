# Blueprint: seal-useComputed

> os.useComputed를 앱 레벨에서 호출할 필요가 없는 구조로 전환한다.

## 1. Goal

**UDE (Undesirable Effects)**:
- UDE1: LLM이 `os.useComputed(s => s.os.path)` 를 Redux `useSelector` 관성으로 직접 호출 — OS 내부 상태 경로에 커플링
- UDE2: `app.useComputed()` API가 존재하지만 사용처 0건 — dead API
- UDE3: accessor hook 6개가 존재하지만 앱 코드 5곳이 중복 구현 — 발견성 부족
- UDE4: bind()가 UI 컴포넌트만 반환하고 상태 접근자를 반환하지 않음 — 상태 읽기 경로가 열려있음

**Done Criteria**: `src/` (앱 코드)에서 `os.useComputed` 직접 호출 0건. OS 내부(`packages/`)만 사용.

## 2. Why

rules.md 원칙 #1 **Pit of Success** 위반:
- "잘못 만들기가 더 어려운 구조"인데, 현재는 **잘못된 길(os.useComputed 직접 호출)이 가장 쉬운 길**
- `os.useComputed` ≅ Redux `useSelector` — LLM pre-trained habit과 동형
- Trigger를 prop-getter로 전환한 것과 같은 근본 원인: **올바른 추상화를 쓸 이유가 없는 구조**

rules.md 원칙 #3 **Pre-trained Habit 금지** 위반:
- 이 세션 실증: AI가 만든 ModalPortal이 `useOverlay` hook 대신 `os.useComputed` 직접 호출

**Goodhart's Law**: "LLM 친화적" 설계가 오히려 환각의 원인. "쉬운 API" ≠ "잘못 쓰기 어려운 API".

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| A1: 앱이 OS 상태를 직접 읽어야 한다 | **부분 무효**. 대부분은 bind() 반환값 + accessor hook으로 대체 가능. Inspector만 예외 | bind() 확장 + accessor hook 완성 |
| A2: `os.useComputed`를 제거해야 한다 | **무효**. OS 내부에서는 정당. 문제는 앱에서의 접근성 | import 경로 제한으로 충분 |
| A3: 모든 상태 접근을 bind()에 넣어야 한다 | **과잉**. app.useComputed(selector)는 앱 상태에 정당. OS 상태 접근만 차단하면 됨 | OS 상태 = accessor hook, 앱 상태 = app.useComputed |
| A4: eslint rule로 import를 차단하면 된다 | **불충분**. LLM은 eslint-disable을 쓸 수 있음. 구조적 불가능이 필요 | accessor hook이 유일한 경로가 되어야 |

**진짜 Goal**: `os.useComputed`를 차단하는 게 아니라, **앱에서 OS 상태를 읽는 유일한 경로를 accessor hook으로 만든다**.

## 4. Ideal

앱 개발자(LLM 포함)의 상태 접근 경로:

```
앱 상태 읽기:   app.useComputed(selector)  ← defineApp이 제공, 앱 스코프
OS 상태 읽기:   useOverlay(id)             ← accessor hook, OS 경로 캡슐화
                useFocusedItem(zoneId)
                useSelection(zoneId)
                useEditingItem(zoneId)     ← NEW
                useZoneValue(zoneId, id)   ← NEW
                useNotifications()         ← NEW
UI 투영:        bind() → { Zone, Item, Field, When, triggers }
조건부 렌더링:  <When condition={cond}>     ← 이미 존재
```

**Negative Branch**:
- Inspector/DevTool은 OS 전체 상태를 읽어야 함 → `@os-react/internal` 경로로 예외 허용
- 새로운 OS 상태 축이 추가될 때마다 accessor hook도 추가해야 함 → 초기 비용

## 5. Inputs

**관련 파일**:
- `packages/os-react/src/6-project/accessors/` — 현재 6개 hook
- `packages/os-sdk/src/app/defineApp/index.ts` — AppHandle.useComputed
- `packages/os-sdk/src/app/defineApp/bind.ts` — bind() 반환값
- `packages/os-core/src/engine/kernel.ts` — os 싱글턴
- `.agent/knowledge/contract-checklist.md` — audit 체크리스트 (규칙 추가 필요)

**앱 코드 현황 (os.useComputed 직접 호출)**:
- `src/widgets/ToastContainer.tsx` — notifications.stack → useNotifications() 필요
- `src/command-palette/QuickPick.tsx` — overlay → useOverlay() 교체
- `src/apps/builder/LocaleSwitcher.tsx` — overlay → useOverlay() 교체
- `src/apps/builder/BuilderCursor.tsx` — focus zone → useFocusedItem() + useEditingItem() 필요
- `src/pages/builder/EditorToolbar.tsx` — editingItemId, focusedItemId → accessor 교체
- `src/pages/builder/SectionSidebar.tsx` — drag → useDragState() 교체
- `src/pages/builder/BuilderPage.tsx` — editingItemId → useEditingItem() 필요
- `src/pages/apg-showcase/patterns/WindowSplitterPattern.tsx` — valueNow → useZoneValue() 필요
- `src/pages/apg-showcase/patterns/SliderMultiThumbPattern.tsx` — valueNow → useZoneValue() 필요
- `src/inspector/panels/ZiftMonitor.tsx` — 전체 focus 상태 (Inspector 예외)

**참조**:
- rules.md 원칙 #1 (Pit of Success), #3 (Pre-trained Habit)
- Discussion: Goodhart's Law, Trigger 선례

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | useEditingItem(zoneId) | 없음 | accessor hook 신규 | High | — |
| G2 | useZoneValue(zoneId, itemId) | 없음 | accessor hook 신규 (slider/splitter) | Med | — |
| G3 | useNotifications() | 없음 | accessor hook 신규 | Med | — |
| G4 | 기존 accessor hook으로 교체 가능한 5곳 | 코드가 os.useComputed 직접 호출 | 마이그레이션 | High | — |
| G5 | 신규 accessor hook으로 교체할 5곳 | accessor hook 없음 | hook 생성 + 마이그레이션 | High | G1,G2,G3 |
| G6 | Inspector 예외 경로 | os.useComputed import 가능 | `@os-react/internal` 경로 문서화 | Low | — |
| G7 | contract-checklist에 규칙 추가 | 없음 | audit 항목 추가 | Med | G4,G5 |
| G8 | rules.md에 원칙 명문화 | "LLM 친화적 ≠ Pit of Success" 미기록 | 원칙 추가 | Med | — |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| T1 | accessor hook 3개 신규 생성 | Clear | — | useEditingItem, useZoneValue, useNotifications |
| T2 | 기존 hook 교체 (5곳) | Clear | — | QuickPick, LocaleSwitcher, SectionSidebar, EditorToolbar(focusedItemId) → 기존 accessor hook |
| T3 | 신규 hook 교체 (5곳) | Clear | T1 | BuilderCursor, EditorToolbar(editingItemId), BuilderPage, WindowSplitter, SliderMultiThumb |
| T4 | ToastContainer 교체 | Clear | T1 | useNotifications() 적용 |
| T5 | contract-checklist 갱신 | Clear | T2,T3,T4 | "src/에서 os.useComputed 직접 호출 금지" 항목 추가 |
| T6 | rules.md 원칙 추가 | Clear | — | "Pit of Success = 잘못 쓰기 어려운 API. LLM 친화적 ≠ 올바른 추상화" |
