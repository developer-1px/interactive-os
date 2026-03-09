# pipeline-v2

## Context

Claim: 현재 파이프라인이 과설계되어 있다. /plan+/divide 역할 중복, /go의 1턴=1샷 한계, 스킬 범주 혼재. 최소 수정으로 TO-BE 파이프라인을 구현하고, os-react 안티패턴(AP-1~AP-8)을 돌려서 검증한다.

Before → After:
- /plan: 변환 명세표 → Task Map + 현황판 + 1턴 크기 분해
- /divide: 실행 계획 → 논의 도구(이해용 분해만)
- /project: Context + Now → Context만 (전략 컨테이너)
- /spec: 프로젝트당 1파일 → 태스크별
- /go: 라우터 → 라우터 + 멀티턴 게이트
- /blueprint §7: 삭제 (실행 계획 → /plan으로 위임)
- /inbox: 인프라 → 논의 도구
- 삭제: /rework, /design, /routes

Risks:
- /go 재구성이 모든 프로젝트에 영향
- 기존 진행 중 프로젝트와의 호환성
- LLM이 새 파이프라인을 올바르게 따르는지 (결국 .md를 읽고 따르는 구조)

규모: **Meta** (워크플로우 .md 수정, 코드 변경 없음)

## Now

## Done

- [x] T8: 검증 — AP-4(Dialog.tsx 삭제) `/auto`→`/go` 파이프라인 완주. project→plan→spec→green→verify→archive 전 단계 정상 동작 (787d5baf)

- [x] T1: /plan 재작성 — Task Map + 현황판 + S/M/L 크기 분해 ✅
- [x] T2: /go 멀티턴 게이트 — 11단계 파이프라인 + 정량 검증 + ≤3 재시도 ✅
- [x] T3: /project 축소 — Context만 남김, Now는 /plan이 담당 ✅
- [x] T4: /spec 태스크별 — `## T{N}:` 헤딩으로 태스크별 섹션 ✅
- [x] T5: /divide 논의 도구 — description + 역할 재정의 ✅
- [x] T6: /blueprint §7 제거 — §1~§6만 유지, /plan 위임 안내 추가 ✅
- [x] T7: 삭제 3개 — /rework, /design, /routes + .agent/workflows 동기화 ✅

## Unresolved

- /naming 개편 방향 (convention/structure 성격) — 별도 논의 필요
- 각 스킬의 "의도-구현 갭" 전수 매핑 — T1~T7 완료 후 다음 프로젝트로

## Ideas

- 정량 게이트의 단계별 기준을 별도 config로 관리
- /auto + 멀티턴 게이트 통합 시 무한루프 방지 강화
