# Anthropic Skills 포맷 마이그레이션 검토

> 작성일: 2026-03-09
> 태그: analysis
> 우선순위: P2

## 문제 / 동기

Anthropic이 Claude Code의 commands → skills로 진화시킴.
Skills는 디렉토리 기반 구조(`SKILL.md` + `scripts/` + `resources/`)로,
자동 감지(Claude가 상황에 맞는 스킬을 자동 로드)를 지원함.

현재 우리의 `.agent/workflows/` + `.agent/knowledge/` 구조는
이미 skills 수준의 기능을 하고 있지만, Anthropic 공식 포맷과 호환은 안 됨.

## 현재 상태

- `.agent/workflows/*.md` — 46개 워크플로우 (flat 파일)
- `.agent/knowledge/*.md` — 도메인 지식 (별도 디렉토리)
- `.claude/skills/*/SKILL.md` — Claude용 수동 동기화 복사본 (skills 포맷)
- 자동 감지 없음 — 사용자가 `/name`으로 수동 호출

## 기대 상태

- Anthropic Skills 포맷 호환 여부 + 자동 감지 기능 활용 가능성 평가
- 마이그레이션 비용 대비 이득 판단
- 특히 **자동 감지**(frontmatter 기반)가 어떤 워크플로우에 유용한지 구체적 평가

## 접근 방향

1. Anthropic Skills 공식 문서 심층 조사
2. 현재 워크플로우 중 자동 감지가 유효한 것 선별 (예: `/why`, `_middleware`)
3. 프로토타입: 1~2개 워크플로우만 Skills 포맷으로 전환해보기

## 관련 항목

- `/research` 조사 결과 (2026-03-09): Claude custom commands 생태계 조사
- `_middleware.md` — 이미 유사한 자동 적용 패턴
