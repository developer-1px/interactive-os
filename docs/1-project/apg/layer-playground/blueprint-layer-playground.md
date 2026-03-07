# Blueprint: Layer Playground

## 1. Goal

**UDE (Undesirable Effects):**
- overlay 관련 패턴(dialog, popover, menu, tooltip 등)이 APG showcase에 파편화되어 있거나 아예 없음
- overlay lifecycle(open -> stack -> dismiss -> focus restore)을 체계적으로 시각 검증할 수 없음
- `createTrigger` API의 6개 role을 한 곳에서 개밥먹기할 전용 환경이 없음
- headless-overlay 프로젝트 완료 후 DOM 레벨 시각 검증이 미착수

**Done Criteria:**
`/playground/layers` route에 overlay type별 독립 showcase가 존재하고, 각 showcase에서 open/close/focus-restore/nested 동작이 시각적으로 확인 가능하다.

## 2. Why

- **개밥먹기 목표**: OS gap 발견이 앱 완성보다 중요하다 (rules.md 철학)
- **headless-overlay archived**: headless 레벨 검증 완료 -> DOM 레벨 시각 검증 타이밍
- **createTrigger API 성숙도 확인**: 6개 role(dialog, alertdialog, menu, popover, listbox, tooltip)의 실사용 검증 필요
- **Zero Drift 보장 확인**: headless 테스트 통과 = DOM 동일 동작이라는 아키텍처 약속을 눈으로 확인

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| APG showcase와 별도 route가 필요하다 | O | APG는 W3C 스펙 적합성, Layer는 OS overlay lifecycle 검증. 관심사가 다르다 |
| 6개 role 전부 showcase가 필요하다 | O | tooltip(hover)은 구현 미완성이지만 gap 발견이 목적이므로 포함 |
| 기존 APG 패턴 코드를 재사용할 수 있다 | 부분적 | MenuButtonPattern은 참고 가능. Dialog/Tooltip APG 패턴은 아직 없음 |
| 한 번에 전부 만들어야 한다 | X | Dialog부터 시작, 하나씩 점진 추가. 각 showcase가 독립 |

## 4. Ideal

`/playground/layers` 접속 시:
- 좌측 사이드바에 overlay type별 목록 (Dialog, AlertDialog, Menu, Popover, Listbox, Tooltip, Nested)
- 각 항목 클릭 시 우측에 해당 overlay의 **실동작 데모** 표시
- 데모에서 확인 가능한 것:
  - Trigger click/Enter -> overlay open
  - Escape -> close + focus restore
  - Tab trap (dialog) vs Tab pass-through (popover)
  - Nested overlay (dialog -> dialog, menu -> submenu)
  - Outside click dismiss (popover/menu)
  - ARIA 속성 자동 투영 (aria-haspopup, aria-expanded, aria-controls)
- Inspector와 함께 사용하면 overlay stack 상태를 실시간 관찰 가능

**Negative Branch:**
- tooltip(hover) role은 현재 headless 미지원 -> showcase에서 gap이 드러날 수 있음 (이것이 개밥먹기의 가치)

## 5. Inputs

**코드:**
- `packages/os-sdk/src/app/defineApp/trigger.ts` — createCompoundTrigger API (6 roles)
- `packages/os-react/src/6-project/trigger/` — TriggerBase, TriggerPortal, TriggerPopover, TriggerDismiss
- `packages/os-react/src/6-project/widgets/radix/Dialog.tsx` — Radix-compatible Dialog compound
- `packages/os-core/src/4-command/overlay/overlay.ts` — OS_OVERLAY_OPEN/CLOSE
- `packages/os-core/src/engine/registries/triggerRegistry.ts` — TriggerRole presets (6 roles)

**참조 패턴:**
- `src/pages/apg-showcase/` — 페이지 구조, 사이드바 패턴, 라우트 연결
- `src/pages/apg-showcase/patterns/MenuButtonPattern.tsx` — createTrigger 사용 예시
- `src/routes/_minimal/playground.apg.tsx` — route 등록 패턴

**테스트:**
- `tests/apg/dialog.apg.test.ts` — focus trap, nested LIFO, escape restore
- `tests/apg/dropdown-menu.apg.test.ts` — menu open/nav/close

**지식:**
- `.agent/knowledge/domain-glossary.md` — ZIFT Trigger 정의
- `docs/2-area/official/os/zift-spec.md` — Trigger 스펙

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | Route `/playground/layers` + `$pattern` | APG route 패턴 존재 | route 파일 2개 + page 컴포넌트 생성 | High | - |
| G2 | Dialog showcase (modal, focus trap) | createTrigger role="dialog" + TriggerPortal + Radix Dialog | showcase 컴포넌트 작성 | High | G1 |
| G3 | AlertDialog showcase (modal, confirm/cancel) | createTrigger role="alertdialog" | showcase 컴포넌트 작성 | Med | G1 |
| G4 | Menu showcase (dropdown trigger) | MenuButtonPattern 참고 가능 | showcase 컴포넌트 작성 (참고 충분) | Med | G1 |
| G5 | Popover showcase (generic non-modal) | createTrigger role="popover" | showcase 컴포넌트 작성 | Med | G1 |
| G6 | Listbox dropdown showcase (input+popup) | createTrigger role="listbox" | showcase 컴포넌트 작성 | Med | G1 |
| G7 | Tooltip showcase (hover trigger) | TriggerRole preset 있음, headless 미완 | showcase 작성 + OS gap 발견 예상 | Med | G1 |
| G8 | Nested overlay showcase (dialog->dialog) | dialog.apg.test.ts에 LIFO 테스트 존재 | showcase 컴포넌트 작성 | Med | G2 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| T1 | Scaffold: route + page shell | Clear | - | `playground.layers.tsx`, `playground.layers.$pattern.tsx`, `src/pages/layer-showcase/index.tsx` 생성. APG showcase 구조 복제 |
| T2 | Dialog showcase | Clear | T1 | `defineApp` + `createTrigger({ role: "dialog" })`. Modal open/close, focus trap, Escape dismiss, focus restore 데모 |
| T3 | AlertDialog showcase | Clear | T1 | Confirm/Cancel 패턴. `role: "alertdialog"`. Backdrop click 무시 확인 |
| T4 | Menu showcase | Clear | T1 | `role: "menu"`. Dropdown menu, arrow nav, item activation, loop. MenuButtonPattern 참고 |
| T5 | Popover showcase | Clear | T1 | `role: "popover"`. Generic non-modal popup. Outside click dismiss |
| T6 | Listbox dropdown showcase | Complicated | T1 | `role: "listbox"`. Input + popup selection. Combobox 유사 |
| T7 | Tooltip showcase | Complicated | T1 | `role: "tooltip"`. Hover trigger. OS gap 발견 가능성 높음 |
| T8 | Nested overlay showcase | Complicated | T2 | Dialog -> Dialog LIFO. Menu -> Submenu. Stack 시각화 |
