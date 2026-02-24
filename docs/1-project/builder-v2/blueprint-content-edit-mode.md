# Blueprint: Content Mode / Edit Mode 분리

> Discussion: [content-edit-mode](discussions/2026-0224-1455-content-edit-mode.md)

## 1. Goal

**UDE (Undesirable Effects)**:
- 현재 text 필드를 편집하려면 **Enter 키**를 눌러야만 한다 → 웹 사용자에게 낯선 UX
- "선택된 아이템을 재클릭하면 편집"이라는 Figma/Google Slides/PowerPoint의 보편 패턴이 없다
- content 탐색(선택)과 text 편집의 경계가 시각적으로 불명확하다
- 선택 상태에서 타핑을 시작해도 아무 반응이 없다 (OS keybinding이 가로챔)

**Done Criteria**:
- 캔버스 아이템 FSM이 `none → selected → editing → selected → none`으로 동작
- 재클릭(이미 focused된 아이템 클릭), 타이핑(printable char), Enter 세 가지 경로로 편집 진입
- Escape = 항상 한 단계 위로 (editing→selected, selected→none)
- EditorToolbar에 현재 모드(Select/Edit) indicator 표시

## 2. Why

**근본 원인**: Interaction OS가 **키보드 OS 문법**(Enter-to-edit)을 강제하고 있으나, 빌더는 **웹 편집 도구**이므로 Figma/Google Slides의 보편 UX가 적용되어야 한다.

**원칙 근거**:
- `rules.md` #6: **학습 비용을 0으로** — POLA(Principle of Least Astonishment). 사용자가 Figma/Slides에서 배운 패턴이 동일하게 동작해야 한다.
- `rules.md` #7: **편의보다 명시적** — 하지만 여기서 "명시적"은 Enter 강제가 아니라, **시각적으로 현재 모드가 명확히 보이는 것**이다.
- 빌더 KI `text_editing_pattern.md` §1: 이미 "Select-then-Edit" 정의가 있으나, 진입 트리거가 Enter/더블클릭**만**으로 제한됨 → 확장 필요.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| "재클릭 = 편집"을 구현하려면 OS 마우스 파이프라인 수정이 필요하다 | **부분 유효** — `resolveClick`이 이미 "re-click on focused item → OS_ACTIVATE" 로직을 가지고 있다. 단, canvas zone에 `activateOnClick: true`가 설정되어 있지 않음 (grid 프리셋 기본값) | canvas의 `activateOnClick`을 활성화하면 됨 |
| "재클릭 → 편집"을 위해 새 OS 커맨드가 필요하다 | **무효** — `OS_ACTIVATE`가 이미 `onAction` 콜백을 호출하고, 빌더 canvas의 `onAction`은 `createDrillDown`으로 설정됨. `drillDown`이 item 레벨이면 `OS_FIELD_START_EDIT()`을 반환 | 기존 체인(resolveClick → OS_ACTIVATE → onAction → drillDown → FIELD_START_EDIT)이 이미 존재. 설정만 켜면 됨 |
| "타이핑 → 편집"을 구현하려면 OS 키보드 파이프라인 대규모 수정이 필요하다 | **부분 유효** — printable char가 deferred field에 도달하면 현재 무시됨. 빌더 zone-level keybinding에서 가로채는 방법 검토 필요 | Zone에 글로벌 printable char 핸들러를 등록하되, 편집 중일 때는 무시 |
| EditorToolbar에 모드를 표시하려면 새 상태가 필요하다 | **무효** — `ZoneState.editingItemId`가 이미 존재. `editingItemId !== null`이면 편집 모드 | OS useComputed로 읽으면 됨 |

**핵심 발견**: 가장 큰 구현 — "재클릭 → 편집" — 은 **이미 거의 배선되어 있다.**

```
resolveClick (이미 구현)
  → clickedItemId === focusedItemId → OS_ACTIVATE (이미 구현)
    → createDrillDown(onAction) → item 레벨이면 OS_FIELD_START_EDIT (이미 구현)
```

**빠진 링크 하나**: canvas zone의 `activateOnClick`이 `false` (grid 프리셋 기본값).

## 4. Ideal

**사용자 시나리오 (Figma UX)**:

1. 사용자가 Hero 블록의 제목 텍스트를 클릭 → **선택** 상태. violet ring 표시. 화살표로 다른 요소 탐색 가능.
2. 선택된 제목을 다시 클릭 → **편집** 상태. blue ring + blue tint. 커서가 텍스트 내에 위치. 타이핑 가능.
3. 또는, 선택 상태에서 바로 `A` 키를 누르면 → **편집** 상태 자동 진입. 기존 텍스트 끝에 `A` 추가.
4. 편집 중 Escape → **선택** 상태로 복귀. 편집 취소 (기존 값 복원).
5. 선택 상태에서 Escape → **none**. 포커스 해제.
6. 상단 툴바: 현재 아이템이 편집 중이면 "Edit" 배지, 선택 중이면 "Select" 배지 표시.

**Negative Branch**:
- 재클릭이 "계층 드릴다운"과 충돌할 수 있음 → 현재 `drillDown`은 level에 따라 다르게 동작 (section→group, group→item, item→edit). 재클릭이 section 레벨일 때는 드릴다운이 맞음. **item 레벨에서만 edit 진입**이므로 충돌 없음.
- 타이핑 진입 시 특수키(Backspace, Delete, Arrow 등)도 편집 시작으로 해석하면 안 됨 → printable char만 감지.

## 5. Inputs

**파일 (수정 대상)**:
| # | 파일 | 역할 |
|-|-|-|
| I1 | `src/apps/builder/app.ts` L412-431 | `BuilderCanvasUI` canvas zone 바인딩 — `activateOnClick` 설정 필요 |
| I2 | `src/pages/builder/EditorToolbar.tsx` | 모드 indicator UI 추가 |
| I3 | `src/apps/builder/features/hierarchicalNavigation.ts` | `createDrillDown` — item→edit 체인 (이미 구현) |

**파일 (참조만)**:
| # | 파일 | 역할 |
|-|-|-|
| R1 | `src/os/1-listeners/mouse/resolveClick.ts` | 재클릭 감지 순수 함수 — **이미 구현** |
| R2 | `src/os/1-listeners/mouse/MouseListener.tsx` | click 이벤트 어댑터 — `activateOnClick` 읽기 |
| R3 | `src/os/3-commands/interaction/activate.ts` | `OS_ACTIVATE` 커맨드 — `onAction` 호출 체인 |
| R4 | `src/os/3-commands/field/startEdit.ts` | `OS_FIELD_START_EDIT` — `editingItemId` 설정 |
| R5 | `src/os/registries/roleRegistry.ts` | grid 프리셋 — `activateOnClick` 기본값 확인 |

**KI**:
- `text_editing_pattern.md` — Select-then-Edit 표준
- `field_interaction_patterns.md` — Field 모드와 Intent Gating

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | canvas zone에서 재클릭 → OS_ACTIVATE | `resolveClick` + `OS_ACTIVATE` + `drillDown` 체인 모두 존재 | canvas zone config에 `activateOnClick: true` 미설정 (grid 프리셋 기본값 = 없음) | **High** — 핵심 기능 | 없음 |
| G2 | 선택 상태에서 printable char 타이핑 → 편집 진입 | OS가 field 미편집 시 printable char를 무시 (Navigation context) | Zone keybinding 또는 onAction에서 printable char 감지 → `FIELD_START_EDIT` 발행 | **Med** — 보조 경로 | G1 |
| G3 | Escape(selected) → none (포커스 해제) | `OS_FIELD_CANCEL`은 editing→selected 처리. selected→none 경로 미확인 | zone dismiss / tab behavior 확인 필요. grid `tab: escape` → Tab이 탈출. Escape 별도 확인 | **Med** | 없음 |
| G4 | EditorToolbar에 Select/Edit 모드 배지 | `editingItemId`가 OS state에 존재 | UI 표시 없음 | **Low** — 시각만 | 없음 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| 1 | G1: `activateOnClick` 활성화 | **Clear** | — | `BuilderCanvasUI.bind()`에 `activate: { onClick: true }` option 추가. 이것만으로 resolveClick → OS_ACTIVATE → drillDown → FIELD_START_EDIT 체인 활성화. |
| 2 | G1 검증 | **Clear** | #1 | 브라우저에서 item-level 텍스트 선택 후 재클릭 → 편집 모드 진입 확인. 헤드리스 단위 테스트: `resolveClick({ activateOnClick: true, clickedItemId: X, focusedItemId: X })` → `OS_ACTIVATE` 커맨드. |
| 3 | G3: Escape(selected) 동작 확인 | **Clear** | — | 현재 canvas zone에서 Escape 시 동작 확인. grid role은 `tab: escape`이나 Escape≠Tab. `drillUp` 키바인딩 `\\` 존재. Escape에 대한 zone-level 드릴업 또는 블러 필요 시 추가. |
| 4 | G2: 타이핑 진입 | **Complicated** | #1 | Zone keybinding에 printable char(a-z, 0-9 등) 핸들러 등록. `editingItemId`가 null일 때만 활성. 핸들러: `FIELD_START_EDIT()` dispatch 후 해당 키를 field에 forwarding (이어쓰기). |
| 5 | G4: 툴바 indicator | **Clear** | — | `EditorToolbar`에서 `os.getState().os.focus.zones.canvas.editingItemId`를 구독. non-null이면 "✏️ Edit" 배지, null이면 "👆 Select" 배지. |
