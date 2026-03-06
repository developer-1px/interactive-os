# eliminate-layout-dispatch — 회고

> 2026-03-05 | 목표: Zone.tsx useLayoutEffect에서 kernel dispatch 3건 제거

## 📝 Session Knowledge Harvest

| # | 지식 | 발견 맥락 | 반영 위치 |
|---|------|----------|----------|
| K1 | OS_INIT_* command는 "mount 시 state 없음" 전제의 산물. 전제 제거 → command 불필요 | /discussion "왜 초기화?" | design-principles #33 ✅ |
| K2 | ensureZone은 초기화가 아니라 방어 코드(빈 그릇) | /discussion 수렴 | design-principles #33 ✅ |
| K3 | "Zone 초기화"라는 별도 단계는 존재하지 않는다 | /discussion 수렴 | design-principles #33 ✅ |
| K4 | lazy creation은 역사적 산물. bind() eager creation 가능 | /discussion "왜 lazy?" | design-principles #33 ✅ |
| K5 | 유틸 함수 side effect 추가 전 호출부 전수 조사 필수 | /solve 실패 (101 regression) | /solve Impact Scope ✅ |
| K6 | OS_OVERLAY_OPEN이 이미 applyFocusPush → Zone.tsx의 OS_STACK_PUSH는 이중 dispatch | /green T4 | Zone.tsx 코드 삭제 ✅ |
| K7 | /why는 Double-loop Learning이어야 한다 | /retrospect discussion | /why workflow ✅ |
| K8 | /go에 Andon: regression → 자동 정지 → /why | /retrospect discussion | /why 트리거 ✅ |

## 🔧 개발 과정

- **Keep 🟢**: /discussion에서 "왜?" 연쇄로 ensureZone의 근본 전제를 뒤집음. 첫 시도 실패 후 즉시 롤백.
- **Problem 🔴**: ensureZone 수정에서 101 regression — 사전 호출부 조사 미흡.
- **Try 🔵**: 함수 수정 전 호출부 전수 조사 선행. → `/solve` RCA에 Impact Scope 추가 ✅

## 🤝 AI 협업 과정

- **Keep 🟢**: 사용자의 "왜?" 3회로 Claim 수렴. "Zone 초기화란?" → "왜 lazy?" → "OS_INIT이 전부 잘못 아닌가?"

## ⚙️ 워크플로우

- **Keep 🟢**: /solve 실패 → /discussion 재설계 → /go 재진입 파이프라인 자연스러움.
- **Problem 🔴**: /solve RCA가 호출부 영향 범위까지 분석하지 않음.
- **Try 🔵**: /solve RCA template에 Impact Scope 필드 추가 ✅

## 액션 결과

| # | 액션 | 카테고리 | 상태 |
|---|------|---------|------|
| 1 | design-principles #32, #33 추가 | 지식 | ✅ |
| 2 | initSelection.ts 삭제 | OS 코드 | ✅ |
| 3 | Zone.tsx dispatch 3건 제거 | OS 코드 | ✅ |
| 4 | /solve RCA에 Impact Scope 추가 | 프로세스 | ✅ |
