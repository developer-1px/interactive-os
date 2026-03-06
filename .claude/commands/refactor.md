---
description: 패턴 A를 패턴 B로 전환하는 리팩토링 파이프라인. 대상 식별부터 재발 방지까지.
---

## /refactor — Green 후 정리 + 검증 + 커밋

> **산출물**: 정리된 코드 + git commit
> **전제**: 테스트가 🟢 PASS 상태여야 한다.
> **원칙**: 테스트를 깨뜨리지 않으면서 코드를 다듬는다. 테스트가 깨지면 리팩터가 잘못된 것이다.

---

### Step 0: 지식 로딩

> `.agent/knowledge/refactor.md`를 읽는다 — §Patterns, §Hazards
> `.agent/knowledge/contract-checklist.md`를 읽는다 — §Config (금지 목록)

### Step 1: 코드 정리

- 중복 제거, 패턴 일반화
- 불필요한 코드 삭제
- 네이밍 개선
- **테스트는 수정하지 않는다** (Green 상태 유지)

### Step 2: 방향 점검 → `/reflect` 실행

`/reflect` 워크플로우를 실행한다.

- 이번 구현이 의도와 맞는지 확인한다.
- 시스템에 새로운 유일한 패턴을 추가했는가? → 추가했으면 보고 (rules.md #1)
- OS 패턴을 따랐는가? (`contract-checklist.md §Config` 금지 목록 위반 0건)
- ❌ 실패 → 보고하고 멈춘다.

### Step 3: OS 계약 감사 → `/audit` 실행

`/audit` 워크플로우를 실행한다.

- 대상: 이번 리팩토링에서 수정한 파일/앱.
- 🔴 LLM 실수가 발견되면 → Step 1로 돌아가 즉시 수정.
- 🟡 OS 갭 → BOARD 태스크로 기록.
- ⚪ 정당한 예외 → 사유 기록.

### Step 4: 의심 → `/doubt` 실행

`/doubt` 워크플로우를 실행한다.

- 불필요한 것이 있는가? 줄일 수 있는가?
- Occam Gate: 새 개념을 도입했으면 정당성 검증.
- 🔴 제거/🟡 축소 발생 시 → Step 1로 돌아간다.

### Step 5: 검증 (verify 인라인)

```bash
source ~/.nvm/nvm.sh && nvm use && npx tsc --noEmit
```
- 0 errors → 다음
- errors → 보고하고 멈춘다

```bash
source ~/.nvm/nvm.sh && nvm use && npx biome check --write
```

```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run 2>&1 | tail -10
```
- all pass → 다음
- fail → 보고하고 멈춘다

```bash
source ~/.nvm/nvm.sh && nvm use && npx vite build 2>&1 | tail -10
```
- success → 다음
- fail → 보고하고 멈춘다

### Step 6: 커밋

검증 결과 보고:

```
| Gate  | Result |
|-------|--------|
| tsc   | ✅ / ❌ |
| lint  | ✅ / ❌ |
| unit  | ✅ N passed / ❌ |
| build | ✅ / ❌ |
```

모든 Gate 통과 시 커밋을 제안한다.

### Step 7: BOARD.md 갱신

- Done에 태스크 이동 + 증빙 기록
- 다음 태스크가 있으면 알려준다: "다음: `/red`를 실행하세요"

### 완료 기준

- [ ] 코드 정리 완료
- [ ] `/reflect` 통과
- [ ] `/audit` 완료 (🔴 0건 또는 수정 완료)
- [ ] `/doubt` 수렴
- [ ] tsc 0 errors
- [ ] vitest all pass
- [ ] vite build success
- [ ] git commit 완료
- [ ] BOARD.md 갱신
