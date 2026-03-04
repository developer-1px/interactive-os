# /auto Stop Hook 구현 계획

> 작성일: 2026-03-04
> 성격: Meta (워크플로우 인프라)
> 출처: /discussion — "/go 자율 루프가 안 된다" → Stop Hook 패턴 발견

---

## 변환 명세표

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `.claude/hooks/go-loop.sh` | 없음 | Stop Hook: `stop_hook_active` 체크 → 마커 존재 시 exit 2, 아니면 exit 0 | Clear | — | 마커 있을 때 exit 2, 없을 때 exit 0 | 마커 미삭제 시 안전장치: `stop_hook_active=true` → 강제 exit 0 |
| 2 | `.claude/settings.local.json` | permissions만 | `hooks.Stop` 배열에 go-loop.sh 등록 | Clear | →#1 | Hook 인식 확인 | 기존 permissions 유지 |
| 3 | `.claude/commands/auto.md` | 없음 | `/auto` 커맨드: 마커 touch + /go 파이프라인 실행 | Clear | →#1,#2 | `/auto` 시 마커 생성 확인 | — |
| 4 | `.claude/commands/go.md` 회고 섹션 | `/archive`로 종료 | `/archive` 후 `rm -f /tmp/.go-pipeline-active` 추가 | Clear | — | `/archive` 후 마커 삭제 확인 | 기존 동작 변경 없음 |

## 라우팅

승인 후 → `/go` (Meta 프로젝트, #1.5 직접 실행) — 파일 4개 생성/수정
