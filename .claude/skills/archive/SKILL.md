---
description: 프로젝트 완료 시 지식을 2-area/official 및 rules로 환류하고, 잔여 산출물은 4-archive/연도/월/주차로 매장한다.
---

## /archive — 프로젝트 완료 & 지식 환류

> **목적**: 프로젝트 완료 시 지식을 소멸시키지 않고 살아있는 문서(2-area/official, rules)로 환류한다.
> **원칙**: 단순 이동 금지. 지식을 추출한 후 잔여물만 매장한다.

### 문서 토폴로지

```
살아있는 문서 (덮어쓰기, 지형 기반):
  2-area/official/   ← 공식 지식의 인지 지도 (소스코드 토폴로지와 동형)
  .agent/rules.md    ← 헌법 (강제 노출, 매 세션 읽힘)

성숙 중인 문서 (인큐베이터):
  2-area/            ← official로 아직 졸업 못 한 것 (meta, cross-cutting)

죽은 문서 (매장, 분류 없음):
  4-archive/YYYY/MM/WNN/ ← 연도/월/주차로 자동 매장
```

### Why

**살아있는 문서**는 소스코드 토폴로지에 기반하여 안 늙는다 (2-area/official/, rules.md).
**죽은 문서**는 시점에 바인딩되어 노화한다 — 분류할 필요 없이 시간순으로 매장한다.

`/archive`의 역할: **프로젝트의 지식을 2-area/official 및 rules로 추출 → 나머지는 4-archive/주차에 매장.**

### 프로세스

#### 0. `/retrospect` 필수 게이트

⛔ **회고 없이 아카이브 금지.** `/retrospect`를 먼저 실행하여 KPT(Keep/Problem/Try)를 기록한다.
이미 이 세션에서 `/retrospect`를 실행했으면 skip.

#### 1. 프로젝트 식별

대상 프로젝트의 `BOARD.md`를 읽어 완료 상태를 확인한다.

```
📋 Archive 대상: [project-name]
📁 위치: docs/1-project/[project-name]/
```

#### 2. 소스코드 모듈 매핑

이 프로젝트가 건드린 소스코드 모듈을 식별한다:

```bash
# 프로젝트 기간의 git log에서 변경된 소스 모듈 추출
git log --name-only --pretty=format: -- src/ packages/ | sort -u | head -20
```

매핑 결과 예시:
```
소스 모듈              →  대응 Area
src/os/3-commands/     →  2-area/20-os/21-commands/
packages/kernel/       →  2-area/10-kernel/
src/os/schemas/focus/  →  2-area/20-os/22-focus/
```

#### 3. 지식 분배 (핵심)

**v2 프로젝트 (BOARD.md + spec.md + discussions/ 구조)**:

판단 0 로직 — 개별 파일 검토 불필요:

| 대상 | 행선지 | 이유 |
|------|--------|------|
| `discussions/` 전체 | `4-archive/YYYY/MM/WNN/[project]/discussions/` | "안 간 길" 보존 |
| `spec.md` | `4-archive/YYYY/MM/WNN/[project]/spec.md` | "진실의 원천" 보존 |
| `BOARD.md` Context 테이블 | `4-archive/YYYY/MM/WNN/[project]/BOARD.md` | "프로젝트 1장" 보존 (Context 테이블만) |
| 나머지 전부 | 🗑️ 삭제 | 코드가 말하는 것은 보존 불필요 |

그 후, 지식 환류를 수행한다:

**a) official 갱신 (살아있는 문서)**
- 프로젝트에서 확정된 스펙/동작이 있으면 → `2-area/official/` 해당 섹션 **덮어쓰기**
- 새 원칙이 발견됐으면 → `.agent/rules.md`에 추가
  - ⚠️ **Abstraction Gate**: 구체적 구현(변수명, 커맨드명)이 아닌 **판단 기준/원칙**으로 추상화.
    LLM이 이미 아는 전문 용어로 대체한다. "다른 프로젝트에서도 통하는가?" 테스트.
- 핵심: official은 **개념 단위**로 존재, 날짜 없음, 코드 토폴로지와 동형

**b) Product 에스컬레이션 (검증된 프로덕트 지식) — 필수**
- 프로젝트가 `6-products/` 내 Product에 귀속되는지 확인
- 귀속되면, 다음을 **반드시** Product 폴더에 환류:

  **b-1) BDD 시나리오 누적 (진실의 원천) — 최우선**
  - PRD의 BDD 시나리오를 `6-products/[name]/spec/`에 **누적 병합**
  - 기존 spec 파일이 있으면 시나리오를 **추가** (덮어쓰기 아님)
  - 이 시나리오가 테스트의 정당성과 코드의 정확성을 판단하는 유일한 기준
  - 형식: Gherkin (Given/When/Then) 또는 동등한 BDD 포맷

  **b-2) 디자인 결정**
  - 검증된 UI/UX 결정과 근거 → `6-products/[name]/design/`

  **b-3) VISION 갱신**
  - Now/Next/Later 로드맵 현행화

- 핵심: **추측이 아닌 검증된 결정만** 에스컬레이션. 코드로 구현되고 테스트를 통과한 것만.
- **BDD 시나리오 누적이 없는 에스컬레이션은 불완전하다.** 동작 정의가 없으면 다음 프로젝트에서 또 흔들린다.

**c) Area 잔류 (인큐베이터)**
- 아직 official로 졸업시킬 만큼 성숙하지 않은 지식
- cross-cutting standards, 미확정 설계 등

**v1 프로젝트 (기존 BOARD + spec + discussions/ + notes/ 구조)**:

기존 v1 프로젝트는 4갈래 라우팅으로 개별 파일 검토:

| 판단 기준 | 행선지 | 예시 |
|-----------|--------|------|
| **시점 독립 원칙/스펙** | `2-area/official/` 갱신 또는 `rules.md` 추가 | 커맨드 동작 스펙, 아키텍처 원칙 |
| **Product에 귀속되는 검증된 결정** | `6-products/[name]/` 에스컬레이션 | 기능 스펙, 디자인 결정, 인터랙션 정의 |
| **아직 성숙 안 된 지식** | `2-area/` 잔류 (인큐베이터) | 초기 설계, 미확정 패턴 |
| **그 외 전부** | `4-archive/YYYY/MM/WNN/` 매장 | BOARD, discussions, 보고서, 분석 |

#### 4. Area 동기화 검증

분배 후, 변경된 Area 문서가 현재 소스코드와 일치하는지 검증:

- Area 문서에서 언급하는 파일/함수가 실제로 존재하는가?
- 삭제되거나 이름이 바뀐 것은 없는가?
- 새로 추가된 주요 개념이 Area에 반영됐는가?

#### 5. STATUS.md 갱신

- `/status` 실행으로 대시보드 자동 갱신. STATUS.md를 직접 편집하지 않는다.
- 프로젝트 폴더가 `docs/1-project/`에서 사라지면 `/status`가 자동 반영한다.

#### 6. 보고

```
📊 Archive Report: [project-name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📘 official 갱신: N개
   - 2-area/official/os/SPEC.md (갱신)
   - .agent/rules.md (원칙 추가)
📝 Area 잔류: N개
   - 2-area/80-cross-cutting/... (인큐베이터)
📦 Archive 매장: N개
   - 4-archive/YYYY/MM/WNN/ (주차별 flat)
```

### `/para`와의 관계

`/para` 워크플로우의 Step 3 "Project Review"에서 완료된 프로젝트를 발견하면,
**직접 mv하지 않고 `/archive`를 호출**한다.

### `/retire`와의 차이

| | `/archive` | `/retire` |
|---|---|---|
| **대상** | 완료된 **프로젝트** | superseded된 **문서** |
| **핵심 동작** | 지식 분배 후 잔여물 아카이브 | AI 컨텍스트에서 제거 |
| **Area 영향** | ✅ Area 갱신 | ❌ Area 무관 |
| **트리거** | 프로젝트 완료 시 | 문서가 outdated 판정 시 |
