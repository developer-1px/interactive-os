# OS Gap: AlertDialog Escape Not Blocked

## Summary

`role="alertdialog"` overlay는 Escape으로 닫히면 안 되지만, 현재 OS는 overlay type을 확인하지 않고 모든 overlay를 Escape으로 닫는다.

## Reproduction

```ts
// zone config에 dismiss.escape를 설정하지 않아도
// overlay stack에 있는 alertdialog가 Escape으로 닫힌다
alertZone.bind({
  role: "group",
  options: {
    tab: { behavior: "trap" },
    // No dismiss.escape — yet Escape still closes
  },
});
```

## Expected

- `type: "alertdialog"` overlay → Escape NOOP
- `type: "dialog"` overlay → Escape closes (current behavior, correct)

## Root Cause

`packages/os-core/src/4-command/dismiss/escape.ts`에서 overlay type을 확인하지 않고 `OS_OVERLAY_CLOSE`를 dispatch하는 것으로 추정.

## Impact

W3C APG alertdialog 스펙 위반. 사용자가 실수로 중요한 확인 다이얼로그를 닫을 수 있음.

## Discovered

layer-playground T3 (AlertDialog showcase) 개밥먹기 중 발견. `tests/headless/apps/layer-showcase/alertdialog.layer.test.ts` it.todo 참조.
