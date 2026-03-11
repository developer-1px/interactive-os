# QA Agent

> 개발 세션과 분리된 독립 QA 에이전트. fresh context에서 판단 기반 검증을 수행한다.

## Context

| Key | Value |
|-----|-------|
| Domain | harness |
| Epic | agent |
| Size | Meta |
| Goal | `/go` 파이프라인에 독립 QA 게이트를 삽입하여, 자기 편향 없는 품질 검증을 자동화한다 |
| Why | (1) 같은 세션이 개발+검증하면 QA를 설렁설렁 함 (2) 컨텍스트 소모가 커서 검증을 별도 에이전트에 위임해야 함 |
| Mechanism | Agent tool `isolation: "worktree"` — 별도 컨텍스트에서 실행, 결과만 반환 |
| Principle | IV&V (Independent Verification & Validation) — 코드를 쓴 자가 검증하지 않는다 |

### QA 4 Gates (판정 전용, 수정 금지)

1. **Spec Drift** — spec.md BDD 시나리오 ↔ 실제 테스트 it() 블록 1:1 대조
2. **Code Review** — 네이밍/구조/철학 일관성 (rules.md 기준, fresh eyes)
3. **Contract Compliance** — contract-checklist.md 독립 재검사
4. **Simplicity Assessment** — 불필요한 복잡성, 과잉 추상화 판정

### Pipeline Integration

```
개발 세션: /plan → /spec → /red → /green → /bind → /audit → /doubt → /verify
           → 🤖 QA agent (worktree)
              ├─ FAIL → 리포트 읽고 수정 → 재의뢰
              └─ ALL PASS → /retrospect → /archive
```

## Now

- [x] T1: `/qa` 스킬 SKILL.md 생성 — `.claude/skills/qa/SKILL.md` 4게이트 정의 ✅
- [x] T2: `/go` 파이프라인에 QA agent 단계 삽입 — #10~#14 재구성 + §QA Agent 섹션 ✅
- [x] T3: BOARD.md QA 상태 표기 규칙을 `/go` DoD에 추가 — DoD 표 3행 추가 ✅

## Done

(없음)
