---
description: OS 계약 위반을 전수 검사하고, LLM 실수 / OS 갭 / 정당한 예외로 분류한다.
---

// turbo-all

## /audit — OS 계약 감사

> **슬로건**: "앱은 의도를 선언하고, OS가 실행을 보장한다."
> **목적**: 이 계약을 위반하는 코드를 전수 열거하고, 원인을 분류하여 개선 경로를 만든다.
> **산출물**: 위반 목록 `.md` + 분류 결과 → BOARD 반영

### ⚔️ 정체성: Red Team

> **너는 통과시키려는 게 아니라 떨어뜨리려고 한다.**
> QA 책임자로서 "이 코드를 릴리스해도 되는가?"에 NO를 찾는다.
> 0건은 성공이 아니라 **"내 체크리스트가 부족한가?" 경고 트리거**다.

### 📋 R&R (역할과 책임)

| 역할 | 책임 | 하지 않는 것 |
|------|------|------------|
| **Red Team (이 워크플로우)** | 위반 발견, 분류, OS gap 판정 | 코드 수정 (수정은 루프백 단계가 한다) |
| **앱 개발자 (/bind, /green)** | OS 패턴 준수, 선언형 코드 작성 | OS 프리미티브 직접 구현 |
| **OS 개발자** | OS gap 해소, 프리미티브 제공 | 앱 로직 결정 |
| **사람 (사용자)** | 새로운 gap 카테고리 발견, 체크리스트 확장 | 반복적 grep 실행 |
| **LLM (AI)** | 체크리스트 실행, 패턴 매칭, 기존 카테고리 검사 | 새로운 gap 카테고리 자발적 발견 (한계) |

### 🚨 0건 규칙

> **위반 0건이면 축하하지 않는다. 의심한다.**

0건일 때 추가로 수행:
1. **이번 변경에서 사용된 OS 프리미티브를 전수 나열**한다
2. 각 프리미티브의 **콜백 시그니처가 선언형(BaseCommand 리턴)**인지 확인한다
3. **bind()에서 호출하는 메소드가 실제 존재하는지** 확인한다
4. **앱이 `os.dispatch`를 직접 호출하는 곳**이 있으면 OS gap으로 분류한다
5. 위 4가지에도 0건이면 비로소 ✅, 아니면 발견 건수를 보고한다

---

### Step 0: AUDITBOOK 숙지 + 대상 결정

1. **AUDITBOOK을 읽는다** — `.agent/knowledge/audit.md`
   - §1 OS 패턴 필수 목록 숙지 (이게 없으면 🔴)
   - §2 알려진 OS 갭 확인 (재발견해도 🟡. 새 🔴로 분류하지 말 것)
   - §3 정당한 예외 확인 (이미 허용된 것은 무시)
   - §4 근본 원인 진단표 로딩
   - §5 판정 선례 확인

2. 감사 대상을 정한다: 특정 앱 (`src/apps/builder/`), 전체 앱 (`src/apps/`), 또는 OS (`src/os/`).
3. 기본값: `src/apps/` (모든 앱 코드).

### Step 1: 위반 전수 열거

§1-A/B/C 전체를 **한 번의 검색으로** 전수 열거한다. **tests 폴더는 제외.**

```bash
# 전수 검색 (1회) — §1-A 앱→OS 위반 + §1-C 직접 dispatch
grep -rnE "useState|useEffect|onClick|onMouseDown|onChange|onKeyDown|onPointerDown|document\.|getElementById|querySelector|addEventListener|os\.dispatch|data-drag-handle" \
  src/apps/ --include="*.ts" --include="*.tsx" | grep -v "/test"
```

결과를 위반 목록 표로 정리한다:

| # | 파일:줄 | 위반 패턴 | 코드 스니펫 | 분류 |
|---|---------|----------|------------|------|
| 1 | `builder/app.ts:42` | `useState` | `const [x, setX] = useState(...)` | ? |

### Step 2: 분류

각 위반을 아래 3가지로 분류한다:

| 분류 | 기준 | 행선지 |
|------|------|--------|
| **🔴 LLM 실수** | OS가 대안을 제공하는데 앱이 안 쓴 경우 | 근본 원인 단계로 루프백 (아래 표 참조) |
| **🟡 OS 갭** | OS가 이 패턴의 대안을 아직 제공하지 않는 경우 | `5-backlog/os-gaps.md` 등록 |
| **⚪ 정당한 예외** | 외부 라이브러리 통합, 브라우저 API 필수 사용 등 OS가 대체할 수 없는 경우 | BOARD Backlog (사유 기록) |

**분류 판단 기준**:
- "OS에 이걸 해주는 API가 있는가?" → 있으면 **LLM 실수**, 없으면 다음
- "OS가 이 API를 만들 수 있는가?" → 가능하면 **OS 갭**, 불가능하면 **정당한 예외**

**🔴 LLM 실수 — 근본 원인 진단표**:

| 근본 원인 | 판정 기준 | 루프백 단계 |
|----------|----------|------------|
| Story / DT가 잘못됨 | DT에 없는 커맨드를 구현했거나, DT 자체가 OS 불가능 구조 | → `/stories` |
| Spec Scenario가 잘못됨 | DT를 잘못 번역하여 BDD가 OS 패턴과 어긋남 | → `/spec` |
| Red 테스트가 잘못됨 | 테스트가 DOM/이벤트를 직접 검증 (OS Hook 미사용) | → `/red` |
| Bind가 잘못됨 | OS Hook/Command가 있는데 raw HTML 이벤트 사용 | → `/bind` |

### Step 3: 결과 저장

1. 위반 목록을 프로젝트 notes에 저장:
   ```
   docs/1-project/{project}/notes/YYYY-MMDD-audit-{scope}.md
   ```

2. BOARD 반영:
   - 🔴 LLM 실수 → 리팩토링 태스크로 Now에 추가
   - 🟡 OS 갭 → **현재 feature를 Blocked로 변경** + OS 프로젝트 BOARD에 OS 개선 태스크 추가. feature는 OS gap 해소 후 재개. (rules.md #13 적용)
   - ⚪ 정당한 예외 → Backlog에 사유와 함께 기록

### Step 4: 즉시 수정 (🔴 LLM 실수)

> **근본 원인 단계로 루프백한다.** 코드만 패치하면 같은 실수가 반복된다.

1. 위 루트 원인 진단표에서 해당 단계를 찾는다.
2. 해당 단계 워크플로우로 루프백 (`/stories` / `/spec` / `/red` / `/bind`).
3. 루프백 완료 후 `/audit` Step 1부터 재실행 (재감사).

> **주의**: `/bind`로 루프백하는 경우만 코드를 직접 수정한다. `/stories` / `/spec` / `/red` 루프백은 해당 워크플로우를 실행하고 이후 파이프라인을 재순환한다.
   - `useState` → OS state / `useSelection` / `useComputed`
   - `onClick` → `Trigger onActivate` / OS activate
   - `useEffect` → OS hook / kernel middleware
2. 수정 후 테스트 실행 — regression 없음 확인.

### Step 5: 재감사 (검증)

수정 후 **같은 grep을 다시 실행**하여 위반이 실제로 사라졌는지 확인한다.

```bash
# 수정한 앱에 대해 Step 1 grep 재실행
grep -rn "useState" src/apps/{앱}/ --include="*.ts" --include="*.tsx" | grep -v "test"
```

- 위반 0건 → ✅ 확정
- 위반 잔존 → Step 2로 복귀

### Step 6: 지표 보고

```
총 위반: N건
  🔴 LLM 실수: X건 → Y건 수정 완료, Z건 잔존
  🟡 OS 갭: A건 → BOARD 태스크 생성
  ⚪ 정당한 예외: B건
재감사: 수정 후 위반 0건 확인 ✅ / ❌
```

### 완료 기준

- [ ] grep 5개 패턴 실행 완료
- [ ] 모든 위반이 3분류 중 하나로 분류됨
- [ ] 🔴 LLM 실수 → 즉시 수정 완료
- [ ] 수정 후 재감사 → 위반 0건 확인
- [ ] 분류 결과가 notes에 저장됨
- [ ] BOARD에 태스크 반영됨 (해당 시)

### Step 7: AUDITBOOK 갱신

> 감사 종료 후 새로 발견된 지식을 AUDITBOOK에 반영한다.
> 재논쟁 방지가 목적이다. 같은 패턴은 다음 감사에서 즉시 분류.

`.agent/knowledge/audit.md`을 열고:
- 🟡 OS 갭 신규 발견 → §2 + `5-backlog/os-gaps.md` 등록
- ⚪ 정당한 예외 신규 확인 → §3 추가
- 판정 내린 선례 → §5 추가
- OS 갭이 구현으로 해결됐다면 → §2 ✅ 체크

> **갱신 없으면 스킵.** 새 지식이 없으면 파일을 건드리지 않는다.
