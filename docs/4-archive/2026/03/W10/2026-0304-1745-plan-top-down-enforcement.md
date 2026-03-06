# /plan — Top-Down Enforcement

> **Discussion Claim**: defineApp = Application Context. 모든 OS primitive는 defineApp으로부터 top-down 생성만 허용. bottom-up 직접 조립 금지.

## 현황

- Trigger 직접 import: 8개 파일 (앱 레이어)
- Zone/Item 직접 import: 28개 파일 (앱 레이어)
- defineApp 이미 사용: 32개 파일

## 변환 명세표

### Phase 1: 전제 확립 (이번 scope)

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `os-react/6-project/Trigger.tsx` export | `export { Trigger }` public | `export { Trigger }` → internal only. re-export from `@os-react/internal` | Clear | — | tsc 0, 기존 import가 `@os-react/internal`로 변경됨 | 8개 파일 import 경로 변경 |
| 2 | `os-react/6-project/Zone.tsx` export | `export { Zone, Item }` public | internal only | Clear | — | tsc 0 | 28개 파일 import 경로 변경 |
| 3 | `os-sdk/app/defineApp.ts` → createAction 추가 | createAction 없음 | `app.createAction(id, { onActivate })` → singleton Zone + bind | Clear | →#1 | +unit test | standalone button 전환 |
| 4 | `@os-react` public API 정리 | Zone/Item/Trigger public export | bind 결과만 public. internal에서만 raw 접근 | Clear | →#1,#2 | tsc 0, 기존 기능 유지 | — |

### Phase 2: 레거시 마이그레이션 (후속 scope)

| # | 대상 | 현재 | 전환 | 파일 수 |
|---|------|------|------|---------|
| 5 | APG patterns (ButtonPattern 등) | `<Trigger>` 직접 | defineApp + bind | ~8개 |
| 6 | Todo app | Zone/Item 직접 import 혼재 | defineApp 이미 있음 → bind만 전환 | ~5개 |
| 7 | Builder app | Zone/Item 직접 import | defineApp 이미 있음 → bind 전환 | ~8개 |
| 8 | docs-viewer | Zone/Item 직접 import | defineApp + bind | ~4개 |
| 9 | Inspector | Trigger 직접 | defineApp + bind | ~2개 |

## MECE 점검

1. **CE**: Phase 1(#1-#4) 완료 → 새 코드가 bottom-up 불가. Phase 2(#5-#9) 완료 → 레거시 0. ✅
2. **ME**: 중복 없음 ✅
3. **No-op**: 없음 ✅

## 라우팅

승인 후 → `/project` (Heavy) — "top-down-enforcement". Phase 1만 Now, Phase 2는 Backlog.
