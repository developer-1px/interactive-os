# testbot-apg-fix — Retrospective

> 2026-03-09 | TestBot APG 6 FAIL 해결

## Session Summary

- **Goal**: TestBot APG 6/23 FAIL → 0 FAIL
- **Result**: 6건 모두 수정, 689 tests passed, tsc 0, build OK
- **Workflows**: `/discussion` → `/divide` → `/auto` (`/go` → `/plan` → `/project` → `/green` → `/verify` → `/audit` → `/doubt` → `/retrospect` → `/archive`)

## 📝 Session Knowledge Harvest

| # | Knowledge | Context | Location | Status |
|---|-----------|---------|----------|--------|
| K1 | `value.mode="continuous"` ≠ slider — role 체크 필수 | T6: Spinbutton 9→50 | testing-hazards.md | ✅ |
| K2 | Zone-level inputmap은 per-item-role 분기 불가 → onAction이 분기점 | T3: Menu overlay close | design-principles.md #37 | ✅ |
| K3 | trigger() prop-getter에 HTML `id` 필수 | T4: Menu Button | testing-hazards.md | ✅ |
| K4 | Meter = 읽기전용 role, focus nav 테스트 불가 | T5: Meter | testing-hazards.md | ✅ |

## KPT

### 🔧 Development

| | |
|---|---|
| **Keep 🟢** | OS Diagnostic 역추적으로 Spinbutton root cause 1단계 도달. 6 FAIL을 4 카테고리로 분류 후 각개격파 |
| **Problem 🔴** | Accordion 초기 상태를 "의도된 설계"로 오판 → 사용자 교정 필요. APG spec "initial state" 미확인 |
| **Try 🔵** | APG 패턴 수정 시 W3C spec의 initial state 섹션 먼저 확인 |

### 🤝 Collaboration

| | |
|---|---|
| **Keep 🟢** | 사용자 1턴 교정으로 Accordion 방향 즉시 전환 |
| **Problem 🔴** | AI가 "현재 코드 = 의도"로 가정하여 Accordion 오분석 |
| **Try 🔵** | spec 기준 판단 우선, 코드 상태를 의도로 해석하지 않기 |

### ⚙️ Workflow

| | |
|---|---|
| **Keep 🟢** | `/auto` 파이프라인이 전체 사이클을 자율 완주. 6건 수정 + 커밋 + 검증까지 한 세션 |
| **Problem 🔴** | (없음) |
| **Try 🔵** | (없음) |

## MECE Actions

| # | Action | Category | Status | Urgency |
|---|--------|----------|--------|---------|
| 1 | K1: testing-hazards.md — value.mode≠slider 추가 | Knowledge | ✅ | 🔴 |
| 2 | K2: design-principles.md #37 — inputmap per-item-role 한계 | Knowledge | ✅ | 🟡 |
| 3 | K3: testing-hazards.md — trigger() id 누락 | Knowledge | ✅ | 🟡 |
| 4 | K4: testing-hazards.md — meter 읽기전용 | Knowledge | ✅ | 🟡 |
| 5 | retrospective.md 저장 | Docs | ✅ | 🔴 |

## Result

```
Total actions: 5
  ✅ Applied: 5
  🟡 Backlog: 0
  ❌ Remaining: 0
```
