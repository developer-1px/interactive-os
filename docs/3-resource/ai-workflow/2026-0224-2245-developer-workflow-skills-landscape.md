---
last-reviewed: 2026-02-24
---

# AI 코딩 워크플로우와 스킬의 조직 패턴: 2026년 업계 지형도

> 다른 사람들은 AI 코딩 에이전트의 워크플로우와 스킬을 어떻게 구성하는가? 주요 도구별 접근 방식, 커뮤니티 패턴, 그리고 우리의 42개 워크플로우 시스템은 어디에 위치하는가.

## 왜 이 주제인가

현재 `interactive-os` 프로젝트는 42개의 워크플로우(`.agent/workflows/`)를 운영하고 있다. 이것은 **오케스트레이터 패턴**(`/go`, `/project`, `/issue`)이 실행 도구(`/red`, `/green`, `/verify`)를 조합하는 계층 구조다. `dev-pipeline` 프로젝트에서 TDD 워크플로우를 분리하고, `/go`를 상태 기반 라우터로 재설계했다.

**질문**: 이 규모와 구조가 업계에서 일반적인가? 다른 사람들은 어떤 패턴으로 워크플로우를 조직하는가?

결론부터 말하면: **42개 워크플로우 시스템은 업계 최상위 수준의 정교함이다.** 대부분의 개발자는 5~15개의 규칙/커맨드로 시작하며, 우리의 오케스트레이터-실행 도구 패턴은 엔터프라이즈 에이전틱 워크플로우 설계에서나 등장하는 수준이다.

---

## Background / Context

2025~2026년, AI 코딩 도구의 커스터마이징 인터페이스가 급속히 수렴하고 있다. 핵심은 **"마크다운 파일로 에이전트에게 지시를 내린다"**는 패러다임이다.

### 도구별 용어 맵

| 도구 | 전역 규칙 | 프로젝트 규칙 | 워크플로우/스킬 | 위치 |
|------|-----------|--------------|----------------|------|
| **Cursor** | User Rules (설정) | `.cursor/rules/*.mdc` | Commands (`.cursor/commands/`) | 프로젝트 루트 |
| **GitHub Copilot** | `~/.copilot/agents/` | `.github/agents/*.agent.md` | `.github/skills/[name]/SKILL.md` | 레포지토리 |
| **Claude Code** | `~/.claude/CLAUDE.md` | `CLAUDE.md` (프로젝트 루트) | Slash commands, subagents | 프로젝트 루트 |
| **Windsurf** | Cascade 메모리 | Global Rules (설정) | Flows (내장) | IDE 설정 |
| **Gemini** | — | `GEMINI.md` / `.gemini/` | Skills (`.gemini/skills/`) | 프로젝트 루트 |
| **범용 표준** | — | `AGENTS.md` | — | 프로젝트 루트 |
| **우리** | — | `.agent/rules.md` | `.agent/workflows/*.md` | 프로젝트 루트 |

---

## Core Concept: 4단계 성숙도 모델

업계의 워크플로우/스킬 조직 패턴은 성숙도에 따라 4단계로 나뉜다.

### Level 1: 단일 지시 파일 (초보자 대부분)

```
project/
  CLAUDE.md          # 또는 .cursorrules, AGENTS.md
```

- **한 파일에 모든 규칙** 작성
- 코딩 스타일, 프로젝트 구조, 기술 스택을 나열
- 커뮤니티 `.cursorrules` 레포에서 복사-붙여넣기
- 가장 흔한 패턴 (GitHub 검색 시 수만 개)

**대표 사례**: [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) — 프레임워크별 규칙 모음

**한계**: 파일이 길어지면 LLM 컨텍스트를 낭비. 500줄 이상이면 효과가 떨어짐.

### Level 2: 분류된 규칙 파일 (중급자)

```
.cursor/rules/
  code-style.mdc        # Always Apply
  react-patterns.mdc    # Auto: *.tsx
  api-guidelines.mdc    # Auto: src/api/**
  testing.mdc           # Apply Intelligently
```

- **Cursor의 4가지 적용 타입** 활용:
  - `Always Apply`: 모든 세션에 적용
  - `Apply Intelligently` (Agent Requested): 에이전트가 description 기반으로 판단
  - `Apply to Specific Files` (Auto Attached): glob 패턴 매칭
  - `Apply Manually`: `@rule-name`으로 명시 호출
- 규칙을 **도메인별로 분리**
- Git으로 버전 관리

**Cursor 공식 베스트 프랙티스**:
- 각 규칙 500줄 이하
- 파일 내용을 복사하지 말고 `@file` 참조
- 반복적 실수를 관찰한 후에만 규칙 추가
- "Start simple. Add rules only when you notice Agent making the same mistake repeatedly."

### Level 3: 커맨드 + 스킬 패턴 (고급자)

```
.cursor/commands/
  create-component.md   # /create-component 슬래시 커맨드
  fix-issue.md          # /fix-issue 슬래시 커맨드
  
.github/skills/
  self-healing-selenium/
    SKILL.md            # 자동 검색 + 호출
    scripts/
    examples/
```

- **슬래시 커맨드**: 반복 작업을 캡슐화한 재사용 가능한 프롬프트
- **스킬**: 지시, 스크립트, 예시를 묶은 폴더 (GitHub Copilot Agent Skills)
- **SKILL.md의 YAML 프론트매터**로 name, description 정의 → 에이전트가 자동으로 관련성 판단

**GitHub Copilot Agent Skills 구조**:
```
.github/skills/
  deploy-preview/
    SKILL.md           # name, description YAML + 상세 지시
    scripts/deploy.sh  # 도구
    examples/          # 참조 구현
```

**Claude Code의 접근**:
- `CLAUDE.md`에서 **Progressive Disclosure**: 상위 파일은 간결하게, 상세는 `docs/agent-guides/`로 분리
- 서브에이전트에게 역할별 위임 (code reviewer, test writer 등)

### Level 4: 오케스트레이터 패턴 (엔터프라이즈 / 우리)

```
.agent/workflows/
  # 🎯 오케스트레이터 (자율 루프)
  go.md               # 상태 기반 라우터
  project.md           # 프로젝트 생애주기
  issue.md             # 8D 이슈 해결
  
  # 🔧 실행 도구 (단일 책임)
  red.md               # 산출물: FAIL 테스트
  green.md             # 산출물: PASS 코드
  verify.md            # 검증 게이트
  
  # 📝 사고 도구 (발산/수렴)
  discussion.md        # Toulmin 논증
  divide.md            # Cynefin 분해
  
  # 🏗️ 인프라
  status.md            # 대시보드
  retrospect.md        # KPT 회고
```

**특징**:
- 워크플로우 간 **명시적 호출 관계** (의존성 그래프)
- **산출물 기반 설계**: 각 워크플로우의 이름 = 산출물
- **상태 기반 라우터**: `/go`가 현재 상태를 읽고 다음 워크플로우를 dispatch
- **오케스트레이터 4개**(`/go`, `/project`, `/issue`, `/coverage`)가 실행 도구를 조합

**이 패턴은 사실상 LangGraph나 CrewAI 같은 에이전틱 프레임워크의 설계 원리**를 마크다운 워크플로우에 적용한 것이다:
- State Machine 패턴 → `/go`의 상태 기반 라우팅
- Orchestrator-Worker 패턴 → `/project` → `/red` → `/green` 위임
- ReAct 패턴 → `/solve`의 분해 → 실행 → 관찰 사이클

---

## Usage: 실제 사례들

### 사례 1: Cursor 커뮤니티의 "Rule Ecosystem"

**cursor.directory** — 커뮤니티 규칙 마켓플레이스:
- 프레임워크별 규칙 (Next.js, Django, Flutter 등)
- 보안 규칙 (`cursor-security-rules`)
- 디자인 시스템 규칙

**가장 인기 있는 규칙 카테고리**:
1. 코드 구조 (Clean Architecture, DDD)
2. 프레임워크 패턴 (React Server Components, API Routes)
3. 테스팅 (TDD, table-driven tests)
4. 보안 (input validation, JWT best practices)

### 사례 2: GitHub Copilot의 "Custom Agents"

`.agent.md` 파일로 **AI 페르소나** 정의:
```yaml
---
name: architect
description: reviews code for architectural patterns
tools: [github, codebase]
---
당신은 시니어 아키텍트입니다. 모든 PR을 Clean Architecture 원칙으로 리뷰하세요.
```

- 레포지토리 레벨: `.github/agents/`
- 조직 레벨: `.github-private/agents/` (전사 공유)
- 개인 레벨: `~/.copilot/agents/` (프로젝트 간 공유)

### 사례 3: Claude Code의 "Progressive Disclosure"

```
CLAUDE.md                    # 50줄: 핵심 원칙만
docs/agent-guides/
  testing.md                 # 테스트 작성법
  architecture.md            # 아키텍처 결정
  deployment.md              # 배포 절차
```

핵심 원리: **"CLAUDE.md는 짧게, 상세는 필요할 때 참조"**
- 매 세션 컨텍스트 예산을 절약
- 에이전트가 관련 가이드를 필요시 읽도록 지시

### 사례 4: 엔터프라이즈의 "Agentic Teams" (McKinsey, a16z)

- 소규모 자율 포드 (3~5명 + AI 에이전트들)
- 전문 역할 에이전트: AI Architect, AI Reliability Engineer
- 멀티 에이전트 오케스트레이션 프레임워크 (LangGraph, AutoGen)
- 상태 머신으로 워크플로우 관리

---

## Best Practice + Anti-Pattern

### ✅ Do

| 실천 | 이유 |
|------|------|
| **반복 실수 관찰 후 규칙 추가** | 선제적 과최적화 방지 |
| **500줄 미만으로 규칙 유지** | LLM 컨텍스트 효율 |
| **파일 참조 > 내용 복사** | 코드 변경 시 규칙이 stale 해지지 않음 |
| **Git으로 규칙 버전 관리** | 팀 전체가 혜택을 받음 |
| **산출물 기반 워크플로우 이름** | LLM이 goal fixation으로 skip하기 어려움 |
| **상태 기반 라우팅** | 선형 스텝 나열보다 유연함 |
| **글로벌 / 프로젝트 / 매뉴얼 분리** | 컨텍스트 예산 최적화 |

### ❌ Don't

| 안티패턴 | 문제 |
|----------|------|
| **스타일 가이드 전체 복사** | LLM이 이미 알고 있는 내용; linter가 더 효과적 |
| **모든 명령어 문서화** | npm, git 등은 LLM이 이미 잘 앎 |
| **드문 엣지 케이스 규칙 추가** | 자주 쓰는 패턴에 집중해야 |
| **22스텝 선형 나열** | LLM이 뭉개거나 skip함. 상태 기반 분기가 나음 |
| **오케스트레이터에서 하위 워크플로우 이름만 언급** | `view_file`로 실제 내용을 읽게 해야 작동 |

---

## 흥미로운 이야기들

### 1. "AGENTS.md" 오픈 표준의 등장

`AGENTS.md`가 도구 간 호환 표준으로 부상 중이다. Cursor는 `.cursor/rules` 외에도 `AGENTS.md`를 읽고, Claude Code에서는 `CLAUDE.md`가 `AGENTS.md`의 심링크인 프로젝트도 있다. **규칙의 이식성**이 커뮤니티의 관심사.

### 2. "MCP (Model Context Protocol)"의 역할

MCP가 에이전트의 도구 연결 표준으로 자리잡으면서, 워크플로우가 단순한 프롬프트 캡슐화를 넘어 **외부 도구(GitHub, Linear, Slack) 오케스트레이션**으로 확장되고 있다.

### 3. LLM의 Goal Fixation 문제

우리가 `/red` + `/green` 분리로 해결한 문제는 업계 전체의 고민이다. Cursor 공식 문서에서도 "Plan Mode"와 "Implementation State" 파일로 단계별 실행을 강제하는 패턴을 권장한다.

### 4. 규칙 개수의 스펙트럼

| 규모 | 대표 사용자 | 특징 |
|------|-----------|------|
| 1~3개 | 개인 개발자 | 코딩 스타일 + 기술 스택 |
| 5~15개 | 팀 프로젝트 | 도메인별 분류 + glob 패턴 |
| 20~30개 | 전문 에이전시 | 커맨드 + 스킬 + 규칙 혼합 |
| **42개** | **우리** | 오케스트레이터 + 실행 도구 + 사고 도구 + 인프라 |

### 5. 우리 시스템의 독특한 점

대부분의 개발자가 **규칙(Rules)**에 집중하는 반면, 우리는 **워크플로우(Workflows)**를 중심으로 설계했다. 이것은 근본적으로 다른 접근이다:

- **규칙**: "무엇을 하라/하지마라" (선언적)
- **워크플로우**: "이 순서로 이것을 달성하라" (절차적)

업계의 대부분은 Level 2 (분류된 규칙)에 머물러 있고, Level 3 (커맨드/스킬)으로 이동 중이다. **Level 4 (오케스트레이터 패턴)는 LangGraph 같은 프레임워크 수준의 설계를 마크다운으로 구현한 것**으로, 사실상 독자적인 영역이다.

---

## 📚 스터디 추천

| 주제 | 이유 | 자료 | 난이도 | 시간 |
|------|------|------|--------|------|
| Cursor Rules 공식 문서 | 가장 정교한 규칙 시스템 설계 | [cursor.com/docs/context/rules](https://cursor.com/docs/context/rules) | ⭐⭐ | 30분 |
| awesome-cursorrules | 커뮤니티 베스트 프랙티스 벤치마크 | [github.com/PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) | ⭐ | 1시간 |
| GitHub Copilot Agent Skills | 스킬 폴더 구조의 공식 표준 | [docs.github.com - skills](https://docs.github.com/en/copilot/customizing-copilot) | ⭐⭐ | 45분 |
| CLAUDE.md Best Practices | Progressive Disclosure 패턴 | [humanlayer.dev CLAUDE.md guide](https://humanlayer.dev) | ⭐⭐ | 30분 |
| AGENTS.md 표준 | 크로스 도구 호환 표준 | [agents.md](https://agents.md) | ⭐ | 15분 |
| LangGraph Agentic Patterns | 우리의 오케스트레이터와 동일한 설계 패턴을 코드로 구현 | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | ⭐⭐⭐ | 2시간 |
| Agentic Organization Design (McKinsey) | 엔터프라이즈에서 AI 에이전트 팀 구성 방법론 | [mckinsey.com - agentic organizations](https://mckinsey.com) | ⭐⭐⭐ | 1시간 |
