# naming-convention

## Why

에이전트가 새 파일/폴더를 만들 때 **제로 추론**으로 이름을 결정할 수 있어야 한다.
현재 프로젝트는 유기적으로 성장하면서 폴더 단수/복수, 뷰 계층 어휘 등이 혼재되어 있다.
"표준이 있으면 발명하지 않는다"(Rule #7) 원칙에 따라, 검증된 체계(FSD, PARA)의 어휘를 채택하고 프로젝트 고유 영역만 명시한다.

## Goals

1. **`rules.md`에 네이밍 컨벤션 섹션 추가** — 파일 케이스 + 폴더 규칙 + 구조 어휘
2. **기존 불일치 교정** — 단수→복수 폴더명, snake_case 실수, CSS 케이스 통일
3. **inbox 클리어** — 감사 보고서를 프로젝트로 흡수

## Scope

### In
- `rules.md` 네이밍 섹션 작성
- 폴더 리네이밍 (`schema/` → `schemas/`, `middleware/` → `middlewares/`, `registry/` → `registries/`)
- `features/todo_details/` → `features/todo-details/`
- `codeTheme.css` → `code-theme.css`
- 관련 import path 전부 수정

### Out
- 파일명 변경 (PascalCase/camelCase 기존 패턴은 이미 일관)
- dot.notation 확대 논의 (동결 — 필요 시 별도 discussion)
- FSD 전면 재구조화 (별도 프로젝트)
