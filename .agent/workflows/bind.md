---
description: Green 테스트를 통과한 헤드리스 로직을 UI 컴포넌트에 연결한다. 산출물은 화면에서 동작하는 UI다.
---

## /bind — UI 연결

> **전제**: `/green` 완료 (헤드리스 테스트 🟢 PASS).
> **산출물**: 화면에서 동작하는 UI 컴포넌트.
> **원칙**: Green이 증명한 로직을 화면에 투영한다. 새로운 로직을 추가하지 않는다.
> **금지**: `contract-checklist.md §Config`의 금지 목록 참조. OS 커맨드를 사용한다.

---

### Step 0: 지식 로딩 + 맥락 파악

> `.agent/knowledge/bind.md`를 읽는다 — §바인딩 원칙, §실수, §선례
> `.agent/knowledge/contract-checklist.md`를 읽는다 — §Config (필수 OS 패턴, 금지 목록)

Then 맥락 파악:

1. 프로젝트 `BOARD.md`의 Now 태스크를 확인한다.
2. `/green`에서 만든 헤드리스 모듈(상태 함수, OS 커맨드)을 파악한다.
3. 연결할 UI 컴포넌트 위치를 파악한다.

---

### Step 1: 앱 패턴 숙지

> `.agent/knowledge/runbook.md`를 읽는다 — OS로 앱 만드는 법

---

### Step 2: 연결

> **로직은 건드리지 않는다.** Green이 만든 것을 import해서 쓴다.

연결 순서:

1. **Hook** — Green의 상태를 읽는 `useXxx` hook을 컴포넌트에서 호출
2. **Command** — 사용자 입력(Zone 이벤트)을 OS 커맨드로 dispatch
3. **Render** — hook 반환값으로 화면을 렌더링

> 바인딩 코드 예시는 `.agent/knowledge/runbook.md`를 참조한다.
> Hook → Command → Render 순서를 따른다.

---

### Step 3: `/verify` — Exit Gate

> **bind의 완료 = /verify 통과.** verify가 실패하면 bind는 미완료.

`/verify`를 실행한다 (`.agent/workflows/verify.md`를 `view_file`로 읽고 실행).

- Gate 1~3 (tsc, lint, unit): regression 확인
- **Gate 4 (Bind Smoke)**: 이번 bind의 OS 커맨드 경로가 실제로 상태를 변경하는지 검증
- Gate 5 (build): 빌드 성공 확인

**verify 실패 시**: 실패 지점을 수정하고 Step 2로 돌아간다.

---

### 완료 기준

- [ ] spec.md UX Flow의 각 단계가 화면에서 동작
- [ ] **`/verify` 전 게이트 통과** (tsc 0, unit PASS, bind smoke ✅, build OK)
- [ ] OS 패턴 준수 (`contract-checklist.md §Config` 금지 목록 위반 0건)
- [ ] regression 없음 (기존 테스트 PASS 유지)
