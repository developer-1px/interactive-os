# /audit — Trigger Pure Projection (2026-03-04)

> 대상: Trigger.tsx + Pipeline 변경 파일 전수
> 범위: OS 프로젝트 (trigger-listener-gap)

---

## 위반 목록

| # | 파일:줄 | 패턴 | 분류 | 처리 |
|---|---------|------|------|------|
| 1 | `Trigger.tsx:97` | `dispatch: customDispatch` dead prop | 🔴 LLM 실수 | ✅ 삭제 |
| 2 | `Trigger.tsx:98` | `allowPropagation` dead prop | 🔴 LLM 실수 | ✅ 삭제 |
| 3 | `Trigger.tsx:100` | `onClick` dead destructure | 🔴 LLM 실수 | ✅ 삭제 |
| 4 | `Trigger.tsx:301,315` | `useEffect` (TriggerPortal) | ⚪ 정당한 예외 | dialog sync + cancel event |
| 5 | `Trigger.tsx:345` | `onClick={handleBackdropClick}` | ⚪ 정당한 예외 | dialog backdrop close |
| 6 | `PointerListener.tsx:64` | `onPointerDown` | ⚪ 정당한 예외 | OS Listener 진입점 |
| 7 | `resolveTriggerClick.ts:50` | `config.open.onClick` | ✅ Clean | OS config 읽기 |

---

## 0건 규칙 검증

| 항목 | 결과 |
|------|------|
| 사용된 OS 프리미티브 | OS_OVERLAY_OPEN/CLOSE, resolveTriggerRole, resolveTriggerClick, defineEffect, ZoneRegistry.getTriggerOverlay |
| 콜백 시그니처 선언형? | ✅ 모두 BaseCommand 리턴 |
| bind() 메소드 존재? | ✅ 해당 없음 (OS 프리미티브 변경) |
| 앱이 os.dispatch 직접 호출? | ✅ Trigger.tsx에서 제거 완료. TriggerPortal/Dismiss만 잔존 (정당) |

---

## 지표

```
총 위반: 7건
  🔴 LLM 실수: 3건 → 3건 수정 완료, 0건 잔존
  🟡 OS 갭: 0건
  ⚪ 정당한 예외: 3건
  ✅ Clean: 1건
재감사: 수정 후 위반 0건 확인 ✅
```
