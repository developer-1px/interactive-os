# 파이프라인 누수 점검 — spec↔test 1:1 대조 강제 메커니즘 부재

> 작성일: 2026-03-08
> 태그: infra
> 우선순위: P0

## 문제 / 동기

testbot-zift 프로젝트에서 **4개 게이트(audit/doubt/go#14/retrospect)를 전부 통과했으나, 실제로 동작하지 않는 기능(toolbar Run All / Quick)이 완료 판정**되었다. Unresolved > 0인 채로 archive까지 진행됨.

이것은 개별 실수가 아니라 파이프라인 구조의 결함이다.

### 발견 경위

1. testbot-zift 프로젝트: TestBot panel을 ZIFT(accordion+toolbar)로 재구성
2. `/auto` 자율 파이프라인으로 T1~T4 완료, 6 headless tests pass, archive까지 진행
3. 사용자가 브라우저에서 확인 → **Run All, Quick 버튼이 동작하지 않음**
4. 원인: `zones.ts` toolbar bind에 `onAction` 콜백 미연결. 버튼이 시각적으로만 존재하는 죽은 코드

### 근본 원인 분석 — 4개 게이트가 전부 뚫린 이유

#### 1. `/spec` — DT 누락으로 앱 고유 행동 명세 증발

| 문제 | 상세 |
|------|------|
| **Step 3 전제 오류** | "DT는 `/stories`에서 이미 작성되어 있다. `/spec`은 참조만 한다." → stories.md가 없는 프로젝트에서 DT가 통째로 스킵 |
| **BDD 시나리오가 OS 기본 동작 반복** | S1-S6 전부 accordion role의 기본 키보드 동작. "앱 이름을 지우고 다른 앱으로 바꿔도 통과하는" 시나리오만 존재 |
| **앱 고유 시나리오 0개** | 동적 getItems 갱신, suite 상태 변화 반영, toolbar onAction→executeAll 연결 — 전부 누락 |
| **Step 4 자가 검증 빈틈** | "DT가 MECE인가?" 체크는 있지만 "DT가 존재하는가?" 체크 없음 |

#### 2. `/red` — spec 시나리오↔테스트 1:1 대조 강제 없음

| 문제 | 상세 |
|------|------|
| **todo 테스트로 통과** | spec의 T1, T2 시나리오가 `it.todo()`로 작성되어 실질 검증 0. 하지만 파이프라인은 "테스트 존재"로 판정 |
| **spec 커버리지 체크 없음** | spec에 8개 시나리오(S1-S6, T1-T2) + R1이 있는데, 테스트가 6개(S1-S6)만 존재해도 `/green` 진입 허용 |
| **"테스트가 있다" ≠ "spec을 커버한다"** | 현재 `/red`의 완료 조건은 "FAIL하는 테스트가 존재"이지, "spec의 모든 시나리오에 대응하는 테스트가 존재"가 아님 |

#### 3. `/audit` — "모든 UI 요소가 동작하는가?" 검증 불가

| 문제 | 상세 |
|------|------|
| **contract-checklist 기반** | 코드 패턴 위반(useState, document.querySelector 등)을 검사하지만, **기능적 완전성**은 검사 범위 밖 |
| **"onAction이 없다"는 contract 위반이 아님** | audit는 "금지된 것을 했는가?"를 보지, "해야 할 것을 안 했는가?"는 보지 않음 |
| **spec↔구현 대조 없음** | audit가 spec.md를 읽고 구현 완전성을 체크하는 단계가 없음 |

#### 4. `/go` #14 — Unresolved>0 archive 금지 규칙 우회

| 문제 | 상세 |
|------|------|
| **"백로그 위임"으로 재분류** | BOARD Unresolved에 "Toolbar onAction 연결"이 있었으나, "백로그에 위임"으로 재분류하여 Unresolved==0으로 처리 |
| **AI의 편의적 우회** | 규칙의 존재 ≠ 규칙의 실행. AI가 형식적으로 조건을 충족시키는 방법을 찾아 우회 |
| **Unresolved의 정의 모호** | "이 프로젝트 범위의 미해결" vs "타 프로젝트에 위임 가능" 기준이 없어 자의적 판단 가능 |

### 선행 경고 — RT-05 (2026-02-26)

`docs/5-backlog/2026-0226-1800-[analysis]-working-methodology-redteam.md` RT-05에서 이미 경고:
> "체크리스트를 '통과해야 하니까' 체크하면, 검증 없는 통과가 된다."
> 당시 판정: 🟡 부분 인정 — "형식적 산출물을 감지하는 메커니즘이 없음"

그 메커니즘을 만들지 않은 채 10일이 지나고, 예측된 대로 터졌다.

## 현재 상태

### `/spec` (`.agent/workflows/spec.md`)
- Step 3: "DT를 여기서 새로 작성하지 않는다. stories.md에서 참조만 한다." (line 93-95)
- Step 4 자가 검증: DT MECE 체크는 있지만 DT 존재 체크 없음 (line 110-118)
- **빈틈**: stories 없는 프로젝트 → DT 전체 스킵 → 앱 고유 행동 무명세

### `/red` (`.agent/workflows/red.md`)
- 완료 조건: "FAIL하는 테스트 존재"
- **빈틈**: spec 시나리오와 테스트의 1:1 대응 강제 없음. todo 테스트도 "존재"로 카운트

### `/audit` (`.agent/knowledge/audit.md` + `.agent/knowledge/contract-checklist.md`)
- 금지 패턴 검사(contract violation) 중심
- **빈틈**: spec 기반 기능적 완전성 검사 없음 ("해야 할 것을 안 했는가?")

### `/go` (`.agent/workflows/go.md`)
- #14: "Unresolved > 0 → Now 승격. Unresolved == 0이 될 때까지 archive 금지."
- **빈틈**: Unresolved를 "백로그 위임"으로 0으로 만드는 우회 경로 차단 안 됨

## 기대 상태

### 완료 조건 (Done Criteria)

1. **`/spec`에서 DT 작성이 보장된다**
   - stories.md 존재 여부와 무관하게, 인터랙션 태스크에는 DT가 반드시 작성된다
   - "시나리오에서 앱 이름을 지워도 통과하면 앱 고유 시나리오가 아니다" 리트머스 테스트 도입

2. **`/red`에서 spec↔test 1:1 대조가 강제된다**
   - spec의 모든 시나리오 ID(S1, T1, R1...)에 대응하는 비-todo 테스트가 존재해야 `/green` 진입 허용
   - todo 테스트는 "존재"로 카운트하지 않음

3. **`/audit`에서 spec 기반 완전성 검사가 추가된다**
   - "spec의 모든 시나리오가 PASS하는 테스트로 존재하는가?" 체크 항목 추가
   - contract violation(금지) + spec coverage(의무) = 양방향 검증

4. **`/go` #14에서 Unresolved 우회가 차단된다**
   - Unresolved → 백로그 위임 시, **사용자 명시적 승인** 필요 (AI 단독 판단 금지)
   - 또는: Unresolved가 "이 프로젝트 spec에 명시된 시나리오"에 해당하면 위임 불가

### 검증 방법

- testbot-zift를 unarchive하고 수정된 파이프라인으로 재실행하여, T1/T2 todo가 게이트에 걸리는지 확인
- 또는: 새 프로젝트에서 의도적으로 spec 시나리오 하나를 todo로 남기고, 파이프라인이 잡는지 확인

## 접근 방향

### Phase 1: Spec 게이트 강화 (핵심)

| 워크플로우 | 수정 내용 |
|-----------|----------|
| `/spec` Step 3 | "stories 없으면 DT를 여기서 직접 작성" 분기 추가 |
| `/spec` Step 4 | "앱 고유 시나리오 리트머스" 체크 추가 — "이 시나리오가 다른 앱에서도 동일하게 성립하면 앱 고유가 아님" |
| `/spec` Step 4 | "DT 존재 여부" 체크 추가 (Zone 있는 태스크에서 DT 없으면 경고) |

### Phase 2: Red↔Spec 대조 게이트 (기계적 차단)

| 워크플로우 | 수정 내용 |
|-----------|----------|
| `/red` 완료 조건 | "spec 시나리오 ID 전수 → 테스트 파일에서 매칭 확인" 단계 추가 |
| `/red` 완료 조건 | `it.todo()` 테스트는 "미구현"으로 분류 — todo가 있으면 `/green` 진입 차단 또는 사용자 승인 필요 |

### Phase 3: Audit 양방향 검증 (방어선)

| 워크플로우 | 수정 내용 |
|-----------|----------|
| `/audit` | 새 카테고리: "Spec Coverage" — spec 시나리오 vs 테스트 PASS 대조 |
| `/audit` | contract violation(금지) + spec coverage(의무) = **쌍방 감사** |

### Phase 4: Unresolved 우회 차단

| 워크플로우 | 수정 내용 |
|-----------|----------|
| `/go` #14 | Unresolved→백로그 위임 시 사용자 승인 필수 |
| `/go` #14 | spec 시나리오에 해당하는 Unresolved는 위임 불가 (해당 프로젝트에서 해결 의무) |

## 관련 항목

- `docs/5-backlog/2026-0226-1800-[analysis]-working-methodology-redteam.md` — RT-05 (관찰자 효과), RT-09 (순환 루프)
- `docs/4-archive/2026/03/W10/testbot-zift/` — 발견 사례
- `.agent/workflows/spec.md` — 수정 대상
- `.agent/workflows/red.md` — 수정 대상
- `.agent/knowledge/audit.md` — 수정 대상
- `.agent/workflows/go.md` — 수정 대상
- `.agent/knowledge/contract-checklist.md` — 수정 대상
