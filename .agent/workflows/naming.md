---
description: 새 모듈·커맨드·API 표면을 구현하기 전 식별자를 설계할 때 사용. 형태소 분해 Key Pool 테이블로 동의어 충돌과 고아 키를 탐지한다.
---

## /naming — 이름 먼저

> Ubiquitous Language (Eric Evans, DDD).
> 이름이 맞으면 구조가 맞다. 이름이 어색하면 설계가 틀렸다.
> 리프.

### 시점

`/go` 보편 사이클 Step 8. /blueprint 후, /tdd 전에 실행.

### Knowledge

이름을 지을 때 반드시 이 두 파일을 읽는다:

- `.agent/knowledge/naming.md` — **동사 Dictionary** + 접미사 Dictionary + 충돌 검사 체크리스트
- `.agent/knowledge/domain-glossary.md` — **도메인 개념 정의** (ZIFT, Zone, Item, Cursor 등)

### 범위 지정

사용자가 명시한 파일·모듈·feature 경로만 대상으로 한다. 전체 소스 스캔 금지.
예: `src/os-core/resolve/`, `src/apps/todo/commands/`

### 절차

1. **범위 내 식별자 수집** — 대상 파일들에서 export된 함수명, 타입명, 상수명, 커맨드명을 전수 추출한다.
2. **형태소 분해** — 각 식별자를 camelCase/PascalCase/SNAKE_CASE 경계에서 Key 단위로 쪼갠다.
   - `prepPrice` → `prep` + `Price`
   - `resolveKeyboard` → `resolve` + `Keyboard`
   - `OS_ZONE_INIT` → `OS` + `ZONE` + `INIT`
3. **Key Pool 표 작성** — 분해된 Key를 다음 범주로 분류하여 MECE 표를 만든다:

   | Category | Key | Meaning | Appears In |
   |----------|-----|---------|------------|
   | Prefix | OS_ | OS 커맨드 네임스페이스 | OS_FOCUS, OS_SELECT |
   | Verb | resolve | 입력→커맨드 결정 | resolveKey, resolveMouse |
   | Verb | compute | 상태→속성 투영 | computeItem, computeZone |
   | Noun | Zone | ZIFT 영역 단위 | zoneId, createZone |
   | Suffix | -Config | 설정 타입 | CheckConfig, AxisConfig |
   | Suffix | -Attrs | DOM 속성 객체 | ItemAttrs, ZoneAttrs |

4. **일관성 점검** — Key Pool에서 이상 패턴을 찾는다:
   - **동의어 충돌**: 같은 의미에 다른 Key (`init` vs `setup` vs `create`)
   - **고아 Key**: 1회만 등장하는 Key — 오타이거나 통합 대상
   - **의미 과적**: 하나의 Key가 2개 이상의 다른 의미로 사용됨
5. **신규 이름 설계** — 새로 추가할 개념이 있다면 Key Pool에서 조합하여 후보를 만든다.
   - 기존 Key 조합 우선. 새 Key 도입은 명시적으로 근거를 남긴다.
6. **확정** — 사용자와 합의. Key Pool 표 + 신규 이름을 BOARD.md 또는 PRD에 기록.
7. **문서화** — 산출물을 반드시 파일로 저장한다. 대화 본문에만 남기는 것은 산출물 누락이다.
   - 저장 위치: `/inbox` 라우팅 규칙을 따른다. (프로젝트 진행 중이면 `notes/`, 아니면 `0-inbox/`)
   - 파일명: `YYYY-MMDD-HHmm-[analysis]-naming-{범위요약}.md`
   - 최소 포함: Key Pool 표 + 이상 패턴 리포트
   - ⛔ 이 단계를 건너뛰는 것은 금지. `/naming`의 가치는 분석 자체가 아니라 **기록으로 남는 것**이다.

### 산출물

1. **Key Pool 표** — 범위 내 모든 식별자의 형태소 분해 + MECE 분류
2. **이상 패턴 리포트** — 동의어 충돌, 고아 Key, 의미 과적 목록
3. **신규 Glossary** (해당 시) — 새로 도입하는 이름과 선택 근거
4. **저장된 파일** — 위 1~3을 포함하는 markdown 문서 (Step 7)
