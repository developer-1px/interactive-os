---
description: Discussion 결론을 프로젝트로 전환한다. scaffold 후 `/go` Phase 1(숙지)로 진입한다.
---

## /project — 프로젝트 생애주기

> **분류**: 오케스트레이터. `/go` 진입 라우터.
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
2. **문서 수집** — `docs/0-inbox/`, `docs/5-backlog/`, `docs/4-archive/` 탐색 → `discussions/`, `notes/`로 이동.
3. **Scaffold** — `docs/1-project/[name]/` 표준 구조 생성.
4. **등록** — `docs/STATUS.md`에 프로젝트 추가.
5. **BOARD.md** — Discussion Conclusion(Toulmin)을 Context에 매핑하여 작성:

   | Toulmin (Discussion) | → | BOARD Section |
   |---------------------|---|---------------|
   | 🎯 Claim | → | **Context**: 한 줄 요약 |
   | 📊 Data + 🔗 Warrant | → | **Context**: Before→After + 핵심 논거 |
   | 📚 Backing | → | **Context**: 선례 (있으면) |
   | ⚡ Rebuttal | → | **Context**: Drawbacks / Risks |
   | ❓ Open Gap | → | **Unresolved** |
   | ⚖️ Qualifier | → | 규모 판정 입력 |

   Heavy는 상세 설계를 `spec.md`에 위임.

6. **스토리 선택** (stories.md가 있는 경우) — BOARD.md의 Now 태스크에 관련 US-ID를 매핑한다.

   > **`/project`는 scaffold까지만 한다. Red 테스트는 `/go`가 라우팅한다.**
   > BOARD.md + spec.md 준비가 끝나면 `/go` 진입.

### BOARD.md 표준 포맷

```markdown
# project-name

## Context

Claim: [Discussion에서 도달한 결론]

Before → After: [핵심 변경 한눈에]

Risks: [Rebuttal에서 온 위험/단점]

## Now
- [ ] T1: description

## Done
- [x] T1: description — tsc 0 | +N tests | build OK ✅

## Unresolved
- [Discussion의 Open Gap에서 온 미해결 질문]

## Ideas
- [미래 아이디어]
```

**DoD (Definition of Done)**: Done 항목에는 반드시 증빙을 포함한다.
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
  BOARD.md           ← Context + Now/Done/Unresolved/Ideas (필수)
  spec.md            ← Functional Spec (Heavy 필수, /go G2에서 작성)
  discussions/
  notes/
```

### 규모 판정

| 규모 | 기준 | 필수 | Red 테스트 |
|------|------|------|----------|
| **Heavy** | 아키텍처 변경, 새 primitive | BOARD + spec.md | ✅ 필수 (→ /go G2→G3) |
| **Light** | 기능, 리팩토링, 버그 | BOARD | ✅ 필수 |
| **Meta** | 워크플로우, 템플릿, 문서, 분석 | BOARD | ❌ 불필요 |

Default: Light. 코드 산출물 없으면 Meta. 필요 시 escalate.

초기화 완료 확인 (Heavy / Light):
- [ ] BOARD.md 존재
- [ ] Now 태스크에 관련 스토리 매핑 (stories.md 있는 경우)

초기화 완료 확인 (Meta):
- [ ] BOARD.md 존재
- [ ] 산출물 경로 명시 (워크플로우, 문서 등)

위 충족 → `/go` 자동 진입.
