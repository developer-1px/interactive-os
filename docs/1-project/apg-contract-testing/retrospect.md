# KPT 회고 — APG Contract Testing

> 2026-02-20

## Keep (계속할 것)

- **APG 스펙 → 테스트 매핑**: W3C 문서를 읽고 1:1로 테스트 케이스로 변환하는 패턴이 효과적. 구현이 아닌 행동을 스펙으로 삼으니 테스트가 더 의미있다.
- **createTestKernel 재사용**: 모든 4개 APG 패턴에서 동일한 인프라를 사용. 신규 위젯 추가 비용이 거의 0.
- **Headless 검증 속도**: 58 tests in 24ms. 빠르니까 TDD 사이클이 즐겁다.
- **DOMRect mock**: Grid 테스트에서 공간 레이아웃을 순수 데이터로 표현. DOM 없이 2D navigation 검증.

## Problem (문제점)

- **58 tests 전부 통과**: APG 위반을 발견하지 못했다. 이 자체는 좋은 소식이지만, Discussion에서 "발견할때마다 많아"라고 했던 위반들이 이 4개 패턴에서는 재현되지 않음. 실제 위반은 더 복잡한 시나리오(예: delete 후 focus recovery, tab 경계 이동 후 selection 상태)에서 발생할 가능성.
- **select.test.ts 삭제 후 커버리지 갭 가능**: SELECT command의 `onCheck` 위임 테스트가 사라짐. 이건 APG contract 영역이 아닌 OS 내부 파이프라인이므로 Layer B에서 커버해야 함.
- **Tree 미지원**: 실제 사용하는 위젯인데 TV test가 없음. 향후 Tree 공식 지원 시 APG 테스트 필요.

## Try (다음에 시도할 것)

- **Layer B: Capability Regression** — delete→focus recovery, tab zone escape→selection reset 같은 OS 오케스트레이션 시나리오. 여기서 실제 APG 위반이 나올 가능성 높음.
- **Negative Test Cases** — "이 조합에서 이 키는 아무 것도 하면 안 된다"를 명시적으로 테스트. APG는 "해야 하는 것"과 "하면 안 되는 것" 두 가지를 정의.
- **APG 위반 발생 시**: 위반을 먼저 테스트로 인코딩한 뒤 수정 (진짜 TDD).
