# OS Core Refactoring — 제안서 (현행 전략)

> Status: Accepted
> Created: 2026-02-09
> Updated: 2026-02-12

---

## 요약 (TL;DR)

**점진적 마이그레이션** 전략으로, `src/os`(레거시)를 유지하면서 `src/os-new`에 Kernel 기반 파이프라인을 구축한다.
re-frame의 **6-Domino 아키텍처**(Listener → Context → Command → Effect → Hook → Component)를 채택하여 폴더 구조가 곧 데이터 흐름이 되도록 설계한다.

---

## 배경 (Context)

- Kernel 패키지는 **완성** 상태 (dispatch, bubblePath, EffectMap, Transaction, useComputed 등)
- os-new에 **두 아키텍처가 공존** 중: Legacy Pipeline(Zustand 직접 조작) + Kernel Pipeline(dispatch → effects)
- 전환 방향: Legacy → Kernel. `3-store/`(Zustand)는 Kernel `state`로 흡수

---

## 제안 (Proposed Solution)

### 1. 아키텍처: 6-Domino Pipeline

```
User: ArrowDown
    ↓
1. listeners     → dispatch("OS_NAVIGATE")
    ↓
2. contexts      → inject("dom-items"), inject("zone-config")
    ↓
3. commands      → NAVIGATE handler → { state, focus, scroll }
    ↓
4. effects       → focus(), scroll() 실행
    ↓
5. hooks         → useFocused re-compute
    ↓
6. components    → <Item /> re-render
```

### 2. 마이그레이션 전략: 점진적 교체

| 원칙 | 설명 |
|------|------|
| **작동 상태 유지** | 각 Phase 후에도 앱이 정상 동작해야 함 |
| **Facade 패턴** | FocusData API 유지, 내부만 Kernel State로 교체 |
| **양방향 의존 제거** | os/ ↔ os-new/ 교차 import를 단방향으로 정리 |
| **Phase별 검증** | 테스트 통과 + tsc 통과 + Inspector 확인 |

### 3. 실행 순서

```
Phase 1 (OS State 통합)
  ↓
Phase 2 (OS Commands 등록)      ← 가장 큰 변경
  ↓
Phase 3 (Effects 등록)          ← 독립 가능
  ↓
Phase 4 (Context Providers)     ← 독립 가능
  ↓
Phase 5 (Scoped Handler)       ← Commands + Effects 완료 필수
  ↓
Phase 6 (Keybinding 분리)
  ↓
Phase 7 (Primitive 재작성)
  ↓
Phase 8 (App 마이그레이션)
```

---

## Trade-offs

| 결정 | 선택 | 대안 | 이유 |
|------|------|------|------|
| 마이그레이션 방식 | 점진적 | Big-bang 교체 | 작동 상태 유지, 리스크 분산 |
| 상태 관리 | Kernel 단일 State | Zustand 유지하며 래핑 | 근본적 문제 해결, Transaction/Time-travel |
| 폴더 구조 | 6-Domino 넘버링 | 기능별 그룹핑 | 데이터 흐름이 폴더에 보임 |
| 커맨드 등록 | defineCommand | 기존 CommandFactory | Kernel의 scoped handler, type 안정성 |

---

## Rabbit Holes (위험 요소)

1. **Phase 2 영향 범위**: 15+ 파일, FocusData를 23개 파일이 사용 중
2. **Zone별 → 단일 스토어**: 리렌더링 최적화 필요 (selector 전략)
3. **양방향 의존**: os/ ↔ os-new/ 교차 import ~47곳 — 단방향 정리 병행 필요
4. **영원히 완료되지 않을 리스크**: 마이그레이션 데드라인 미설정 ([Pre-Mortem 참고](file:///Users/user/Desktop/interactive-os/docs/1-project/os-core-refactoring/notes/2026-02-10_OS_Migration_Pre-Mortem.md))

---

## 관련 문서

- [점진적 마이그레이션 전략](file:///Users/user/Desktop/interactive-os/docs/1-project/os-core-refactoring/notes/2026-02-09_incremental-migration.md)
- [폴더 구조 제안](file:///Users/user/Desktop/interactive-os/docs/1-project/os-core-refactoring/notes/2026-02-09_folder-structure.md)
- [Legacy Pipeline 정리 계획](file:///Users/user/Desktop/interactive-os/docs/1-project/os-core-refactoring/notes/2026-02-10_Legacy_Pipeline_Cleanup_Plan.md)
- [Spike 구현 계획](file:///Users/user/Desktop/interactive-os/docs/1-project/os-core-refactoring/notes/2026-02-10_Spike_Implementation_Plan.md)
