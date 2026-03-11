# OS Gap Backlog

> OS가 아직 제공하지 않는 UI/인터랙션 프리미티브 목록.
> `/audit`에서 🟡 OS 갭으로 분류된 항목이 등록된다.
> 항목이 OS에 구현되면 `[x]`로 체크하고 구현 PR/커밋을 기록한다.

---

## 미해결

| # | 발견일 | 앱 | 패턴 | 설명 | 임시 대응 |
|---|--------|-----|------|------|----------|
| OG-004 | 2026-02-26 | builder | DOM convention | `data-drag-handle` 속성을 앱이 수동 부착. OS가 자동 주입하지 않음. | 앱에서 수동 `data-drag-handle` 부착 |
| OG-005 | 2026-02-26 | builder | 커서 메타 등록 | `useCursorMeta` hook이 useEffect로 cursorRegistry에 수동 등록/해제. OS에 커서 메타 API 없음. | useEffect + 앱 내부 레지스트리 |
| OG-009 | 2026-03-03 | os-core | Modifier keybindings | Shift+Arrow, Ctrl+Arrow, Ctrl+Space, Shift+Space 가 osDefaults에 하드코딩. config chain으로 전환 필요. | – |
| OG-010 | 2026-03-05 | os-core | Trigger → inputmap | TriggerConfig + triggerRegistry의 별도 파이프라인을 inputmap으로 흡수. Trigger 컴포넌트 전면 수정 필요. 별도 프로젝트 스코프. | Trigger는 기존 TriggerConfig 경로 유지 |
| OG-011 | 2026-03-06 | os-core | ~~Role defaults in headless~~ | ✅ 해결: OG-012(90 tests) + apg-test-fix-18(18 tests) = 0 APG failures. Root causes: inputmap Enter block, createTrigger zone registration, valueNow init, test bugs. | — |
| OG-012 | 2026-03-06 | os-core | ~~expandableItems → computeItem~~ | ✅ 해결: page.ts goto() opts에 items/expandableItems/treeLevels override 추가. 90 tests fixed (108→18). | — |
| OG-013 | 2026-03-07 | os-core | trigger:"change" headless | `trigger:"change"` fields don't auto-commit on headless `keyboard.type()`. DOM onChange fires commit; headless doesn't simulate it. | `page.dispatch(setQuery())` workaround |
| OG-014 | 2026-03-07 | os-core | Cross-zone editingItemId | `OS_FIELD_START_EDIT` sets editingItemId on active zone (list), not transferred to target zone (edit). `OS_FIELD_CANCEL` needs it. | `page.dispatch(cancelEdit())` workaround |
| OG-015 | 2026-03-07 | os-core | ~~Overlay Escape dismiss~~ | ✅ 해결: OS_ESCAPE에 overlay guard 추가 — overlay stack 비어있지 않으면 OS_OVERLAY_CLOSE 먼저 dispatch. | — |
| OG-016 | 2026-03-07 | os-core | Dialog Tab trap | Headless doesn't support overlay focus trap (Tab cycles within dialog). | TODO in tests |
| OG-017 | 2026-03-07 | os-core | Dialog Enter confirm | Overlay zone navigation (focus to confirm button + Enter) not supported in headless. | TODO in tests |
| OG-018 | 2026-03-07 | os-core | Cross-zone headless test | `page.goto()` sets single activeZoneId. Scripts that click items across multiple zones cannot run in headless runScenarios. Focus-showcase 29 scripts blocked. | Browser TestBot only |
| OG-019 | 2026-03-07 | os-core | ~~Initial selection/expand~~ | ✅ 해결: SelectConfig.initial + ExpandConfig.initial + disallowEmpty auto-select. Zone.tsx + page.ts goto() 양쪽 seeding. 5 APG I1 tests fixed. | — |
| OG-020 | 2026-03-07 | os-core | ~~aria-controls for select-based visibility~~ | ✅ 해결: computeItem에 contentRoleMap 기반 aria-controls 블록 추가. expand 블록과 중복 방지. APG A5 tests fixed. | — |
| OG-021 | 2026-03-08 | os-sdk | SDK OS_OVERLAY_OPEN re-export | SDK가 `OS_OVERLAY_OPEN`을 re-export하지 않음. zone-level trigger binding을 SDK 수준에서 선언할 방법 없음. `createTrigger`는 React 전용이라 headless에서 overlay lifecycle 테스트 불가. | `@os-core` 직접 import |
| OG-022 | 2026-03-08 | os-core | Headless hover simulation | `createHeadlessPage`에 hover/pointer-enter 시뮬레이션 없음. tooltip `onHover` trigger 테스트 불가. | TODO tests |
| OG-023 | 2026-03-08 | os-core | ~~AlertDialog Escape block~~ | ✅ 해결: escape.ts overlay guard에 `topOverlay.type === "alertdialog"` 체크 추가. alertdialog Escape NOOP. | — |
| OG-024 | 2026-03-08 | os-core | Dynamic item initial expand | 동적으로 발견된 아이템의 초기 aria-expanded 상태를 선언적으로 설정하는 메커니즘 없음. `expand.initial`은 정적 아이템만 지원. | `useEffect` + `os.setState` workaround |
| OG-025 | 2026-03-08 | os-core | Trigger focus drift (Zero Drift) | 브라우저에서 trigger 클릭 시 `<Item>` 래핑으로 trigger 자체가 zone item으로 인식 → focusedItemId가 trigger ID로 변경 → `onActivate(triggerId)` 호출 (의도: 이전 focused data item ID). Headless `simulateClick`은 standalone fast path로 정확한 focusId 전달. | Trigger click = headless only 테스트 |
| OG-026 | 2026-03-08 | os-core | aria-checked binding | `OS_CHECK` → `toggleTodo` 실행 → `completed` 상태 변경되나, zone의 `aria-checked` ARIA 속성에 반영 안 됨. TestBot §1f 실패. | headless에서 `page.state` 직접 검증 |
| OG-027 | 2026-03-10 | os-core | Dialog Arrow key leak | Dialog role에 inputmap이 없어 ArrowDown/Up이 OS global keybinding(`OS_NAVIGATE`)으로 leak → `activeZoneId`가 dialog에서 외부 zone으로 변경됨. 브라우저에서는 React `onKeyDown` + `preventDefault`가 보호하지만, headless에는 React 없어 leak 발생. T7 테스트(`docs-search-overlay.test.ts`)로 증명. 해소안: dialog role preset inputmap에 Arrow key noop 추가, 또는 dialog 내부를 nested zone(listbox 등)으로 구성. | React `onKeyDown` + `e.preventDefault()` |
| OG-028 | 2026-03-06 | os-testing | goto() auto-focus 부재 | `page.goto()` 후 `focusedItemId`가 null. 브라우저 FocusGroup은 마운트 시 첫 item 자동 focus하지만 headless에 해당 로직 없음. Zero Drift 위반. | `goto()` opts에 focusedItemId 수동 지정 |
| OG-029 | 2026-03-06 | os-sdk | AppPage zone() accessor 없음 | `page.zone("list")` TypeError. OsPage에만 zone() accessor 존재. AppPage는 개별 메서드(focusedItemId, selection)만 제공. API 불일치. | 개별 메서드 사용 |
| OG-030 | 2026-03-06 | os-testing | Field without fieldName → headless 등록 누락 | `goto()` field 등록이 `fieldName` 필수. bind에 fieldName 없는 zone은 headless에서 완전 비활성. Zero Drift 위반. | bind에 fieldName 추가 |
| OG-031 | 2026-03-06 | os-testing | keyboard.type() silent failure | field 미등록 시 `keyboard.type()` 무반응 + 에러/경고 없음. 디버깅 난이도 상승. | — |

## 해결됨

| # | 발견일 | 해결일 | 패턴 | 설명 |
|---|--------|--------|------|------|
| OG-001 | 2026-02-25 | 2026-02-26 | Dropdown Zone | 기존 Trigger+Portal 패턴으로 해결. 새 프리미티브 불필요. outsideClick 런타임 추가. |
| OG-002 | 2026-02-26 | 2026-02-26 | `onReorder: void` | zone 콜백 명령형 시그니처. 다른 콜백(onAction 등)은 선언형(BaseCommand 리턴). → 선언형으로 수정 완료 |
| OG-015 | 2026-03-07 | 2026-03-07 | Overlay Escape dismiss | OS_ESCAPE overlay guard + TriggerDismiss onActivate 등록. escape.ts + TriggerDismiss.tsx |
| OG-023 | 2026-03-08 | 2026-03-09 | AlertDialog Escape block | escape.ts overlay guard에 type 체크. alertdialog → Escape NOOP. roleRegistry preset `dismiss.escape: "none"` |
