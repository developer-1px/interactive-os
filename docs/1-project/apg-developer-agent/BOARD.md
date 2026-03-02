# apg-developer-agent

> **규모**: Meta
> **Phase**: Scaffold

## Context

Claim: **Claude Code 커스텀 에이전트(`.claude/agents/apg-developer.md`)로 "Interactive OS 네이티브 APG 패턴 개발자"를 만들어, 사전학습 패턴(useState/onClick)과의 충돌을 구조적으로 제거한다.**

Before → After:
- Before: 범용 Claude 세션이 APG 패턴 개발 → 핸들러 작성, 기존 OS 기능 재구현 마찰
- After: 전용 에이전트가 OS 세계관을 기본값으로 가지고 전 사이클(스펙→테스트→구현→검증) 수행

Backing: Curriculum Learning (Bengio 2009), Pit of Success (Rico Mariani)

Risks:
- R1. 서브에이전트는 다른 서브에이전트를 호출 불가 — 모든 단계를 자체 컨텍스트에서 수행
- R2. 시스템 프롬프트만으로 사전학습 패턴을 완전히 억제할 수 있는지는 POC로 검증 필요

## Now

- [x] T1: `.claude/agents/` 디렉토리 생성 + `apg-developer.md` 에이전트 정의 파일 작성 — `.claude/agents/apg-developer.md` 생성 완료 ✅
- [x] T2: POC 실행 — Switch 패턴 개발. useState 0 | onClick 0 | onKeyDown 0 | +12 tests | 999 total | tsc 0 | OS gap 5건 자율 수정 ✅

## Done
- [x] T1 — `.claude/agents/apg-developer.md` 생성 ✅
- [x] T2 — Switch POC. useState 0 | onClick 0 | +12 tests | 999 total | tsc 0 | OS gap 5건 자율 수정 ✅

## Unresolved

- OG1. ~~에이전트 시스템 프롬프트에 "OS capability index"를 얼마나 상세하게 넣어야 충분한가?~~ → POC에서 Accordion 전문 + API 가이드 수준으로 충분했음. **Resolved.**
- OG2. ~~어떤 APG 패턴을 첫 POC 대상으로 선택할 것인가?~~ → Switch로 실행. **Resolved.**
- OG3. (NEW) `.claude/agents/` 커스텀 에이전트가 Task 도구의 subagent_type으로 직접 사용 불가 — general-purpose + 프롬프트 주입으로 우회. Claude Code 업데이트 시 재확인 필요.
- OG4. (NEW) 에이전트가 OS 내부 파일(roleRegistry, resolveItemKey, check, select, compute)을 수정했는데, 이것이 의도된 범위인지 — OS 프로젝트에서는 정당하지만, 외부 사용자 에이전트라면 제한 필요.

## Ideas

- Hook(PreToolUse)으로 useState/onClick 작성 시 자동 차단하는 가드레일 추가
- 성공 시 에이전트를 Plugin으로 패키징하여 배포
- APG 외 일반 앱 개발 에이전트로 확장
