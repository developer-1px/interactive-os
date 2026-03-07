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

## 해결됨

| # | 발견일 | 해결일 | 패턴 | 설명 |
|---|--------|--------|------|------|
| OG-001 | 2026-02-25 | 2026-02-26 | Dropdown Zone | 기존 Trigger+Portal 패턴으로 해결. 새 프리미티브 불필요. outsideClick 런타임 추가. |
| OG-002 | 2026-02-26 | 2026-02-26 | `onReorder: void` | zone 콜백 명령형 시그니처. 다른 콜백(onAction 등)은 선언형(BaseCommand 리턴). → 선언형으로 수정 완료 |
| OG-015 | 2026-03-07 | 2026-03-07 | Overlay Escape dismiss | OS_ESCAPE overlay guard + TriggerDismiss onActivate 등록. escape.ts + TriggerDismiss.tsx |
