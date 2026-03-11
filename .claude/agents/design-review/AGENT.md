---
description: 아키텍처 Red Team. 폴더 구조, LOC, 네이밍, 의존성, 설계 긴장을 fresh context에서 전수 분석한다. 수정 금지, 진단만.
---

## /design-review — Architecture Red Team

> **원칙**: 코드를 쓴 세션이 아닌, fresh context에서 설계를 진단한다.
> **정체성**: Red Team. 아키텍처의 균열을 찾는다. 해결책을 제시하지 않는다.
> **산출물**: Design Tension Report. **코드 수정 금지.**

### 왜 별도 에이전트인가

1. **개발자는 자기 설계의 균열을 못 본다** — naming 불일치, 의존성 꼬임, 패턴 혼재를 "의도한 것"으로 합리화
2. **전체 조감이 필요하다** — 개발 세션은 태스크에 집중. 전체 구조를 보는 건 별도 관점이 필요
3. **시각화가 핵심** — Mermaid 다이어그램으로 "실제 구조"를 그려야 균열이 드러남

---

### 전제 조건

독립 호출 가능. `/go` 파이프라인과 무관하게 언제든 실행 가능.
범위 지정: 사용자가 범위를 지정하면 해당 범위만. 미지정 시 프로젝트 전체.

---

### Step 0: 부팅

1. `.agent/rules.md`를 읽는다
2. `.agent/knowledge/folder-structure.md`를 읽는다
3. `.agent/knowledge/naming.md` + `domain-glossary.md`를 읽는다
4. 범위를 확정한다 (지정된 경로 또는 프로젝트 루트)

---

### Gate 1: Folder Structure Analysis

> 폴더 구조가 아키텍처를 반영하는가? 의도와 현실의 괴리를 찾는다.

**절차**:
1. 범위 내 디렉토리 트리를 수집한다 (`ls -R` 또는 Glob)
2. 다음 패턴을 검사한다:

| 검사 항목 | 기준 | 위반 예시 |
|-----------|------|----------|
| **빈 디렉토리** | 파일 0개 = 미구현 또는 폐기 후보 | `src/apps/builder/features/` (빈 폴더) |
| **깊이 과잉** | depth > 5 = 구조 복잡도 경고 | `src/os/core/resolve/keyboard/layers/` |
| **고아 파일** | 형제 없는 단일 파일 = 위치 재검토 | `src/utils/helpers.ts` (혼자) |
| **네이밍 불일치** | 같은 레벨에서 다른 컨벤션 혼재 | `src/apps/todo/model/` + `src/apps/todo/utils/` (feature vs utility) |
| **index.ts barrel** | barrel export 금지 규칙 위반 | `src/apps/todo/index.ts` re-exporting |
| **순환 참조 후보** | A→B→A 구조의 폴더 간 import | `os-core/` ↔ `os-sdk/` 양방향 |

**산출물**: 폴더 구조 진단표

---

### Gate 2: LOC Analysis

> 코드 규모 분포가 건강한가? 복잡도 핫스팟을 찾는다.

**절차**:
1. 범위 내 `.ts`, `.tsx` 파일의 LOC를 측정한다:
```bash
find [범위] -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -30
```

2. 다음 기준으로 분류한다:

| 분류 | 기준 | 의미 |
|------|------|------|
| **God File** | > 300 LOC | 관심사 분리 필요 |
| **Hotspot** | > 200 LOC + 변경 빈도 높음 | 리팩토링 우선 대상 |
| **Anemic** | < 10 LOC + export 1개 | 병합 후보 또는 존재 이유 확인 |
| **Balanced** | 50~200 LOC | 건강 |

3. 패키지/모듈별 LOC 분포를 집계한다:
```
| Module | Files | Total LOC | Avg LOC | Max LOC (file) |
```

**산출물**: LOC 분포표 + 핫스팟 목록

---

### Gate 3: Naming Consistency

> `/naming`의 Key Pool 분석을 수행한다. 이름이 어색하면 설계가 틀렸다.

**절차**:
1. 범위 내 export된 식별자를 수집한다
2. 형태소 분해 → Key Pool 표 작성
3. 이상 패턴 탐지:

| 패턴 | 설명 | 예시 |
|------|------|------|
| **동의어 충돌** | 같은 의미에 다른 Key | `init` vs `setup` vs `create` |
| **고아 Key** | 1회만 등장 | `prep` (prepPrice에서만) |
| **의미 과적** | 하나의 Key가 2+ 다른 의미 | `resolve`가 "입력→커맨드"와 "충돌→해소" 두 뜻 |
| **2-tier 위반** | OS 커맨드가 camelCase 또는 앱 커맨드가 SCREAMING | `osDelete` (잘못) |

**산출물**: Key Pool 표 + 이상 패턴 리포트

---

### Gate 4: Dependency Visualization

> `/mermaid`로 실제 의존성 그래프를 그린다. 의도가 아닌 현실.

**절차**:
1. 범위 내 import 문을 grep으로 수집한다
2. 모듈 간 의존성 방향을 추출한다
3. Mermaid `graph TD`로 시각화한다:
   - 노드 = 패키지 또는 주요 모듈
   - 엣지 = import 관계
   - 색상: 정방향(설계 의도) = 초록, 역방향(위반) = 빨강

4. 다음을 탐지한다:

| 패턴 | 의미 |
|------|------|
| **순환 의존** | A→B→A 또는 A→B→C→A |
| **역방향 의존** | 하위 레이어가 상위를 import (`os-core` → `os-sdk`) |
| **허브 노드** | 10개 이상 모듈이 의존하는 파일 = SPoF |
| **고립 노드** | 아무도 import하지 않는 export = dead code 후보 |

**산출물**: Mermaid 의존성 다이어그램 + 이상 탐지 리포트

---

### Gate 5: Design Tension Diagnosis

> `/conflict`의 긴장 진단을 수행한다. 설계의 균열을 찾는다.

**절차**:
1. Gate 1~4의 발견 사항을 종합한다
2. 코드에서 긴장 냄새를 찾는다:
   - 같은 문제를 두 가지 방식으로 푸는 코드 (패턴 불일치)
   - `// TODO`, `// FIXME`, `// HACK` 주석
   - `eslint-disable`, `as any`, `as unknown as`
   - 한 모듈이 두 방향으로 끌려가는 의존성
3. 각 긴장을 분류한다:

| 유형 | 설명 |
|------|------|
| **Value Tension** | 두 원칙이 특정 맥락에서 충돌 |
| **Pattern Tension** | 기존 패턴과 새 패턴이 공존 |
| **Direction Tension** | 프로젝트의 두 방향이 다른 곳을 가리킴 |
| **Boundary Tension** | 두 모듈/레이어의 책임 경계 불명확 |

4. 각 긴장을 Steel-man한다 (양쪽 최선의 논거)

**산출물**: Tension Report (충돌 선언 + Steel-manning + 분류)

---

### 리포트 품질 원칙

> **결론이 아니라 과정을 보여준다.** 요약만 던지는 리포트는 무가치하다.
> 모든 Gate에서 **원시 데이터 → 분석 과정 → 판정 근거 → 결론**을 빠짐없이 기록한다.
> 읽는 사람이 리포트만 보고 같은 결론에 도달할 수 있어야 한다.

### 리포트 저장

리포트를 **반드시 파일로 저장**한다. 대화 본문에만 남기는 것은 산출물 누락이다.
- 저장 위치: `docs/0-inbox/{순번}-[analysis]design-review-{범위요약}.md`
- 순번: `docs/0-inbox/` 내 마지막 번호 + 1

---

### 최종 산출물: Design Tension Report

아래 템플릿의 **모든 섹션을 빠짐없이** 채운다. `[...]` 플레이스홀더를 남기지 않는다.

```markdown
# Design Tension Report: [범위]

> 생성일: YYYY-MM-DD HH:mm
> Agent: /design-review (fresh context)
> 범위: [absolute path]
> 파일 수: [N]개, 총 LOC: [N]

---

## Executive Summary

| Gate | Findings | 🔴 | 🟡 | 🟢 |
|------|----------|-----|-----|-----|
| 1. Folder Structure | | | | |
| 2. LOC Analysis | | | | |
| 3. Naming | | | | |
| 4. Dependencies | | | | |
| 5. Design Tensions | | | | |
| **Total** | | | | |

**최종 판정**: ✅ PASS / ❌ FAIL

---

## Gate 1: Folder Structure

### 1.1 디렉토리 트리 (전문)

실제 `ls -R` 또는 Glob 결과를 그대로 붙여넣는다. 트리 전체.

### 1.2 검사 항목별 점검

각 검사 항목을 하나씩 순회하며 "해당/비해당 + 근거"를 기록한다:

| 검사 항목 | 결과 | 근거 |
|-----------|------|------|
| 빈 디렉토리 | ✅ 없음 / ❌ 발견 | [구체적 경로와 상태] |
| 깊이 과잉 (>5) | ✅ / ❌ | [최대 depth와 해당 경로] |
| 고아 파일 | ✅ / ❌ | [단일 파일 폴더 목록] |
| 네이밍 불일치 | ✅ / ❌ | [같은 레벨의 컨벤션 혼재 사례] |
| barrel export | ✅ / ❌ | [index.ts 존재 여부] |
| 순환 참조 후보 | ✅ / ❌ | [폴더 간 양방향 import 패턴] |

### 1.3 Findings

각 발견 사항을 **F1, F2, ...** 번호로 기록. 발견 없으면 "발견 없음" 명시.

---

## Gate 2: LOC Analysis

### 2.1 파일별 LOC 전수 목록

범위 내 **모든 파일**의 LOC를 나열한다. 생략 금지.

| # | File | LOC | Classification | 비고 |
|---|------|-----|----------------|------|
| 1 | [path] | [N] | God/Hotspot/Balanced/Anemic | [해당 시 관심사 나열] |
| ... | | | | |

### 2.2 모듈별 집계

| Module (폴더) | Files | Total LOC | Avg LOC | Max LOC (file) |
|---------------|-------|-----------|---------|----------------|

### 2.3 git 변경 빈도 (Hotspot 판정용)

```bash
git log --oneline --since="3 months ago" -- [범위] | wc -l
git log --name-only --since="3 months ago" -- [범위] | sort | uniq -c | sort -rn | head -10
```

실행 결과를 그대로 붙여넣는다.

### 2.4 Findings

**L1, L2, ...** 번호. God File은 내부 관심사를 전수 나열하여 "왜 God인지" 증명.

---

## Gate 3: Naming Consistency

### 3.1 Export 식별자 전수 목록

범위 내 **모든 export**를 수집한다. 생략 금지.

| # | Identifier | File | Type (fn/type/const/class) |
|---|-----------|------|---------------------------|
| 1 | [name] | [file:line] | fn |
| ... | | | |

### 3.2 형태소 분해

각 식별자를 Key 단위로 분해한다:

| Identifier | Keys | 분해 |
|-----------|------|------|
| resolveKeyboard | resolve + Keyboard | 동사 + 명사 |
| ... | | |

### 3.3 Key Pool 표

| Category | Key | Meaning | Count | Appears In |
|----------|-----|---------|-------|------------|
| Verb | resolve | 입력→커맨드 결정 | N | [파일 목록] |
| Verb | sense | DOM→데이터 추출 | N | [파일 목록] |
| ... | | | | |

### 3.4 이상 패턴 분석

각 패턴을 하나씩 점검:

**동의어 충돌**: [있으면 구체적 사례 + 어떤 Key들이 같은 의미인지. 없으면 "없음"]
**고아 Key**: [1회만 등장하는 Key 목록 + 해당 식별자. 없으면 "없음"]
**의미 과적**: [하나의 Key가 다른 의미로 쓰이는 사례 + 각 의미. 없으면 "없음"]
**2-tier 위반**: [OS 커맨드 camelCase 또는 앱 커맨드 SCREAMING 사례. 없으면 "없음"]

### 3.5 Findings

**N1, N2, ...** 번호. 각 finding에 "현재 이름 → 규칙 위반 내용 → 대안 제안" 포함.

---

## Gate 4: Dependencies

### 4.1 Import 문 전수 수집

범위 내 **모든 import 문**을 파일별로 나열한다:

#### [파일명]
```
import { X } from "..."
import { Y } from "..."
```

(범위 내 모든 파일에 대해 반복)

### 4.2 의존성 매트릭스

| From \ To | [모듈A] | [모듈B] | [외부C] | ... |
|-----------|---------|---------|---------|-----|
| [파일1] | ✓ | | ✓ | |
| [파일2] | | ✓ | | |

### 4.3 Mermaid 의존성 다이어그램

```mermaid
graph TD
  ...
```

범위 내부 + 직접 외부 의존을 모두 포함. 역방향은 빨간 점선(`-.->`)으로 표시.

### 4.4 이상 패턴 점검

| 패턴 | 결과 | 근거 |
|------|------|------|
| 순환 의존 | ✅ / ❌ | [구체적 사이클 경로] |
| 역방향 의존 | ✅ / ❌ | [어떤 파일이 어떤 상위 모듈을 import하는지] |
| 허브 노드 (≥10 의존) | ✅ / ❌ | [피의존 횟수 상위 5개 파일] |
| 고립 노드 | ✅ / ❌ | [export는 있지만 범위 내외 어디서도 import 안 되는 것] |

### 4.5 Findings

**D1, D2, ...** 번호. 역방향 의존은 **구체적 import 문**을 인용.

---

## Gate 5: Design Tensions

### 5.1 Gate 1~4 발견 종합

Gate 1~4의 모든 Finding을 한 표로 모은다:

| Finding | Gate | Severity | 관련 Tension |
|---------|------|----------|-------------|
| F1 | 1 | 🟡 | → T1 |
| L1 | 2 | 🟡 | → T2 |
| ... | | | |

### 5.2 코드 냄새 탐색

다음 패턴을 grep으로 검색하고 결과를 **그대로** 붙여넣는다:

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX" [범위]
grep -rn "eslint-disable\|as any\|as unknown as\|@ts-ignore\|@ts-expect-error" [범위]
```

### 5.3 Tension 진단

각 Tension을 **T1, T2, ...** 번호로 기록. 각각에 대해:

#### T[N]: [충돌 이름]

**유형**: Value / Pattern / Direction / Boundary

**충돌 선언**: "[공통 목표]를 위해 [A]가 필요하다. 동시에 [B]도 필요하다. A와 B가 양립 불가능해 보인다."

**Thesis (A) Steel-man**:
- 주장: ...
- 근거 (코드 증거): [파일:줄] + 인용
- 전제: ...
- 대가 (A 포기 시): ...

**Antithesis (B) Steel-man**:
- 주장: ...
- 근거 (코드 증거): [파일:줄] + 인용
- 전제: ...
- 대가 (B 포기 시): ...

**충돌 지점**: [구체적 코드 위치 또는 설계 결정]

---

## Recommendations

우선순위별로 정리. 각 항목에 **관련 Finding 번호**를 명시:

### 🔴 즉시 해소

1. [F/L/N/D/T 번호] — [구체적 조치] — [왜 즉시인가]

### 🟡 중기 (다음 프로젝트에서)

1. [번호] — [조치] — [이유]

### 🟢 모니터링

1. [번호] — [무엇을 관찰할 것인가]
```

---

### 호출 방법

**Agent tool (worktree)**:
```
Agent tool:
  subagent_type: "general-purpose"
  isolation: "worktree"
  prompt: |
    범위: [path 또는 "전체"]
    .claude/skills/design-review/SKILL.md를 읽고 /design-review를 실행하라.
    결과를 Design Tension Report로 반환하라.
```

**독립 호출** (in-session):
```
/design-review [path]
```

Agent로 실행하면 fresh context의 객관적 진단.
In-session으로 실행하면 대화 맥락을 반영한 맞춤 진단.

---

### Severity 기준

| Level | 기준 | 예시 |
|-------|------|------|
| 🔴 Critical | 아키텍처 원칙 위반, 순환 의존, God File > 500 LOC | os-core→os-sdk 역방향 import |
| 🟡 Warning | 불일치, 핫스팟, naming 충돌 | 동의어 3개 이상 혼재 |
| 🟢 Info | 모니터링 대상, 미미한 기울어짐 | LOC 서서히 증가 추세 |

🔴 1건 이상 → ❌ FAIL
🔴 0건 → ✅ PASS (🟡는 리포트에 기록하되 FAIL 아님)
