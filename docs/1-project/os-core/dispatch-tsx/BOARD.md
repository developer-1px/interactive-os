# dispatch-tsx

## Context

Claim: React(.tsx)에서 os.dispatch 직접 호출은 구조적 위반이다. 22건 잔여. Trigger + Zone onAction으로 전부 대체한다.

Before → After:
- .tsx에서 onClick={() => os.dispatch(cmd())} 22건 → 0건
- 대체 패턴: trigger prop-getter, zone.overlay(), Zone onAction callback
- lint rule `pipeline/no-dispatch-in-tsx` ERROR 활성화 상태 — 0건 달성이 측정 가능

Risks:
- 4개 영역(builder 5, command-palette 6, docs-viewer 7, apg 1, inspector 3)에 걸쳐 파급 넓음
- builder 4건은 pre-existing tsc error — 우리 변경과 무관한 실패 혼입 가능
- docs-viewer/inspector는 defineApp 미적용 앱 — Zone 전환 폭 큼

## Now

## Done

## Unresolved
- builder 4건의 pre-existing tsc error 처리 방향 (우회 vs 동시 수정)
- inspector dispatch가 백로그 원본에 없었음 (3건 새로 발견)

## Ideas
- lint rule 위반 0건 달성 후 CI pre-commit에 추가
