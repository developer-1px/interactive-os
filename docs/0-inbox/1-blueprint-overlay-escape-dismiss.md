# Blueprint: Overlay Escape Dismiss

## 1. Goal

삭제 다이얼로그가 열린 후 Escape로 닫을 수 있어야 하며, 닫은 후 list zone이 정상 작동해야 한다.

**Done Criteria**:
- `§14b` headless 테스트 6개 전부 GREEN
- 브라우저에서 Delete → Dialog → Escape 또는 Confirm → 정상 복귀

## 2. Why

OS pipeline의 설계 의도:
```
OS_OVERLAY_OPEN → overlay stack push + focus save
  → Zone(dialog) autoFocus → activeZoneId = dialog
  → Escape → OS_ESCAPE → dismiss:"close" → onDismiss = OS_OVERLAY_CLOSE
  → overlay stack pop + focus restore
```

실제 동작 (browser 보고 + headless 재현):
```
OS_OVERLAY_OPEN → overlay stack push + focus save
  → Zone(dialog) autoFocus FAILS (items=0 or rendering issue)
  → activeZoneId remains "list"
  → Escape → OS_ESCAPE → list's dismiss:"deselect" → no overlay close
  → overlay stack stays → ALL input blocked by focus trap
```

근본 원인: **OS_ESCAPE가 overlay stack을 확인하지 않는다.** Zone의 dismiss config에만 의존하므로, autoFocus가 실패하면 chain이 끊어진다.

## 3. Challenge

| 전제 (Assumption) | 유효한가? | 무효화 시 대안 |
|-|-|-|
| autoFocus가 항상 성공한다 | NO — items=0이면 OS_FOCUS 미발행 | OS_ESCAPE에 overlay fallback 추가 |
| overlay dismiss는 Zone의 onDismiss만으로 충분 | NO — activeZoneId가 dialog가 아니면 도달 불가 | OS_ESCAPE가 직접 overlay stack 확인 |
| headless에서 dialog zone의 items를 알 수 있다 | NO — React가 Item을 등록하지 않음 | headless 테스트에서 dispatch로 우회 (현재 §14b 4/6 통과) |

**진짜 Goal**: OS_ESCAPE가 overlay stack 존재 시 무조건 `OS_OVERLAY_CLOSE`를 먼저 실행해야 한다. autoFocus 성공 여부에 무관하게.

## 4. Ideal

1. overlay stack이 비어있지 않은 상태에서 Escape → 최상위 overlay 닫힘
2. overlay 닫힘 → focus restore (applyFocusPop)
3. 닫힌 후 원래 zone이 정상 작동
4. headless에서 동일하게 동작

**부정적 분기**: dialog 안에서 selection을 deselect하려고 Escape를 눌렀는데 dialog가 닫히는 경우 → alertdialog에서는 Escape = close가 APG 표준이므로 문제 없음.

## 5. Inputs

- `packages/os-core/src/4-command/dismiss/escape.ts` — OS_ESCAPE command
- `packages/os-core/src/4-command/overlay/overlay.ts` — OS_OVERLAY_CLOSE
- `packages/os-core/src/2-resolve/osDefaults.ts` — Escape keybinding (when: "navigating")
- `packages/os-devtool/src/testing/simulate.ts` — headless overlay focus trap
- `tests/headless/apps/todo/todo-bug-hunt.test.ts` — §14b 테스트 (2 FAIL)
- APG Dialog Pattern: Escape closes dialog (unconditional)

## 6. Gap

| # | Need | Have | Gap | Impact | Depends |
|-|-|-|-|-|-|
| G1 | OS_ESCAPE가 overlay stack 확인 후 OS_OVERLAY_CLOSE dispatch | OS_ESCAPE는 zone dismiss config만 확인 | overlay close 로직 누락 | HIGH | — |
| G2 | headless Escape가 overlay 내부 동작 | simulate.ts Escape 통과 but OS_ESCAPE가 overlay 안 닫음 | G1이 해결되면 자동 해결 | HIGH | G1 |

## 7. Execution Plan

| # | Task | Domain | Depends | Description |
|-|-|-|-|-|
| 1 | OS_ESCAPE overlay guard | Clear | — | `escape.ts`: overlay stack 비어있지 않으면 `OS_OVERLAY_CLOSE` dispatch 후 return. Zone dismiss 로직보다 선행 |
| 2 | §14b 테스트 GREEN 확인 | Clear | 1 | headless 테스트 6개 전부 통과 확인 |
| 3 | 커밋 | Clear | 2 | blueprint + fix + test |
