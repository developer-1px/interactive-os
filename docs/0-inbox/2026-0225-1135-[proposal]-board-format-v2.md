# BOARD.md 포맷 고도화 제안

| 항목 | 내용 |
|------|------|
| **원문** | project에서 쓰이는 BOARD를 조금 더 표 형식으로 보기 좋게도 개선하고 싶은데 하나 샘플을 만들어 볼래. 기존의 BOARD 고도화 |
| **내가 추정한 의도** | BOARD.md의 정보 밀도를 높이고, 한눈에 프로젝트 상태를 파악할 수 있는 대시보드 형태로 진화시키고 싶다. |
| **날짜** | 2026-02-25 |

---

## 1. 개요

`/project` 워크플로우가 생성하는 BOARD.md의 표준 포맷을 개선한다. 현재는 자유 텍스트 + 체크박스 리스트가 혼재되어 있어, 프로젝트 간 일관성이 떨어지고 정보 검색이 어렵다.

## 2. 분석 — 현재 BOARD 5개 실태

### 2-1. 현행 포맷 (v1)

```markdown
# project-name

## Context
Claim: ...
Before → After: ...
Risks: ...

## Now
- [ ] T1: description

## Done
- [x] T1: description — tsc 0 | +N tests | build OK ✅

## Unresolved / Ideas
```

### 2-2. 실제 사용 편차

| 프로젝트 | Context 준수 | Done 증빙 | 섹션 일관성 | 특이사항 |
|----------|:---:|:---:|:---:|------|
| test-observability | ✅ | ✅ | ✅ | 깔끔한 표준 준수 |
| docs-section-nav | ✅ | ✅ | ✅ | Audit 링크 추가 |
| dev-pipeline | ✅ | ✅ | ⚠️ | Resources 섹션 자체 추가 |
| builder-v2 | ⚠️ blockquote | ✅ | ⚠️ | 118줄, sub-task 중첩 |
| normalized-collection | ❌ 없음 | ✅ | ❌ | Now/Done 중복, Context 누락 |

### 2-3. 발견된 문제

1. **Context가 자유 텍스트** → AI가 매번 다르게 작성, 누락 빈발
2. **Now/Done이 flat list** → 태스크 수가 늘면 스캔이 어려움 (builder-v2: 21개 태스크)
3. **증빙 형식 불일관** → `tsc 0 | +N tests` vs `GREEN ✅` vs 설명만
4. **Discussion 링크 위치 불일관** → Context에, Done 항목에, 별도 섹션에 혼재
5. **Resources/Backlog 섹션 유무 불일관**

## 3. 제안 — BOARD v2 포맷

### 3-1. 설계 원칙

| 원칙 | 적용 |
|------|------|
| **표로 강제** | 자유 텍스트 → 표. AI의 형식 편차를 구조로 제거 |
| **메타 → 본문 분리** | 프로젝트 메타정보를 상단 표로 집약 |
| **증빙 칼럼 강제** | Done에 Evidence 칼럼을 필수로 두어 빈 증빙 불가 |
| **링크 집중** | Discussion, Audit, PRD 등 관련 문서를 한 곳에 |

### 3-2. v2 템플릿

```markdown
# project-name

| 항목 | 내용 |
|------|------|
| **Claim** | [Discussion에서 도달한 결론 1문장] |
| **Before → After** | [핵심 변경 한눈에] |
| **Risks** | [Rebuttal에서 온 위험/단점] |
| **규모** | Light / Heavy |
| **Discussion** | `discussions/YYYY-MMDD-slug.md` |
| **Audit** | `notes/YYYY-MMDD-audit-slug.md` (있으면) |
| **PRD** | `prd.md` (Heavy만) |

## Now

| # | Task | Status | Blocked |
|---|------|--------|---------|
| T5 | 검증 — docs-section-nav T4~T8을 새 로깅 시스템 위에서 실증 | 🔲 | — |

## Done

| # | Task | Evidence | Date |
|---|------|----------|------|
| T4 | RUNBOOK — 앱 커맨드 headless 테스트 + dumpDiagnostics | tsc 0 · +3 tests · build OK | 02-25 |
| T3 | OS pipeline DEBUG/INFO logs | tsc 0 · +3 tests · build OK | 02-25 |
| T2 | createOsPage `dumpDiagnostics()` | +2 tests | 02-25 |
| T1 | kernel unhandled command WARN | +3 tests | 02-25 |

## Unresolved

| # | Question | Blocker? |
|---|----------|----------|
| U1 | logger DI vs 글로벌 싱글톤 | No |
| U2 | log level 설정: env 변수? kernel config? | No |

## Ideas

| Idea | Trigger |
|------|---------|
| Inspector에 실시간 로그 탭 | Inspector 프로젝트 완료 후 |
| scope chain 시각화 | — |
```

### 3-3. v1 → v2 변경점 요약

| 영역 | v1 | v2 |
|------|----|----|
| **Context** | 자유 텍스트 (Claim, Before→After, Risks) | **메타 표** (Claim + Before→After + Risks + 규모 + 링크) |
| **Now** | `- [ ] T1: desc` | **표** (# · Task · Status · Blocked) |
| **Done** | `- [x] T1: desc — evidence ✅` | **표** (# · Task · Evidence · Date) |
| **Unresolved** | `- 질문` | **표** (# · Question · Blocker?) |
| **Ideas** | `- 아이디어` | **표** (Idea · Trigger) |
| **Discussion 링크** | 산재 | **메타 표에 집중** |

### 3-4. 실제 적용 샘플 — test-observability

현재 `test-observability/BOARD.md` (33줄)을 v2로 변환한 모습:

```markdown
# test-observability

| 항목 | 내용 |
|------|------|
| **Claim** | OS 전체에 구조화된 debug 로깅을 의무 삽입하고, 테스트에서는 "Always Record, Print on Failure" 패턴으로 noise 없이 자동 진단한다 |
| **Before → After** | OS 대부분이 침묵, AI가 console.log 수동 삽입 → OS 파이프라인 9개 지점에서 DEBUG/INFO/WARN, 실패 시만 자동 dump |
| **Risks** | 과도한 로깅 = 성능 저하 + noise. Log level로 제어 |
| **Backing** | Go t.Log(), Playwright trace:retain-on-failure, pytest captured output |
| **규모** | Heavy |
| **Discussion** | `discussions/2026-0225-0804-test-diagnostics-gap.md` |
| **PRD** | `prd.md` |

## Now

| # | Task | Status | Blocked |
|---|------|--------|---------|
| T5 | 검증 — docs-section-nav T4~T8을 새 로깅 시스템 위에서 실증 | 🔲 | — |

## Done

| # | Task | Evidence | Date |
|---|------|----------|------|
| T4 | RUNBOOK — 앱 커맨드 headless 테스트 + dumpDiagnostics + 버그=/red 문서화 | ✅ | 02-25 |
| T3 | OS pipeline DEBUG/INFO logs (keybind, dispatch, focus) | +3 tests | 02-25 |
| T2 | createOsPage `dumpDiagnostics()` | +2 tests | 02-25 |
| T1 | kernel unhandled command WARN | +3 tests | 02-25 |

## Unresolved

| # | Question | Blocker? |
|---|----------|----------|
| U1 | logger DI vs 글로벌 싱글톤 | No |
| U2 | log level 설정: env 변수? kernel config? | No |

## Ideas

| Idea | Trigger |
|------|---------|
| Inspector에 실시간 로그 탭 | inspector 프로젝트 |
| scope chain 시각화 | — |
```

## 4. Cynefin 도메인 판정

🟢 **Clear** — BOARD.md는 프로젝트 템플릿이다. 표로 바꾸는 것은 구조 변경이지 의사결정이 아니다. Sense-Categorize-Respond.

## 5. 인식 한계

- 62개 BOARD 중 5개만 직접 확인. 나머지에 다른 패턴이 있을 수 있음.
- v2 포맷의 실제 사용 시 AI가 표를 얼마나 일관되게 생성하는지는 실사용으로 검증 필요.
- 매우 큰 프로젝트(builder-v2 118줄)에서 표 형식이 오히려 가독성을 해칠 가능성.

## 6. 열린 질문

1. **sub-task 표현**: builder-v2처럼 T19-1, T19-2 같은 하위 태스크를 표에서 어떻게 처리할 것인가? (들여쓰기? 별도 행?)
2. **기존 BOARD 마이그레이션**: 기존 12개 Active BOARD를 v2로 일괄 변환할 것인가, 새 프로젝트부터 적용할 것인가?
3. **v2 적용 시 `/project` 워크플로우의 BOARD 템플릿도 함께 갱신해야 한다.**

---

> **한줄요약**: BOARD.md를 자유 텍스트에서 전면 표 기반(메타 표 + Now/Done/Unresolved/Ideas 각각 테이블)으로 전환하면 AI 일관성 ↑, 정보 밀도 ↑, 증빙 누락 방지.
