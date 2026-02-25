# dev-pipeline

## Context

Claim: 개발 워크플로우는 산출물 기반으로 설계해야 한다. 각 워크플로우의 이름 = 세션 Goal = 산출물.

Before → After:
- Before: `/go` 4-Phase에 `/test`, `/tdd` 포함. LLM이 TDD를 goal fixation으로 skip. 오케스트레이터의 하위 워크플로우 호출이 실질적으로 미작동.
- After: `/red`(산출물=FAIL 테스트) + `/green`(산출물=PASS 코드) 분리. `/go`는 상태 기반 라우터. `view_file`로 하위 워크플로우 실행.

Risks:
- view_file 오케스트레이션의 장기 안정성 미검증
- 기존 42개 워크플로우 중 오케스트레이터 패턴에 의존한 것들 재검토 필요

## Now

- [ ] T5: OS 갭 — Tab 활성 상태 관리. `/audit` builder에서 발견. `BuilderTabs.tsx`가 `useState+onClick`으로 우회.
  - OS에 tablist activate → active tab 상태 변경 경로 필요
  - 판정: builder-v2 BOARD에 위임 or OS 프로젝트로 분리?

## Done
- [x] T14: STORIESBOOK/SPECBOOK/REDBOOK/GREENBOOK/REFACTORBOOK 생성 + 각 워크플로우 Step0(읽기)/마지막(갱신) 추가 ✅
- [x] T13: `/audit` 근본 원인 진단표 + 루프백 라우팅 + `/go` G4.7/4.8 추가 + `os-gaps.md` 생성 (OG-001 Dropdown) ✅
- [x] T12: `/bind` 워크플로우 신규 생성 + `/go` G4.5 추가 — Green→UI 연결 단계 명시 ✅
- [x] T11: `/stories` UX Flow + `/spec` 수직 분해 규칙 — 2개 워크플로우 수정 ✅
- [x] T10: `/stories` INVEST S 재정의 — 파이프라인 1사이클 기준 ✅
- [x] T9: `/stories` DT Gate 추가 — DT 불가 Story 거부 규칙 ✅
- [x] T8: `/stories` 워크플로우 파일 생성 — Connextra+AC+INVEST, Discover/Review 모드 ✅
- [x] T7: 기존 `/prd` deprecated 표시 — deprecated notice + `/spec` 안내 ✅
- [x] T6: `/discussion` conclusion 구로직 정리 — 🚀 Next 2축 라우팅 참조로 교체 ✅
- [x] T0: `/red` + `/green` 생성, `/test` + `/tdd` 제거 — 2개 워크플로우 생성, 2개 삭제 ✅
- [x] T1: `/go` 라우터 재설계 — 195줄→70줄. 4-Phase 실행기 → 상태 기반 라우터 + view_file dispatch ✅
- [x] T2: `/refactor` 재정의 — 자기 완결 세션 (정리+reflect+doubt+verify 인라인+커밋) ✅
- [x] T3: `/project` 정리 — Step 6 → `/red` view_file 위임. Phase 2 참조 제거 ✅
- [x] T4: `/audit` 워크플로우 생성 + Builder 감사 실행 — grep 5패턴, 4건 위반 발견, 3분류 완료 ✅
  - Discussion: `discussions/2026-0224-2027-os-audit-workflow.md`
  - `/red` 3회 개정 (1차/2차 분기 구조, Zone 추가, Full Path 강제)
  - keybindings.ts forward→reverse iteration 버그 수정 (+13 tests 개선)

## Unresolved
- 42개 워크플로우 전체 재검토 범위 (이 프로젝트 or 별도?)
- 기존 워크플로우의 오케스트레이터 참조 (이름만 쓰인 것들) 정리

## Resources
- [업계 워크플로우/스킬 조직 패턴 지형도](../../3-resource/ai-workflow/2026-0224-2245-developer-workflow-skills-landscape.md)
- [워크플로우 의존관계 분석](../../3-resource/ai-workflow/2026-0219-1328-[analysis]-workflow-dependency-graph.md)

## Ideas
- `/go`가 자동으로 다음 세션을 알려주는 UX: "다음: /green을 실행하세요"
- 워크플로우 의존 관계 시각화
- `/audit` 전체 앱 감사 (todo, docs-viewer, kanban)
- `/audit` callback 내부 분기 감지 → AST 분석 확장
