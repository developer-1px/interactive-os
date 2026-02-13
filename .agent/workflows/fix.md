---
description: Automatically verify and fix build errors, type errors, and runtime errors using smoke tests.
---

// turbo-all

## /fix — 이슈 기반 자동 수정 파이프라인

```
이슈 등록(/issue §1) → Smoke Test로 실패 수집
→ /divide로 자율 분해·수정 (의사결정 필요 전까지)
→ 검증 (smoke → type → build)
→ 이슈 종료(/issue §10)
```

### 1. 이슈 등록

- `/issue` workflow의 **§1 이슈 등록** + **§2 Triage**를 실행한다.
- 사용자가 제공한 에러 메시지를 원문으로 기록한다.
- 이슈 문서 위치: `docs/1-project/0-issue/YYYY-MM-DD_<슬러그>.md`

### 2. Smoke Test (실패 수집)

- Dev server가 실행 중인지 확인한다. 아니면 백그라운드로 시작: `npm run dev`
- `npx playwright test e2e/smoke.spec.ts`를 실행하여 전체 라우트의 런타임 에러를 수집한다.
- 실패한 라우트와 에러 메시지를 이슈 문서에 **Before 스냅샷**으로 기록한다.

### 3. 자율 분해·수정 — `/divide` 실행

- Smoke test 실패 + 사용자 보고 에러를 대상으로 `/divide`를 실행한다.
- **핵심 원칙**: 의사결정이 필요하기 전까지 스스로 할 수 있는 것은 전부 푼다.
  - 정답이 확실한 것 → 단위 테스트로 증명 → 수정
  - 정답이 불확실한 것 → 분해하여 재시도
  - 분해해도 모르겠는 것 → **그때 사용자에게 질문** (멈추지 말고 다른 것 먼저 계속 진행)
- **안전 장치**: 수정 전에 반드시 테스트를 먼저 작성한다.
  - 재현 테스트(failing test) → 수정 → 테스트 통과 확인
  - 테스트 없이 코드를 수정하지 않는다.

#### Gate Check
- 수정한 모든 부분의 테스트가 **통과**하는가?
  - ✅ → 다음 단계 진행
  - ❌ → 통과할 때까지 수정 계속

### 4. 검증 (시스템 안정성 확인)

순서대로 실행한다:

1. **Smoke Test**: `npx playwright test e2e/smoke.spec.ts` — 전체 라우트 정상 렌더링 확인
2. **Type Verification**: `npx tsc --noEmit` — TypeScript 컴파일 에러 확인
3. **Build Verification**: `npm run build` — 프로덕션 빌드 무결성 확인
4. **Full E2E (Optional)**: 사이드이펙트가 의심되면 `npx playwright test` 전체 실행

- 각 단계에서 에러 발견 시 → **§3으로 돌아가서** `/divide`로 수정 후 재검증.

### 5. 이슈 종료

- `/issue` workflow의 **§10 이슈 종료**를 실행한다.
- 이슈 문서의 상태를 `closed`로 변경한다.
- 해결 요약 + changelog를 문서 끝에 추가한다:
  ```markdown
  ## 해결 요약
  - 원인: ...
  - 수정: ... (변경 파일 목록)
  - 검증: smoke ✅ / type ✅ / build ✅

  ## Changelog
  | 커밋 | 내용 |
  |------|------|
  | `해시` | 커밋 메시지 — 변경 파일 요약 |
  ```
- 사용자에게 **최종 안정성 리포트**를 보고한다.
