# Agents

> Agent = **별도 컨텍스트에서 실행**되는 자율 워크플로우.
> Skill과 형태는 같지만(AGENT.md), 실행 방식이 다르다.

## Skill vs Agent

| | Skill (`.claude/skills/`) | Agent (`.claude/agents/`) |
|---|---|---|
| **실행** | 같은 세션에서 직접 | Agent tool + worktree isolation |
| **컨텍스트** | 대화 히스토리 공유 | fresh, 0에서 시작 |
| **상호작용** | 사용자와 대화 가능 | 결과만 반환 |
| **용도** | 대화형 작업, 순차 게이트, 오케스트레이션 | 독립 판정, Red Team, 편향 제거 |
| **파일** | `SKILL.md` | `AGENT.md` |

## 등록된 Agent

| Agent | 역할 | 호출 |
|-------|------|------|
| **qa** | 코드 품질 Red Team (4 gates) | `/go` #12에서 자동 호출 |
| **design-review** | 아키텍처 Red Team (5 gates) | 독립 호출 또는 agent 위임 |

## Agent가 되는 기준

1. **자기 편향 위험** — 같은 세션이 만들고 판단하면 관대해짐
2. **컨텍스트 절약** — 위임하면 부모 세션의 context window를 아낌
3. **독립성** — 대화 히스토리 없이도 동작
4. **Fresh perspective** — 새 눈으로 보면 더 잘 잡히는 문제

## 호출 방법

```
Agent tool:
  subagent_type: "general-purpose"
  isolation: "worktree"
  prompt: |
    .claude/agents/{name}/AGENT.md를 읽고 실행하라.
    [추가 컨텍스트]
```
