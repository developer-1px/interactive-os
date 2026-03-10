---
last-reviewed: 2026-03-11
---

# AI Coding Agent Observability — 에이전트가 뭘 했는지 자동으로 아는 법

> 훅 기반 자동 로깅으로 "이 세션에서 뭘 건드렸고 왜 건드렸는지"를 토큰 0으로 추적한다.

## 왜 이 주제인가

Interactive OS 프로젝트는 `/status`, `/archive`, `BOARD.md` 같은 docs 워크플로우로 작업 이력을 관리한다. 이 방식은 의미 있는 요약을 만들지만, **매번 AI가 파일을 읽고 쓰며 토큰을 소비**한다. "에이전트가 어떤 파일을 건드렸는지"는 기계적으로 수집 가능한 데이터인데, 왜 AI가 직접 해야 하는가?

이 문서는 **Claude Code 밖에서, 토큰 0으로, 자동으로** 작업 이력을 수집하는 방법을 정리한다.

## Background / Context

### 문제의 본질: Agent Observability

AI 코딩 에이전트의 행동을 추적하는 것은 업계 전반의 관심사다. OpenTelemetry는 2025년부터 [GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)을 정의하고 있고, Langfuse, LangSmith, Arize 같은 전용 플랫폼이 20개 이상 존재한다.

하지만 이들은 대부분 **API 호출 수준의 관찰**(토큰 사용량, 응답 시간, 프롬프트 버전)에 초점을 맞춘다. 우리가 원하는 것은 더 구체적이다:

> **"이 세션에서 어떤 파일을 읽고, 어떤 파일을 수정하고, 어떤 파일을 만들었는가?"**

이것은 **도구 호출 수준(tool-level)의 관찰**이며, Claude Code의 훅 시스템이 정확히 이 계층을 지원한다.

### 왜 훅인가?

Claude Code의 아키텍처에서 훅은 특별한 위치에 있다:

```
사용자 프롬프트 → Claude 추론(토큰 소비) → 도구 호출 → [Hook 실행(토큰 0)] → 결과 반환
```

훅은 **Claude의 컨텍스트 윈도우 밖에서 실행**되는 shell script/HTTP 요청이다. 즉:
- Claude의 토큰을 전혀 소비하지 않는다
- 매 도구 호출마다 보장된(deterministic) 실행 — CLAUDE.md 지시와 달리 100% 발동
- stdin으로 `tool_name`, `tool_input`, `session_id` 등 구조화된 데이터를 받는다


## Core Concept

### 1. Claude Code Hook 시스템 — PostToolUse

`PostToolUse` 이벤트는 도구 실행 완료 후 발동된다. stdin으로 받는 JSON:

```json
{
  "session_id": "abc123",
  "hook_event_name": "PostToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/Users/user/Desktop/interactive-os/src/apps/todo/app.ts",
    "old_string": "...",
    "new_string": "..."
  },
  "cwd": "/Users/user/Desktop/interactive-os",
  "timestamp": "2026-03-11T07:53:00Z"
}
```

이 데이터로 할 수 있는 것:
- **파일 접근 로그**: Read/Edit/Write의 `file_path` 추출
- **명령 실행 로그**: Bash의 `command` 추출
- **검색 패턴 로그**: Grep/Glob의 `pattern` 추출
- **세션별 그룹핑**: `session_id`로 작업 단위 묶기

### 2. JSONL 로그 포맷 (Boucle session-log)

[Boucle 프레임워크](https://dev.to/boucle2026/how-to-see-everything-claude-code-does-audit-trail-hook-1g9j)가 제안하는 포맷:

```jsonl
{"ts":"2026-03-11T07:53:00Z","session":"abc123","tool":"Read","detail":"/src/apps/todo/app.ts","cwd":"/project"}
{"ts":"2026-03-11T07:53:01Z","session":"abc123","tool":"Edit","detail":"/src/apps/todo/app.ts","cwd":"/project"}
{"ts":"2026-03-11T07:53:05Z","session":"abc123","tool":"Write","detail":"/docs/0-inbox/28-diagram.md","cwd":"/project"}
{"ts":"2026-03-11T07:53:10Z","session":"abc123","tool":"Bash","detail":"npm run typecheck","cwd":"/project"}
```

저장 위치: `~/.claude/session-logs/YYYY-MM-DD.jsonl` (일별 파일)

### 3. Gryph — 본격적인 에이전트 감사 도구

[Gryph](https://safedep.io/gryph-ai-agent-audit-trail/)는 이 문제를 전문적으로 푸는 오픈소스 도구다:

```bash
brew install safedep/tap/gryph
gryph install --agent claude-code
```

특징:
- **로컬 SQLite DB** — 클라우드 전송 없음, 프라이버시 보장
- **Claude Code, Cursor, Gemini CLI** 등 멀티 에이전트 지원
- **자동 민감 파일 감지** — `.env`, `*.pem`, `.ssh/` 접근 시 플래그
- **세션 리플레이** — `gryph session <id> --show-diff`로 전체 세션 재현
- **파일 diff 보기** — `gryph diff <event-id>`로 변경 내용 확인
- **JSONL 내보내기** — OpenSearch/Splunk 연동 가능

```bash
# 최근 활동 보기
gryph logs

# 특정 패턴 필터링
gryph query --action write --path "src/apps/**"

# 세션 상세 (diff 포함)
gryph session abc123 --show-diff
```

### 4. OpenTelemetry GenAI Semantic Conventions

업계 표준으로 수렴 중인 [OTEL GenAI 스펙](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/)의 핵심 속성:

| 속성 | 설명 |
|------|------|
| `gen_ai.operation.name` | `invoke_agent`, `execute_tool` 등 |
| `gen_ai.agent.name` | 에이전트 이름 |
| `gen_ai.conversation.id` | 세션/대화 ID |
| `gen_ai.tool.definitions` | 사용 가능한 도구 목록 |

아직 실험 단계(experimental)지만, **도구 호출을 span으로 기록하는 패턴**은 이미 표준화 방향이 잡혔다.


## Usage

### 최소 구현: 5줄 훅 스크립트

```bash
#!/bin/bash
# .claude/hooks/audit-log.sh
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name')
DETAIL=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.command // .tool_input.pattern // "—"')
SESSION=$(echo "$INPUT" | jq -r '.session_id')
echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"session\":\"$SESSION\",\"tool\":\"$TOOL\",\"detail\":\"$DETAIL\"}" >> ~/.claude/session-logs/$(date +%Y-%m-%d).jsonl
```

### settings.json 설정

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Read|Edit|Write|Bash|Glob|Grep",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/audit-log.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### 로그 활용

```bash
# 실시간 모니터링
tail -f ~/.claude/session-logs/2026-03-11.jsonl | jq .

# 특정 세션의 수정 파일만 추출
jq -r 'select(.tool == "Edit" or .tool == "Write") | .detail' ~/.claude/session-logs/2026-03-11.jsonl | sort -u

# 세션별 요약
jq -r '[.session, .tool, .detail] | @tsv' ~/.claude/session-logs/2026-03-11.jsonl | sort | uniq -c | sort -rn
```

### "왜"까지 알고 싶다면: git log 교차

```bash
# 세션의 파일 변경 + 커밋 메시지를 합쳐 보기
SESSION="abc123"
FILES=$(jq -r "select(.session==\"$SESSION\" and (.tool==\"Edit\" or .tool==\"Write\")) | .detail" ~/.claude/session-logs/2026-03-11.jsonl | sort -u)
for f in $FILES; do
  echo "--- $f ---"
  git log --oneline -3 -- "$f"
done
```


## Best Practice + Anti-Pattern

### Do

- **matcher를 좁게 설정** — `Read|Edit|Write|Bash`면 충분. `*`로 모든 도구를 잡으면 Agent 호출까지 로깅되어 노이즈가 많아짐
- **timeout을 짧게** — 로깅은 5초면 충분. 길면 Claude의 응답이 느려짐
- **jq 의존성 확인** — macOS는 `brew install jq`로 설치. 없으면 훅이 조용히 실패
- **일별 파일 분할** — 단일 파일이 커지면 `tail -f` 성능 저하. YYYY-MM-DD.jsonl이 적절
- **git log와 교차** — 훅 로그는 "뭘 건드렸는지", git commit은 "왜 건드렸는지". 둘을 합치면 완전한 audit trail

### Don't

- **tool_input 전체를 로깅하지 말 것** — `old_string`/`new_string`까지 넣으면 로그가 거대해짐. `file_path`만으로 충분
- **동기적으로 무거운 작업 하지 말 것** — PostToolUse에서 HTTP 호출이나 DB 쓰기를 하면 매 도구 호출이 느려짐
- **AI에게 로그를 읽히지 말 것** — 목적이 "토큰 절약"인데 로그를 다시 AI에게 먹이면 본말전도. 로그는 사람이 읽거나, 별도 스크립트로 가공


## 흥미로운 이야기들

### "Audit trail은 불신이 아니라 엔지니어링 규율이다"

Gryph 팀의 철학이 인상적이다. 그들은 에이전트 감사를 보안/규제 관점이 아니라 **개발 품질** 관점에서 접근한다:

> "Audit trails reflect engineering discipline, not distrust."

에이전트가 새벽 3시에 CI에서 자동 실행됐을 때, "뭘 했는지" 모르면 문제가 생겨도 진단할 수 없다. 이것은 `git log`를 쓰는 것과 같은 맥락이다.

### CLAUDE.md vs Hook — Advisory vs Deterministic

Claude Code 생태계에서 재미있는 이분법이 있다:

| | CLAUDE.md | Hook |
|---|---|---|
| 실행 보장 | Advisory (LLM이 무시할 수 있음) | Deterministic (100% 실행) |
| 토큰 비용 | 매 턴 컨텍스트에 주입 | 0 |
| 유연성 | 자연어로 복잡한 판단 가능 | if/else 수준의 단순 로직 |

"로깅"처럼 **판단이 필요 없는 기계적 작업**은 Hook이 압도적으로 유리하다. "커밋 메시지를 잘 쓰세요"처럼 **판단이 필요한 작업**은 CLAUDE.md가 적합하다.

### Trail of Bits의 접근

보안 연구 기업 [Trail of Bits](https://github.com/trailofbits/claude-code-config)는 Claude Code 설정을 오픈소스로 공유하면서, PreToolUse로 위험한 명령을 차단하고 PostToolUse로 모든 Bash 명령을 감사 로깅하는 패턴을 보여준다. "차단 + 기록"의 조합이 실전에서 검증된 패턴이다.

### 표준의 수렴: OpenTelemetry GenAI

2025년부터 OpenTelemetry가 GenAI 에이전트용 semantic conventions를 정의하기 시작했다. `gen_ai.operation.name = "execute_tool"` 같은 속성으로 도구 호출을 span으로 기록하는 표준이다. 아직 experimental이지만, Datadog, Honeycomb 등 주요 관찰 플랫폼이 이미 지원을 시작했다. 향후 Claude Code의 로그를 OTEL 포맷으로 내보내면 기존 모니터링 인프라와 통합할 수 있는 길이 열린다.


## 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|--------|------|
| Claude Code Hooks 공식 문서 | 훅 시스템의 정확한 동작 이해 | [Hooks Guide](https://code.claude.com/docs/en/hooks-guide), [Hooks Reference](https://code.claude.com/docs/en/hooks) | 초급 | 30분 |
| Gryph 설치 및 실습 | 즉시 사용 가능한 완성형 도구 체험 | [Gryph 소개](https://safedep.io/gryph-ai-agent-audit-trail/) | 초급 | 1시간 |
| Boucle session-log | 최소 구현 참고용 | [DEV Community 글](https://dev.to/boucle2026/how-to-see-everything-claude-code-does-audit-trail-hook-1g9j) | 초급 | 15분 |
| Trail of Bits claude-code-config | 보안 관점의 훅 구성 참고 | [GitHub](https://github.com/trailofbits/claude-code-config) | 중급 | 30분 |
| OTEL GenAI Semantic Conventions | 표준화 방향 파악 | [OTEL Spec](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) | 중급 | 1시간 |
| Langfuse (오픈소스) | 자체 호스팅 가능한 관찰 플랫폼 | [Langfuse Docs](https://langfuse.com/docs/observability/overview) | 고급 | 3시간 |
