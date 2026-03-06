---
description: createKernel.ts의 React Hook 분리
---

## /plan — 실행 전 MECE 점검표

### Step 1: 대상 전수 열거

코드베이스를 조사하여 변경 대상을 빠짐없이 나열:
- `createKernel.ts` 내의 React import 구문
- `createKernel.ts` 내의 `useComputed` 훅 위치
- `createKernel.ts` 내의 `useQuery` 훅 위치

### Step 2: 변환 명세표 작성

| # | 대상 | Before | After | Cynefin | 의존 | 검증 | 위험 |
|---|------|--------|-------|---------|------|------|------|
| 1 | `createKernel.ts:9` | `react`에서 훅 수입 | `react` 수입 구문 전면 제거 | 🟢 Clear | — | `tsc 0` | 없음 |
| 2 | `useComputed` | 파라미터 없는 클로저 훅 (763L) | 별도 패키지/파일의 팩토리 함수 반환값으로 이동 | 🟢 Clear | →#4 | `+0 tests` (기존 유지) | API Signature 변경 시 컴파일 에러 |
| 3 | `useQuery` | 파라미터 없는 클로저 훅 (820L) | 별도 패키지/파일의 팩토리 함수 반환값으로 이동 | 🟢 Clear | →#4 | `+0 tests` (기존 유지) | API Signature 변경 시 컴파일 에러 |
| 4 | `createReactBindings.ts` | (없음) | `createReactBindings(kernel)` 구현. 내부에서 #2, #3 반환 | 🟢 Clear | — | `tsc 0` | Kernel Port 누락 시 구동 불가 |
| 5 | `packages/kernel/src/index.ts` | `createKernel` 단일 export | `createReactBindings` 추가 export | 🟢 Clear | — | `build OK` | 외부 모듈의 Tree Shaking |

### Step 3: 비-Clear 행 즉석 해소

모두 🟢 Clear. 즉석 해소 항목 없음.

### Step 4: MECE 점검

1. CE: 5개 행을 모두 수행하면 Kernel의 React 의존성이 완전히 제거되며, 기존의 외부 API(Hook 사용처)는 동일한 서명으로 사용할 수 있습니다. (목표 달성)
2. ME: 대상과 범위가 겹치지 않습니다.
3. No-op: 변경점이 명확합니다. (제거 및 별도 파일 생성)

### 라우팅
승인 후 → `/go` (os-restructure) — createKernel 경량화를 위한 Now Task 진행
