# [plan] Trigger → 순수 투영 프리미티브 전환

> 2026-03-04 02:50 | `/plan` 변환 명세표
> Discussion: `discussions/2026-0304-0250-trigger-aria-responsibility.md`

## 목표

Trigger를 Item과 동격의 **순수 투영 프리미티브**로 전환한다.
- ARIA 투영(`aria-haspopup`, `aria-expanded`, `aria-controls`)을 headless 순수 계산으로 이동
- 렌더링(Portal/Popover/Dismiss)을 Trigger에서 분리 → OS/Overlay 프리미티브로
- 모든 overlay trigger를 `createTrigger` 경유로 통일

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `types.ts:TriggerBinding` | `{ id, onActivate }` — overlay 메타데이터 없음 | `{ id, onActivate, overlay?: { id, type } }` — overlay 관계 선언 | Clear | — | tsc 0 | 기존 TriggerBinding 소비자에 optional이므로 무해 |
| 2 | `trigger.ts:CompoundTriggerConfig` | `{ id, confirm, role: "dialog"\|"alertdialog" }` — dialog 전용 | `{ id, role: "dialog"\|"alertdialog"\|"menu"\|"listbox", confirm? }` — 범용 overlay | Clear | — | tsc 0 | Todo/Carousel의 기존 dialog 설정 호환 |
| 3 | `trigger.ts:createCompoundTrigger()` | Dialog 전용 (`Dialog.Trigger`+`Dialog.Content`+`Dialog.Close`) 반환 | **Popover/Menu** 역할 추가: role에 따라 Dialog 또는 Popover 컴포넌트 세트 반환 | Clear | →#2 | tsc 0, 기존 Dialog 테스트 유지 | CompoundTriggerComponents 인터페이스 확장 필요 |
| 4 | `Trigger.tsx` | 614줄. ARIA 투영 + overlay lifecycle + Portal + Popover + Dismiss 전부 소유 | **ARIA만 투영** — overlay 메타데이터됨 커널 등록 경로에서 계산. Portal/Popover/Dismiss 분리 | Complicated | →#1,#3 | tsc 0, 기존 headless 테스트 유지 | 가장 큰 변경. 단계적 분리 필요 |
| 5 | `MenuButtonPattern.tsx` | `<Trigger role="menu">` 직접 + `<Trigger.Popover>` 자식 | `createTrigger({ id, role: "menu" })` → 컴포넌트 세트 사용 | Clear | →#3 | APG menu-button 테스트 PASS | MenuButton showcase 깨짐 주의 |
| 6 | `LocaleSwitcher.tsx` | `<Trigger id="..." role="menu">` + `<Trigger.Portal>` + `<Trigger.Dismiss>` | `createTrigger({ id, role: "menu" })` → 컴포넌트 세트 사용 | Clear | →#3 | 브라우저 수동 확인 (locale 변경) | Builder 앱 영향 |
| 7 | `todo/app.ts:DeleteDialog` | `createTrigger({ id, confirm, role: "alertdialog" })` — 이미 사용 중 | 변경 없음 (기존 호환) | Clear | — | 기존 Todo 테스트 유지 | — |
| 8 | headless `computeTrigger` | 없음 | `computeTrigger(id, state)` → `{ "aria-haspopup", "aria-expanded", "aria-controls" }` 순수 함수 추가 | Clear | →#1 | +3 unit tests (haspopup, expanded, controls) | os-core에 추가 → 패키지 경계 |
| 9 | `page.ts:AppPage.attrs()` | Item ARIA만 계산 | trigger overlay ARIA도 반환 | Clear | →#8 | +2 headless 테스트 (attrs 검증) | — |

## MECE 점검

1. **CE** — #1~#9 전부 실행하면 "Trigger = 순수 투영 + createTrigger 통일" 달성? ✅
2. **ME** — 중복 행? ❌ 없음
3. **No-op** — #7 은 변경 없음이지만 호환성 확인용으로 유지 (검증 행)

## 비-Clear 행 해소

**#4** (Complicated): `Trigger.tsx` 614줄 분리는 단계적 접근 필요.
- **제 판단**: Phase 1에서 ARIA 투영을 `computeTrigger`로 추출 (#8). Phase 2에서 Portal/Popover/Dismiss를 별도 파일로 분리. Phase 3에서 Trigger.tsx를 슬림화.
- Phase 1만 이번 스코프. Phase 2-3은 후속 태스크.
- **이 분리로 #4를 Clear로 변환**: "이번에는 ARIA 계산 경로만 추가. 기존 Trigger.tsx는 건드리지 않고 공존."

→ **수정: #4를 "ARIA 계산을 computeTrigger로 위임하되 기존 코드 유지 (공존)"로 축소 → Clear**

## 실행 순서

```
#1 (TriggerBinding 확장)
  → #8 (computeTrigger 순수 함수)
    → #9 (AppPage.attrs 확장)
      → #2 (CompoundTriggerConfig 확장)
        → #3 (createCompoundTrigger 확장)
          → #5, #6 (소비자 마이그레이션)
            → #4 (Trigger.tsx ARIA 위임 — 공존)
              → #7 (호환성 확인)
```

## 검증 계획

### 자동 테스트
```bash
# 전체 타입 검사
source ~/.nvm/nvm.sh && nvm use && npx tsc --noEmit 2>&1 | tail -20

# 기존 APG menu-button 테스트
source ~/.nvm/nvm.sh && nvm use && npx vitest run tests/apg/menu-button.apg.test.ts --reporter=verbose 2>&1 | tail -30

# 기존 Todo 테스트 (Dialog 호환)
source ~/.nvm/nvm.sh && nvm use && npx vitest run tests/ --reporter=verbose 2>&1 | tail -30

# 새 computeTrigger 단위 테스트 (작성 예정)
source ~/.nvm/nvm.sh && nvm use && npx vitest run tests/unit/compute-trigger.test.ts --reporter=verbose 2>&1 | tail -30
```

### 수동 검증
- MenuButtonPattern: 브라우저에서 Enter/Space/Click으로 메뉴 열림/닫힘 확인
- LocaleSwitcher: 브라우저에서 locale 변경 동작 확인

## 라우팅

승인 후 → `/go` (zift-usage-spec) — Trigger 순수 투영 전환 태스크를 BOARD.md에 등록 후 실행
