# behavior-first-zone — 백로그 이동

> 2026-02-16

## 사유

Discussion에서 도출한 "ARIA role→behavior 인과관계 역전" 가설이
IME 버그 수정 후 무효화됨.

### 경과
1. Todo typeahead가 이상하다 → "role preset이 잘못된 기본값을 강제한다"로 진단
2. `/doubt` → typeahead 제거, SHOULD→MUST 격상 문제 제기
3. `/discussion` → behavior-first-zone 프로젝트 생성
4. 사용자 질문: "IME 모드에서 발동하는게 진짜 문제 아냐?"
5. 조사 → Chrome이 한글 IME 첫 keydown에서 `isComposing: false` 전송
6. `keyCode === 229` 가드 추가 → IME 버그 수정
7. typeahead 복원 → **정상 동작. 문제는 preset이 아니라 IME 누출이었음.**

### 무효화된 Warrant (8개 중 5개)
- W2: SHOULD→MUST 격상이 문제 → ❌ 기본값이 올바랐음
- W3: Todo typeahead 실증 → ❌ IME 버그
- W4: LLM 확신 함정 → ❌ ARIA 기반 확신이 맞았음
- W5: 인과관계 역전 → ❌ 현재 모델 정상 동작
- W8: 부정형→긍정형 전환 → ❌ 빼야 할 게 없었음

### 유효한 잔여 가치
- W1: ARIA ≠ 행동 명세 (원칙적으로 맞음)
- W6: Behavior 합성 (이론적 가치)

## 실질적 성과 (프로젝트 외부)
- ✅ IME keyCode 229 가드 (KeyboardListener.tsx)
- ✅ zone.bind() options override 인프라
- ✅ rolePresets.test.ts typeahead assertion (+16 tests)
- ✅ Todo dead code 정리 (AppEffect, GenericCommand, logic/)
