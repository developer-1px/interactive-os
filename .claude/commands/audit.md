---
description: OS 계약 위반을 전수 검사하고, LLM 실수 / OS 갭 / 정당한 예외로 분류한다.
---

## /audit — OS 계약 감사

> **슬로건**: "앱은 의도를 선언하고, OS가 실행을 보장한다."
> **목적**: 이 계약을 위반하는 코드를 전수 열거하고, 원인을 분류하여 개선 경로를 만든다.
> **산출물**: 위반 목록 `.md` + 분류 결과 → BOARD 반영
> **라우팅**: 🔴 발견 시 감사 보고서가 Discussion 역할 → `/project` 전환 가능

---

### Step 0: 대상 결정

1. 감사 대상을 정한다: 특정 앱 (`src/apps/builder/`), 전체 앱 (`src/apps/`), 또는 OS (`src/os/`).
2. 기본값: `src/apps/` (모든 앱 코드).

### Step 1: 위반 전수 열거

아래 패턴을 grep으로 전수 검색한다. **tests 폴더는 제외.**

```bash
# 1. useState — 앱이 자체 상태 관리
grep -rn "useState" src/apps/ --include="*.ts" --include="*.tsx" | grep -v "test" | grep -v "node_modules"

# 2. useEffect — 앱이 사이드이펙트 직접 실행
grep -rn "useEffect" src/apps/ --include="*.ts" --include="*.tsx" | grep -v "test"

# 3. onClick/onMouseDown/onChange — 앱이 이벤트 직접 핸들링
grep -rn "onClick\|onMouseDown\|onChange\|onKeyDown\|onPointerDown" src/apps/ --include="*.tsx" | grep -v "test"

# 4. document.querySelector/getElementById — DOM 직접 접근
grep -rn "document\.\|getElementById\|querySelector" src/apps/ --include="*.ts" --include="*.tsx" | grep -v "test"

# 5. addEventListener — 이벤트 직접 등록
grep -rn "addEventListener" src/apps/ --include="*.ts" --include="*.tsx" | grep -v "test"
```

결과를 위반 목록 표로 정리한다:

| # | 파일:줄 | 위반 패턴 | 코드 스니펫 | 분류 |
|---|---------|----------|------------|------|
| 1 | `builder/app.ts:42` | `useState` | `const [x, setX] = useState(...)` | ? |

### Step 2: 분류

각 위반을 아래 3가지로 분류한다:

| 분류 | 기준 | 행선지 |
|------|------|--------|
| **🔴 LLM 실수** | OS가 대안을 제공하는데 앱이 안 쓴 경우 | 즉시 `/refactor` |
| **🟡 OS 갭** | OS가 이 패턴의 대안을 아직 제공하지 않는 경우 | BOARD Now 태스크 |
| **⚪ 정당한 예외** | 외부 라이브러리 통합, 브라우저 API 필수 사용 등 OS가 대체할 수 없는 경우 | BOARD Backlog (사유 기록) |

**분류 판단 기준**:
- "OS에 이걸 해주는 API가 있는가?" → 있으면 **LLM 실수**, 없으면 다음
- "OS가 이 API를 만들 수 있는가?" → 가능하면 **OS 갭**, 불가능하면 **정당한 예외**

### Step 3: 결과 저장

**기존 프로젝트가 있는 경우:**

1. 위반 목록을 프로젝트 notes에 저장:
   ```
   docs/1-project/{project}/notes/YYYY-MMDD-audit-{scope}.md
   ```

2. BOARD 반영:
   - 🔴 LLM 실수 → 리팩토링 태스크로 Now에 추가
   - 🟡 OS 갭 → OS 프로젝트 BOARD에 태스크 추가
   - ⚪ 정당한 예외 → Backlog에 사유와 함께 기록

**기존 프로젝트가 없는 경우:** Step 7(라우팅)에서 `/project` 전환.

### Step 4: 즉시 수정 (🔴 LLM 실수)

🔴 항목은 **이 세션에서 즉시 수정**한다. 문서만 갱신하지 않는다.

1. 앱 코드를 OS 패턴으로 리팩토링한다.
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

### Step 7: 라우팅 — `/project` 전환

🔴 LLM 실수가 발견되고, 기존 프로젝트에 귀속되지 않으면 `/project`로 전환한다.

**감사 보고서 = Discussion.** 별도 `/discussion`을 실행하지 않는다.

감사 보고서 → Toulmin 매핑:

| Audit 결과 | → | Toulmin | → | BOARD Section |
|-----------|---|---------|---|---------------|
| 🔴 위반 목록 + 집계 | → | 📊 Data | → | **Context**: Before→After |
| 분류 판단 기준 (OS 대안 존재 여부) | → | 🔗 Warrant | → | **Context**: 핵심 논거 |
| `rules.md` 원칙 (OS가 보장, DOM 금지 등) | → | 📚 Backing | → | **Context**: 선례 |
| 🟡 OS 갭 (선행 의존) | → | ❓ Open Gap | → | **Unresolved** |
| 대규모 리팩토링 회귀 위험 | → | ⚡ Rebuttal | → | **Risks** |
| "OS 최신 패턴으로 전환" | → | 🎯 Claim | → | **Context**: 한 줄 요약 |

**라우팅 판정:**

| 조건 | 행선지 |
|------|--------|
| 🔴 ≥ 1건, 기존 프로젝트 없음 | `/project` 전환 (감사 보고서 = discussion) |
| 🔴 ≥ 1건, 기존 프로젝트 있음 | BOARD Now에 태스크 추가 |
| 🔴 = 0건, 🟡 ≥ 1건 | OS 프로젝트 BOARD에 갭 태스크 |
| 🔴 = 0건, 🟡 = 0건 | 감사 완료. 조치 없음 |

### 완료 기준

- [ ] grep 5개 패턴 실행 완료
- [ ] 모든 위반이 3분류 중 하나로 분류됨
- [ ] 🔴 LLM 실수 → 즉시 수정 완료 또는 `/project` 전환
- [ ] 수정 후 재감사 → 위반 0건 확인
- [ ] 분류 결과가 notes에 저장됨
- [ ] BOARD에 태스크 반영됨 (해당 시)
