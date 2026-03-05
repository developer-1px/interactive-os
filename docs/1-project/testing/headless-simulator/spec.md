# Spec — headless-simulator

> 한 줄 요약: tsx adapter 계층을 극단적으로 얇게 만들어, vitest만으로 Playwright 동등 검증을 달성한다.

## 성공 기준 (Definition of Done)

이 프로젝트는 아래 **5가지 전부** 충족 시 성공이다.

### ✅ 1. e2e GREEN 복구
- Playwright focus-showcase 29개 테스트 전부 PASS
- `npm run test:e2e:summary` → `0 failed`

### ✅ 2. vitest 동등 검증 존재
- focus-showcase e2e 29개 중 **핵심 패턴**을 vitest로 재현하는 테스트 파일이 존재
- 최소 커버: click→navigate→attrs, selection, expand, tab, dismiss, focus-stack (카테고리당 1개 이상)
- 이 vitest는 `createOsPage` API만 사용 (testing-library ❌)

### ✅ 3. "거짓 GREEN 방지" 증명
- headless-item-discovery 리팩토링(commit `270a7c7`)을 시뮬레이션할 때:
  - **Before**: vitest GREEN, e2e RED (거짓 GREEN)
  - **After**: vitest RED, e2e RED (동일한 실패)
- 즉, 동일한 버그를 vitest가 잡을 수 있다는 증거

### ✅ 4. FocusGroup 축소
- FocusGroup.tsx ≤ 300줄 (현재 611줄)
- Phase 2 DOM scan이 OS layer로 이동
- `querySelectorAll`이 FocusGroup.tsx에 0회

### ✅ 5. computeAttrs 단일 원천
- `aria-current`가 `computeAttrs`에 포함
- FocusItem의 attrs 계산이 `computeAttrs`를 소비 (중복 제거)

## 범위 밖 (Out of Scope)

- Field.tsx 리팩토링 (본질적 DOM 의존, 장기 과제)
- QuickPick.tsx 이동 (Layer 2 분리는 별도 프로젝트)
- 다른 e2e spec (aria-showcase, todo, builder) 검증
- Listener 리팩토링
- rules.md 환류 (T18, 경험 후 별도 진행)

## 상태 인벤토리

| 상태 | 설명 | 진입 조건 | 탈출 조건 |
|------|------|----------|----------|
| RED | e2e 25 FAIL, vitest 거짓 GREEN | 현재 상태 | T1 완료 |
| REFACTORING | FocusGroup 구조 변경 중 | T1 시작 | e2e 0 FAIL |
| PROVING | vitest 동등 테스트 작성 | e2e GREEN | 기준 3 충족 |
| DONE | 전체 기준 충족 | 기준 1-5 전부 | — |

## 검증 스크립트

```bash
# 기준 1: e2e GREEN
npm run test:e2e && npm run test:e2e:summary

# 기준 2: vitest 동등 존재
npx vitest run src/os/**/headless-simulator*.test.ts

# 기준 3: 거짓 GREEN 방지 증명 → 테스트 내 주석으로 설명

# 기준 4: FocusGroup 축소
wc -l src/os/6-components/base/FocusGroup.tsx  # ≤ 300
grep -c "querySelectorAll" src/os/6-components/base/FocusGroup.tsx  # = 0

# 기준 5: computeAttrs 단일 원천
grep "aria-current" src/os/headless.ts  # 존재
```
