# defineApp v5 — 워크플로우 회고 (KPT)

> 날짜: 2026-02-14
> 범위: defineApp 프로젝트 전체 (Phase 1~3, 6개 세션)

## 세션에서 사용한 Workflow

| Workflow | 단계 | 효과 |
|----------|------|------|
| `/discussion` | Phase 1 | ⭐⭐⭐⭐⭐ Zone binding 설계 원칙 도출 |
| `/project` | Phase 1~3 | ⭐⭐⭐⭐ 구조는 좋지만 Phase 4 루프가 경직 |
| `/redteam` | Phase 2 | ⭐⭐⭐⭐ 8개 공격으로 v5 설계 검증 |
| `/divide` | Phase 3 | ⭐⭐⭐⭐ E2E 분석은 우수, 오진 1건 |
| `/go` | Phase 3 | ⭐⭐⭐⭐ 자율 실행 효과적 |
| `/verify` | Phase 3 | ⭐⭐⭐⭐⭐ 4단계 검증 완벽 |

## 수정된 Workflow 요약

| Workflow | 수정 내용 |
|----------|----------|
| **`/project`** | Phase 4 /tdd 조건부화, 최소 루프 명시 (/divide+/verify 필수), Phase 5에 /retrospect 추가 |
| **`/redteam`** | Blue Team 자동 프롬프트, "다음 단계" 섹션 추가 |
| **`/divide`** | 판단 재분류 단계 추가, 통합 버그 전략 추가 |
| **`/go`** | 커밋 단계 추가, 보고서 형식 표준화 (이전 세션 회고) |
| **`/workflow`** | 기존 파일 존재 확인 추가, 초기 질문 조건부화 (이전 세션 회고) |
| **`/verify`** | tsc --strict 제거, build 명령 수정 (이전 세션 회고) |
