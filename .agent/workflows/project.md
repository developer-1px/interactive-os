---
description: Discussion 결론을 전략 컨테이너(BOARD.md Context)로 전환한다. Task Map은 /plan이 담당.
---

## /project — 전략 컨테이너

> **분류**: 행선지. `/discussion` 종료 후 프로젝트를 만든다.
> **책임**: Context(왜, 무엇을) + Scaffold. **전술(어떻게, 얼마나)은 `/plan`이 담당.**
> **진입점**: `/discussion` 종료 → "새 프로젝트" 판정 시 자동 전환.

### 라우팅

```
/project
  ├─ discussion 미완료 → /discussion 진입 → 완료 후 /project 재진입
  └─ discussion 완료 → 규모 판정 → scaffold → /go Phase 1(숙지) 자동 진입
```

### 초기화

0. **Discussion 판정** — 미완료 시 `/discussion` 진입. 완료 후 재진입.
1. **규모 판정** — Heavy / Light / Meta 결정.
2. **문서 수집** — `docs/0-inbox/`, `docs/5-backlog/`, `docs/4-archive/` 탐색 → `discussions/`로 이동.
3. **Scaffold** — `docs/1-project/[domain]/[name]/` 표준 구조 생성. 도메인은 코드 패키지 기준 (os-core, testing, builder, inspector, apg 등).
4. **등록** — `/status` 실행으로 대시보드 자동 갱신. STATUS.md를 직접 편집하지 않는다.
5. **BOARD.md** — Discussion Conclusion(Toulmin)을 Context 테이블에 매핑하여 작성:

   | Toulmin (Discussion) | → | BOARD 테이블 Key |
   |---------------------|---|-----------------|
   | 🎯 Claim | → | `Claim` |
   | 📊 Data + 🔗 Warrant | → | `Before` + `After` |
   | ⚡ Rebuttal | → | `Risk` |
   | ⚖️ Qualifier | → | `Size` |
   | ❓ Open Gap | → | `Unresolved` 테이블 |

   Heavy는 상세 설계를 `spec.md`에 위임.

6. **스토리 선택** (stories.md가 있는 경우) — BOARD.md의 Tasks에 관련 US-ID를 매핑한다.

   > **`/project`는 scaffold까지만 한다. Red 테스트는 `/go`가 라우팅한다.**
   > BOARD.md + spec.md 준비가 끝나면 `/go` 진입.

### BOARD.md 표준 포맷 (v2 — 테이블 기반)

```markdown
# project-name

| Key | Value |
|-----|-------|
| Claim | [Discussion에서 도달한 결론] |
| Before | [변경 전 상태] |
| After | [변경 후 상태] |
| Size | Heavy / Light / Meta |
| Risk | [Rebuttal에서 온 위험/단점] |

## Tasks

| # | Task | AC | Status | Evidence |
|---|------|----|--------|----------|
<!-- /plan이 Task Map으로 채운다. /project는 비워둔다. -->

## Unresolved

| # | Question | Impact |
|---|----------|--------|
```

> **`/project`는 Context 테이블 + Unresolved만 작성한다.**
> **Tasks는 `/plan`이 Task Map으로 채운다.**
> **테이블 형식이 pit of success** — 빈 셀이 보이면 채워야 한다는 시각적 강제력.

**DoD (Definition of Done)**: Tasks의 Evidence 열에 반드시 증빙을 포함한다.
증빙 없이 `✅`만 찍는 것은 금지.

**프로젝트 초기화 DoD**:
- Heavy / Light: BOARD.md 존재. `/go` 진입 시 G2(spec)→G3(red) 순서로 자동 라우팅.
- Meta: BOARD.md만으로 `/go` 진입 가능. 코드 테스트 불필요.

| 증빙 패턴 | 예시 |
|-----------|------|
| 코드 변경 | `tsc 0 | +13 tests | build OK` |
| 문서 변경 | `N개 파일 갱신` |
| 워크플로우 변경 | `N개 워크플로우 수정, 검증 완료` |

### 표준 구조

```
docs/1-project/[name]/
  README.md          ← 프로젝트 개요 (필수). 외부인/미래 세션이 "이게 뭔지" 빠르게 파악하는 용도
  BOARD.md           ← Context 테이블 + Tasks + Unresolved (필수)
  spec.md            ← Functional Spec (Heavy 필수, /go G2에서 작성)
  discussions/       ← "안 간 길" — 기각 대안, 진단, 의사결정 기록
```

> **README.md vs BOARD.md 역할 분리**: README.md = 읽기용 개요 (Why + Summary + Prior Art). BOARD.md = 실행용 전술 (Context 테이블 + Tasks + Unresolved).
> **notes/ 폴더는 v2에서 제거.** 수명이 다른 문서를 한 폴더에 담으면 아카이브 시 개별 판단이 필요해진다.
> discussions/만 남기면 `/archive`가 판단 0으로 동작한다.

### 규모 판정

| 규모 | 기준 | 필수 | Red 테스트 |
|------|------|------|----------|
| **Heavy** | 아키텍처 변경, 새 primitive | BOARD + spec.md | ✅ 필수 (→ /go G2→G3) |
| **Light** | 기능, 리팩토링, 버그 | BOARD | ✅ 필수 |
| **Meta** | 워크플로우, 템플릿, 문서, 분석 | BOARD | ❌ 불필요 |

**사용자 행동 규칙**: 산출물에 사용자 상호작용(클릭, 키보드, 포커스 등)이 포함되면 **무조건 Light 이상**. showcase/playground/prototype이라도 행동이 있으면 Red/Green 필수. Meta는 순수 문서/워크플로우/분석만 해당.

Default: Light. 코드 산출물 없으면 Meta. 사용자 행동 있으면 Light. 필요 시 escalate.

초기화 완료 확인 (Heavy / Light):
- [ ] BOARD.md 존재
- [ ] Tasks에 관련 스토리 매핑 (stories.md 있는 경우)

초기화 완료 확인 (Meta):
- [ ] BOARD.md 존재
- [ ] 산출물 경로 명시 (워크플로우, 문서 등)

위 충족 → `/go` 자동 진입.
