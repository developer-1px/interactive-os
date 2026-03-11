# Naming Analysis: docs/1-project/ 구조 재편

> 작성일: 2026-03-11
> 범위: `docs/1-project/` 전체 (domain / epic / project 이름)

---

## Key Pool 표

| Category | Key | Meaning | Appears In |
|----------|-----|---------|------------|
| Namespace | `os` | OS 시스템 | `os-core` domain, `ban-os-from-tsx`, `os-migration` |
| Namespace | `apg` | ARIA Patterns Gallery | `apg` domain, `apg-suite` |
| Namespace | `sdk` | OS SDK 패키지 | `sdk-role-factory` |
| Noun | `core` | 핵심 | `os-core` |
| Noun | `builder` | 빌더 앱 | `builder` domain, `builder-v2`, `builder-v3` |
| Noun | `testing` | 테스트 | `testing` domain |
| Noun | `docs` | 문서 | `docs` domain, `docs-viewer` |
| Noun | `page` | Page API | `headless-page` |
| Noun | `role` | ZIFT Role | `sdk-role-factory` |
| Noun | `condition` | 조건 | `condition-auto-disabled` |
| Noun | `devtool` | 개발도구 | `devtool-split` |
| Noun | `viewer` | 뷰어 | `docs-viewer` |
| Noun | `suite` | 테스트 스위트 | `apg-suite` |
| Noun | `agent` | AI 에이전트 | `agent-recent` |
| Verb | `ban` | 금지 | `ban-os-from-tsx` |
| Verb | `split` | 분리 | `devtool-split` |
| Verb | `replay` | 재생 | `replay` |
| Adjective | `headless` | DOM 없는 | `headless-page`, `headless-simulator` |
| Adjective | `disabled` | 비활성 | `condition-auto-disabled` |
| Adjective | `recent` | 최근 | `agent-recent` |
| Modifier | `auto` | 자동 | `condition-auto-disabled` |
| Suffix | `factory` | 팩토리 | `sdk-role-factory` |
| Suffix | `simulator` | 시뮬레이터 | `headless-simulator` |
| Suffix | `observability` | 관찰 가능성 | `test-observability` |
| Suffix | `cleanup` | 정리 | `archive-cleanup` |
| Suffix | `migration` | 마이그레이션 | `os-migration` |
| Version | `v2`, `v3` | 버전 번호 | `builder-v2`, `builder-v3` |

---

## 이상 패턴 리포트

### A. 네이밍 계층 불일치 (Critical)

1. **`os-core` domain = `packages/os-core/` 패키지 동음이의**
   - domain은 kernel + os-core + os-sdk + os-react 4개 패키지를 아우르는 범주
   - 그런데 그중 하나의 패키지와 이름이 같아 혼동

2. **epic에 버전 번호 (`builder-v2`, `builder-v3`)**
   - v2 규칙: "epic = 확정된 컨셉, 바뀌지 않음"
   - 버전은 project의 관심사이지 epic의 관심사가 아님

3. **`docs` domain의 이중성**
   - 메타 관리 범주 + 실제 앱(`docs-viewer`)이 혼재
   - docs-viewer는 `src/apps/`에 있는 앱인데 메타 domain에 분류됨

### B. 동의어 충돌

| Key 1 | Key 2 | 판정 |
|-------|-------|------|
| `testing` (domain) | `test` (`test-observability`) | 같은 의미, 형태 불일치 |
| `headless` (epic) | `simulator` (project) | simulator가 headless의 구현체인데 이름으로 분리 |

### C. 의미 과적

| Key | 의미 1 | 의미 2 |
|-----|--------|--------|
| `os` | namespace (os-core domain) | target (ban-os-from-tsx) |
| `docs` | domain (문서 관리 범주) | app (docs-viewer 앱) — **강한 충돌** |

### D. 고아 Key (1회만 등장)

`cleanup`, `observability`, `migration`, `simulator`, `recent` — 각 1회. 프로젝트 완료/stale 상태.

### E. 구조 규칙 위반

| 위반 | 사례 |
|------|------|
| epic 없는 project | os-core/ 아래 3개 모두 depth 2에 바로 BOARD |
| project 없는 epic | headless-page epic에 headless-simulator 1개만 |
| domain ↔ 패키지 동음이의 | `os-core` domain = `packages/os-core/` |
| 앱이 메타 domain에 | `docs-viewer`(앱) → `docs`(메타) domain |

---

## 근본 문제 3가지

1. **`os-core` domain 이름이 패키지와 충돌** — 상위 범주와 하위 패키지가 같은 이름
2. **epic에 버전 번호** — epic 규칙 위반. 버전은 project 레벨
3. **`docs` domain의 이중성** — 메타 관리 + 실제 앱 혼재. 분류 기준 불일치
