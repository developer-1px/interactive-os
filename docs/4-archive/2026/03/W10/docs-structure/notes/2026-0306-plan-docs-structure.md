# /plan — Docs 디렉토리 구조 정비

> 2026-03-06 | Origin: docs-structure-reorganization backlog

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `docs/archive/` | `docs/archive/2026/{02,03}/` (번호 없는 아카이브) | `docs/4-archive/2026/{02,03}/`로 병합, `docs/archive/` 삭제 | Clear | — | `ls docs/archive` → not found | W10 병합 시 이름 충돌 없음 확인됨 |
| 2 | `docs/official/` | `docs/official/{kernel/,os/}` (PARA 밖 독립) | `docs/2-area/official/{kernel/,os/}` 이동 | Clear | — | `ls docs/official` → not found | 참조 17파일 40건 |
| 3 | `.agent/rules.md` | `docs/official/os/zone-data-model.md`, `docs/official/VISION.md`, `docs/official/kernel/`, `docs/official/os/` | `docs/2-area/official/os/zone-data-model.md` 등으로 갱신 | Clear | →#2 | grep `docs/official` → 0 hits in rules.md | 헌법 파일 — 오타 주의 |
| 4 | `.agent/knowledge/runbook.md` | `docs/official/os/SPEC.md` 등 9건 | `docs/2-area/official/os/SPEC.md` 등으로 갱신 | Clear | →#2 | grep 확인 | — |
| 5 | 기타 참조 파일 (12파일) | `docs/official/` 참조 | `docs/2-area/official/` 으로 갱신 | Clear | →#2 | grep `docs/official` → 0 hits 전체 | `.claude/commands/`, `.agent/workflows/`, `packages/kernel/README.md`, `.ts` 파일 2개 포함 |
| 6 | `docs/2-area/praxis/` (11파일) | 혼합 성격 파일 praxis/ 하위 | 관행 문서(5) → `2-area/` 루트, 설계/AI(4) → `3-resource/`, zift-doubt(1) → `3-resource/`, discussion-expert(1) → `3-resource/` | Clear | — | `ls docs/2-area/praxis/` → not found | — |
| 7 | `docs/1-project/0-issue/` | 이슈 17개 + closed/ + 폴더형 1개 | open → `5-backlog/issues/`, `closed/` → `4-archive/` | Clear | — | `ls docs/1-project/0-issue` → not found | `/issue` 워크플로우 경로 갱신 필요 |
| 8 | `/issue` 워크플로우 | `docs/1-project/0-issue/` 참조 | `docs/5-backlog/issues/` 참조 | Clear | →#7 | grep `0-issue` → 0 hits | `.claude/commands/issue.md` + `.agent/workflows/issue.md` |
| 9 | `/archive` 워크플로우 | `archive/YYYY/MM/WNN/` (번호 없음) | `4-archive/YYYY/MM/WNN/` | Clear | →#1 | grep `archive/` in archive.md → `4-archive/` only | — |
| 10 | `docs/MIGRATION_MAP.md` | `docs/archive/`, `4-archive/` 혼재 참조 | 통합 후 `4-archive/`만 참조 | Clear | →#1 | grep 확인 | — |

## MECE 점검

1. **CE**: #1-#10 실행하면 PARA 밖 폴더 0개, 아카이브 1곳, praxis 소멸, 0-issue 소멸 → 목표 달성
2. **ME**: 중복 없음 (#3,#4,#5는 #2 의존이지만 대상 파일이 다름)
3. **No-op**: 없음

## 라우팅

승인 후 → `/project` (새 프로젝트: docs-structure) — Meta 프로젝트, Red/Green 스킵, 파일 이동 + 참조 갱신
