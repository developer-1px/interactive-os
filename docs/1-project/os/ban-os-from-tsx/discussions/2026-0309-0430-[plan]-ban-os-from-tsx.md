# Plan: ban-os-from-tsx

> Discussion Claim: React 파일에서 `os` import을 원천 차단하면, React가 순수 투영이 되고, 깨지는 곳이 OS 확장 지도가 된다.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `eslint.config.js` | os import 제한 없음 | `no-restricted-imports`: `*.tsx`에서 `{os}` from `@os-sdk/os` 금지 | Clear | — | lint pass | — |
| 2 | `widgets/ToastContainer.tsx` | `os.dispatch(OS_NOTIFY_DISMISS)` 3건 | Zone onDismiss + onAction callback | Clear | →#1 | tsc 0 | Toast action dispatch |
| 3 | `command-palette/CommandPalette.tsx` | `os.dispatch(OS_OVERLAY_CLOSE)` 1건 | Zone onDismiss | Clear | →#1 | tsc 0 | — |
| 4 | `pages/builder/PropertiesPanel.tsx` | `os.dispatch(appCmd)` 3건 | Trigger/bind callback | Clear | →#1 | tsc 0 | field 수정 경로 |
| 5 | `docs-viewer/DocsSearch.tsx` | `os.dispatch(appCmd)` 4건 | Zone onAction + onDismiss | Clear | →#1 | tsc 0 | ZIFT 미적용 앱 |
| 6 | `docs-viewer/DocsViewer.tsx` | `os.dispatch(appCmd)` 3건 | ⚪ 예외 (eslint-disable) — ZIFT 미적용 앱 | Clear | →#1 | lint pass | — |
| 7 | `command-palette/QuickPick.tsx` | os.dispatch 6건 + os.getState 1건 | Dialog Zone 패턴 재구성. onKeyDown 제거, overlay lifecycle 위임 | Clear | →#1 | tsc 0 | 가장 큰 변경 |
| 8 | `MeterPattern.tsx` | os.getState + os.dispatch in setInterval | ⚪ 예외 (eslint-disable) — 외부 시뮬레이션 | Clear | →#1 | lint pass | — |
| 9 | `main.tsx` | os.use(middleware) | ⚪ 예외 (eslint-disable) — 부트스트랩 | Clear | →#1 | lint pass | — |
| 10 | contract-checklist + rules.md | os.useComputed만 금지 | *.tsx에서 os import 전체 금지 | Clear | →#2~9 | — | — |

## 라우팅

승인 후 → `/project` (새 프로젝트: **ban-os-from-tsx**, Light)
