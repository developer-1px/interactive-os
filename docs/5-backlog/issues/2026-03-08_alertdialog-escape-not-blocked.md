# OS Gap: AlertDialog Escape Not Blocked — [Closed]

## Summary

`role="alertdialog"` overlay는 Escape으로 닫히면 안 되지만, 현재 OS는 overlay type을 확인하지 않고 모든 overlay를 Escape으로 닫는다.

## Resolution

**해결일**: 2026-03-09

`escape.ts`의 overlay guard에서 `topOverlay.type === "alertdialog"` 체크 추가. alertdialog일 때 Escape NOOP 리턴.

수정 파일:
- `packages/os-core/src/4-command/dismiss/escape.ts` — overlay type 체크
- `packages/os-core/src/engine/registries/roleRegistry.ts` — alertdialog preset `dismiss.escape: "close"` → `"none"`
- `tests/headless/apps/layer-showcase/alertdialog.layer.test.ts` — `it.todo()` → 실제 assertion

증명: Red(1 FAIL) → Green(4/4 PASS) + 회귀 0 (layer-showcase 32 tests all pass)

## Root Cause

`escape.ts:45`에서 `ctx.state.os.overlays.stack.length > 0`만 확인하고 무조건 `OS_OVERLAY_CLOSE` dispatch. overlay의 `.type` 필드를 확인하지 않음.

## Discovered

layer-playground T3 (AlertDialog showcase) 개밥먹기 중 발견.
