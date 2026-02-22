# Blueprint — Dialog Activate Path

> Source: Discussion `2026-0222-1746-dialog-activate-path.md`
> Goal: Dialog 내 Enter 키로 버튼 활성화 + FocusItem 계층 정리
> PRD 참조: Feature 1, 검증 포인트 5번 "확인 버튼 → 커맨드 실행 + Dialog 닫기"

---

## Goal
Dialog에서 Enter 키를 눌렀을 때, 포커스된 버튼의 command가 실행되어야 한다.

## Why
OS_ACTIVATE(Enter)가 dispatch되지만, 포커스된 item(Trigger)의 command를 알 수 없어서 아무 일도 일어나지 않는다.
Trigger의 `onPress` command는 React onClick에만 연결되어 있고, OS(ZoneRegistry)에 등록되지 않는다.

## Challenge
- Trigger의 command가 React 공간(onClick)에만 존재
- OS_ACTIVATE는 focusedItemId만 알고, 해당 item의 command를 모름
- FocusItem이 inline style (outline, cursor, opacity)을 갖고 있어 계층 위반
- `onPress`라는 이름이 물리 레벨이라 OS의 `ACTIVATE` 어휘와 불일치

## Ideal
1. Trigger가 `onActivate` command를 선언하면, FocusItem이 ZoneRegistry에 등록
2. OS_ACTIVATE가 item-level `onActivate`를 조회하여 dispatch
3. 마우스 click과 키보드 Enter가 동일한 command 경로를 공유
4. FocusItem은 Projection-Only — 시각 스타일 없음

## Inputs
- `src/os/6-components/base/FocusItem.tsx` — inline style 제거, onActivate prop 추가
- `src/os/6-components/primitives/Trigger.tsx` — onPress→onActivate rename, asChild 사용
- `src/os/6-components/radox/Dialog.tsx` — Dialog.Close의 onPress→onActivate
- `src/os/defineApp.trigger.ts` — CompoundTrigger의 onPress→onActivate
- `src/os/2-contexts/zoneRegistry.ts` — item-level callback 등록/조회 API
- `src/os/3-commands/interaction/activate.ts` — item-level onActivate 조회 로직

## Gap Analysis
| 현재 | 이상 | Gap |
|------|------|-----|
| FocusItem에 `outline:"none"`, `cursor`, `opacity` | style 없음 | inline style 블록 제거 |
| Trigger prop: `onPress` | prop: `onActivate` | 전체 rename |
| Trigger.Dismiss: `<FocusItem><button>` | `<FocusItem asChild><button>` | asChild 추가 |
| ZoneRegistry: zone-level callbacks만 | item-level callbacks도 | `setItemCallback`, `getItemCallback` 추가 |
| OS_ACTIVATE: zone.onAction → click fallback | zone.onAction → item.onActivate → null | item-level 조회 추가 |

## Divide — 실행 순서

### T5.1: FocusItem inline style 제거 [Clear]
- `FocusItem.tsx` line 213-218의 style 블록에서 `outline`, `cursor`, `opacity` 제거
- `style` prop만 passthrough
- 검증: 기존 테스트 regression 없음

### T5.2: `onPress` → `onActivate` rename [Clear]
- 대상 파일: Trigger.tsx, Dialog.tsx, defineApp.trigger.ts
- `grep -rn "onPress" src/os/` 로 전수 확인
- `interface TriggerDismissProps`, `interface DialogCloseProps` 수정
- 검증: tsc + 기존 테스트 통과

### T5.3: Trigger.Dismiss — FocusItem asChild [Clear]
- `Trigger.Dismiss` 내부에서 `<FocusItem id={itemId}>` → `<FocusItem id={itemId} asChild>`
- button이 직접 FocusItem의 projection 속성을 받음
- 검증: Dialog close 동작 유지

### T5.4: ZoneRegistry item-level callback 등록 [Complicated]
- `ZoneRegistry`에 `setItemCallback(zoneId, itemId, key, callback)` 추가
- `ZoneRegistry`에 `getItemCallback(zoneId, itemId, key)` 추가
- FocusItem에 `onActivate?: BaseCommand` prop 추가
- FocusItem mount 시 `onActivate`가 있으면 ZoneRegistry에 등록
- unmount 시 정리
- 검증: 단위 테스트

### T5.5: OS_ACTIVATE item-level onActivate 조회 [Complicated]
- `activate.ts`에서 zone.onAction 없을 때 → `ZoneRegistry.getItemCallback(zoneId, focusedItemId, "onActivate")` 확인
- 있으면 dispatch, 없으면 기존 click fallback (하위 호환)
- 검증: Red→Green 테스트
  - RED: onActivate 등록 전 Enter → 아무 일 없음
  - GREEN: onActivate 등록 후 Enter → command dispatch

## Glossary
| 도메인 개념 | 코드 이름 | 근거 |
|------------|----------|------|
| 활성화 command 선언 | `onActivate` | OS_ACTIVATE와 일관. 의미 레벨 |
| Item-level 콜백 등록 | `ZoneRegistry.setItemCallback()` | 기존 `setDisabled()` 패턴과 일관 |
| Item-level 콜백 조회 | `ZoneRegistry.getItemCallback()` | 대칭 API |
