# Workflow 진화사 — 1개의 fix.md에서 45개의 운영체제까지

| 항목 | 내용 |
|------|------|
| **원문** | git logs를 뒤져가면서 완전 초창기 시절 workflows부터 지금까지의 변화사를 쭉 적어보면서 어쩌다가 이렇게 점점 진화했는지를 작성해봐 workflow 진화사 |
| **내(AI)가 추정한 의도** | **경위**: /discussion에서 45개 워크플로우 전체를 논의한 직후, 진화의 여정을 기록하고 싶어졌다.<br>**표면**: git 이력 기반의 워크플로우 변천사 문서 작성.<br>**의도**: "왜 이렇게 됐나"를 기록하여, 향후 워크플로우 설계 시 맥락을 보존하고, 외부 공유의 소재로 쓰려는 것. |
| **날짜** | 2026-03-05 |

> 📌 1개의 fix.md(브라우저 에러 잡기)에서 시작해 35일 만에 45개 워크플로우 체계로 진화했다.
> 📌 핵심 전환점은 5번: 탄생 → 목록화 → 철학화 → 정리(축소) → 분해(구조화) → 성숙.
> 📌 모든 진화는 "실패에서 배운 교훈을 구조로 강제"하는 패턴으로 발생했다.

---

## 1. 개요 (Overview)

Interactive OS의 워크플로우 시스템은 2026년 1월 31일 단 1개의 `fix.md`에서 시작하여, 2026년 3월 5일 현재 45개 워크플로우(3개 디렉토리)의 체계적 운영 시스템으로 진화했다. 이 문서는 git 이력을 근거로 그 진화 과정을 6개 시대로 구분하여 기록한다.

---

## 2. 연대기

### 🌱 Era 0: 원시 시대 (01-31 ~ 02-02) — 1개

```
.agent/workflows/
  fix.md          ← 유일한 워크플로우
```

**최초의 워크플로우 `fix.md`의 전문**:
> "브라우저를 열고, 콘솔 에러를 확인하고, 스택 트레이스를 읽고, 고치고, 새로고침하여 확인한다."

이것이 전부였다. "AI에게 뭘 시킬 수 있을까?"의 첫 번째 답: **에러를 자동으로 잡아라**. `// turbo-all` 플래그가 붙어있어 사람 승인 없이 자율 실행되었다. 이 시점의 워크플로우는 "자동화 스크립트"에 가까웠다.

**동시에 탄생**: `.agent/rules.md` — 커밋 `b4093f93` (02-01). 아직 선언문이 아닌 기술 규칙 모음.

---

### 📋 Era 1: 목록화 시대 (02-02 ~ 02-11) — 1 → 16개

```
+inbox.md, +para.md, +rules.md          (80cf7aa5, 02-02)
+cleanup.md, +daily.md, +diagnose.md    (a9bd9857, 02-11)
+discussion.md, +make.md, +redteam.md
+resources.md, +review.md, +status.md
+test.md, +todo.md, +workflow.md
```

**전환점**: PARA 디렉토리 구조 도입 (`80cf7aa5`). 단순히 "에러를 고치는" 도구에서 **문서 관리 시스템**으로 확장. `inbox.md`가 등장하여 사용자 요청을 정형화하기 시작.

**이 시대의 특징**:
- `daily.md` — 일일 루틴 (나중에 삭제됨)
- `todo.md` — 할 일 목록 관리 (나중에 삭제됨)
- `make.md` — 코드 생성 (나중에 삭제됨)
- `test.md` — 테스트 실행 (나중에 `/red`, `/green`으로 분화)

아직 워크플로우 사이의 **연결**이 없었다. 각각 독립적인 도구 목록.

---

### ⚖️ Era 2: 철학화 시대 (02-13 ~ 02-14) — 16 → 28개

```
+archive.md, +design.md, +divide.md    (62800a38, 02-13)
+go.md, +issue.md, +project.md
+refactor.md, +reflect.md, +retrospect.md
+routes.md, +onboarding.md, +poc.md, +til.md
```

**전환점 1**: `rules.md v2 — 선언문 헌법화` (`7be8bb93`, 02-14). rules.md가 기술 규칙에서 **프로젝트 헌법**으로 승격. "Pit of Success"와 "100% Observable" 원칙이 이때 명문화.

**전환점 2**: `/go` 탄생 (`62800a38`, 02-13). 최초의 **오케스트레이터 워크플로우**. 개별 도구들을 파이프라인으로 연결하는 허브가 등장. 이 순간부터 워크플로우가 "도구 목록"에서 **"시스템"**으로 변모 시작.

**전환점 3**: 같은 날 22건 일괄 수정 (`4e0e4748`, 02-14). `/fix` 재설계, 컨벤션 통일, 철학 정합. 기존 워크플로우를 전부 읽고 일관성을 맞춘 최초의 대규모 리팩토링.

**이 시대에 등장한 핵심 개념**:
- **`/discussion` → `/project` → `/go`** 파이프라인의 원형
- **`/retrospect`** — 세션 자체를 회고하는 메타인지 워크플로우
- **`/divide`** — Backward Chaining으로 문제를 분해

---

### 🔪 Era 3: 정리의 시대 (02-15 ~ 02-19) — 28 → 31개 (축소 발생)

```
+verify.md, +ready.md, +changelog.md   (b9e1e1b0 ~ 9cd0f4ad, 02-14~15)
+premortem.md                          (cf88e488, 02-15)
+doubt.md, +prd.md, +tdd.md            (df11f66b, 02-15)
−daily.md, −todo.md, −til.md           (df11f66b, 02-15)
−reflect.md, −onboarding.md            (df11f66b, 02-15)
```

**전환점**: **`/doubt` 적용 — 35 → 30 워크플로우 축소** (`df11f66b`, 02-15).

`/doubt`가 태어나자마자 **자기 자신에게 적용**되었다. "이 워크플로우는 쓸모가 있나?" 질문을 전체에 던져 5개를 삭제. `/doubt`의 첫 번째 실적이 "자기 형제 워크플로우를 5개 죽인 것"이라는 점이 상징적.

- `daily.md` — "매일 루틴"은 필요 없었다. `/go`가 대체했다.
- `todo.md` — BOARD.md가 대체했다.
- `til.md` (Today I Learned) — `/retrospect`에 흡수.
- `onboarding.md` — rules.md가 대체했다.

**동시에 등장**: `/verify` (type→unit→e2e→build 게이트), `/ready` (개발 환경 점검). 검증 체계가 본격화.
**docs-system-v2** (`89f9b60e`, 02-15): STATUS.md 도입. 프로젝트 대시보드라는 개념 탄생.

---

### 🧬 Era 4: 분화의 시대 (02-19 ~ 02-26) — 31 → 42개

```
+coverage.md, +retire.md, +reflect.md(재탄생)    (0e8e9af7, 02-19)
+solve.md, +perf.md                              (9e38b16d ~ 51b76654, 02-19)
+blueprint.md, +elicit.md, +naming.md            (31b68522, 02-24)
+why.md, +self.md, +fired.md                     (31b68522, 02-24)
+audit.md, +ban.md, +bind.md, +conflict.md       (22ae6417, 02-26)
+green.md, +red.md, +plan.md, +spec.md
+stories.md, +reframe.md, +rework.md
−changelog.md, −cleanup.md, −prd.md, −tdd.md
−test.md, −poc.md, −resources.md, −para.md
−premortem.md, −self.md, −fired.md
```

가장 격렬한 변화의 시대. 대규모 분화와 대규모 삭제가 동시에 발생.

**전환점 1**: `/go` 4-Phase 재설계 (`31b68522`, 02-24). `/go`가 단순 라우터에서 8단계 판별 테이블 + 재진입 루프를 가진 **파이프라인 엔진**으로 진화. 이 시점에서 `/go`는 사실상 프로젝트의 main() 함수가 됨.

**전환점 2**: TDD 분화 — `/tdd` → `/red` + `/green` (`22ae6417`, 02-26). 하나의 "테스트" 워크플로우가 "실패하는 테스트를 쓰는 것"과 "그것을 통과시키는 것"으로 분리. 이 순간부터 Red-Green-Refactor 사이클이 물리적으로 강제됨.

**전환점 3**: `/audit` 탄생 (`22ae6417`, 02-26). OS 계약 위반을 전수 검사하는 필수 게이트. `/go` 파이프라인의 #7 단계에 삽입되어, 모든 프로젝트가 audit을 통과해야 archive 가능.

**전환점 4**: `/elicit` 탄생 (`d9802ed1`, 02-22). LLM의 잘못된 의사결정 → 사용자의 암묵지 추출. "mistakes" 폴더가 "precedents"로 리네임된 것도 이때. 실수를 벌점이 아닌 **선례(판례)**로 재정의.

**삭제된 것들의 패턴**: 범용 이름(`test`, `cleanup`, `tdd`)이 구체적 이름(`red`, `green`, `verify`, `doubt`)으로 교체됨. 모호한 도구 → 명확한 책임.

---

### 🌳 Era 5: 구조화 시대 (02-26 ~ 03-05) — 42 → 45개 (폴더 분리)

```
.agent/workflows/
  _middleware.md      ← 03-04 NEW: 지식 축적 미들웨어
  thinking/           ← 03-03 NEW: 15개 (분석·의사결정·메타인지)
    discussion.md, conflict.md, blueprint.md, divide.md,
    solve.md, plan.md, inbox.md, knowledge.md, doubt.md,
    reflect.md, retrospect.md, why.md, elicit.md,
    reframe.md, redteam.md
  process/            ← 03-03 NEW: 11개 (프로젝트 생명주기)
    go.md, project.md, archive.md, retire.md, status.md,
    stories.md, ban.md, fix.md, naming.md, rules.md, workflow.md
  (root: 19개)        ← 구현·검증 워크플로우
    apg.md, audit.md, bind.md, coverage.md, design.md,
    diagnose.md, green.md, issue.md, perf.md, ready.md,
    red.md, refactor.md, review.md, rework.md, routes.md,
    spec.md, usage.md, verify.md
```

**전환점 1**: `_middleware.md` 패턴 도입 (03-04, `workflow-knowledge-separation` 프로젝트). 모든 워크플로우에 암묵적으로 적용되는 **지식 축적 규약**. 워크플로우 실행 중 발견한 지식을 자동으로 프로젝트에 환류하는 메커니즘.

**전환점 2**: flat → tree 구조 전환 (03-03, `ec9f5d1a`). 42개 파일이 한 폴더에 있던 것을 `thinking/`과 `process/`로 분리. 워크플로우에 **분류 체계**가 생김.

**전환점 3**: `/knowledge` 워크플로우 독립 (03-04). Discussion의 Knowledge 반영 로직이 별도 워크플로우로 분리. 지식의 생명주기(발견→정제→정착→은퇴)가 완성.

**03-05 최신**: `/discussion` 라우팅 확장 (이 세션). Complex를 3분기(정보부족/충돌불명확/선택불가)로 세분화. `/conflict` 재설계 (관찰→진단). `/go` 대화 맥락 기본값 우선.

---

## 3. 수량 변화 그래프

```
날짜        | 워크플로우 수 | 주요 이벤트
------------|-------------|----------------------------------
01-31       |      1      | fix.md 탄생
02-02       |      4      | +inbox, +para, +rules
02-11       |     16      | 대량 추가 (+12)
02-13       |     28      | /go 탄생, /discussion 등장
02-14       |     28      | 22건 일괄 리팩토링, rules v2
02-15       |     30      | /doubt 탄생 → 즉시 5개 삭제 (35→30)
02-19       |     35      | /solve, /perf, /retire 등
02-24       |     40      | /go 4-Phase, /blueprint, /elicit, /why
02-26       |     42      | /audit, /red, /green, /spec, /conflict, /plan 최대 팽창
03-03       |     42      | flat→tree 구조 전환
03-04       |     44      | _middleware, /knowledge
03-05       |     45      | +usage, /conflict 재설계
```

---

## 4. 진화의 패턴 — 왜 이렇게 됐는가

### 패턴 1: 실패가 워크플로우를 낳는다

모든 주요 워크플로우는 **실패**에서 탄생했다:
- `/why` ← LLM이 헤매면서 같은 실수를 반복
- `/elicit` ← LLM의 잘못된 판단이 사용자 교정으로 드러남
- `/audit` ← 구현 완료 후 OS 계약 위반 발견
- `/doubt` ← 과잉 산출물 축적
- `/ban` ← 잘못된 컨텍스트에서 벗어나지 못함

### 패턴 2: 범용 → 구체 분화

```
test.md → red.md + green.md
tdd.md → red.md + green.md + refactor.md
cleanup.md → doubt.md + retire.md
daily.md → (삭제, /go가 대체)
```

하나의 모호한 워크플로우가 사용되면서 **책임이 명확한 작은 워크플로우로 분열**. 이것은 코드의 SRP 적용과 동일한 패턴.

### 패턴 3: 문서 → 법 → 제도

```
Era 0: fix.md는 "스크립트" (실행만)
Era 2: rules.md가 "헌법" (원칙 선언)
Era 4: /audit이 "사법" (위반 심판)
Era 5: _middleware가 "행정" (자동 집행)
```

워크플로우 시스템 자체가 **국가의 삼권분립**을 닮아감. 입법(rules) → 사법(audit) → 행정(middleware/go).

### 패턴 4: 축소와 팽창이 교대

팽창만 한 게 아니다. 의식적 **축소**가 3번 있었다:
- 02-15: `/doubt` 첫 적용 — 35→30 (−5)
- 02-24: `/go` 재설계 시 중복 제거 — 여러 워크플로우 흡수
- 02-26: `changelog`, `poc`, `para` 등 사용 안 되는 것 삭제

**건강한 시스템은 커지기만 하지 않는다.**

---

## 5. Cynefin 도메인 판정

🟢 **Clear** — git 이력이라는 확정된 사실에 기반한 기록이다. 해석을 추가했지만 사실 자체는 변하지 않는다.

## 6. 인식 한계 (Epistemic Status)

- git 커밋 메시지와 파일 트리 변화에 기반. 각 워크플로우의 **내용 변화**(예: /go의 판별 테이블이 언제 8단계가 되었는지)는 모든 커밋의 diff를 분석하지 않았으므로 누락 가능.
- 커밋 사이의 대화(discussion)에서 왜 특정 워크플로우를 만들었는지의 맥락은 일부만 복원 가능. 사용자의 기억이 가장 정확한 소스.
- Era 구분은 AI의 해석이며, 사용자와 합의된 것은 아님.

---

> 📌 35일간 1 → 45개. 모든 진화는 "실패 → 교훈 → 구조로 강제"의 반복이었다.
> 📌 핵심 전환점: (1) /go의 탄생 (도구→시스템), (2) /doubt의 자기적용 (팽창→축소), (3) tree 구조화 (목록→분류).
> 📌 워크플로우 진화사 ≈ 국가 형성사. 스크립트(부족)→ 원칙(헌법)→ 감사(사법)→ 미들웨어(행정).
