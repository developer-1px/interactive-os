# /docs 디렉토리 구조·양식 감사 보고서

| 항목 | 내용 |
|------|------|
| **원문** | 너는 문서 정리 및 포맷 전문가야 /docs 내 폴더의 양식과 구조등에 대해서 전문가의 관점에서 분석하고 보고서를 작성해 |
| **내(AI)가 추정한 의도** | 문서가 빠르게 늘어나고 있으므로, 지금 시점에서 양식 일관성을 점검하고 표준화할 기회를 만들려 한다 |
| **날짜** | 2026-02-13 |

---

## 1. 개요

`docs/` 하위 **7개 폴더, ~250+ 파일**을 전수 조사하여, 폴더 체계·파일 네이밍·내부 양식·구조적 일관성을 평가했다.

---

## 2. 현재 구조 맵

```
docs/
├── 0-inbox/          ← 미분류 수신함 (4 files)
├── 1-project/        ← 프로젝트 단위 (10 subdirs, ~89 files)
├── 2-area/           ← 영구 관심사 (8 subdirs, ~54 files)
├── 3-resource/       ← 참조·리서치 (4 subdirs + 19 standalone, ~60 files)
├── 4-archive/        ← 아카이브 (year-nested, ~18 files)
├── 10-devnote/       ← 개발일지·TIL (7 files)
├── 11-discussions/   ← 소크라테스 토론 기록 (32 files)
└── MIGRATION_MAP.md  ← superseded 패턴 사전
```

### 평가: PARA 확장 체계

| 번호 | 폴더 | PARA 매핑 | 평가 |
|------|------|-----------|------|
| 0 | inbox | Inbox | ✅ 표준 |
| 1 | project | Projects | ✅ 표준 |
| 2 | area | Areas | ✅ 표준 |
| 3 | resource | Resources | ✅ 표준 |
| 4 | archive | Archives | ✅ 표준 |
| 10 | devnote | *(확장)* | ⚠️ PARA 밖. 번호 10은 의도적 간격? |
| 11 | discussions | *(확장)* | ⚠️ PARA 밖. 32개 파일이 가장 빠르게 증식 |

> **소견**: 0~4는 정통 PARA. 10~11은 "일지"와 "토론"이라는 **시간축 문서**로, PARA의 정적 분류와 직교한다. 번호 간격 `5~9`가 비어있어 확장 여지는 충분하나, **이 확장 규칙이 문서화되어 있지 않다.**

---

## 3. 네이밍 컨벤션 분석

프로젝트 전체에서 **5가지 이상의 네이밍 패턴**이 공존하고 있다.

### 3.1 패턴 목록

| # | 패턴 | 예시 | 사용 위치 |
|---|------|------|-----------|
| A | `YYYY-MMDD-HHmm-[type]-kebab-title.md` | `2026-0213-0044-[report]-project-status-audit.md` | 0-inbox, 일부 3-resource, 일부 10-devnote |
| B | `N-role.md` (번호-역할) | `0-discussion-journey.md`, `2-prd.md`, `5-status.md` | 1-project 내부 문서 |
| C | `N-ROLE.md` (대문자 역할) | `0-SPEC.md`, `1-PROPOSAL.md`, `2-STATUS.md` | 1-project/os-core-refactoring |
| D | `NN-kebab-name.md` (번호-제목) | `00-overview.md`, `03-api-reference.md` | 2-area, 3-resource 하위 |
| E | `ADR-NNN-Title.md` (ADR 시퀀스) | `ADR-001-Implementation_Verification.md` | 3-resource/kernel-adr |
| F | `YYYY-MM-DD_PascalTitle.md` | `2026-02-12_DevLog.md`, `2026-02-10_TIL.md` | 10-devnote (일부) |
| G | `YYYY-MMDD-HHmm_Discussion_*.md` | `2026-0213-0300_Discussion_Conclusion.md` | 11-discussions (신규) |
| H | `YYYY-MM-DD_PascalTitle_*.md` | `2026-02-12_OS_Structure_Conclusion.md` | 11-discussions (구) |

### 3.2 문제점

| 이슈 | 심각도 | 상세 |
|------|--------|------|
| **날짜 포맷 불일치** | 🔴 높음 | `2026-02-12` vs `2026-0212` vs `2026-0213-0300`. 하이픈 유무, 시분 포함 여부가 혼재 |
| **구분자 불일치** | 🟡 중간 | `_` (underscore) vs `-` (hyphen). devnote는 `_`, inbox는 `-` |
| **케이스 불일치** | 🟡 중간 | `PascalCase` (discussions 구), `kebab-case` (inbox), `UPPERCASE` (os-core-refactoring) |
| **역할 번호 불일치** | 🟡 중간 | `N-role.md` (소문자, define-app) vs `N-ROLE.md` (대문자, os-core-refactoring) |
| **[type] 태그 불일치** | 🟠 | inbox는 `[report]`, `[analysis]` 태그 사용. 일부 파일은 태그 없음 (`TODO.md`) |

---

## 4. 폴더별 내부 양식 분석

### 4.1 `0-inbox` — ✅ 우수

최근 생성 파일 3/4가 `/inbox` 워크플로우 표준을 충실히 따름:
- 메타 테이블 (원문, 의도, 날짜)
- 번호 섹션 (1. 개요 → 2. 분석 → 3. 결론 → 4. 해법 유형 → 5. 인식 한계 → 6. 열린 질문)
- 한줄요약

**예외**: `TODO.md`는 `/todo` 워크플로우 산출물로, inbox 양식과 다른 포맷.

### 4.2 `1-project` — ✅ 우수 (표준 확립됨, 일부 비준수)

**확립된 표준** (최신 프로젝트 `define-app`, `testbot`, `create-module`):
```
project-name/
├── 0-discussion-journey.md    ← WHY (여정)
├── 1-discussion-conclusion.md ← WHY (결론)
├── 2-prd.md                   ← WHAT (요구사항)
├── 3-kpi.md                   ← IF (측정)
├── 4-proposal.md              ← HOW (기술 제안)
├── 5-status.md                ← 진행 상황 추적
└── notes/                     ← 부속 분석·메모
```

> **WHY → WHAT → HOW → IF** 순서가 번호에 반영되어 있어 **의도적이고 읽기 좋은 설계**.

**비준수 프로젝트:**

| 프로젝트 | 패턴 | 차이점 |
|----------|------|--------|
| `os-core-refactoring` | `0-SPEC.md`, `1-PROPOSAL.md`, `2-STATUS.md`, `3-RETRO.md` | 대문자, 다른 역할 순서, discussion 없음 |
| `builder-focus-navigation` | `2-prd.md` ~ `5-status.md` | discussion 없음 (0, 1번 파일 부재) |
| `focus-recovery` | `1-analysis.md`, `2-prd.md` ... | discussion 대신 analysis |

> **소견**: `os-core-refactoring`은 가장 오래된 프로젝트로, 표준 확립 이전에 생성됨. `builder-focus-navigation`은 discussion 없이 시작됨. **마이그레이션 or 예외 허용** 결정 필요.

### 4.3 `2-area` — ✅ 양호

`NN-topic/` 패턴으로 통일. 내부 파일도 `NN-subtopic.md` 형태.

| 영역 | 파일 수 | 비고 |
|------|---------|------|
| 00-principles | 2 | 아키텍처 철학 |
| 01-command-pipeline | 4 | 커맨드 파이프라인 |
| 02-focus-navigation | 9 | 포커스 시스템 |
| 03-zift-primitives | 8 | ⚠️ `zift`는 deprecated 명칭 (`MIGRATION_MAP` 참조) |
| 04-aria | 4 | 접근성 |
| 05-kernel | 10 | 커널 공식 문서 (최신, 체계적) |
| 06-testing | 13 | 테스트 전략 |
| 07-code-standards | 4 | 코딩 표준 |

**이슈**: `03-zift-primitives`는 더 이상 사용하지 않는 `ZIFT` 명칭을 폴더명에 사용. `MIGRATION_MAP.md`에 따르면 현행 명칭은 `Interactive OS / Kernel`.

### 4.4 `3-resource` — 🟡 혼재

가장 이질적인 폴더. **3가지 서로 다른 구조**가 공존:

| 구조 | 예시 | 파일 수 |
|------|------|---------|
| 번호 접두사 디렉토리 | `00-guides/`, `01-focus-reference/`, `02-analysis-reports/` | ~14 |
| 번호 접두사 flat 파일 | `03-w3c-wai-aria-reference.md` ~ `13-browser-event-loop-timing.md` | 11 |
| inbox 스타일 timestamps | `2026-0212-1324-[report]-os-codebase-status.md` | 3 |
| 이름 only | `devtools-reference-catalog.md`, `workflow-manual.md` | 4 |
| ADR 서브폴더 | `kernel-adr/ADR-001-*.md` ~ `ADR-024-*.md` | 27 |

**이슈:**
- 번호 중복: `07-tanstack-router-mece.md`와 `07-typescript-refactoring-tools.md` (같은 번호)
- inbox 스타일 파일이 resource에 섞여 있음 (report → inbox에 가야 하지 않나?)
- ADR 27개가 resource 하위에 있으나, area(05-kernel)와 주제가 겹침

### 4.5 `4-archive` — ✅ 양호

`year/` → `project-name/` 계층 구조. 깔끔.

### 4.6 `10-devnote` — 🟡 혼재

3가지 포맷 공존:

| 포맷 | 예시 |
|------|------|
| `YYYY-MM-DD_DevLog.md` | `2026-02-12_DevLog.md` |
| `YYYY-MM-DD_TIL.md` | `2026-02-12_TIL.md` |
| `YYYY-MMDD-HHmm-[report]-*.md` | `2026-0212-2325-[report]-daily-changelog.md` |
| `YYYY-MMDD-HHmm-changelog.md` | `2026-0213-0100-changelog.md` |

**이슈**: DevLog/TIL은 `_` 구분자 + `PascalCase`, changelog는 inbox 스타일. 워크플로우 산출물마다 다른 네이밍.

### 4.7 `11-discussions` — 🟡 진화 중

32개 파일이 **Journey/Conclusion 쌍**으로 생성. 네이밍이 시간에 따라 진화:

| 시기 | 패턴 | 예시 |
|------|------|------|
| 초기 | `YYYY-MM-DD_Topic_*.md` | `2026-02-07_Stream_Inspector_Discussion.md` |
| 중기 | `YYYY-MM-DD_Topic_Conclusion.md` | `2026-02-12_OS_Structure_Conclusion.md` |
| 최신 | `YYYY-MMDD-HHmm_Discussion_*.md` | `2026-0213-0824_Discussion_Conclusion.md` |

> 최신 패턴으로 수렴 중이나, 20개 이상이 구 패턴.

---

## 5. 내부 양식(본문 포맷) 분석

### 5.1 양식별 템플릿 준수율

| 문서 유형 | 템플릿 존재 | 준수율 | 비고 |
|----------|------------|--------|------|
| Inbox 리포트 | ✅ (`/inbox` 워크플로우) | 90% | TODO.md만 예외 |
| Project 문서 | ✅ (암묵적 WHY→WHAT→HOW→IF) | 60% | 신규 프로젝트만 준수 |
| Discussion | ✅ (`/discussion` 워크플로우) | 100% | Why/Intent/Warrants 구조 통일 |
| DevLog | ✅ (`/daily` 워크플로우) | 70% | 이모지 기반 섹션 통일. changelog만 다름 |
| Area 문서 | ❌ (없음) | N/A | 자유 형식. 품질은 높으나 구조 비통일 |
| Resource 문서 | ❌ (없음) | N/A | 완전 자유 형식 |
| ADR | ⚠️ (일부 자체 규칙) | 50% | 초기 ADR은 자유형, 후기 ADR은 구조화 |

### 5.2 공통 내부 양식 품질

| 항목 | 평가 |
|------|------|
| **마크다운 문법** | ✅ 매우 우수. 표, 코드 블록, blockquote 적절 활용 |
| **한국어/혼용** | ✅ 일관. 제목·섹션명 한국어, 코드·기술용어 영문. 자연스러운 혼용 |
| **섹션 구분** | ✅ `---` 수평선으로 대섹션 구분. 가독성 좋음 |
| **상호 참조** | ⚠️ 있지만 비일관. 일부는 절대경로, 일부는 상대경로 링크 |
| **메타데이터** | ⚠️ Inbox는 메타 테이블. ADR은 blockquote. Area/Resource는 없음 |

---

## 6. 종합 진단 — 점수표

| 항목 | 점수 | 코멘트 |
|------|------|--------|
| **폴더 체계** | 8/10 | PARA 확장이 합리적. 10~11 번호규칙만 문서화 필요 |
| **네이밍 일관성** | 4/10 | 5가지+ 패턴 공존. 가장 큰 개선 여지 |
| **내부 양식 통일** | 6/10 | 워크플로우 산출물은 우수. 자유형 문서에 템플릿 없음 |
| **상호 참조** | 5/10 | 절대/상대 혼용. 링크 유효성 검증 없음 |
| **아카이브 관리** | 7/10 | MIGRATION_MAP + archive 브랜치 전략은 우수. 실행은 초기 |
| **검색 가능성** | 5/10 | timestamp 기반이라 내용 파악에 파일을 열어봐야 함. YAML frontmatter 없음 |

---

## 3. 결론 / 제안

### 즉시 실행 가능 (Low effort)

1. **`03-zift-primitives` → `03-os-primitives` 리네임** — deprecated 명칭 제거
2. **번호 중복 해결** — `3-resource/07-*.md` 두 파일 중 하나 리넘버링
3. **`3-resource` 내 inbox 스타일 파일 3개** → `0-inbox`로 이동 또는 번호 부여

### 표준화 제안 (Medium effort)

4. **날짜 포맷 단일화** → `YYYY-MMDD-HHmm` (이미 inbox/discussion 최신에서 사용 중)
5. **구분자 단일화** → `-` (hyphen). `_` 사용 중단
6. **YAML frontmatter 도입** — 최소 `title`, `date`, `type` 3개 필드. 검색 가능성 대폭 향상

```yaml
---
title: "createModule Usage 회고"
date: 2026-02-13
type: report
---
```

7. **`1-project` 내부 표준 문서화** — 현재 암묵적인 `0~5` 번호 규칙을 명시화. 구 프로젝트는 예외 허용(또는 점진적 정규화)

### 구조적 개선 (High effort)

8. **`3-resource/kernel-adr/` 위치 재검토** — `2-area/05-kernel/adr/`로 이동하면 kernel 관련 문서 일원화
9. **Area/Resource 문서 템플릿 작성** — 최소한 `# 제목`, `> 요약`, `---` 구분선 정도의 경량 템플릿
10. **`10-devnote`와 `11-discussions` 번호 규칙 문서화** — "5~9는 미래 시간축 문서 예약" 등

---

## 4. 해법 유형

🟡 **Constrained** — 네이밍 표준화는 업계 Best Practice가 명확하지만 (kebab-case, ISO 날짜 등), 기존 250+ 파일과의 호환 전략, 마이그레이션 범위, 도입 시점은 프로젝트 맥락에 따른 결정이 필요.

---

## 5. 인식 한계

- 이 분석은 **파일명·폴더 구조·본문 헤더 수준의 정적 분석**에 기반. 문서 내용의 정확성·최신성은 검증하지 않았다.
- `MIGRATION_MAP`과 실제 코드의 정합성(deprecated 패턴이 문서에 아직 남아있는지)은 별도 감사가 필요하다.
- YAML frontmatter 도입의 기술적 영향(docs-viewer, IDE 검색 등)은 확인하지 못했다.

---

## 6. 열린 질문

1. **`10-devnote`, `11-discussions`의 번호 규칙을 공식화할 것인가?** 5~9 예약 규칙이 있다면 문서화 필요.
2. **기존 파일 리네이밍을 일괄 수행할 것인가, 아니면 신규 파일부터만 적용할 것인가?** (250+ 파일 일괄 변환 vs 점진적 수렴)
3. **YAML frontmatter를 도입할 경우, docs-viewer에서 이를 활용할 것인가?** (파싱·검색·필터 기능)
4. **`3-resource/kernel-adr/`를 `2-area/05-kernel/`로 이동해도 되는가?** (ADR은 area인가, resource인가?)

---

**한줄요약**: PARA 기반 폴더 체계는 잘 설계되어 있으나, 5가지+ 네이밍 패턴이 공존하고 Area/Resource에 템플릿이 없어, 네이밍 단일화와 경량 frontmatter 도입이 가장 시급한 개선 포인트다.
