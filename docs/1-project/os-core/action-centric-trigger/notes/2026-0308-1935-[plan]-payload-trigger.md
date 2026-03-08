# Plan: Trigger Payload 기반 Prop-getter 전환

> Discussion: 2026-0308-1920
> 전행 Clear 변환 명세표

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `trigger.ts:createFunctionTrigger` | `(payload?: string) => { "data-trigger-id": id }` (payload 무시) | `(payload?: string) => { "data-trigger-id": id, ...(payload ? { "data-trigger-payload": payload } : {}) }` | Clear | — | trigger.test.ts 기존 2 pass + 신규 payload 테스트 | 없음 |
| 2 | `senseMouse.ts:senseClickTarget` | L282에서 `data-trigger-id`만 읽음 | `data-trigger-payload`도 읽어서 `ClickTarget`에 포함 | Clear | — | tsc 0 | ClickTarget 타입 확장 필요 |
| 3 | `senseMouse.ts:ClickTarget` 타입 | `simple-trigger`에 `triggerId`만 있음 | `payload?: string` 추가 | Clear | →#2 | tsc 0 | 없음 |
| 4 | `PointerListener.tsx` L325-347 | `cb.onActivate(focusId)` 호출 | `cb.onActivate(clickTarget.payload ?? focusId)` — payload 우선, fallback focusId | Clear | →#2,#3 | 기존 trigger 테스트 유지 + 신규 payload 테스트 | focusId fallback 필수 (payload 없는 기존 trigger 호환) |
| 5 | `simulate.ts` L263-269, L335-338 | `itemCb.onActivate(focusId)` 호출 | payload 지원 추가 (headless에서는 click(itemId)의 itemId 자체가 payload 역할) | Clear | →#3 | 기존 headless 테스트 유지 | simulate.ts는 DOM이 없으므로 data-attribute 대신 다른 경로 필요 |
| 6 | `trigger.test.ts` | T1: data-trigger-id 반환 확인 / T2: overlay getter 확인 | T3 추가: `trigger(payload)` 호출 시 `data-trigger-payload` 반환 확인 | Clear | →#1 | +1 test | 없음 |
| 7 | `trigger.ts:createFunctionTrigger` 시그니처 | `_onActivate: (focusId: string) => BaseCommand` | `onActivate: (payload: string) => BaseCommand` — focusId → payload 리네이밍 | Clear | →#1 | tsc 0 | index.ts도 동기화 필요 |
| 8 | `index.ts:trigger()` 메서드 | `onActivate: (focusId: string) => BaseCommand` | `onActivate: (payload: string) => BaseCommand` | Clear | →#7 | tsc 0 | types.ts 동기화 |

---

## MECE 점검

1. CE: #1-#8 전부 실행하면 "payload 기반 trigger dispatch" 완성? → ✅ (prop-getter가 payload 반환 + Pipeline이 payload 읽기 + handler에 payload 전달)
2. ME: 중복? → #7과 #8은 같은 리네이밍이지만 다른 파일 → 유지
3. No-op: Before=After? → 없음

---

## 라우팅
승인 후 → `/go` (action-centric-trigger T1~T4) — OS Core 내부 변경. 앱 코드 변경(T5)은 후속.
