# Focus Recovery Strategy — 삭제 시 포커스 복구

> Area: 20-os/22-focus
> Source: src/os/schemas/focus/resolveRecovery.ts, src/os/2-sync/FocusSync.tsx
> Last synced: 2026-02-18
> Origin: 4-archive/2026-02-focus-recovery (프로젝트 완료 후 환류)

## 개요

아이템이 삭제될 때 포커스가 사라지는 문제. **하이브리드 전략** 채택:
- OS가 Safety Net 제공 (삭제 후 DOM에서 focusedItemId 사라지면 자동 복구)
- App이 정밀 복구 지정 가능 (커맨드 내에서 `FOCUS()` dispatch)

## 아키텍처 결정 (ADR)

### OS 전담 vs App 전담 vs 하이브리드

| 기준 | App-Only | OS-Only | **하이브리드** ✅ |
|------|:---:|:---:|:---:|
| DRY | ❌ | ✅ | ✅ |
| 정밀 제어 | ✅ | ❌ | ✅ |
| 접근성 안전망 | ❌ | ✅ | ✅ |
| 예측적 실패 방지 | ✅ | ❌ | ✅ |
| 하위 호환 | ✅ | ❌ | ✅ |

### 채택: 하이브리드 (OS Default + App Override)

```
[삭제 요청]
    ↓
[앱 핸들러] → FOCUS() dispatch 있음? → 앱이 지정한 대상으로 포커스 ✅
    ↓ (없음)
[React 렌더] → focusedItemId가 DOM에서 사라짐
    ↓
[FocusSync] → resolveRecovery()로 자동 복구 (Safety Net) ✅
```

### 기각된 대안

**OS-Only** — OS는 삭제 결과를 모름 (서버 에러, 필터링된 뷰, cascade 삭제). 삭제 전 포커스 이동 시 상태 불일치 위험.

**App-Only** — 모든 앱이 동일한 복구 로직을 반복. 빠뜨리면 포커스가 `<body>`로 떨어져 접근성 위반.

## 구현

| 파일 | 역할 |
|------|------|
| `src/os/schemas/focus/resolveRecovery.ts` | OS 순수 함수 — 복구 대상 계산 (전략 패턴: next/prev/nearest) |
| `src/os/2-sync/FocusSync.tsx` | Safety Net — 렌더 후 focusedItemId DOM 검증 |
| `src/apps/todo/app.ts` (deleteTodo) | App 정밀 복구 예시 — 삭제 전 FOCUS() dispatch |

## 현재 상태

- `resolveRecovery.ts` — 구현 완료, FocusSync에서 호출
- Todo deleteTodo — 앱 레벨에서 FOCUS() dispatch로 정밀 복구 (하이브리드 동작)
