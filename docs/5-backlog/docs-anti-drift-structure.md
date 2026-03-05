# Docs Anti-Drift Structure

> 2026-03-06 | Origin: docs-freshness 프로젝트 회고

## 문제

docs-freshness에서 8개 WP를 실행하며 드러난 구조적 문제:

1. **같은 지식이 여러 곳에 존재** — ZoneState 구조가 SPEC.md, domain-glossary.md, MEMORY.md 3곳에. ZIFT 설명이 5곳에. 코드 변경 시 모든 곳을 갱신하는 것은 불가능.
2. **official vs knowledge 경계 불명확** — design-principles가 36개까지 성장했으나 official 반영 기준이 없었음.
3. **문서에 내부 경로 하드코딩** — `src/os/` 경로가 20건 이상. 패키지 재구조화 한 번에 전부 드리프트.
4. **드리프트 감지 메커니즘 부재** — 코드 변경 후 문서 동기화를 강제하는 구조 없음.

## 제안: 3가지 구조 원칙

### 원칙 1: 한 곳에만 쓰고, 나머지는 링크

**규칙**: 동일 지식이 2곳 이상에 기술되면 구조 결함.

**적용 대상**:

| 지식 | Canonical (SSOT) | 다른 곳에서는 |
|------|-----------------|-------------|
| State Shape | `OSState.ts` (코드) | SPEC.md에는 "Source: OSState.ts" 명시 + 요약만 |
| ZIFT 정의 | `zift-spec.md` | domain-glossary는 1줄 정의 + "상세: zift-spec.md" 링크 |
| Role Preset 테이블 | SPEC.md §7 | 코드(`roleRegistry.ts`)와 SPEC 둘 다 존재 — SPEC이 계약, 코드가 구현 |
| 파이프라인 구조 | `folder-structure.md` | 다른 문서에서 파이프라인 설명 시 링크 |

**새 knowledge 항목 작성 시 체크**: "이 내용이 이미 어디에 있는가?" → 있으면 링크, 없으면 한 곳에만.

### 원칙 2: 문서에 내부 경로를 쓰지 않는다

**규칙**: 문서에 `packages/os-core/src/4-command/navigate/` 같은 경로를 쓰지 않는다.

**대안**:

| Before (경로 하드코딩) | After (패키지명 + grep 힌트) |
|----------------------|---------------------------|
| `src/os/3-commands/` | `@os-core command layer` |
| `src/os/1-listen/KeyboardListener.tsx` | `@os-react의 KeyboardListener` (grep: `senseKeyboard`) |
| `src/os/6-components/6-project/Item.tsx` | `@os-react의 Item 컴포넌트` |

**예외**:
- `rules.md`의 참조 테이블 — 에이전트가 `view_file`로 직접 열어야 하므로 정확한 경로 필요. 단, `.agent/knowledge/` 경로만 (패키지 내부 경로 아님).
- BOARD.md, REPORT.md — 프로젝트 산출물이므로 구체적 경로 기록 OK (히스토리 성격).

### 원칙 3: 계약 문서 드리프트 감지 자동화

**규칙**: SPEC.md(계약)의 핵심 테이블이 코드와 일치하는지 `/audit`에서 검사한다.

**검사 항목**:

| 계약 | 코드 SSOT | 검사 방법 |
|------|----------|----------|
| SPEC §2 State Shape | `OSState.ts` ZoneState interface | 필드 목록 diff |
| SPEC §7 Role Preset Table | `roleRegistry.ts` ROLE_PRESETS | role 수 + 설정값 diff |
| SPEC §4 Effect Contract | `defineEffect` 호출 목록 | effect name 목록 diff |

**구현 방식**: `/audit` 워크플로우에 "§Docs Drift" 섹션 추가. grep으로 코드의 실제 값을 추출하고 SPEC 테이블과 대조.

## 실행 계획

| # | 내용 | 크기 | 의존 |
|---|------|------|------|
| T1 | `working-standards.md`에 원칙 1-2 추가 (규칙화) | S | 없음 |
| T2 | SPEC.md에 Source 주석 추가 ("Source: OSState.ts" 등) | S | 없음 |
| T3 | 잔존 내부 경로 제거 — official/os/*.md에서 패키지 내부 경로를 패키지명+grep 힌트로 교체 | M | T2 |
| T4 | `/audit` 워크플로우에 Docs Drift 검사 섹션 추가 | M | T1 |
| T5 | domain-glossary.md에서 ZIFT 상세 설명을 링크로 교체 (원칙 1 적용) | S | 없음 |

## 판단 기준

이 구조가 성공하면:
- 패키지 재구조화 시 문서 갱신 대상이 `rules.md` 참조 테이블 1곳뿐
- `/audit` 실행 시 SPEC ↔ 코드 드리프트가 자동 감지됨
- 같은 지식을 2곳에 쓰는 것이 규칙 위반으로 인식됨
