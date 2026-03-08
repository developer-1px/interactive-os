# OS 기반 앱 개발의 구조적 Leak 지도

| 항목 | 내용 |
|------|------|
| **원문** | 논의 좀 심각하게 해보자. 지금 동작이 안하는데 무슨 근거로 마무리를 한거야? → OS 기반 위에서 만드려고 하니까 workflow상에서 혹은 os상에서 뭐가 leak이니? |
| **내(AI)가 추정한 의도** | |
| — 경위 | testbot-zift 프로젝트에서 4개 게이트(audit/doubt/go#14/retrospect)를 전부 통과했으나, toolbar 버튼이 실제로 동작하지 않는 채 archive됨 |
| — 표면 | 개별 버그가 아니라, OS 위에서 앱을 만들 때 반복될 수 있는 모든 구조적 leak을 파악하고 싶다 |
| — 의도 | OS 기능 개발보다 **프로세스 신뢰성 확보가 우선**. leak을 전수 파악하여 파이프라인을 먼저 고치고, 그 위에서 안전하게 개발하고 싶다 |
| **날짜** | 2026-03-08 |
| **상태** | 분석 완료, 실행 대기 (OS 수습 후 착수) |

---

## 1. 개요 (Overview)

testbot-zift 프로젝트에서 **동작하지 않는 기능이 "완료"로 판정되고 archive까지 진행**된 사건을 계기로, OS 위에서 앱을 만드는 전체 경험의 구조적 leak을 3층으로 분석한다.

**3층 구조**:
- **1층**: OS 자체의 Gap — headless↔browser 불일치
- **2층**: 워크플로우 게이트의 빈틈 — 형식적 통과 허용
- **3층**: 앱 개발 경험(DX)의 Gap — silent failure, SDK 표면적 부족

---

## 2. 분석 (Analysis)

### 2.1 발견 사례: testbot-zift

| 사실 | 상세 |
|------|------|
| 프로젝트 | TestBot panel을 ZIFT(accordion+toolbar)로 재구성 |
| 파이프라인 | `/auto`로 자율 실행. spec→red→green→audit→doubt→retrospect→archive 전과정 통과 |
| 테스트 | 6 headless tests PASS, 2 todo |
| 실제 동작 | **toolbar의 Run All / Quick 버튼 미동작** — `zones.ts`의 toolbar bind에 `onAction` 콜백 미연결 |
| 게이트 결과 | 4개 게이트(audit, doubt, go#14, retrospect) **전부 통과** |

### 2.2 1층 — OS 자체의 Gap (headless↔browser 불일치)

> **Zero Drift 원칙**: "headless pass = browser 동일 동작" — 현재 이것은 **선언이지 보장이 아니다.**

`docs/5-backlog/os-gaps.md`에 누적된 24건 중, headless가 브라우저 동작을 시뮬레이션하지 못하는 케이스:

| OG# | 패턴 | 설명 | 영향 |
|-----|------|------|------|
| OG-013 | trigger:"change" | headless `type()`이 DOM onChange를 시뮬레이션하지 않아 field auto-commit 안 됨 | field 테스트 불완전 |
| OG-016 | Dialog Tab trap | headless에서 overlay 내 Tab cycle 미지원 | dialog 접근성 미검증 |
| OG-017 | Dialog Enter confirm | overlay zone 내 navigation→confirm 미지원 | dialog 확인 흐름 미검증 |
| OG-018 | Cross-zone | `page.goto()`가 단일 activeZoneId만 설정. 다중 zone 전환 테스트 불가 | focus-showcase 29 scripts 차단 |
| OG-022 | Hover simulation | `createHeadlessPage`에 hover/pointer-enter 없음 | tooltip 테스트 불가 |
| OG-024 | Dynamic initial expand | 동적 아이템의 초기 aria-expanded 선언적 설정 불가 | accordion 초기 상태 테스트 불완전 |

**SDK 노출 부족**:

| OG#/Gap | 설명 | 영향 |
|---------|------|------|
| OG-021 | SDK가 `OS_OVERLAY_OPEN` re-export 안 함 | rules 위반(`@os-core` 직접 import) 유도 |
| Gap 3 | AppPage에 `zone()` accessor 없음 | OsPage와 API 불일치 |

**Silent failure**:

| Gap | 설명 | 영향 |
|-----|------|------|
| Gap 4 | field 미등록 시 `type()` 무반응 (에러 없음) | "동작한다"는 착각 유발 |
| Gap 5 | `keyboard.type()` field 미등록 시 silent return | 디버깅 난이도 상승 |

**1층 핵심 문제**: headless 시뮬레이션 불가 6건이 있는 상태에서, headless pass를 "완료 증거"로 채택하는 것은 **증명력 한계가 있다**. 특히 todo 테스트로 남기면 "headless 한계"와 "미구현"이 구분되지 않는다.

### 2.3 2층 — 워크플로우 게이트의 빈틈

> **파이프라인이 "완료"라고 판정하는데 실제론 미완성** — 가장 위험한 층.

#### Leak A: `/spec` — DT 누락으로 앱 고유 행동 명세 증발

- **원인**: Step 3이 "stories.md에서 DT 참조"로만 설계. stories 없는 프로젝트에서 DT 통째로 스킵
- **결과**: BDD 시나리오가 OS 기본 동작(accordion ArrowDown, Enter expand)만 나열. 앱 고유 행동(동적 items, onAction 연결) 0건
- **리트머스**: "시나리오에서 앱 이름을 지우고 다른 앱으로 바꿔도 통과하면, 그건 앱 고유 시나리오가 아니다"
- **Step 4 자가 검증**: "DT가 MECE인가?" 체크는 있지만 "DT가 존재하는가?" 체크 없음

#### Leak B: `/red` — spec↔test 1:1 대조 강제 없음

- **원인**: 완료 조건이 "FAIL하는 테스트가 존재"이지, "spec 시나리오 전수가 테스트로 커버됨"이 아님
- **결과**: spec에 T1, T2, R1 시나리오가 있는데 `it.todo()`로 남겨도 `/green` 진입 허용
- **핵심**: `it.todo()` 테스트는 "존재"가 아니다. 실행되지 않는 테스트는 검증이 아니다

#### Leak C: `/audit` — 기능적 완전성 검사 부재

- **원인**: contract-checklist가 **금지 패턴**(있으면 안 되는 것)만 검사. **의무 패턴**(있어야 하는 것)은 범위 밖
- **결과**: toolbar에 `onAction` 없어도 contract 위반이 아니므로 audit 통과
- **빈틈**: spec↔구현 대조 없음. role별 필수 콜백(toolbar→onAction, listbox→onAction 등) 부재 감지 못함

#### Leak D: `/bind` — 연결 후 동작 검증 없음

- **원인**: `/bind`는 "headless 로직을 React 컴포넌트에 연결"까지만 수행. 연결 후 "click하면 실제로 커맨드가 dispatch되는가?" 검증 단계 없음
- **결과**: bind 했지만 onAction이 없어서 동작 안 함 — 그래도 bind "완료"

#### Leak E: `/go` #14 — Unresolved 우회

- **원인**: Unresolved를 "백로그 위임"으로 재분류하여 Unresolved==0 처리. AI 단독 판단
- **결과**: spec에 명시된 시나리오(T1, T2)가 미구현인데 archive 진행
- **핵심**: Unresolved의 정의가 모호 — "프로젝트 범위의 미해결" vs "타 프로젝트에 위임 가능" 기준 없음

#### Leak F: role별 필수 콜백 감지 없음 (신규 발견)

- **원인**: Zone bind에 role이 기대하는 콜백(onAction, onDelete, onCheck 등)이 빠져도 경고/에러 없음
- **결과**: toolbar zone에 onAction 없이 bind 완료. 버튼이 시각적으로만 존재
- **영향**: 이건 OS 자체의 gap이기도 함 — `bind({ role: "toolbar", getItems: [...] })`에서 onAction이 없으면 경고를 줘야 하지 않나?

### 2.4 3층 — 앱 개발 경험(DX)의 Gap

| leak | 상세 | 영향 |
|------|------|------|
| **Silent failure 문화** | field 미등록 시 type() 무반응, trigger click 미등록 시 무반응, onAction 없어도 무반응. 에러가 안 나니까 "동작한다"고 착각 | 디버깅 시간 증가 + 거짓 GREEN |
| **headless 한계를 todo가 숨김** | hover 못함, cross-zone 못함, Tab trap 못함 → todo로 남기면 "테스트 있음"으로 보임. 한계와 미구현이 구분 안 됨 | 테스트 커버리지 착시 |
| **동적 items 초기 상태** | getItems가 kernel state에 의존할 때 초기 expand/select 상태를 선언적으로 못 넣음 | useEffect workaround → rules 위반 유혹 |
| **SDK 표면적 부족** | OS_OVERLAY_OPEN, zone accessor 등이 SDK에 없어서 `@os-core` 직접 import 유혹 | Pit of Success 원칙 위반 경로 열림 |

### 2.5 선행 경고와의 관계

`docs/5-backlog/2026-0226-1800-[analysis]-working-methodology-redteam.md`에서 2026-02-26에 이미 경고:

| RT# | 경고 | 지금 터진 것 |
|-----|------|-------------|
| **RT-05** | "체크리스트를 통과해야 하니까 체크하면 검증 없는 통과" | audit/doubt가 형식적으로 통과됨 |
| **RT-04** | "과정이 목적을 삼킨다" | 10단계 파이프라인을 통과했지만 기능은 미동작 |
| **RT-09** | "순환 루프 종료 보장 없음" | Unresolved>0인데 archive 진행 (루프가 돌지 않음) |

당시 판정: RT-05 🟡 부분 인정 — **"형식적 산출물을 감지하는 메커니즘이 없음"**. 10일 후 예측대로 터짐.

### 2.6 Leak 전체 지도

```
┌─────────────────────────────────────────────────────┐
│  3층: DX Gap                                         │
│  ┌───────────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Silent Failure │ │ todo 착시 │ │ SDK 표면적 부족 │  │
│  └───────┬───────┘ └────┬─────┘ └───────┬────────┘  │
│          │              │               │            │
├──────────┼──────────────┼───────────────┼────────────┤
│  2층: Workflow Gate Gap  │               │            │
│  ┌──────┐ ┌──────┐ ┌───┴──┐ ┌──────┐ ┌─┴────┐      │
│  │spec  │ │red   │ │audit │ │bind  │ │go#14 │      │
│  │DT 스킵│ │todo  │ │금지만│ │검증  │ │우회  │      │
│  │      │ │통과  │ │검사  │ │없음  │ │가능  │      │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘      │
│     │        │        │        │        │           │
├─────┼────────┼────────┼────────┼────────┼───────────┤
│  1층: OS Gap (headless↔browser)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │시뮬레이션 │ │SDK 미노출 │ │Silent    │             │
│  │불가 6건   │ │2건       │ │failure 2건│             │
│  └──────────┘ └──────────┘ └──────────┘             │
└─────────────────────────────────────────────────────┘
```

**leak 간 상호작용**: 1층의 silent failure가 → 3층에서 "동작한다" 착각을 만들고 → 2층의 audit가 이를 못 잡고 → 미동작 기능이 "완료"로 판정됨. 층이 독립적이 아니라 **연쇄적으로 악화**한다.

---

## 3. 제안 (Proposal)

### 우선순위 판정

| 순위 | 대상 | 이유 |
|------|------|------|
| **P0** | 2층 워크플로우 게이트 | 프로세스가 "완료"라고 판정하는 것이 가장 위험. 1층/3층은 개발자가 인지할 수 있지만, 2층은 **인지 못한 채 통과** |
| **P1** | 3층 DX silent failure | 거짓 GREEN의 직접 원인. OS 코드 수정 필요 |
| **P2** | 1층 headless↔browser | 장기 과제. 각 OG별로 독립 해결 가능 |

### P0: 워크플로우 게이트 강화 (Meta 프로젝트)

> 상세 계획: `docs/5-backlog/pipeline-leak-audit.md` (이미 등록)

| Phase | 수정 | 효과 |
|-------|------|------|
| 1 | `/spec` Step 3: stories 없으면 DT 직접 작성 + 앱 고유 시나리오 리트머스 | spec 품질 = 파이프라인 품질 상한 |
| 2 | `/red` 완료 조건: spec ID↔test 1:1 대조. todo 불허 | 미구현 시나리오의 기계적 차단 |
| 3 | `/audit` spec coverage 카테고리 추가 | 금지(contract) + 의무(spec) = 쌍방 감사 |
| 4 | `/go` #14 Unresolved 우회 차단 | spec 시나리오 해당 Unresolved는 위임 불가 |

### P1: Silent Failure 경고 (OS 코드 수정)

| 대상 | 수정 |
|------|------|
| `keyboard.type()` field 미등록 | console.warn 또는 throw |
| `page.click()` trigger/item 미등록 | console.warn 또는 throw |
| `zone.bind()` role별 필수 콜백 누락 | 개발 모드 경고: "toolbar role expects onAction callback" |

### P2: Headless↔Browser 불일치 해소 (각 OG별)

기존 `docs/5-backlog/os-gaps.md`에서 개별 추적. 특히:
- OG-016 (Tab trap), OG-018 (cross-zone)은 테스트 범위에 직접 영향
- OG-022 (hover)는 tooltip 패턴 전체를 차단

---

## 4. Cynefin 도메인 판정

**🟡 Complicated**

leak의 목록과 구조는 파악됐고, 각 수정 방향도 보인다. 하지만 수정 간 상호작용(spec 강화가 audit를 어떻게 바꾸는지, silent failure 경고가 기존 테스트를 어떻게 깨뜨리는지)은 실행하면서 확인해야 한다. 분석 후 답이 좁혀지는 Complicated 영역.

---

## 5. 인식 한계 (Epistemic Status)

- 이 분석은 **testbot-zift 1건 + os-gaps.md + testing-hazards.md + todo-dogfooding**에 기반한다. 다른 완료된 프로젝트에서도 같은 leak이 있었는지는 소급 검증하지 않았다.
- 2층 Leak F(role별 필수 콜백)가 OS 코드로 해결 가능한지, 아니면 role별 필수 콜백 정의 자체가 복잡한지는 `roleRegistry.ts`를 상세 분석해야 확인 가능하다.
- `/auto` 자율 모드가 leak을 **증폭**하는지(관성 가속), 아니면 수동 모드에서도 같은 leak이 나는지는 비교 데이터가 없다.

---

## 6. 열린 질문 (Complex Questions)

1. **P0 워크플로우 수정을 testbot-zift unarchive로 검증할 것인가, 새 프로젝트로 검증할 것인가?**
   - testbot-zift를 되살리면 "같은 사례로 재검증" 가능하지만, 수정된 파이프라인의 일반성은 증명 못함
   - 새 프로젝트로 하면 일반성 증명 가능하지만, 기존 사례의 수습이 별도 필요

2. **Silent failure 경고를 warn으로 할 것인가, throw로 할 것인가?**
   - warn: 기존 코드 안 깨짐, 하지만 무시될 수 있음
   - throw: 확실하지만, 기존 테스트가 대량 실패할 가능성

3. **role별 필수 콜백을 OS가 강제할 것인가, lint rule로 할 것인가?**
   - OS 런타임 강제: Pit of Success 원칙에 부합, 하지만 role별 "필수"의 정의가 필요
   - lint rule: 비침투적, 하지만 우회 가능

---

> **3줄 요약**:
> testbot-zift에서 4개 파이프라인 게이트가 전부 뚫려 미동작 기능이 "완료" 판정된 사건을 계기로, OS 기반 앱 개발의 구조적 leak을 3층(OS gap / 워크플로우 / DX)으로 분석했다.
> 가장 위험한 2층(워크플로우)은 spec DT 스킵, red todo 통과, audit 의무 검사 부재, Unresolved 우회 — 4건의 게이트 빈틈이 연쇄하여 형식적 통과를 허용한다.
> P0 = 워크플로우 게이트 강화(Meta 프로젝트), P1 = silent failure 경고(OS 코드), P2 = headless↔browser 불일치(개별 OG). OS 기능 개발보다 프로세스 신뢰성 확보가 우선이다.
