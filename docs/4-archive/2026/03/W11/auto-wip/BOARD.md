# auto-wip — `/auto` 범용 자율 래퍼 확장

> **Size**: Meta
> **Epic**: harness/skill
> **Created**: 2026-03-12

## Context

`/auto`는 현재 `/go` 전용 자율 래퍼다. target 인자를 받아 `/auto /wip`이면 `/wip` 루프를 자율 실행하도록 확장한다.

### Warrants

- W1. `/auto` = 마커 ON + target 실행. stop hook이 종료 차단
- W2. `/wip` Step 3A(Clear→`/project`→`/go`)가 이미 실행 경로를 정의 — 멈추지만 않으면 됨
- W3. 별도 스킬보다 인자 확장이 동기화 비용 최소

### Design

- 마커 파일에 target 저장: `echo "TARGET" > /tmp/.go-pipeline-$ID`
- stop hook이 마커 내용을 읽어 적절한 재개 메시지 출력
- `/auto`가 target 인자를 파싱하여 해당 스킬 실행

## Now

(없음 — 전부 완료)

## Unresolved

(없음)

## Done

- [x] T1: `/auto` SKILL.md에 target 인자 지원 추가 — `/auto [target]` 패턴, 기본값 go, wip 지원 ✅
- [x] T2: `go-loop.sh` stop hook — 마커 내용(`cat $MARKER`)으로 target 읽어 메시지 분기 ✅
- [x] T3: `workflows/auto.md` dual-file 동기화 — SKILL.md와 100% 일치 ✅

✅ QA PASS (Meta 4/4: Completeness, Consistency, Reference Integrity, Convention)
