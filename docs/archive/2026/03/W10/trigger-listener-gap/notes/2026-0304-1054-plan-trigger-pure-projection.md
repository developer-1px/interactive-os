# /plan — Trigger 순수 투영 변환 명세표

> 목표: Trigger.tsx의 모든 behavior를 Pipeline으로 이관하여, 컴포넌트가 ARIA/data 투영만 수행하도록 만든다.
> 전제: /discussion → Complicated. /divide → 5 WP.

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `senseMouse.ts:MouseDownSense` | Trigger 필드 없음. Item/Label/Zone만 감지 | `triggerId: string\|null`, `triggerOverlayId: string\|null`, `isTriggerOverlayOpen: boolean` 3개 필드 추가 | Clear | — | tsc 0 | 기존 `extractMouseInput` 소비자에 영향 없음 (신규 필드) |
| 2 | `senseMouse.ts:senseMouseDown()` | `findFocusableItem(target)`만 호출 | Trigger 감지 추가: `target.closest("[data-trigger-id]")` → `ZoneRegistry.getTriggerOverlay()` → overlay stack 확인 | Clear | →#1 | +3 unit tests (`resolveTriggerClick.test.ts`) | `senseKeyboard.ts:29`와 동일 패턴이므로 안전 |
| 3 | `resolveMouse.ts:MouseInput` | Trigger 관련 필드 없음 | `triggerId`, `triggerOverlayId`, `isTriggerOverlayOpen` 3개 필드 추가 (optional) | Clear | →#1 | tsc 0 | 기존 `resolveMouse()` 소비자 영향 없음 |
| 4 | **[NEW]** `resolveTriggerClick.ts` | 존재하지 않음 | `resolveTriggerClick(ctx: TriggerClickContext): BaseCommand\|null` 순수 함수. `triggerRegistry.resolveTriggerRole()`로 config 조회 → `onClick: true` → toggle 판단: `isTriggerOverlayOpen ? OS_OVERLAY_CLOSE : OS_OVERLAY_OPEN` | Clear | →#1, →#3 | +6 unit tests: menu open/close/tooltip skip/dialog toggle/already-open check/overlayId 전달 | `resolveTriggerKey.ts`와 대칭 구조 |
| 5 | `PointerListener.tsx:onPointerUp()` CLICK분기 | L301-373: Item 전용 resolve. Trigger 미인식 | Trigger-first 분기 추가: `data-trigger-id` 감지 시 `resolveTriggerClick()` 호출 → dispatch. Item 분기 앞에 삽입 | Clear | →#4 | 기존 resolveTriggerKey.test.ts 유지 + Menu Button e2e 통과 | Trigger 클릭이 Item resolve보다 먼저 처리되어야 함. 순서 중요 |
| 6 | `PointerListener.tsx:onPointerDown()` outsideClick | L144-155: `dismiss.outsideClick` 체크 | Trigger의 overlay 영역 클릭은 outsideClick에서 제외. `data-trigger-id`가 있으면 outsideClick 판단 스킵 | Clear | →#5 | +1 test: trigger 클릭 시 outsideClick dismiss 안 됨 | Trigger 클릭→CLOSE와 outsideClick→CLOSE 중복 dispatch 방지 |
| 7 | `overlay.ts:OS_OVERLAY_CLOSE` | `applyFocusPop(draft)` — activeZone 스택만 복원. trigger 엘리먼트로의 DOM focus 없음 | Close 커맨드에 `triggerId` 정보를 overlay entry에 저장. Close 시 Sync phase에서 `focus.onClose: "restore"` config을 읽어 trigger 엘리먼트 focus | Complicated | — | +2 unit tests: close 후 focus target 확인, restore=none일때 스킵 | 커널 상태 변경(COMMIT)과 DOM side-effect(SYNC) 분리 필요 |
| 8 | `overlay.ts:OS_OVERLAY_OPEN` 또는 `OSState.ts:OverlayEntry` | `OverlayEntry`에 `triggerId` 없음 | `OverlayEntry`에 `triggerId?: string` 추가. OPEN 시 어떤 trigger가 열었는지 기록 | Clear | →#7 | tsc 0 | Close 시 focus 복귀 대상을 알기 위해 필요 |
| 9 | `Trigger.tsx:triggerActivate()` | L169-181: overlay toggle 로직 (`isOverlayOpen` 체크 → dispatch OPEN/CLOSE) | **삭제** — Pipeline이 처리 | Clear | →#4, →#5 | 기존 Menu Button TestBot script 통과 | N/A |
| 10 | `Trigger.tsx:handleClick` | L183-189: `onClick` → `triggerActivate()` | **삭제** — Pipeline PointerListener가 처리 | Clear | →#5, →#9 | 기존 Menu Button TestBot script 통과 | N/A |
| 11 | `Trigger.tsx:handleKeyDown` | L194-201: Enter/Space → `triggerActivate()` (id 없는 경우 fallback) | **삭제** — `resolveTriggerKey`가 이미 처리 | Clear | →#9 | 기존 resolveTriggerKey.test.ts 통과 | id 없는 Trigger는 Pipeline이 `data-trigger-id`로 감지 |
| 12 | `Trigger.tsx:prevOverlayOpen useEffect` | L148-154: overlay 닫히면 trigger로 focus 복원 | **삭제** — Pipeline Sync phase가 처리 (#7) | Clear | →#7 | +1 test: overlay close 후 trigger focus 확인 | N/A |
| 13 | `Trigger.tsx:overlayOpenCmd` | L129-132: `OS_OVERLAY_OPEN` 커맨드 생성 | **삭제** — Pipeline이 생성 | Clear | →#4 | tsc 0 | N/A |

---

## 비-Clear 행 해소

### #7: `overlay.ts:OS_OVERLAY_CLOSE` focus restoration — Complicated

**왜 확정 안 됨**: 커널 커맨드(상태 변경)에서 DOM focus()를 직접 호출하면 COMMIT/SYNC 경계를 위반한다.

**제안**: overlay CLOSE 시 커널 상태에 `focusTarget: { type: "trigger", triggerId: "xxx" }`를 기록하고, 기존 React 측 Sync 메커니즘(useEffect)이 이 상태를 읽어 `element.focus()`를 실행한다. 이 방식은 현재 Zone의 `computeItem`이 `shouldFocus`를 통해 DOM focus를 트리거하는 패턴과 동일하다.

→ 이 방식이면 **커널은 순수하게 상태만 변경하고, React 측이 DOM focus를 수행**하므로 Clear로 전환 가능.

> **사용자 확인 필요**: 이 접근이 맞는지, 아니면 다른 메커니즘을 원하는지?

---

## MECE 점검

1. **CE**: 13행 전부 실행 시 — senseMouse Trigger 감지(1-2) + resolve 함수(3-4) + PointerListener 통합(5-6) + focus restoration(7-8) + Trigger.tsx 정리(9-13) = 목표 달성 ✅
2. **ME**: 중복 없음 ✅ (9~13은 각기 다른 코드 블록 삭제)
3. **No-op**: Before=After 없음 ✅

---

## 라우팅

승인 후 → `/go` (기존 프로젝트 `trigger-listener-gap`) — Trigger 순수 투영 이관. Pipeline에 마우스 Trigger layer 추가 + Trigger.tsx behavior 제거.
