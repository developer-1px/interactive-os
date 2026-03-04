# /plan — CheckConfig.aria 추가로 toggle button aria-pressed 투영

> **목표**: Toggle button이 W3C APG 스펙대로 `aria-pressed`를 투영한다.
> **원칙**: if 분기 없이 config 선언 + map lookup으로 해결.

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `FocusGroupConfig.ts:CheckConfig` | `{ mode: "check" \| "select" \| "none" }` | `{ mode: ..., aria?: "checked" \| "pressed" }` — default `"checked"` | 🟢 Clear | — | tsc 0 | 기존 소비자 영향 없음 (optional 필드 추가) |
| 2 | `headless.types.ts:ItemAttrs` | `"aria-checked"?: boolean` 만 존재 | `"aria-pressed"?: boolean` 추가 | 🟢 Clear | — | tsc 0 | 없음 |
| 3 | `compute.ts:FieldAttrsInput` | `checkMode: string` | `checkMode: string; checkAria?: "checked" \| "pressed"` | 🟢 Clear | →#1 | tsc 0 | 내부 인터페이스, 외부 영향 없음 |
| 4 | `compute.ts:FieldAttrsOutput` | `"aria-checked"?: boolean` 만 존재 | `"aria-pressed"?: boolean` 추가 | 🟢 Clear | →#2 | tsc 0 | 없음 |
| 5 | `compute.ts:computeFieldAttrs` | `if (useChecked) result["aria-checked"] = ...` (hardcoded) | `CHECK_ATTR_MAP` lookup: `result[attrMap[input.checkAria ?? "checked"]] = ...` | 🟢 Clear | →#3,#4 | 기존 10 FAIL → 10 PASS | checkbox/switch/radio 테스트 regression 확인 |
| 6 | `compute.ts:computeItem` | `computeFieldAttrs({ checkMode, ... })` | `computeFieldAttrs({ checkMode, checkAria: entry?.config?.check?.aria, ... })` | 🟢 Clear | →#5 | tsc 0 | 없음 |
| 7 | `ButtonPattern.tsx:bind options` | `check: { mode: "check" }` | `check: { mode: "check", aria: "pressed" }` | 🟢 Clear | →#1 | aria-pressed가 DOM에 투영됨 | 없음 |
| 8 | `button.apg.test.ts:factory` | `check: { mode: "check" }` | `check: { mode: "check", aria: "pressed" }` | 🟢 Clear | →#1 | 10 FAIL → 10 PASS | 없음 |
| 9 | `button.ts (TestBot)` | `"aria-checked"` 검증 | `"aria-pressed"` 검증 + 스크립트명 수정 | 🟢 Clear | — | TestBot 실행 시 올바른 속성 검증 | 없음 |

## MECE 점검

1. **CE**: #1~#9 모두 실행하면 toggle button `aria-pressed` 투영 완성? → ✅
2. **ME**: 중복 행? → 없음
3. **No-op**: Before=After? → 없음

## 검증 계획

```bash
# 1. tsc — 타입 에러 0
npx tsc --noEmit 2>&1 | tail -5

# 2. Button APG test — 10 FAIL → 0 FAIL (18 PASS)
npx vitest run tests/apg/button.apg.test.ts --reporter=verbose 2>&1 | tail -30

# 3. Checkbox/Switch/Radio regression — 기존 PASS 유지
npx vitest run tests/apg/checkbox.apg.test.ts tests/apg/spinbutton.apg.test.ts --reporter=verbose 2>&1 | tail -20

# 4. 전체 APG suite regression
npx vitest run tests/apg/ --reporter=verbose 2>&1 | tail -30

# 5. apg-matrix unit test (aria-checked 경로 보호)
npx vitest run packages/os-core/src/4-command/__tests__/unit/apg-matrix.test.ts --reporter=verbose 2>&1 | tail -20
```

## 라우팅

승인 후 → `/go` (0-issue/apg-button-aria-pressed) — OS 코어 패치 + 테스트 green 전환
