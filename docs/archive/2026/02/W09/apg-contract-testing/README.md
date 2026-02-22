# APG Contract Testing

> **WHY**: 커버리지(%)는 높지만 APG 스펙 위반이 반복 발견된다. 순수함수 단위 테스트는 구현 세부사항만 검증하고, 사용자 행동 계약을 보장하지 않는다.

## Goals

1. **APG 스펙 기반 Contract Testing** — W3C APG 패턴이 테스트의 Source of Truth.
2. **Headless Kernel 검증** — DOM 없이 `dispatch → assert state`로 행동 계약 검증.
3. **2-Layer Architecture** — Widget Contract(A) + Capability Regression(B).

## Scope

- **In Scope**:
    - Layer A: Widget Pattern별 APG Contract Test (`listbox.apg.test.ts`, `grid.apg.test.ts`, ...)
    - Layer B: OS Capability Regression Test (`navigate.capability.test.ts`, ...)
    - `createTestKernel` 활용 (기존 인프라 재사용)
- **Out of Scope**:
    - DOM 프로젝션 테스트 (기계적 매핑, 스모크로 충분)
    - 테스트 시각화 (별도 주제로 분리)
    - Layer C: App Integration (A+B 완료 후)

## 전략

| Layer | 역할 | 방향 | 파일 패턴 |
|-------|------|------|-----------|
| **A: Widget Contract** | APG 스펙 1:1 매핑 | Top-Down (스펙→행동) | `*.apg.test.ts` |
| **B: Capability Regression** | OS 커맨드 하위 호환 | Bottom-Up (기능→회귀방지) | `*.capability.test.ts` |
| **C: App Integration** | 앱 위젯 조합 | (Later) | `*.integration.test.ts` |

## 관련 프로젝트
- `apg-testing-rebalance` — 전신. KernelTestKit 인프라 구축 + Delete/Focus Integration 완료.
