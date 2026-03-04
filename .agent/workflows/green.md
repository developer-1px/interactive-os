---
description: Red 테스트를 Green으로 만든다. 이 세션의 유일한 산출물은 🟢 PASS하는 구현 코드다.
---

// turbo-all

## /green — 테스트를 통과시킨다

> **산출물**: 구현 코드 (🟢 PASS)
> **전제**: `/red`에서 작성한 🔴 FAIL 테스트가 존재해야 한다.
> **원칙**: 테스트가 요구하는 것만 구현한다. 과하게 구현하지 않는다.

---

### Step 0: 지식 로딩 + Red 테스트 확인

> `.agent/knowledge/testing-hazards.md`를 읽는다 — §Patterns, §Hazards
> `.agent/knowledge/testing-tools.md`를 읽는다 — §Config (도구 패턴)

Then Red 테스트 확인:

```bash
source ~/.nvm/nvm.sh && nvm use && npx vitest run --reporter=verbose [테스트파일경로] 2>&1 | tail -30
```

- 🔴 FAIL 확인 → 진행.
- ⛔ 모든 테스트가 PASS면 구현할 것이 없다. 멈춘다.

### Step 1: OS 패턴 숙지

구현 전에 필요한 OS 지식을 확인한다.

1. `.agent/knowledge/runbook.md` — OS로 앱 만드는 법
2. `.agent/knowledge/contract-checklist.md` §Config — 금지 목록 확인
3. 태스크 관련 SPEC 섹션 — 필요한 Role/Command/Config 확인

### Step 2: 최소 구현

- 테스트를 통과시키는 **최소한의 코드**만 작성한다.
- 구현 순서: `app.ts` (로직) → `widgets/` (뷰). **로직이 먼저, 뷰는 바인딩이다** (rules.md #2).
- 과하게 구현하지 않는다. 테스트가 요구하지 않는 것은 만들지 않는다.

### Step 3: `/verify` — Exit Gate

> **green의 완료 = /verify 통과.** verify가 실패하면 green은 미완료.

`/verify`를 실행한다 (`.agent/workflows/verify.md`를 `view_file`로 읽고 실행).

- Gate 1 (tsc): 타입 에러 0
- Gate 2 (lint): 코드 정리
- Gate 3 (unit): 대상 테스트 🟢 PASS + regression 없음
- Gate 4 (bind smoke): ⏭ 스킵 (bind 미실행)
- Gate 5 (build): 빌드 성공

**verify 실패 시**: 실패 지점을 수정하고 Step 2로 돌아간다.

### 완료 기준

- [ ] 대상 테스트 🟢 PASS
- [ ] **`/verify` 전 게이트 통과** (tsc 0, lint, unit PASS, build OK)
- [ ] 코드가 OS 패턴을 따름 (`contract-checklist.md §Config` 금지 목록 위반 0건)
- [ ] Zone 태스크의 경우: UI 컴포넌트에 바인딩 가능한가? (순수함수 PASS만으로 끝내지 않는다)

---

### 마지막 Step: 📝 Knowledge 반영

> `_middleware.md` §3 "종료 시" 규약을 따른다.
> 새 구현 패턴 → `testing-hazards.md` §Patterns
> 새 함정 → `testing-hazards.md` §Hazards
>
> 📝이 비어있으면 스킵.
