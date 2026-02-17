# Project Dashboard

> Last updated: 2026-02-18 00:05
>
> 이 파일은 **단일 진실 원천(Single Source of Truth)**이다.
> 워크플로우가 읽고, 워크플로우가 갱신한다. git log가 곧 changelog.

---

## 🔥 Active Focus

_(없음 — 모든 Focus 프로젝트 태스크 소진)_

---

## 📋 All Active Projects

| Project | Phase | Last Activity | Status |
|---------|-------|---------------|--------|
| os-prd | Execution (Now 비어있음) | 02-18 | ⏸ Idle |
| builder-mvp | Definition | 02-16 | ⏸ Idle |
| define-app | Execution (Phase 3) | 02-16 | ⏸ Idle |
| registry-monitor-v5 | Design | 02-15 | ⏸ Idle |
| docs-dashboard | Design | 02-15 | ⏸ Idle |
| create-module | Design (Proposal 미승인) | 02-15 | ⏸ Idle |
| testbot | Execution 준비 | 02-15 | ⏸ Idle |

---

## ✅ Completed (→ archive 완료)

| Project | Completed | Archived |
|---------|-----------|----------|
| naming-convention | 02-17 | pending |
| field-key-ownership | 02-16 | pending |
| todo-keyboard-dogfooding | 02-16 | ✅ 4-archive/2026-02 |
| command-palette-e2e | 02-16 | ✅ 4-archive/2026-02 |
| fix-tab-navigation | 02-16 | ✅ 4-archive/2026-02 |
| docs-system-v2 | 02-16 | ✅ 4-archive/2026-02 |
| builder-focus-navigation | 02-15 | ✅ 4-archive/2026-02 |
| builder-os-panel-binding | 02-15 | ✅ 4-archive/2026-02 |
| os-elegance | 02-14 | ✅ 4-archive/2026-02 |
| focus-recovery | 02-15 | ✅ 4-archive/2026-02 |
| todo-v3-migration | 02-15 | ✅ 4-archive/2026-02 |
| todo-app | 02-15 | ✅ 4-archive/2026-02 |
| workflow-ecosystem-refactoring | 02-13 | ✅ 2026 |
| test-structure-convention | 02-13 | ✅ 2026 |
| stream-inspector | 02-13 | ✅ 2026 |
| os-keybinding-architecture | 02-13 | ✅ 2026 |
| official-docs | 02-14 | ✅ 2026 |
| move-docs-script | 02-13 | ✅ 2026 |
| os-core-refactoring | 02-12 | ✅ 2026 |

---

## 📥 Inbox

| File | Type | Suggested Action |
|------|------|-----------------|
| `2026-0215-1845-divide-os-remaining.md` | /divide report | → `os-prd/notes/` |
| `2026-0216-2053-analysis-diagnose-editing-ownership.md` | 아키텍처 분석 | → `builder-mvp/notes/` |
| `2026-0216-2100-report-kernel-code-review.md` | 코드 리뷰 | → `3-resource/` |
| `2026-0216-2104-[report]-os-code-review.md` | 코드 리뷰 | → `3-resource/` |
| `2026-0216-2217-[report]-code-review.md` | 코드 리뷰 | → `3-resource/` |

---

## 📊 Summary

| Metric | Count |
|--------|-------|
| Active Focus | 0 |
| Active Projects (total) | 7 |
| Completed (archived) | 19 |
| Inbox items | 5 |
| Backlog items | 3 |
| Open issues | 0 (7 closed) |

---

## 📝 Recent Changes (2026-02-18)

- ✅ `os-prd` T9 완료 확인 — defineApp.ts 분할 이미 완료 (912→299줄, 6개 모듈)
- ⏸ `os-prd` Now 비어있음 → Idle (Closing 또는 Living Spec 판정 필요)
- ⏸ `builder-mvp` Focus → Idle 강등 (02-16 이후 활동 없음)
- 📥 Inbox 5건 누적 — 코드 리뷰 3건 + /divide 보고서 1건 + 아키텍처 분석 1건

## 📝 Recent Changes (2026-02-17)

- 🆕 `naming-convention` 프로젝트 생성 — 네이밍 컨벤션 감사 + rules.md 반영 + 폴더 리네이밍

## 📝 Recent Changes (2026-02-16)

- 🔧 워크플로우 프레임워크 도입: Cynefin, 8D, PMBOK, Test Pyramid, Conventional Comments, Mikado Method
- 🔧 rules.md: #4 판단 기준 확장, #5 산출물 부채 확장, Cynefin 부록 분리
- ✅ `fix-tab-navigation` 프로젝트 완료 — Tab escape/flow 모드 수정
- ✅ `docs-system-v2` 프로젝트 완료 — 워크플로우 리팩토링, PARA 구조 정착
- 🆕 `/perf` 워크플로우 신설, `/review` 성능 렌즈 추가
- 🆕 BOARD 파이프라인 체크리스트 도입 (워크플로우 단계 누락 방지)
- perf: useComputed 구독 패턴 최적화 (string→boolean, 300→2 리렌더)
- ✅ `todo-keyboard-dogfooding` 프로젝트 완료 — 포커스 복원 구현, E2E 16개 전부 통과 (SC-1~SC-5)
- fix: click-to-expand — disclosure/accordion 클릭 확장 + dialog 포커스 복원, E2E 164/164 통과
- ✅ 전체 이슈 클리어 (5개 이슈 done → closed)
- ✅ `field-key-ownership` 프로젝트 완료
- 🆕 `behavior-first-zone` 프로젝트 생성 — ARIA role→behavior 인과관계 역전 수정
- 📥 `behavior-first-zone` 백로그 이동 — 전제 무효(IME 버그였음), typeahead 복원
- fix: IME keyCode 229 가드 추가 (KeyboardListener) — 한글 IME 첫 keydown 누출 방지
- fix: Todo dead code 정리 (AppEffect, GenericCommand, logic/)
