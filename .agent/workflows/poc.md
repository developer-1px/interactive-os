---
description: 아이디어를 빠르게 검증하는 PoC spike를 만든다. 별도 라우트 + GlobalNav 등록.
---

## /poc — Proof of Concept

### 원칙

> PoC는 "이거 되나?" 확인이다. 실패하면 버리면 된다.
> 별도 라우트에서 작업하고, GlobalNav에 등록하여 눈에 보이게 한다.

### Phase 1: Discovery (선택) — `/discussion`

1. 아이디어가 모호하면 `/discussion`으로 정리한다.
2. 이미 명확하면 스킵한다.

### Phase 2: PRD — `/inbox`

3. `/inbox`로 간략한 PRD를 작성한다.
   - 핵심 기능, 검증 목적, 스코프를 포함한다.

### Phase 3: 구현

4. **라우트 생성** — 별도 경로에 페이지를 생성한다.
5. **GlobalNav 등록** — `/routes`를 실행하여 아이콘+이름 매칭 → GlobalNav에 등록한다.
6. **spike 구현** — 최소한의 동작하는 코드를 작성한다.

### Phase 4: 검증 — `/fix`

7. smoke → type → build 검증.

### Phase 5: 판정

8. 사용자에게 질문: **"채택할까요, 폐기할까요?"**
   - ✅ **채택** → `/project`로 전환을 제안한다.
   - ❌ **폐기** → `/routes`를 실행하여 라우트 삭제 + GlobalNav 제거 + 관련 파일 정리.
