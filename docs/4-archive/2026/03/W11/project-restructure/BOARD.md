# 1-project 구조 재편

> **유형**: Meta
> **목표**: docs/1-project/를 5 domain · 21 epic 구조로 재편
> **근거**: /discussion + /naming 분석 (docs/0-inbox/30, 31)

## Context

- 5 domain: kernel, os, apps, harness, agent-activity
- 21 epic: 전수 조사로 발견된 확정 컨셉 (archive 포함)
- 원칙: epic은 영구 유지 (빈 상태 OK), archive는 완료·폐기만
- 4분류: Active / Hold / Archive / Backlog

## Now

(전부 완료)

## Done

- [x] T1: 5 domain 폴더 생성 ✅
- [x] T2: os/ 빈 epic 폴더 10개 생성 ✅
- [x] T3: harness/ epic 폴더 3개 생성 ✅
- [x] T4: agent-activity/ epic 폴더 2개 생성 ✅
- [x] T5: apps/todo/ epic 폴더 생성 ✅
- [x] T6: os-core/ → os/ git mv ✅
- [x] T7: testing/headless-page/ → os/headless-page/ git mv ✅
- [x] T8: apg/apg-suite/ → os/apg/ 파일 배치 ✅
- [x] T9: builder/ → apps/builder/ git mv ✅
- [x] T10: docs-viewer/os-migration → agent-activity/docs-viewer/ git mv ✅
- [x] T11: 완료 3개 archive (devtool-split, agent-recent, archive-cleanup) ✅
- [x] T12: backlog 복귀 3개 (condition-auto-disabled, replay, test-observability) ✅
- [x] T13: 고아 정리 (interaction_specs.md → 2-area/, resource/ 삭제) ✅
- [x] T14: 구 domain 폴더 삭제 ✅
- [x] T15: STATUS.md 갱신 ✅
- [x] T16: MEMORY.md 갱신 ✅
- [x] T17: Knowledge 반영 ✅

## Unresolved

(없음)
